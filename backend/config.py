"""
CyberSphere Backend Configuration
───────────────────────────────────
All secrets are loaded from environment variables (.env file).
"""

import os
from functools import lru_cache
from dotenv import load_dotenv

# Load .env automatically
load_dotenv()

class Settings:
    # JWT
    SECRET_KEY: str         = os.getenv("SECRET_KEY", "change-me-in-production-32-chars")
    JWT_ALGORITHM: str      = "HS256"
    JWT_EXPIRE_HOURS: int   = int(os.getenv("JWT_EXPIRE_HOURS", "24"))

    # Database — PostgreSQL (Supabase) or SQLite fallback
    DATABASE_URL: str       = os.getenv("DATABASE_URL", "cybersphere.db")

    # Supabase
    SUPABASE_URL: str       = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str       = os.getenv("SUPABASE_KEY", "")

    # External API keys
    VIRUSTOTAL_API_KEY: str     = os.getenv("VIRUSTOTAL_API_KEY", "")
    SAFE_BROWSING_API_KEY: str  = os.getenv("SAFE_BROWSING_API_KEY", "")
    ABUSEIPDB_API_KEY: str      = os.getenv("ABUSEIPDB_API_KEY", "")
    GEMINI_API_KEY: str         = os.getenv("GEMINI_API_KEY", "")

    # File encryption
    ENCRYPTION_KEY: str         = os.getenv("ENCRYPTION_KEY", "")

    # Storage
    STORAGE_BUCKET: str         = os.getenv("STORAGE_BUCKET", "cybersphere-files")

    # Feature flags — auto-detected
    @property
    def USE_REAL_VT(self) -> bool:
        return bool(self.VIRUSTOTAL_API_KEY)

    @property
    def USE_REAL_GSB(self) -> bool:
        return bool(self.SAFE_BROWSING_API_KEY)

    @property
    def USE_REAL_ABUSEIPDB(self) -> bool:
        return bool(self.ABUSEIPDB_API_KEY)

    @property
    def USE_GEMINI(self) -> bool:
        return bool(self.GEMINI_API_KEY)

    @property
    def USE_POSTGRES(self) -> bool:
        return self.DATABASE_URL.startswith("postgresql")

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
