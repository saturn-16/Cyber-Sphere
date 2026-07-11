# 🌌 CyberSphere: Next-Gen Autonomous Security Operations Platform

[![Vite Build](https://img.shields.io/badge/Vite-v8.0-00f5ff?style=flat-square&logo=vite)](https://vitejs.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-v0.110-39ff14?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-v18-ff007f?style=flat-square&logo=react)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-violet?style=flat-square)](LICENSE)

CyberSphere is a professional, SOC-inspired full-stack cybersecurity operations platform. It integrates machine learning-driven phishing detection, high-performance web compliance auditing, and secure zero-trust encrypted file sharing into a unified, glassmorphic cybersecurity control center.

---

## 🏛️ Comprehensive System Architecture

CyberSphere uses a decoupled, zero-trust service-oriented architecture designed to handle secure files, execute compliance scanning, and run Machine Learning predictions asynchronously.

```mermaid
graph TD
    %% Frontend Layer
    subgraph Client [Frontend Layer - React + Vite]
        UI[Glassmorphic SOC Dashboard] --> Store[Zustand State Manager]
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
        PhishRouter --> ML_Engine[RandomForest ML Classifier]
        PhishRouter --> VT_API[VirusTotal API Adapter]
        PhishRouter --> Abuse_API[AbuseIPDB Reputation Check]
        
        ShareRouter --> Fernet_Enc[AES-256 Fernet Payload Encryptor]
        ShareRouter --> Mal_Scanner[Heuristic Malware Scanner]
        
        ScanRouter --> Aud_Scan[TLS Socket & Security Header Auditor]
    end

    %% Database & Storage Layer
    subgraph Storage [Persistence & Storage Layer]
        AuthRouter --> DB_Adapter[(Database Adapter: SQLite / Supabase Postgres)]
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

### 1. PhishGuard Engine (Machine Learning & OSINT reputation)
*   **Machine Learning Classifier:** Runs a custom-trained Scikit-Learn `RandomForestClassifier` (achieving **81.97% test accuracy**). It evaluates URLs based on features like token length, domain entropy, presence of IP addresses, digit-to-letter ratios, and suspicious keywords.
*   **Active Reputation Checks:** Queries VirusTotal (IP/URL scans) and AbuseIPDB dynamically to fetch live, real-time threat intelligence.
*   **Heuristics Parser:** Conducts typo-squatting audits against popular brand aliases and analyzes QR code payloads.

### 2. SecureShare Engine (Zero-Trust Cryptographic Storage)
*   **Heuristic Malware Scan:** Scans uploaded files to match file signatures against known malware patterns and blocks malicious executables.
*   **AES-256 Encryption:** Encrypts file streams on-the-fly using AES-256 Symmetric Encryption (via `cryptography.fernet`). Encryption keys are loaded from environment secrets and remain stable across restarts.
*   **Sharing & Expiry Lifecycle:** Generates short-lived, unique share tokens. The database automatically checks timestamps on download requests and denies access to expired resources.

### 3. CloudScan Engine (Compliance & Socket Audits)
*   **Security Header Scans:** Initiates passive HTTP handshakes to audit HSTS (`Strict-Transport-Security`), CSP (`Content-Security-Policy`), `X-Frame-Options`, and `X-Content-Type-Options`.
*   **TLS/SSL Audit:** Establishes direct SSL socket handshakes (`ssl.create_default_context()`) to inspect peer certificates, issuer info, expiration timestamps, and encryption strengths.
*   **Directory Exposure Scans:** Tests target paths for standard misconfigurations (e.g., exposed `.git/` directories, exposed `.env` files, open `/admin` directories, and unconfigured CORS headers).

---

## 🛠️ Technology Stack

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite 8, TypeScript, TailwindCSS | High-performance client, responsive layouts |
| **Animation** | Framer Motion | Dynamic SVG flow lines, interactive element cascades |
| **State** | Zustand + Redux-like persistence | Global state, persistent UI theme configs |
| **Backend** | FastAPI, Uvicorn, Python 3.11 | High-throughput, async request gateway |
| **Database** | SQLite / Supabase PostgreSQL (`psycopg2`) | Unified relational storage adapter |
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
cd Cyber-Sphere
```

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

---

### 🐍 2. Backend Installation & Run
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
*   **Direct Dashboard Access:** The platform is configured for instant, frictionless previewing and testing. It bypasses auth screens by default, initializing with a pre-configured **Demo Analyst** profile.
*   **Automatic Database Migrations:** SQLite databases and table schemas are initialized on application startup.
