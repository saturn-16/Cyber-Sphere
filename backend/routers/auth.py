"""Authentication router — register, login, JWT token handling"""

import uuid, hashlib
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, status
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
def register(req: RegisterRequest):
    conn = get_connection()
    try:
        user_id = str(uuid.uuid4())
        hashed = hash_password(req.password)
        d_name = req.displayName or req.email.split("@")[0]
        
        if settings.USE_POSTGRES:
            cur = conn.cursor()
            cur.execute("SELECT id FROM users WHERE email = %s", (req.email.lower(),))
            if cur.fetchone():
                raise HTTPException(status_code=409, detail="Email already registered")
            
            cur.execute(
                'INSERT INTO users (id, email, "displayName", password_hash) VALUES (%s,%s,%s,%s)',
                (user_id, req.email.lower(), d_name, hashed)
            )
            conn.commit()
            cur.close()
        else:
            cur = conn.cursor()
            existing = cur.execute("SELECT id FROM users WHERE email = ?", (req.email.lower(),)).fetchone()
            if existing:
                raise HTTPException(status_code=409, detail="Email already registered")
            cur.execute(
                "INSERT INTO users (id, email, displayName, password_hash) VALUES (?,?,?,?)",
                (user_id, req.email.lower(), d_name, hashed)
            )
            conn.commit()
    finally:
        conn.close()
        
    return {
        "token": create_token(user_id, req.email),
        "user": {"id": user_id, "email": req.email, "displayName": req.displayName}
    }

@router.post("/login")
def login(req: LoginRequest):
    conn = get_connection()
    try:
        if settings.USE_POSTGRES:
            cur = conn.cursor()
            cur.execute(
                'SELECT id, email, "displayName" FROM users WHERE email = %s AND password_hash = %s',
                (req.email.lower(), hash_password(req.password))
            )
            row = cur.fetchone()
            cur.close()
        else:
            row = conn.execute(
                "SELECT id, email, displayName FROM users WHERE email = ? AND password_hash = ?",
                (req.email.lower(), hash_password(req.password))
            ).fetchone()
    finally:
        conn.close()
        
    if not row:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {
        "token": create_token(row["id"], row["email"]),
        "user": {"id": row["id"], "email": row["email"], "displayName": row["displayName"]}
    }

@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        if settings.USE_POSTGRES:
            cur = conn.cursor()
            cur.execute('SELECT id, email, "displayName", created_at FROM users WHERE id = %s', (current_user["sub"],))
            row = cur.fetchone()
            cur.close()
        else:
            row = conn.execute("SELECT id, email, displayName, created_at FROM users WHERE id = ?", (current_user["sub"],)).fetchone()
    finally:
        conn.close()
        
    if not row: raise HTTPException(404, "User not found")
    return dict(row)
