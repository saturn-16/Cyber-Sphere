# 🌌 CyberSphere: Next-Gen Autonomous Security Operations Platform

[![Vite Build](https://img.shields.io/badge/Vite-v8.0-00f5ff?style=flat-square&logo=vite)](https://vitejs.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-v0.110-39ff14?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-v19-ff007f?style=flat-square&logo=react)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-violet?style=flat-square)](LICENSE)

CyberSphere is a professional, SOC-inspired full-stack cybersecurity operations platform. It integrates machine learning-driven phishing detection, high-performance compliance auditing, secure cryptographic file sharing, and multi-provider identity gateways into a unified security control center.

---

## 🏛️ Comprehensive System Architecture

CyberSphere uses a decoupled, zero-trust service-oriented architecture designed to handle authentication, secure file transfers, compliance scanning, and machine learning inferences asynchronously.

```mermaid
graph LR
    %% Frontend Layer
    subgraph Client [Frontend Layer - React + Vite]
        AuthPortal[Authentication Portal] --> |Firebase Auth SDK| FB_Auth((Firebase Auth Provider))
        AuthPortal --> |Authenticated Session| Store[Zustand State Manager]
        UI[Security Control Center] --> Store
        Store --> API_Client[Axios API Client]
    end

    %% API Gateway Layer
    subgraph Gateway [API Gateway Layer - FastAPI]
        API_Client --> CORS[CORS Middleware]
        CORS --> AuthRouter[Auth Router]
        CORS --> PhishRouter[PhishGuard Router]
        CORS --> ShareRouter[SecureShare Router]
        CORS --> ScanRouter[CloudScan Router]
    end

    %% Engine & Logic Layer
    subgraph Engines [Engine & Logic Layer]
        AuthRouter --> Token_Val[JWT & Firebase Token Validator]
        PhishRouter --> ML_Engine[RandomForest ML Classifier]
        PhishRouter --> VT_API[VirusTotal API Adapter]
        PhishRouter --> Abuse_API[AbuseIPDB Reputation Check]
        
        ShareRouter --> Fernet_Enc[AES-256 Fernet Payload Encryptor]
        ShareRouter --> Mal_Scanner[Heuristic Malware Scanner]
        
        ScanRouter --> Aud_Scan[TLS Socket & Security Header Auditor]
    end

    %% Database & Storage Layer
    subgraph Storage [Persistence & Storage Layer]
        Token_Val --> DB_Adapter[(Database Adapter: SQLite / Supabase Postgres)]
        ShareRouter --> DB_Adapter
        ShareRouter --> R2_Storage[(Storage Adapter: Local Uploads / Cloudflare R2)]
        ScanRouter --> DB_Adapter
    end

    %% Custom Styling
    style Client fill:#001524,stroke:#00f5ff,stroke-width:2px,color:#fff
    style Gateway fill:#0d1b2a,stroke:#39ff14,stroke-width:2px,color:#fff
    style Engines fill:#1b263b,stroke:#ff9500,stroke-width:2px,color:#fff
    style Storage fill:#000814,stroke:#7c3ade,stroke-width:2px,color:#fff
```

### 1. Identity & Gateway Security (Firebase & JWT)
*   **Multi-Provider Authentication:** Coordinates user identity validations through Google and GitHub authentication wrappers.
*   **Hybrid Token Validation:** The FastAPI backend is equipped with a custom token resolver that parses standard JWTs and Firebase ID tokens, validating payload claims without requiring blocking network steps.
*   **Route Protection:** Implements client-side route guards and automatic Axios interceptors that attach authorization headers to all secure API requests.
*   **Sandbox Fallback:** Features a zero-configuration developer sandbox mode. If no Firebase configuration variables are provided, the gateway falls back to pre-configured local demo profiles for instant evaluation.

### 2. PhishGuard Engine (Machine Learning & OSINT reputation)
*   **Machine Learning Classifier:** Runs a custom-trained Scikit-Learn `RandomForestClassifier` (achieving **81.97% test accuracy**). It evaluates URLs based on features like token length, domain entropy, presence of IP addresses, digit-to-letter ratios, and suspicious keywords.
*   **Active Reputation Checks:** Queries VirusTotal (IP/URL scans) and AbuseIPDB dynamically to fetch live, real-time threat intelligence.
*   **Heuristics Parser:** Conducts typo-squatting audits against popular brand aliases and analyzes QR code payloads.

### 3. SecureShare Engine (Zero-Trust Cryptographic Storage)
*   **Heuristic Malware Scan:** Scans uploaded files to match file signatures against known malware patterns and blocks malicious executables.
*   **AES-256 Encryption:** Encrypts file streams on-the-fly using AES-256 Symmetric Encryption (via `cryptography.fernet`). Encryption keys are loaded from environment secrets and remain stable across restarts.
*   **Sharing & Expiry Lifecycle:** Generates short-lived, unique share tokens. The database automatically checks timestamps on download requests and denies access to expired resources.

### 4. CloudScan Engine (Active Scanner & Compliance Audits)
*   **Security Header Scans:** Initiates active HTTP requests to audit HSTS (`Strict-Transport-Security`), CSP (`Content-Security-Policy`), `X-Frame-Options`, and `X-Content-Type-Options` on target hosts.
*   **TLS/SSL Audit:** Establishes direct SSL socket handshakes (`ssl.create_default_context()`) to inspect peer certificates, issuer info, expiration timestamps, and encryption strengths.
*   **Vulnerability Detection:** Actively probes for common configuration flaws, scanning for exposed `.git/` directories, exposed `.env` files, open administrative dashboards, and CORS wildcard vulnerabilities.

---

## 🛠️ Technology Stack

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite 8, TypeScript, TailwindCSS | High-performance client, structured layout templates |
| **Animation** | Three.js, postprocessing, Framer Motion | WebGL shader canvases, interactive flow connections |
| **Authentication** | Firebase Client SDK (Google & GitHub OAuth) | Operator authentication and identity verification |
| **State** | Zustand | Global authentication and threat-feed state management |
| **Backend** | FastAPI, Uvicorn, Python 3.11 | High-throughput, async request gateway |
| **Database** | SQLite / Supabase PostgreSQL (`psycopg2`) | Unified relational database schema and adapters |
| **Security** | Scikit-Learn, Cryptography (Fernet) | Machine Learning inference, Symmetric Encryption |

---

## 🚀 Getting Started

### 📋 Prerequisites
*   Python 3.9+
*   Node.js 18+
*   npm or yarn

### 📥 1. Clone & Configure Workspace
```bash
git clone https://github.com/saturn-16/Cyber-Sphere.git
# Move into folder
cd Cyber-Sphere
```

---

### 🐍 2. Backend Installation & Run
Create a `.env` file inside the `backend/` directory:
```ini
# JWT configuration
SECRET_KEY=generate-a-long-random-string-here

# Database Config (defaults to SQLite if not specified)
# DATABASE_URL=postgresql://user:pass@host:port/dbname

# API Keys (optional; enables real APIs, otherwise operates in mock fallback mode)
VIRUSTOTAL_API_KEY=your_virustotal_key
ABUSEIPDB_API_KEY=your_abuseipdb_key

# AES-256 encryption key (generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
ENCRYPTION_KEY=your_fernet_aes_key
```

Run the backend server:
```bash
cd backend
# Create virtual environment
python -m venv venv
# Activate virtual environment (Windows)
venv\Scripts\activate
# Activate virtual environment (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8000
```
The interactive Swagger API documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

---

### ⚛️ 3. Frontend Installation & Run
Create a `.env` file inside the `frontend/` directory (leave blank to run in Sandbox Mode):
```ini
# Firebase Config (get from Firebase Project Settings)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Backend Connection URL (defaults to http://localhost:8000 if omitted)
VITE_API_URL=http://localhost:8000
```

Run the client:
```bash
cd ../frontend
# Install npm dependencies
npm install

# Run the Vite local development server
npm run dev
```
The client dashboard will be available at [http://localhost:5173/](http://localhost:5173/).

---

## 🔒 Security Operations
*   **Role-Based Access:** All dashboards are shielded behind authentication routers. Unauthorized visitors are automatically redirected to the secure login gateway.
*   **Automatic Database Migrations:** Relational tables and schemas are initialized automatically on application startup.
