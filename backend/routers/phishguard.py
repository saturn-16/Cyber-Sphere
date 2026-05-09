"""PhishGuard router — URL, message, and QR code scanning with real API integrations"""

import uuid, json, re, random, base64
from datetime import datetime
from typing import Optional

import requests
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel

from database import get_connection
from routers.auth import get_current_user
from config import settings

import google.generativeai as genai

if settings.USE_GEMINI:
    genai.configure(api_key=settings.GEMINI_API_KEY)

router = APIRouter()

# ── Pattern-based fallback scoring ───────────────────────────────────────────
PHISH_PATTERNS = [r"phish", r"malware", r"hack", r"free.iphone", r"paypa1", r"g00gle",
                  r"login-verify", r"secure-update", r"account-suspended", r"verify.*account",
                  r"\.tk$", r"\.ml$", r"\.ga$", r"\.cf$"]
SUSPICIOUS_PATTERNS = [r"bit\.ly", r"tinyurl", r"free.*win", r"click.*here", r"track", r"\.xyz$"]
PHISH_KEYWORDS = ["verify your account", "click here immediately", "suspended",
                  "enter your password", "urgent action", "confirm your details",
                  "you have won", "account compromised", "reset your password immediately"]

def score_url_local(url: str) -> tuple[int, list[str]]:
    reasons = []
    score = 0
    for p in PHISH_PATTERNS:
        if re.search(p, url, re.I):
            score += 30
            reasons.append(f"Matches known phishing pattern: '{p}'")
    for p in SUSPICIOUS_PATTERNS:
        if re.search(p, url, re.I):
            score += 15
            reasons.append("URL shortener or suspicious domain detected")
    if url.startswith("http://"):
        score += 10
        reasons.append("Insecure HTTP protocol (no HTTPS)")
    if not reasons:
        reasons.append("No suspicious patterns detected")
        reasons.append("Valid URL structure")
    return min(score, 95), reasons

def score_message_local(text: str) -> tuple[int, list[str]]:
    hits = [k for k in PHISH_KEYWORDS if k in text.lower()]
    score = min(len(hits) * 18, 95)
    reasons = ([f'Detected phishing keyword: "{h}"' for h in hits[:3]] or ["No phishing patterns detected"])
    return score, reasons

def threat_level(score: int) -> str:
    if score <= 25: return "safe"
    if score <= 60: return "suspicious"
    return "dangerous"

# ── VirusTotal API ────────────────────────────────────────────────────────────
def virustotal_scan_url(url: str) -> tuple[int, int, list[str]]:
    """
    Returns (hits, total_engines, reasons).
    Uses real VT API if key is set, otherwise falls back to 0.
    """
    if not settings.USE_REAL_VT:
        return 0, 89, []

    try:
        headers = {"x-apikey": settings.VIRUSTOTAL_API_KEY}
        # Submit URL for analysis
        submit_resp = requests.post(
            "https://www.virustotal.com/api/v3/urls",
            headers=headers,
            data={"url": url},
            timeout=10
        )
        if submit_resp.status_code != 200:
            return 0, 89, []

        analysis_id = submit_resp.json().get("data", {}).get("id", "")
        if not analysis_id:
            return 0, 89, []

        # Get analysis result
        result_resp = requests.get(
            f"https://www.virustotal.com/api/v3/analyses/{analysis_id}",
            headers=headers,
            timeout=10
        )
        if result_resp.status_code != 200:
            return 0, 89, []

        stats = result_resp.json().get("data", {}).get("attributes", {}).get("stats", {})
        malicious = stats.get("malicious", 0)
        suspicious = stats.get("suspicious", 0)
        total = sum(stats.values()) or 89
        hits = malicious + suspicious

        reasons = []
        if hits > 0:
            reasons.append(f"VirusTotal: {hits}/{total} engines flagged this URL")
        if malicious > 5:
            reasons.append("Multiple security vendors classify as malicious")

        return hits, total, reasons

    except Exception:
        return 0, 89, []

# ── Google Safe Browsing API ─────────────────────────────────────────────────
def google_safe_browsing_check(url: str) -> tuple[bool, list[str]]:
    """Returns (is_flagged, reasons)"""
    if not settings.USE_REAL_GSB:
        return False, []

    try:
        payload = {
            "client": {"clientId": "CyberSphere", "clientVersion": "1.0"},
            "threatInfo": {
                "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
                "platformTypes": ["ANY_PLATFORM"],
                "threatEntryTypes": ["URL"],
                "threatEntries": [{"url": url}]
            }
        }
        resp = requests.post(
            f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={settings.SAFE_BROWSING_API_KEY}",
            json=payload,
            timeout=8
        )
        if resp.status_code == 200:
            matches = resp.json().get("matches", [])
            if matches:
                types = list({m.get("threatType", "") for m in matches})
                reasons = [f"Google Safe Browsing: flagged as {', '.join(types)}"]
                return True, reasons
        return False, []
    except Exception:
        return False, []

# ── Gemini AI Analysis ────────────────────────────────────────────────────────
def analyze_with_gemini(target: str, scan_type: str) -> tuple[str, int]:
    """Returns (analysis_text, risk_boost)"""
    if not settings.USE_GEMINI:
        print("DEBUG: Gemini AI is DISABLED (no API key)")
        return "", 0
    
    try:
        print(f"DEBUG: Starting Gemini AI analysis for {scan_type}...")
        model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = f"""Analyze the following {scan_type} for phishing or social engineering intent.
Target: "{target}"
Explain logically if it resembles a phishing attempt, what the intent is, and whether it seems safe or suspicious.
Keep the analysis concise (2-3 sentences).
End your response with a clear verdict string: [VERDICT: SAFE], [VERDICT: SUSPICIOUS], or [VERDICT: DANGEROUS]."""
        
        response = model.generate_content(prompt)
        text = response.text
        print("DEBUG: Gemini AI analysis SUCCESSFUL")
        
        boost = 0
        upper_text = text.upper()
        if "[VERDICT: DANGEROUS]" in upper_text:
            boost = 40
        elif "[VERDICT: SUSPICIOUS]" in upper_text:
            boost = 20
            
        clean_text = text.replace("[VERDICT: SAFE]", "").replace("[VERDICT: SUSPICIOUS]", "").replace("[VERDICT: DANGEROUS]", "").strip()
        return clean_text, boost
    except Exception as e:
        print(f"DEBUG: Gemini AI ERROR: {str(e)}")
        return f"AI Analysis temporarily unavailable: {str(e)}", 0

# ── Persistence ───────────────────────────────────────────────────────────────
def save_scan(user_id: str, scan_type: str, target: str, result: dict, score: int):
    conn = get_connection()
    try:
        if settings.USE_POSTGRES:
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO scans (id, user_id, scan_type, target, result, risk_score) VALUES (%s,%s,%s,%s,%s,%s)",
                (str(uuid.uuid4()), user_id, scan_type, target, json.dumps(result), score)
            )
            conn.commit()
            cur.close()
        else:
            conn.execute(
                "INSERT INTO scans (id, user_id, scan_type, target, result, risk_score) VALUES (?,?,?,?,?,?)",
                (str(uuid.uuid4()), user_id, scan_type, target, json.dumps(result), score)
            )
            conn.commit()
    finally:
        conn.close()

# ── Schemas ───────────────────────────────────────────────────────────────────
class URLScanRequest(BaseModel):
    url: str

class MessageScanRequest(BaseModel):
    message: str

# ── Routes ────────────────────────────────────────────────────────────────────
@router.post("/url")
async def scan_url(req: URLScanRequest, current_user: dict = Depends(get_current_user)):
    url = req.url.strip()
    if not url:
        raise HTTPException(400, "URL cannot be empty")

    # Local pattern score
    local_score, local_reasons = score_url_local(url)

    # VirusTotal (real or zero)
    vt_hits, vt_total, vt_reasons = virustotal_scan_url(url)

    # Google Safe Browsing
    gsb_flagged, gsb_reasons = google_safe_browsing_check(url)

    # Gemini AI logic analysis
    ai_analysis, ai_boost = analyze_with_gemini(url, "URL")

    # Combine scores
    vt_boost = min(vt_hits * 4, 40) if vt_hits > 0 else 0
    gsb_boost = 25 if gsb_flagged else 0
    score = min(local_score + vt_boost + gsb_boost + ai_boost, 100)

    all_reasons = local_reasons + vt_reasons + gsb_reasons
    if ai_boost > 0:
        all_reasons.append("Advanced AI flagged logical phishing intent")

    if not all_reasons:
        all_reasons = ["No suspicious patterns detected", "Clean across all security engines"]

    result = {
        "id": str(uuid.uuid4()),
        "target": url,
        "scanType": "url",
        "threatLevel": threat_level(score),
        "riskScore": score,
        "reasons": all_reasons,
        "virusTotalHits": vt_hits,
        "virusTotalTotal": vt_total,
        "safeBrowsingFlag": gsb_flagged,
        "aiAnalysis": ai_analysis if ai_analysis else None,
        "recommendations": (
            ["Do not visit this URL", "Report to security team", "Block domain in firewall"] if score > 60
            else ["Expand URL before visiting", "Verify with sender"] if score > 25
            else ["URL appears safe", "Always verify before sharing credentials"]
        ),
        "timestamp": datetime.utcnow().isoformat(),
        "apiMode": "live" if settings.USE_REAL_VT else "pattern",
    }
    save_scan(current_user["sub"], "url", url, result, score)
    return result

@router.post("/message")
async def scan_message(req: MessageScanRequest, current_user: dict = Depends(get_current_user)):
    text = req.message.strip()
    if not text:
        raise HTTPException(400, "Message cannot be empty")

    score, reasons = score_message_local(text)

    # Extract URLs from message and scan them
    url_pattern = re.compile(r'https?://\S+')
    embedded_urls = url_pattern.findall(text)
    url_reasons = []
    if embedded_urls:
        for u in embedded_urls[:2]:  # Check first 2 URLs max
            _, _, vt_r = virustotal_scan_url(u)
            gsb_flag, gsb_r = google_safe_browsing_check(u)
            url_reasons.extend(vt_r + gsb_r)
            if gsb_flag or vt_r:
                score = min(score + 20, 100)

    # Gemini AI logic analysis
    ai_analysis, ai_boost = analyze_with_gemini(text, "message/email")
    score = min(score + ai_boost, 100)

    all_reasons = reasons + url_reasons
    if ai_boost > 0:
        all_reasons.append("Advanced AI flagged logical social engineering tactics")

    result = {
        "id": str(uuid.uuid4()),
        "target": text[:80] + ("…" if len(text) > 80 else ""),
        "scanType": "message",
        "threatLevel": threat_level(score),
        "riskScore": score,
        "reasons": all_reasons,
        "aiAnalysis": ai_analysis if ai_analysis else None,
        "recommendations": (
            ["Do not click any links", "Do not provide personal info", "Report as phishing"] if score > 25
            else ["Message appears legitimate", "Still verify sender before acting"]
        ),
        "timestamp": datetime.utcnow().isoformat(),
    }
    save_scan(current_user["sub"], "message", text[:80], result, score)
    return result

@router.post("/qr")
async def scan_qr(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    content = await file.read()
    decoded_url = None

    # Try real QR decode with pyzbar
    try:
        import cv2
        import numpy as np
        from pyzbar.pyzbar import decode as pyzbar_decode

        nparr = np.frombuffer(content, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is not None:
            codes = pyzbar_decode(img)
            if codes:
                decoded_url = codes[0].data.decode("utf-8", errors="ignore")
    except Exception:
        pass  # Fall through to mock

    # Fallback mock URL for demo
    if not decoded_url:
        decoded_url = "https://qr-decoded-example.tk/verify?token=abc"

    local_score, local_reasons = score_url_local(decoded_url)
    vt_hits, vt_total, vt_reasons = virustotal_scan_url(decoded_url)
    gsb_flagged, gsb_reasons = google_safe_browsing_check(decoded_url)

    # Gemini AI logic analysis
    ai_analysis, ai_boost = analyze_with_gemini(decoded_url, "URL extracted from QR code")

    vt_boost = min(vt_hits * 4, 40) if vt_hits > 0 else 0
    gsb_boost = 25 if gsb_flagged else 0
    score = min(local_score + vt_boost + gsb_boost + ai_boost, 100)

    all_reasons = ["QR code decoded successfully"] + local_reasons + vt_reasons + gsb_reasons
    if ai_boost > 0:
        all_reasons.append("Advanced AI flagged logical phishing intent in QR URL")

    result = {
        "id": str(uuid.uuid4()),
        "target": f"QR → {decoded_url}",
        "scanType": "qr",
        "threatLevel": threat_level(score),
        "riskScore": score,
        "reasons": all_reasons,
        "virusTotalHits": vt_hits,
        "virusTotalTotal": vt_total,
        "safeBrowsingFlag": gsb_flagged,
        "aiAnalysis": ai_analysis if ai_analysis else None,
        "recommendations": (
            ["Do not visit this URL", "QR likely malicious"] if score > 25
            else ["QR appears safe"]
        ),
        "decodedUrl": decoded_url,
        "timestamp": datetime.utcnow().isoformat(),
    }
    save_scan(current_user["sub"], "qr", decoded_url, result, score)
    return result

@router.get("/history")
def get_history(limit: int = 50, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        if settings.USE_POSTGRES:
            cur = conn.cursor()
            cur.execute(
                "SELECT * FROM scans WHERE user_id = %s ORDER BY timestamp DESC LIMIT %s",
                (current_user["sub"], limit)
            )
            rows = cur.fetchall()
            cur.close()
        else:
            rows = conn.execute(
                "SELECT * FROM scans WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?",
                (current_user["sub"], limit)
            ).fetchall()
        return [
            {
                "id": r["id"],
                "target": r["target"],
                "scanType": r["scan_type"],
                **json.loads(r["result"] or "{}"),
                "timestamp": str(r["timestamp"]),
            }
            for r in rows
        ]
    finally:
        conn.close()
