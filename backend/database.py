"""
Database setup — SQLite for local dev, Supabase for production.
Switch DATABASE_URL in .env to connect to Supabase PostgreSQL.
"""

import sqlite3
import os
from config import settings

def get_connection():
    if settings.USE_POSTGRES:
        try:
            import psycopg2
            from psycopg2.extras import RealDictCursor
            conn = psycopg2.connect(settings.DATABASE_URL, cursor_factory=RealDictCursor)
            return conn
        except ImportError:
            raise RuntimeError("psycopg2 is not installed. Please run: pip install psycopg2-binary")
    else:
        conn = sqlite3.connect(settings.DATABASE_URL, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

def create_tables():
    conn = get_connection()
    cur = conn.cursor()

    if settings.USE_POSTGRES:
        # PostgreSQL schema creation
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id            VARCHAR(255) PRIMARY KEY,
                email         VARCHAR(255) UNIQUE NOT NULL,
                "displayName" VARCHAR(255),
                password_hash VARCHAR(255) NOT NULL,
                created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS scans (
                id          VARCHAR(255) PRIMARY KEY,
                user_id     VARCHAR(255) NOT NULL,
                scan_type   VARCHAR(255) NOT NULL,
                target      TEXT NOT NULL,
                result      TEXT,           -- JSON blob
                risk_score  INTEGER DEFAULT 0,
                timestamp   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS files (
                id                VARCHAR(255) PRIMARY KEY,
                user_id           VARCHAR(255) NOT NULL,
                filename          VARCHAR(255) NOT NULL,
                encrypted_path    TEXT,
                file_size         INTEGER DEFAULT 0,
                malware_status    VARCHAR(255) DEFAULT 'scanning',
                share_token       VARCHAR(255) UNIQUE,
                password_hash     VARCHAR(255),
                expiry_time       VARCHAR(255),
                download_count    INTEGER DEFAULT 0,
                created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS activity_logs (
                id          VARCHAR(255) PRIMARY KEY,
                user_id     VARCHAR(255) NOT NULL,
                type        VARCHAR(255) NOT NULL,
                message     TEXT NOT NULL,
                severity    VARCHAR(255) DEFAULT 'safe',
                timestamp   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
        """)
    else:
        # SQLite schema creation
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
                result      TEXT,           -- JSON blob
                risk_score  INTEGER DEFAULT 0,
                timestamp   TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (user_id) REFERENCES users(id)
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
                created_at        TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS activity_logs (
                id          TEXT PRIMARY KEY,
                user_id     TEXT NOT NULL,
                type        TEXT NOT NULL,
                message     TEXT NOT NULL,
                severity    TEXT DEFAULT 'safe',
                timestamp   TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
        """)
    conn.commit()

    # Pre-create demo user if not exists
    try:
        if settings.USE_POSTGRES:
            cur.execute("SELECT id FROM users WHERE email = %s", ("demo@cybersphere.io",))
        else:
            cur.execute("SELECT id FROM users WHERE email = ?", ("demo@cybersphere.io",))
            
        if not cur.fetchone():
            from passlib.context import CryptContext
            pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
            hashed_demo_pw = pwd_context.hash("demo1234")
            
            if settings.USE_POSTGRES:
                cur.execute(
                    'INSERT INTO users (id, email, "displayName", password_hash) VALUES (%s,%s,%s,%s)',
                    ("demo-user-001", "demo@cybersphere.io", "Demo Analyst", hashed_demo_pw)
                )
            else:
                cur.execute(
                    "INSERT INTO users (id, email, displayName, password_hash) VALUES (?,?,?,?)",
                    ("demo-user-001", "demo@cybersphere.io", "Demo Analyst", hashed_demo_pw)
                )
            conn.commit()
            print("DEBUG: Pre-created demo user 'demo@cybersphere.io' in database.")
    except Exception as e:
        print(f"DEBUG: Failed to pre-create demo user: {e}")
        pass
    finally:
        cur.close()
        conn.close()
