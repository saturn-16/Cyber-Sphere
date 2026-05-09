"""
Database setup — supports both SQLite (local dev) and PostgreSQL (Supabase production).
DATABASE_URL in .env controls which is used automatically.
"""

import os
import sqlite3
from config import settings

DATABASE_URL = settings.DATABASE_URL
USE_POSTGRES = settings.USE_POSTGRES

# ── PostgreSQL via psycopg2 ────────────────────────────────────────────────────
if USE_POSTGRES:
    try:
        import psycopg2
        import psycopg2.extras

        def get_connection():
            conn = psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)
            conn.autocommit = False
            return conn

        def create_tables():
            conn = get_connection()
            cur = conn.cursor()
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id          TEXT PRIMARY KEY,
                    email       TEXT UNIQUE NOT NULL,
                    "displayName" TEXT,
                    password_hash TEXT NOT NULL,
                    created_at  TIMESTAMPTZ DEFAULT now()
                );
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS scans (
                    id          TEXT PRIMARY KEY,
                    user_id     TEXT NOT NULL,
                    scan_type   TEXT NOT NULL,
                    target      TEXT NOT NULL,
                    result      TEXT,
                    risk_score  INTEGER DEFAULT 0,
                    timestamp   TIMESTAMPTZ DEFAULT now()
                );
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS files (
                    id                TEXT PRIMARY KEY,
                    user_id           TEXT NOT NULL,
                    filename          TEXT NOT NULL,
                    encrypted_path    TEXT,
                    file_size         BIGINT DEFAULT 0,
                    malware_status    TEXT DEFAULT 'scanning',
                    share_token       TEXT UNIQUE,
                    password_hash     TEXT,
                    expiry_time       TIMESTAMPTZ,
                    download_count    INTEGER DEFAULT 0,
                    created_at        TIMESTAMPTZ DEFAULT now()
                );
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS activity_logs (
                    id          TEXT PRIMARY KEY,
                    user_id     TEXT NOT NULL,
                    type        TEXT NOT NULL,
                    message     TEXT NOT NULL,
                    severity    TEXT DEFAULT 'safe',
                    timestamp   TIMESTAMPTZ DEFAULT now()
                );
            """)
            conn.commit()
            cur.close()
            conn.close()

    except ImportError:
        raise RuntimeError("psycopg2-binary is required for PostgreSQL. Run: pip install psycopg2-binary")

# ── SQLite (local dev fallback) ───────────────────────────────────────────────
else:
    def get_connection():
        conn = sqlite3.connect(DATABASE_URL, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def create_tables():
        conn = get_connection()
        cur = conn.cursor()
        cur.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id          TEXT PRIMARY KEY,
                email       TEXT UNIQUE NOT NULL,
                displayName TEXT,
                password_hash TEXT NOT NULL,
                created_at  TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS scans (
                id          TEXT PRIMARY KEY,
                user_id     TEXT NOT NULL,
                scan_type   TEXT NOT NULL,
                target      TEXT NOT NULL,
                result      TEXT,
                risk_score  INTEGER DEFAULT 0,
                timestamp   TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS files (
                id                TEXT PRIMARY KEY,
                user_id           TEXT NOT NULL,
                filename          TEXT NOT NULL,
                encrypted_path    TEXT,
                file_size         INTEGER DEFAULT 0,
                malware_status    TEXT DEFAULT 'scanning',
                share_token       TEXT UNIQUE,
                password_hash     TEXT,
                expiry_time       TEXT,
                download_count    INTEGER DEFAULT 0,
                created_at        TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS activity_logs (
                id          TEXT PRIMARY KEY,
                user_id     TEXT NOT NULL,
                type        TEXT NOT NULL,
                message     TEXT NOT NULL,
                severity    TEXT DEFAULT 'safe',
                timestamp   TEXT DEFAULT (datetime('now'))
            );
        """)
        conn.commit()
        conn.close()
