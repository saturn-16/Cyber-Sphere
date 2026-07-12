"""
CloudScan Router
────────────────
Performs passive compliance audits of web domains.
Evaluates SSL/TLS certificate validity and analyzes public HTTP response headers
to verify standard security configurations.
"""

import uuid
import json
import ssl
import socket
import re
import requests
from datetime import datetime
from urllib.parse import urlparse
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from database import get_connection
from routers.auth import get_current_user
from config import settings

router = APIRouter()

# Defining the standard compliance audits including exposed files, headers, and credentials
AUDIT_DEFINITIONS = [
    {
        "id": "v1",
        "severity": "critical",
        "title": "Exposed Environment File (.env)",
        "description": "A publicly accessible .env file was detected. This exposes database credentials, API keys, and sensitive configuration secrets.",
        "fix": "Block HTTP access to dotfiles in your server configuration (e.g., Nginx/Apache deny rules) and move the .env file outside the public web root."
    },
    {
        "id": "v2",
        "severity": "critical",
        "title": "Exposed Git Repository (.git)",
        "description": "The .git repository directory is publicly accessible. Attackers can rebuild your source code, configuration history, and discover private credentials.",
        "fix": "Configure your web server to block all HTTP access to the .git directory (e.g., location ~ /\\.git { deny all; } in Nginx)."
    },
    {
        "id": "v3",
        "severity": "high",
        "title": "Missing Content-Security-Policy",
        "description": "No Content-Security-Policy (CSP) header detected. XSS attacks are not mitigated.",
        "fix": "Implement a strict Content-Security-Policy header in your web server configuration."
    },
    {
        "id": "v4",
        "severity": "high",
        "title": "Missing X-Frame-Options",
        "description": "X-Frame-Options header is missing. The site may be vulnerable to clickjacking.",
        "fix": "Add X-Frame-Options: SAMEORIGIN or X-Frame-Options: DENY to response headers."
    },
    {
        "id": "v5",
        "severity": "high",
        "title": "Insecure HTTP Protocol",
        "description": "The server does not automatically redirect HTTP requests to secure HTTPS.",
        "fix": "Configure an HTTP 301 redirect redirecting all traffic from port 80 to port 443."
    },
    {
        "id": "v6",
        "severity": "medium",
        "title": "Permissive CORS Configuration",
        "description": "Access-Control-Allow-Origin header is set to wildcard '*' allowing unauthorized cross-origin access.",
        "fix": "Configure CORS to explicitly authorize trusted origins instead of using wildcards."
    },
    {
        "id": "v7",
        "severity": "medium",
        "title": "Missing HSTS Header",
        "description": "HTTP Strict Transport Security (HSTS) is not enabled, leaving connections open to SSL stripping.",
        "fix": "Add the Strict-Transport-Security header: max-age=31536000; includeSubDomains."
    },
    {
        "id": "v8",
        "severity": "medium",
        "title": "Exposed Admin Panel",
        "description": "A public entry point to an administrative dashboard (e.g., /admin, /wp-admin) was detected without IP restrictions.",
        "fix": "Restrict access to administrative paths using IP whitelisting, VPN routing, or multi-factor authentication (MFA)."
    },
    {
        "id": "v9",
        "severity": "low",
        "title": "Server Information Disclosure",
        "description": "The Server or X-Powered-By header discloses detailed system version signatures.",
        "fix": "Update server configurations (e.g., ServerTokens Prod in Apache, server_tokens off in Nginx) to hide versions."
    },
    {
        "id": "v10",
        "severity": "low",
        "title": "Missing X-Content-Type-Options",
        "description": "X-Content-Type-Options header is missing, allowing browsers to guess MIME types.",
        "fix": "Add the X-Content-Type-Options: nosniff header to responses."
    },
    {
        "id": "v11",
        "severity": "high",
        "title": "Exposed Credentials or Secrets",
        "description": "Detected possible hardcoded secrets, API keys, or private credential blocks inside public pages.",
        "fix": "Never store API keys or private credentials in client-side code. Revoke leaked keys and use environment variables served securely from the backend."
    }
]

def check_ssl(hostname: str) -> tuple[bool, str | None]:
    """Real SSL check — connects via SSL context to fetch expiration date."""
    try:
        ctx = ssl.create_default_context()
        with socket.create_connection((hostname, 443), timeout=5) as sock:
            with ctx.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()
                expiry = cert.get("notAfter", "")
                return True, expiry
    except Exception:
        return False, None

def check_http_redirect(domain: str) -> bool:
    """Verifies if HTTP requests are redirected to HTTPS."""
    try:
        url = f"http://{domain}" if not domain.startswith(("http://", "https://")) else domain
        if url.startswith("https://"):
            url = url.replace("https://", "http://")
        
        res = requests.get(url, allow_redirects=False, timeout=5)
        # Check if status code indicates redirect and destination starts with https
        if res.status_code in [301, 302, 307, 308]:
            loc = res.headers.get("Location", "")
            return loc.startswith("https://")
    except Exception:
        pass
    return False

def audit_headers(domain: str) -> list[dict]:
    """Retrieves target web headers, exposed directories, and scans for credential leaks."""
    url = f"https://{domain}" if not domain.startswith(("http://", "https://")) else domain
    if url.startswith("http://"):
        url = url.replace("http://", "https://")

    headers = {}
    html_content = ""
    connection_failed = False
    
    try:
        res = requests.get(url, timeout=5, headers={"User-Agent": "CyberSphere-Security-Compliance-Agent/1.0"})
        headers = {k.lower(): v for k, v in res.headers.items()}
        html_content = res.text
    except Exception:
        connection_failed = True

    # Active file and path checks
    env_exposed = False
    git_exposed = False
    admin_exposed = False
    leaks_found = False

    if not connection_failed:
        # 1. Check exposed .env file
        try:
            env_res = requests.get(f"https://{domain}/.env", timeout=3, allow_redirects=False)
            if env_res.status_code == 200 and any(k in env_res.text for k in ["DB_", "PASSWORD", "SECRET", "KEY="]):
                env_exposed = True
        except Exception:
            pass

        # 2. Check exposed .git repository (verifying via HEAD pointer file)
        try:
            git_res = requests.get(f"https://{domain}/.git/HEAD", timeout=3, allow_redirects=False)
            if git_res.status_code == 200 and "ref:" in git_res.text:
                git_exposed = True
        except Exception:
            pass

        # 3. Check exposed admin panels
        for admin_path in ["/admin", "/administrator", "/wp-admin/"]:
            try:
                admin_res = requests.get(f"https://{domain}{admin_path}", timeout=3, allow_redirects=False)
                if admin_res.status_code == 200 and any(k in admin_res.text.lower() for k in ["login", "username", "password", "sign in", "admin"]):
                    admin_exposed = True
                    break
            except Exception:
                pass

        # 4. Check for leaks in homepage HTML
        if html_content:
            # Check for Google API key pattern
            if re.search(r"AIza[0-9A-Za-z\-_]{35}", html_content):
                leaks_found = True
            # Check for AWS Access Key pattern
            elif re.search(r"AKIA[0-9A-Z]{16}", html_content):
                leaks_found = True
            # Check for Firebase config block pattern
            elif "apiKey:" in html_content and "authDomain:" in html_content:
                leaks_found = True

    detected_issues = []
    
    # Audit redirects
    redirects_secure = check_http_redirect(domain)

    for audit in AUDIT_DEFINITIONS:
        detected = False
        
        # If domain lookup failed entirely, treat as clean/inconclusive or default checks
        if connection_failed:
            detected_issues.append({**audit, "detected": False})
            continue

        if audit["id"] == "v1":  # Exposed .env
            detected = env_exposed
        elif audit["id"] == "v2":  # Exposed .git
            detected = git_exposed
        elif audit["id"] == "v3":  # CSP
            detected = "content-security-policy" not in headers
        elif audit["id"] == "v4":  # X-Frame-Options
            detected = "x-frame-options" not in headers and "frame-ancestors" not in headers.get("content-security-policy", "")
        elif audit["id"] == "v5":  # HTTP Redirect
            detected = not redirects_secure
        elif audit["id"] == "v6":  # CORS wildcard
            detected = headers.get("access-control-allow-origin") == "*"
        elif audit["id"] == "v7":  # HSTS
            detected = "strict-transport-security" not in headers
        elif audit["id"] == "v8":  # Exposed admin panel
            detected = admin_exposed
        elif audit["id"] == "v9":  # Server Version Disclosure
            srv = headers.get("server", "").lower()
            powered = headers.get("x-powered-by", "").lower()
            detected = any(char.isdigit() for char in srv) or len(srv) > 15 or bool(powered)
        elif audit["id"] == "v10":  # X-Content-Type-Options
            detected = "x-content-type-options" not in headers or "nosniff" not in headers.get("x-content-type-options", "").lower()
        elif audit["id"] == "v11":  # Credentials leak
            detected = leaks_found

        detected_issues.append({**audit, "detected": detected})

    return detected_issues

class ScanRequest(BaseModel):
    domain: str

@router.post("/website")
def scan_website(req: ScanRequest, current_user: dict = Depends(get_current_user)):
    # Parse hostname
    clean_domain = req.domain
    if "://" in clean_domain:
        clean_domain = urlparse(clean_domain).netloc
    
    clean_domain = clean_domain.split(":")[0]  # Remove port if present

    # 1. Check SSL Certificate
    ssl_valid, ssl_expiry = check_ssl(clean_domain)

    # 2. Perform Passive Headers Audit
    start_time = datetime.now()
    vulns = audit_headers(clean_domain)
    duration = int((datetime.now() - start_time).total_seconds() * 1000)

    detected = [v for v in vulns if v["detected"]]

    # 3. Calculate compliance score
    penalties = {"critical": 25, "high": 15, "medium": 8, "low": 3}
    penalty = sum(penalties.get(v["severity"], 0) for v in detected)
    score = max(5, 100 - penalty)

    result = {
        "id": str(uuid.uuid4()),
        "domain": req.domain,
        "securityScore": score,
        "vulnerabilities": vulns,
        "sslValid": ssl_valid,
        "sslExpiry": ssl_expiry,
        "responseTime": max(50, duration),
        "timestamp": datetime.utcnow().isoformat(),
    }

    # Persist scan results in DB
    conn = get_connection()
    try:
        cur = conn.cursor()
        if settings.USE_POSTGRES:
            cur.execute(
                'INSERT INTO scans (id, user_id, scan_type, target, result, risk_score) VALUES (%s,%s,%s,%s,%s,%s)',
                (result["id"], current_user["sub"], "cloudscan", req.domain, json.dumps(result), 100 - score)
            )
        else:
            cur.execute(
                "INSERT INTO scans (id, user_id, scan_type, target, result, risk_score) VALUES (?,?,?,?,?,?)",
                (result["id"], current_user["sub"], "cloudscan", req.domain, json.dumps(result), 100 - score)
            )
        conn.commit()
        cur.close()
    finally:
        conn.close()

    return result

@router.get("/history")
def scan_history(current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        cur = conn.cursor()
        if settings.USE_POSTGRES:
            cur.execute(
                "SELECT * FROM scans WHERE user_id = %s AND scan_type = 'cloudscan' ORDER BY timestamp DESC LIMIT 20",
                (current_user["sub"],)
            )
        else:
            cur.execute(
                "SELECT * FROM scans WHERE user_id = ? AND scan_type = 'cloudscan' ORDER BY timestamp DESC LIMIT 20",
                (current_user["sub"],)
            )
        rows = cur.fetchall()
        cur.close()
    finally:
        conn.close()
        
    return [{"id": r["id"], "target": r["target"], "riskScore": r["risk_score"],
             "timestamp": r["timestamp"]} for r in rows]
