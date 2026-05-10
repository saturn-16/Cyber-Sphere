// ── Global TypeScript type definitions ──

export type ThreatLevel = 'safe' | 'suspicious' | 'dangerous' | 'unknown';

export interface User {
  id: string;
  email: string;
  displayName?: string;
  createdAt: string;
}

// ── Auth ──
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ── Scan Results ──
export interface PhishScanResult {
  id: string;
  target: string;            // URL or message snippet
  scanType: 'url' | 'message' | 'qr';
  threatLevel: ThreatLevel;
  riskScore: number;         // 0–100
  reasons: string[];
  recommendations: string[];
  virusTotalHits?: number;
  virusTotalTotal?: number;
  safeBrowsingFlag?: boolean;
  neuralAnalysis?: string;
  engineBreakdown?: {
    pattern_heuristics: { score: number; status: string };
    typosquatting_engine: { score: number; status: string };
    whois_analysis: { score: number; data: any };
    virustotal: { hits: number; total: number; status: string };
    google_safe_browsing: { flagged: boolean };
    neural_engine: { boost: number; verdict: string };
  };
  timestamp: string;
}

export interface CloudScanVuln {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  fix: string;
  detected: boolean;
}

export interface CloudScanResult {
  id: string;
  domain: string;
  securityScore: number;     // 0–100
  vulnerabilities: CloudScanVuln[];
  sslValid: boolean;
  sslExpiry?: string;
  neuralAnalysis?: string;
  engineBreakdown?: {
    ssl_tls: { score: number; status: string };
    headers: { score: number; status: string };
    exposure: { score: number; status: string };
    protocol: { score: number; status: string };
    cors_policy: { score: number; status: string };
  };
  responseTime: number;
  timestamp: string;
}

export interface SecureFile {
  id: string;
  filename: string;
  size: number;              // bytes
  encrypted: boolean;
  encryptionMethod?: string;
  malwareStatus: 'clean' | 'infected' | 'scanning' | 'unknown';
  malwareAnalysis?: string;
  shareToken?: string;
  passwordProtected: boolean;
  expiryTime?: string;
  downloadCount: number;
  uploadedAt: string;
  url?: string;
}

// ── Dashboard Stats ──
export interface DashboardStats {
  totalScans: number;
  threatsDetected: number;
  filesShared: number;
  securityScore: number;
  scanTrend: { date: string; scans: number; threats: number }[];
  recentActivity: ActivityItem[];
  threatDistribution: { name: string; value: number; color: string }[];
}

export interface ActivityItem {
  id: string;
  type: 'scan' | 'upload' | 'download' | 'alert';
  message: string;
  timestamp: string;
  severity?: ThreatLevel;
}

// ── Threat feed ──
export interface ThreatFeedItem {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium';
  source: string;
  timestamp: string;
}
