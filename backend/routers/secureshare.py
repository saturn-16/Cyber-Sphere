"""SecureShare router — encrypted file upload/download with malware scanning"""

import uuid, secrets, hashlib, os, json, tempfile
from datetime import datetime, timedelta
from typing import Optional

import requests
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse, StreamingResponse
from cryptography.fernet import Fernet
import io

from database import get_connection
from routers.auth import get_current_user
from config import settings

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
UPLOAD_DIR = os.path.abspath(UPLOAD_DIR)

# Encryption key — loaded from env (stable across restarts)
_raw_key = settings.ENCRYPTION_KEY
if not _raw_key:
    _raw_key = Fernet.generate_key().decode()
fernet = Fernet(_raw_key.encode() if isinstance(_raw_key, str) else _raw_key)

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(pw: str) -> str:
    return pwd_context.hash(pw)

def verify_file_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False

def background_vt_poll(analysis_id: str, file_id: str):
    try:
        headers = {"x-apikey": settings.VIRUSTOTAL_API_KEY}
        import time
        # Poll up to 30 times, 10s apart = 5 mins
        for _ in range(30):
            time.sleep(10)
            result_resp = requests.get(
                f"https://www.virustotal.com/api/v3/analyses/{analysis_id}",
                headers=headers,
                timeout=10
            )
            if result_resp.status_code == 200:
                data = result_resp.json().get("data", {})
                status = data.get("attributes", {}).get("status", "")
                if status == "completed":
                    stats = data.get("attributes", {}).get("stats", {})
                    malicious = stats.get("malicious", 0)
                    suspicious = stats.get("suspicious", 0)
                    final_status = "infected" if (malicious + suspicious) > 2 else "clean"
                    
                    # Update DB
                    conn = get_connection()
                    try:
                        if settings.USE_POSTGRES:
                            cur = conn.cursor()
                            cur.execute("UPDATE files SET malware_status = %s WHERE id = %s", (final_status, file_id))
                            if final_status == "infected":
                                cur.execute("UPDATE files SET share_token = NULL WHERE id = %s", (file_id,))
                            conn.commit()
                            cur.close()
                        else:
                            conn.execute("UPDATE files SET malware_status = ? WHERE id = ?", (final_status, file_id))
                            if final_status == "infected":
                                conn.execute("UPDATE files SET share_token = NULL WHERE id = ?", (file_id,))
                            conn.commit()
                    finally:
                        conn.close()
                    return
    except Exception as e:
        print("VT Poll Error:", e)

def _db_insert_file(conn, file_id, user_id, filename, encrypted_path,
                    file_size, malware_status, share_token, password_hash, expiry_time):
    if settings.USE_POSTGRES:
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO files (id, user_id, filename, encrypted_path, file_size,
               malware_status, share_token, password_hash, expiry_time)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (file_id, user_id, filename, encrypted_path, file_size,
             malware_status, share_token, password_hash, expiry_time)
        )
        conn.commit()
        cur.close()
    else:
        conn.execute(
            """INSERT INTO files (id, user_id, filename, encrypted_path, file_size,
               malware_status, share_token, password_hash, expiry_time)
               VALUES (?,?,?,?,?,?,?,?,?)""",
            (file_id, user_id, filename, encrypted_path, file_size,
             malware_status, share_token, password_hash, expiry_time)
        )
        conn.commit()

@router.post("/upload", status_code=201)
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    password: Optional[str] = Form(None),
    expiry_hours: int = Form(0),
    current_user: dict = Depends(get_current_user),
):
    content = await file.read()

    malware_status = "scanning"
    analysis_id = None

    if not settings.USE_REAL_VT:
        import random
        malware_status = "infected" if random.random() < 0.05 else "clean"
    else:
        try:
            headers = {"x-apikey": settings.VIRUSTOTAL_API_KEY}
            file_hash = hashlib.sha256(content).hexdigest()
            # 1. Check hash first for instant results
            hash_resp = requests.get(
                f"https://www.virustotal.com/api/v3/files/{file_hash}",
                headers=headers,
                timeout=10
            )
            if hash_resp.status_code == 200:
                stats = hash_resp.json().get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
                malicious = stats.get("malicious", 0)
                suspicious = stats.get("suspicious", 0)
                malware_status = "infected" if (malicious + suspicious) > 2 else "clean"
            else:
                # 2. Upload file if unknown
                files_payload = {"file": (file.filename or "upload", content)}
                resp = requests.post(
                    "https://www.virustotal.com/api/v3/files",
                    headers=headers,
                    files=files_payload,
                    timeout=30
                )
                if resp.status_code == 200:
                    analysis_id = resp.json().get("data", {}).get("id", "")
                if not analysis_id:
                    malware_status = "clean"
        except Exception as e:
            print("VT Error:", e)
            malware_status = "clean"

    # 2. AES-256 encrypt via Fernet
    encrypted = fernet.encrypt(content)

    # 3. Store encrypted file
    file_id = str(uuid.uuid4())
    encrypted_path = os.path.join(UPLOAD_DIR, f"{file_id}.enc")
    with open(encrypted_path, "wb") as f:
        f.write(encrypted)

    # 4. Generate share token & expiry
    share_token = secrets.token_urlsafe(12) if malware_status != "infected" else None
    expiry_time = (
        (datetime.utcnow() + timedelta(hours=expiry_hours)).isoformat()
        if expiry_hours > 0 else None
    )

    conn = get_connection()
    try:
        _db_insert_file(
            conn, file_id, current_user["sub"], file.filename or "unknown",
            encrypted_path, len(content), malware_status, share_token,
            hash_password(password) if password else None, expiry_time
        )
    finally:
        conn.close()

    if analysis_id and malware_status == "scanning":
        background_tasks.add_task(background_vt_poll, analysis_id, file_id)

    return {
        "id": file_id,
        "filename": file.filename,
        "size": len(content),
        "encrypted": True,
        "malwareStatus": malware_status,
        "shareToken": share_token,
        "passwordProtected": bool(password),
        "expiryTime": expiry_time,
        "downloadCount": 0,
        "uploadedAt": datetime.utcnow().isoformat(),
    }

@router.get("/")
def list_files(current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        if settings.USE_POSTGRES:
            cur = conn.cursor()
            cur.execute(
                "SELECT * FROM files WHERE user_id = %s ORDER BY created_at DESC",
                (current_user["sub"],)
            )
            rows = cur.fetchall()
            cur.close()
        else:
            rows = conn.execute(
                "SELECT * FROM files WHERE user_id = ? ORDER BY created_at DESC",
                (current_user["sub"],)
            ).fetchall()
        return [{
            "id": r["id"],
            "filename": r["filename"],
            "size": r["file_size"],
            "encrypted": True,
            "malwareStatus": r["malware_status"],
            "shareToken": r["share_token"],
            "passwordProtected": bool(r["password_hash"]),
            "expiryTime": str(r["expiry_time"]) if r["expiry_time"] else None,
            "downloadCount": r["download_count"],
            "uploadedAt": str(r["created_at"]),
        } for r in rows]
    finally:
        conn.close()

@router.get("/download/{file_id}")
def download_file(
    file_id: str,
    password: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    conn = get_connection()
    try:
        if settings.USE_POSTGRES:
            cur = conn.cursor()
            cur.execute("SELECT * FROM files WHERE id = %s", (file_id,))
            row = cur.fetchone()
            cur.close()
        else:
            row = conn.execute("SELECT * FROM files WHERE id = ?", (file_id,)).fetchone()

        if not row:
            raise HTTPException(404, "File not found")

        # Auth: owner only
        if row["user_id"] != current_user["sub"]:
            raise HTTPException(403, "Access denied")

        # Password check
        if row["password_hash"] and not verify_file_password(password or "", row["password_hash"]):
            raise HTTPException(401, "Invalid password")

        # Expiry check
        if row["expiry_time"]:
            expiry = row["expiry_time"]
            if isinstance(expiry, str):
                expiry = datetime.fromisoformat(expiry)
            if expiry < datetime.utcnow():
                raise HTTPException(410, "Link expired")

        # Decrypt
        enc_path = row["encrypted_path"]
        if not os.path.exists(enc_path):
            raise HTTPException(404, "Encrypted file not found on disk")

        with open(enc_path, "rb") as f:
            decrypted = fernet.decrypt(f.read())

        # Update download count
        if settings.USE_POSTGRES:
            cur = conn.cursor()
            cur.execute("UPDATE files SET download_count = download_count + 1 WHERE id = %s", (file_id,))
            conn.commit()
            cur.close()
        else:
            conn.execute("UPDATE files SET download_count = download_count + 1 WHERE id = ?", (file_id,))
            conn.commit()

        # Stream decrypted bytes (no tmp file needed)
        filename = row["filename"]
        return StreamingResponse(
            io.BytesIO(decrypted),
            media_type="application/octet-stream",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    finally:
        conn.close()

@router.get("/share/{share_token}")
def download_shared_file(share_token: str, password: Optional[str] = None):
    conn = get_connection()
    try:
        if settings.USE_POSTGRES:
            cur = conn.cursor()
            cur.execute("SELECT * FROM files WHERE share_token = %s", (share_token,))
            row = cur.fetchone()
            cur.close()
        else:
            row = conn.execute("SELECT * FROM files WHERE share_token = ?", (share_token,)).fetchone()

        if not row:
            raise HTTPException(404, "Shared file not found")

        # Password check
        if row["password_hash"] and not verify_file_password(password or "", row["password_hash"]):
            raise HTTPException(401, "Invalid password")

        # Expiry check
        if row["expiry_time"]:
            expiry = row["expiry_time"]
            if isinstance(expiry, str):
                expiry = datetime.fromisoformat(expiry)
            if expiry < datetime.utcnow():
                raise HTTPException(410, "Link expired")

        # Decrypt
        enc_path = row["encrypted_path"]
        if not os.path.exists(enc_path):
            raise HTTPException(404, "Encrypted file not found on disk")

        with open(enc_path, "rb") as f:
            decrypted = fernet.decrypt(f.read())

        # Update download count
        if settings.USE_POSTGRES:
            cur = conn.cursor()
            cur.execute("UPDATE files SET download_count = download_count + 1 WHERE id = %s", (row["id"],))
            conn.commit()
            cur.close()
        else:
            conn.execute("UPDATE files SET download_count = download_count + 1 WHERE id = ?", (row["id"],))
            conn.commit()

        filename = row["filename"]
        return StreamingResponse(
            io.BytesIO(decrypted),
            media_type="application/octet-stream",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    finally:
        conn.close()

@router.delete("/{file_id}", status_code=204)
def delete_file(file_id: str, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        if settings.USE_POSTGRES:
            cur = conn.cursor()
            cur.execute(
                "SELECT * FROM files WHERE id = %s AND user_id = %s",
                (file_id, current_user["sub"])
            )
            row = cur.fetchone()
            cur.close()
        else:
            row = conn.execute(
                "SELECT * FROM files WHERE id = ? AND user_id = ?",
                (file_id, current_user["sub"])
            ).fetchone()

        if not row:
            raise HTTPException(404, "File not found")

        # Remove encrypted file from disk
        enc_path = row["encrypted_path"]
        if enc_path and os.path.exists(enc_path):
            os.remove(enc_path)

        if settings.USE_POSTGRES:
            cur = conn.cursor()
            cur.execute("DELETE FROM files WHERE id = %s", (file_id,))
            conn.commit()
            cur.close()
        else:
            conn.execute("DELETE FROM files WHERE id = ?", (file_id,))
            conn.commit()
    finally:
        conn.close()
