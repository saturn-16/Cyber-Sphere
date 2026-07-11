"""
Database setup — SQLite for local dev, Supabase for production.
Switch DATABASE_URL in .env to connect to Supabase PostgreSQL.
"""

import sqlite3
import os

DATABASE_URL = os.getenv("DATABASE_URL", "cybersphere.db")

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
    conn.close()
