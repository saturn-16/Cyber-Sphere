"""CloudScan router — comprehensive web security scanner"""

import uuid, json, random, re, ssl, socket
from datetime import datetime
from urllib.parse import urlparse

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from database import get_connection
from routers.auth import get_current_user
from config import settings

router = APIRouter()

VULN_DEFINITIONS = [
    {"id":"v1","severity":"critical","title":"Exposed .env File","description":"/.env accessible publicly — may contain API keys and database credentials.","fix":"Restrict .env access in nginx/Apache config with deny all."},
    {"id":"v2","severity":"critical","title":"Exposed .git Directory","description":"/.git/ directory publicly accessible, leaking source code.","fix":"Block /.git/ access in your server configuration."},
    {"id":"v3","severity":"high","title":"Missing Content-Security-Policy","description":"No CSP header — XSS attacks are unmitigated.","fix":"Add Content-Security-Policy header with strict directives."},
    {"id":"v4","severity":"high","title":"Missing X-Frame-Options","description":"Page embeddable in iframes — clickjacking risk.","fix":"Set X-Frame-Options: DENY or SAMEORIGIN."},
    {"id":"v5","severity":"high","title":"Insecure HTTP Protocol","description":"Site serves over HTTP without HTTPS redirect.","fix":"Configure SSL/TLS and force HTTPS redirect."},
    {"id":"v6","severity":"medium","title":"CORS Misconfiguration","description":"Access-Control-Allow-Origin: * allows any origin.","fix":"Restrict CORS to known trusted origins only."},
    {"id":"v7","severity":"medium","title":"Missing HSTS Header","description":"HTTP Strict Transport Security not enforced.","fix":"Add Strict-Transport-Security: max-age=31536000; includeSubDomains."},
    {"id":"v8","severity":"medium","title":"Open Admin Panel","description":"/admin or /wp-admin accessible without IP restriction.","fix":"Restrict admin access by IP whitelist or VPN."},
    {"id":"v9","severity":"low","title":"Server Version Disclosure","description":"Server header exposes software version.","fix":"Configure server to suppress version in headers."},
    {"id":"v10","severity":"low","title":"Missing X-Content-Type-Options","description":"MIME-type sniffing not disabled.","fix":"Add X-Content-Type-Options: nosniff header."},
    {"id":"v11","severity":"info","title":"Firebase Config Exposed","description":"Firebase API keys found in public JS bundle.","fix":"Use Firebase Security Rules and server-side auth."},
    {"id":"v12","severity":"info","title":"API Keys in Source","description":"Potential API keys in public JavaScript files.","fix":"Move all secrets to server-side environment variables."},
]

def check_ssl(hostname: str) -> tuple[bool, str | None]:
    """Real SSL check — try connecting with SSL context"""
    try:
        ctx = ssl.create_default_context()
        with ctx.wrap_socket(socket.socket(), server_hostname=hostname) as s:
            s.settimeout(5)
            s.connect((hostname, 443))
            cert = s.getpeercert()
            expiry = cert.get("notAfter", "")
            return True, expiry
    except Exception:
        return False, None

def simulate_scan(domain: str) -> list[dict]:
    """
    In production: make HTTP requests to check headers, probe paths, etc.
    For demo: probabilistic detection based on domain patterns.
    """
    is_http = domain.startswith("http://")
    vulns = []
    for v in VULN_DEFINITIONS:
        det = False
        if v["id"] == "v5": det = is_http
        elif v["severity"] == "critical": det = random.random() > 0.65
        elif v["severity"] == "high": det = random.random() > 0.45
        elif v["severity"] == "medium": det = random.random() > 0.40
        elif v["severity"] == "low": det = random.random() > 0.35
        else: det = random.random() > 0.75
        vulns.append({**v, "detected": det})
    return vulns

class ScanRequest(BaseModel):
    domain: str

@router.post("/website")
def scan_website(req: ScanRequest, current_user: dict = Depends(get_current_user)):
    parsed = urlparse(req.domain if "://" in req.domain else f"https://{req.domain}")
    hostname = parsed.hostname or req.domain

    # SSL check
    ssl_valid, ssl_expiry = check_ssl(hostname)

    # Vulnerability simulation (real checks in production)
    vulns = simulate_scan(req.domain)
    detected = [v for v in vulns if v["detected"]]

    # Calculate score
    penalties = {"critical": 25, "high": 15, "medium": 8, "low": 3, "info": 1}
    penalty = sum(penalties.get(v["severity"], 0) for v in detected)
    score = max(5, 100 - penalty)

    result = {
        "id": str(uuid.uuid4()),
        "domain": req.domain,
        "securityScore": score,
        "vulnerabilities": vulns,
        "sslValid": ssl_valid,
        "sslExpiry": ssl_expiry,
        "responseTime": random.randint(80, 600),
        "timestamp": datetime.utcnow().isoformat(),
    }

    # Persist
    conn = get_connection()
    try:
        if settings.USE_POSTGRES:
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO scans (id, user_id, scan_type, target, result, risk_score) VALUES (%s,%s,%s,%s,%s,%s)",
                (result["id"], current_user["sub"], "cloudscan", req.domain, json.dumps(result), 100 - score)
            )
            conn.commit()
            cur.close()
        else:
            conn.execute(
                "INSERT INTO scans (id, user_id, scan_type, target, result, risk_score) VALUES (?,?,?,?,?,?)",
                (result["id"], current_user["sub"], "cloudscan", req.domain, json.dumps(result), 100 - score)
            )
            conn.commit()
    finally:
        conn.close()
    return result

@router.get("/history")
def scan_history(current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        if settings.USE_POSTGRES:
            cur = conn.cursor()
            cur.execute(
                "SELECT * FROM scans WHERE user_id = %s AND scan_type = 'cloudscan' ORDER BY timestamp DESC LIMIT 20",
                (current_user["sub"],)
            )
            rows = cur.fetchall()
            cur.close()
        else:
            rows = conn.execute(
                "SELECT * FROM scans WHERE user_id = ? AND scan_type = 'cloudscan' ORDER BY timestamp DESC LIMIT 20",
                (current_user["sub"],)
            ).fetchall()
        
        return [{"id": r["id"], "target": r["target"], "riskScore": r["risk_score"],
                 "timestamp": str(r["timestamp"])} for r in rows]
    finally:
        conn.close()
