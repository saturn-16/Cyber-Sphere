"""Authentication router — register, login, JWT token handling"""

import uuid, hashlib
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
import jwt

from database import get_connection
from config import settings

router = APIRouter()
security = HTTPBearer()

# ── Helpers ───────────────────────────────────────────────────────────────────
def hash_password(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()

def create_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRE_HOURS),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    return decode_token(creds.credentials)

# ── Schemas ───────────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    email: str
    password: str
    displayName: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

# ── Routes ────────────────────────────────────────────────────────────────────
@router.post("/register", status_code=201)
def register(req: RegisterRequest, request: Request):
    conn = get_connection()
    cur = conn.cursor()
    existing = cur.execute("SELECT id FROM users WHERE email = ?", (req.email.lower(),)).fetchone()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    user_id = str(uuid.uuid4())
    display_name = req.displayName or req.email.split("@")[0]
    cur.execute(
        "INSERT INTO users (id, email, displayName, password_hash) VALUES (?,?,?,?)",
        (user_id, req.email.lower(), display_name, hash_password(req.password))
    )
    conn.commit(); conn.close()

    # Trigger welcome email in background
    try:
        from email_service import send_welcome_email
        send_welcome_email(req.email.lower(), display_name)
    except Exception:
        pass

    return {
        "token": create_token(user_id, req.email),
        "user": {"id": user_id, "email": req.email, "displayName": display_name}
    }

@router.post("/login")
def login(req: LoginRequest, request: Request):
    conn = get_connection()
    cur = conn.cursor()
    row = cur.execute(
        "SELECT id, email, displayName FROM users WHERE email = ? AND password_hash = ?",
        (req.email.lower(), hash_password(req.password))
    ).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Trigger login notification email in background
    try:
        from email_service import send_login_alert
        ip = request.client.host if request.client else "127.0.0.1"
        ua = request.headers.get("user-agent", "Unknown Client")
        send_login_alert(row["email"], row["displayName"] or row["email"].split("@")[0], ip, ua)
    except Exception:
        pass

    return {
        "token": create_token(row["id"], row["email"]),
        "user": {"id": row["id"], "email": row["email"], "displayName": row["displayName"]}
    }


@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    row = conn.execute("SELECT id, email, displayName, created_at FROM users WHERE id = ?", (current_user["sub"],)).fetchone()
    conn.close()
    if not row: raise HTTPException(404, "User not found")
    return dict(row)
