# CyberSphere

> Advanced Cybersecurity & Cloud Security Platform

CyberSphere is a modern full-stack cybersecurity platform that combines phishing detection, secure encrypted file sharing, and cloud/web security analysis into one unified dashboard.

Built with a futuristic SOC-inspired interface, CyberSphere focuses on real-world cybersecurity concepts such as malware scanning, AES-256 encryption, phishing detection, cloud misconfiguration analysis, secure file sharing, and threat intelligence.

---

# Features

## PhishGuard — AI-Powered Phishing Detection
Detects suspicious and malicious content using multiple security checks.

### Features
- URL phishing detection
- Message/email phishing analysis
- QR code phishing scanning
- Typo-squatting detection
- Google Safe Browsing integration
- VirusTotal integration
- Threat scoring system
- Scan history tracking

### Example Detection
- Fake banking links
- Suspicious login pages
- Giveaway scams
- Credential harvesting attempts

---

## SecureShare — Encrypted File Sharing System
A secure cloud file-sharing module designed with cybersecurity principles.

### Features
- AES-256 file encryption
- Malware scanning workflow
- Secure shareable links
- Password-protected sharing
- Link expiry system
- Quarantine system for suspicious files
- Download tracking
- Secure cloud storage integration

### Secure Workflow
Upload File → Malware Scan → Encrypt File → Store Securely → Generate Secure Link

---

## CloudScan — Cloud & Website Security Scanner
Analyzes websites for vulnerabilities, weak configurations, and exposed sensitive data.

### Features
- HTTPS / SSL analysis
- Security header analysis
- Exposed `.env` detection
- Exposed `.git` detection
- Open admin panel detection
- Cloud misconfiguration checks
- API key exposure checks
- Security scoring system
- Vulnerability reporting

### Detects Issues Like
- Missing security headers
- Weak SSL/TLS configuration
- Public sensitive files
- Exposed cloud configurations

---

# Tech Stack

## Frontend
- React
- Vite
- TailwindCSS
- Framer Motion
- TypeScript

## Backend
- FastAPI
- Python

## Database & Cloud
- Supabase
- Cloudflare R2

## Security APIs
- VirusTotal API
- Google Safe Browsing API

## Security Tools
- AES-256 Encryption
- Malware scanning workflow
- URL reputation analysis

---

# Project Architecture

```text
Frontend (React)
       ↓
FastAPI Backend
       ↓
--------------------------------
| PhishGuard Engine            |
| SecureShare Engine           |
| CloudScan Engine             |
--------------------------------
       ↓
Supabase Database & Storage
