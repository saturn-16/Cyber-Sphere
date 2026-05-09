"""
CyberSphere FastAPI Backend
───────────────────────────
Entry point. Run with:
  uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import auth, phishguard, secureshare, cloudscan, dashboard
from database import create_tables

app = FastAPI(
    title="CyberSphere API",
    description="Backend API for the CyberSphere cybersecurity platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
import os
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://cybersphere.vercel.app",
]

# Add production URL from environment if exists
prod_url = os.getenv("FRONTEND_URL")
if prod_url:
    allowed_origins.append(prod_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    create_tables()

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,        prefix="/api/auth",      tags=["Authentication"])
app.include_router(phishguard.router,  prefix="/api/phish",     tags=["PhishGuard"])
app.include_router(secureshare.router, prefix="/api/files",     tags=["SecureShare"])
app.include_router(cloudscan.router,   prefix="/api/scan",      tags=["CloudScan"])
app.include_router(dashboard.router,   prefix="/api/dashboard", tags=["Dashboard"])

@app.get("/health")
def health():
    return {"status": "operational", "service": "CyberSphere API v1.0"}
