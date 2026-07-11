"""Authentication router — register, login, JWT token handling"""

import uuid, hashlib
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
import jwt

from database import get_connection
from config import settings

router = APIRouter()
security = HTTPBearer()

# ── Password Hashing ──────────────────────────────────────────────────────────
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False

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
    email_clean = req.email.strip().lower()
    print(f"DEBUG: Registering new operator: {email_clean}")
    
    conn = get_connection()
    try:
        cur = conn.cursor()
        
        # Check if email exists
        if settings.USE_POSTGRES:
            cur.execute("SELECT id FROM users WHERE email = %s", (email_clean,))
        else:
            cur.execute("SELECT id FROM users WHERE email = ?", (email_clean,))
        
        if cur.fetchone():
            print(f"DEBUG: Registration failed — {email_clean} already exists")
            raise HTTPException(status_code=409, detail="Email already registered")
        
        user_id = str(uuid.uuid4())
        hashed = get_password_hash(req.password)
        d_name = req.displayName or email_clean.split("@")[0]
        
        if settings.USE_POSTGRES:
            cur.execute(
                'INSERT INTO users (id, email, "displayName", password_hash) VALUES (%s,%s,%s,%s)',
                (user_id, email_clean, d_name, hashed)
            )
        else:
            cur.execute(
                "INSERT INTO users (id, email, displayName, password_hash) VALUES (?,?,?,?)",
                (user_id, email_clean, d_name, hashed)
            )
        
        conn.commit()
        cur.close()
        print(f"DEBUG: Registration SUCCESS for {email_clean} (ID: {user_id})")
        
        # Trigger welcome email in background
        try:
            from email_service import send_welcome_email
            send_welcome_email(email_clean, d_name)
        except Exception as e:
            print(f"DEBUG: Welcome email trigger failed: {str(e)}")
            pass
            
        return {
            "token": create_token(user_id, email_clean),
            "user": {"id": user_id, "email": email_clean, "displayName": d_name}
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"DEBUG: CRITICAL REGISTRATION ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during registration")
    finally:
        conn.close()

@router.post("/login")
def login(req: LoginRequest, request: Request):
    email_clean = req.email.strip().lower()
    print(f"DEBUG: Login attempt for operator: {email_clean}")
    
    conn = get_connection()
    try:
        cur = conn.cursor()
        
        # Fetch user by email
        if settings.USE_POSTGRES:
            cur.execute('SELECT id, email, "displayName", password_hash FROM users WHERE email = %s', (email_clean,))
        else:
            cur.execute("SELECT id, email, displayName, password_hash FROM users WHERE email = ?", (email_clean,))
        
        row = cur.fetchone()
        cur.close()
        
        if not row:
            print(f"DEBUG: Login failed — email {email_clean} not found in database")
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Verify hash
        if not verify_password(req.password, row["password_hash"]):
            print(f"DEBUG: Login failed — password mismatch for {email_clean}")
            raise HTTPException(status_code=401, detail="Invalid email or password")
            
        print(f"DEBUG: Login SUCCESS for {email_clean}")
        
        # Trigger login notification email in background
        try:
            from email_service import send_login_alert
            ip = request.client.host if request.client else "127.0.0.1"
            ua = request.headers.get("user-agent", "Unknown Client")
            send_login_alert(row["email"], row["displayName"] or row["email"].split("@")[0], ip, ua)
        except Exception as e:
            print(f"DEBUG: Login alert trigger failed: {str(e)}")
            pass

        return {
            "token": create_token(row["id"], row["email"]),
            "user": {"id": row["id"], "email": row["email"], "displayName": row["displayName"]}
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"DEBUG: CRITICAL LOGIN ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during login")
    finally:
        conn.close()


@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        cur = conn.cursor()
        if settings.USE_POSTGRES:
            cur.execute('SELECT id, email, "displayName", created_at FROM users WHERE id = %s', (current_user["sub"],))
        else:
            cur.execute("SELECT id, email, displayName, created_at FROM users WHERE id = ?", (current_user["sub"],))
        
        row = cur.fetchone()
        cur.close()
    finally:
        conn.close()
        
    if not row:
        raise HTTPException(404, "User not found")
    return dict(row)
