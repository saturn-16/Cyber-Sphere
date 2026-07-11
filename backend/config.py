"""
CyberSphere Backend Configuration
───────────────────────────────────
All secrets are loaded from environment variables.
Copy .env.example to .env and fill in real values.
"""

import os
from functools import lru_cache
from dotenv import load_dotenv

# Load env variables from .env file if it exists
load_dotenv()

class Settings:
    # JWT
    SECRET_KEY: str         = os.getenv("SECRET_KEY", "change-me-in-production-32-chars")
    JWT_ALGORITHM: str      = "HS256"
    JWT_EXPIRE_HOURS: int   = 24

    # Database
    DATABASE_URL: str       = os.getenv("DATABASE_URL", "cybersphere.db")

    # SMTP Settings (for email notifications)
    SMTP_HOST: str          = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int          = int(os.getenv("SMTP_PORT", "587"))
    SMTP_EMAIL: str         = os.getenv("SMTP_EMAIL", "")
    SMTP_APP_PASSWORD: str  = os.getenv("SMTP_APP_PASSWORD", "")


    # External API keys (optional — mock mode if not set)
    VIRUSTOTAL_API_KEY: str     = os.getenv("VIRUSTOTAL_API_KEY", "")
    SAFE_BROWSING_API_KEY: str  = os.getenv("SAFE_BROWSING_API_KEY", "")
    ABUSEIPDB_API_KEY: str      = os.getenv("ABUSEIPDB_API_KEY", "")

    # Storage (Cloudflare R2 or Supabase Storage)
    STORAGE_BUCKET: str         = os.getenv("STORAGE_BUCKET", "cybersphere-files")
    STORAGE_ENDPOINT: str       = os.getenv("STORAGE_ENDPOINT", "")
    STORAGE_ACCESS_KEY: str     = os.getenv("STORAGE_ACCESS_KEY", "")
    STORAGE_SECRET_KEY: str     = os.getenv("STORAGE_SECRET_KEY", "")

    # Feature flags
    USE_MOCK_APIS: bool         = not bool(os.getenv("VIRUSTOTAL_API_KEY", ""))

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
