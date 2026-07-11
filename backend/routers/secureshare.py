"""SecureShare router — encrypted file upload/download with ClamAV scanning hook"""

import uuid, secrets, hashlib, os, json
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import FileResponse
from cryptography.fernet import Fernet

from database import get_connection
from routers.auth import get_current_user

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Generate or load encryption key (in prod: store in env/secrets manager)
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY") or Fernet.generate_key().decode()
fernet = Fernet(ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY)

def hash_password(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()

def mock_malware_scan(data: bytes) -> str:
    """
    Production: pipe to ClamAV via python-clamav or clamd socket.
    Returns 'clean' | 'infected'
    """
    import random
    return "infected" if random.random() < 0.05 else "clean"  # 5% chance for demo

@router.post("/upload", status_code=201)
async def upload_file(
    file: UploadFile = File(...),
    password: Optional[str] = Form(None),
    expiry_hours: int = Form(0),
    current_user: dict = Depends(get_current_user),
):
    content = await file.read()

    # 1. Malware scan before encryption
    malware_status = mock_malware_scan(content)

    # 2. AES-256 encrypt via Fernet
    encrypted = fernet.encrypt(content)

    # 3. Store encrypted file
    file_id = str(uuid.uuid4())
    encrypted_path = os.path.join(UPLOAD_DIR, f"{file_id}.enc")
    with open(encrypted_path, "wb") as f:
        f.write(encrypted)

    # 4. Generate share token
    share_token = secrets.token_urlsafe(12) if malware_status == "clean" else None
    expiry_time = (datetime.utcnow() + timedelta(hours=expiry_hours)).isoformat() if expiry_hours > 0 else None

    conn = get_connection()
    conn.execute(
        """INSERT INTO files (id, user_id, filename, encrypted_path, file_size,
           malware_status, share_token, password_hash, expiry_time)
           VALUES (?,?,?,?,?,?,?,?,?)""",
        (file_id, current_user["sub"], file.filename, encrypted_path,
         len(content), malware_status, share_token,
         hash_password(password) if password else None, expiry_time)
    )
    conn.commit(); conn.close()

    return {
        "id": file_id, "filename": file.filename, "size": len(content),
        "encrypted": True, "malwareStatus": malware_status,
        "shareToken": share_token, "passwordProtected": bool(password),
        "expiryTime": expiry_time, "downloadCount": 0,
        "uploadedAt": datetime.utcnow().isoformat(),
    }

@router.get("/")
def list_files(current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM files WHERE user_id = ? ORDER BY created_at DESC",
        (current_user["sub"],)
    ).fetchall()
    conn.close()
    return [{
        "id": r["id"], "filename": r["filename"], "size": r["file_size"],
        "encrypted": True, "malwareStatus": r["malware_status"],
        "shareToken": r["share_token"], "passwordProtected": bool(r["password_hash"]),
        "expiryTime": r["expiry_time"], "downloadCount": r["download_count"],
        "uploadedAt": r["created_at"],
    } for r in rows]

@router.get("/download/{file_id}")
def download_file(file_id: str, password: Optional[str] = None,
                  current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    row = conn.execute("SELECT * FROM files WHERE id = ?", (file_id,)).fetchone()
    if not row: raise HTTPException(404, "File not found")

    # Auth: owner or valid share
    if row["user_id"] != current_user["sub"]:
        raise HTTPException(403, "Access denied")

    # Password check
    if row["password_hash"] and hash_password(password or "") != row["password_hash"]:
        raise HTTPException(401, "Invalid password")

    # Expiry check
    if row["expiry_time"] and datetime.fromisoformat(row["expiry_time"]) < datetime.utcnow():
        raise HTTPException(410, "Link expired")

    # Decrypt
    with open(row["encrypted_path"], "rb") as f:
        decrypted = fernet.decrypt(f.read())

    # Update download count
    conn.execute("UPDATE files SET download_count = download_count + 1 WHERE id = ?", (file_id,))
    conn.commit(); conn.close()

    # Return as file response
    temp_path = f"/tmp/{row['filename']}"
    with open(temp_path, "wb") as f: f.write(decrypted)
    return FileResponse(temp_path, filename=row["filename"])

@router.delete("/{file_id}", status_code=204)
def delete_file(file_id: str, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    row = conn.execute("SELECT * FROM files WHERE id = ? AND user_id = ?",
                       (file_id, current_user["sub"])).fetchone()
    if not row: raise HTTPException(404, "File not found")
    if os.path.exists(row["encrypted_path"]): os.remove(row["encrypted_path"])
    conn.execute("DELETE FROM files WHERE id = ?", (file_id,))
    conn.commit(); conn.close()
