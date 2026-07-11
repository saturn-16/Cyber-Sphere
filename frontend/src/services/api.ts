import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import type {
  PhishScanResult,
  CloudScanResult,
  SecureFile,
  DashboardStats,
  ThreatFeedItem,
} from '../types';

// Create Axios instance pointing to FastAPI backend
const API = axios.create({
  baseURL: 'http://localhost:8000',
});

// Interceptor to attach the JWT token to requests if authenticated
API.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token && !token.startsWith('mock.')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle responses and clear session on 401 Unauthorized
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Auto logout to redirect user back to login/signup for the new backend database
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);



/* ─────────────────────────────────────────
   PHISHGUARD (Real endpoints calling backend)
   ───────────────────────────────────────── */
export async function scanUrl(url: string): Promise<PhishScanResult> {
  const response = await API.post('/api/phish/url', { url });
  return response.data;
}

export async function scanMessage(message: string): Promise<PhishScanResult> {
  const response = await API.post('/api/phish/message', { message });
  return response.data;
}

export async function scanQR(file: File): Promise<PhishScanResult> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await API.post('/api/phish/qr', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function getScanHistory(): Promise<PhishScanResult[]> {
  try {
    const response = await API.get('/api/phish/history');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch scan history from server, returning empty', error);
    return [];
  }
}

// Keep local helper compatible with other parts of the site that might still call it
export function saveScanToHistory(_result: PhishScanResult) {
  // Scans are automatically saved by the backend in SQLite, so this is a no-op
}

/* ─────────────────────────────────────────
   CLOUDSCAN
   ───────────────────────────────────────── */
export async function scanWebsite(domain: string): Promise<CloudScanResult> {
  const response = await API.post('/api/scan/website', { domain });
  return response.data;
}

/* ─────────────────────────────────────────
   SECURESHARE
   ───────────────────────────────────────── */
export async function uploadFile(
  file: File,
  options: { password?: string; expiryHours?: number }
): Promise<SecureFile> {
  const formData = new FormData();
  formData.append('file', file);
  if (options.password) formData.append('password', options.password);
  formData.append('expiry_hours', String(options.expiryHours || 0));

  const response = await API.post('/api/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function getFiles(): Promise<SecureFile[]> {
  const response = await API.get('/api/files/');
  return response.data;
}

export async function deleteFile(id: string): Promise<void> {
  await API.delete(`/api/files/${id}`);
}

/* ─────────────────────────────────────────
   DASHBOARD STATS
   ───────────────────────────────────────── */
export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await API.get('/api/dashboard/stats');
  return response.data;
}

/* ─────────────────────────────────────────
   REPORTS
   ───────────────────────────────────────── */
export async function generateReport(): Promise<void> {
  const response = await API.get('/api/reports/generate', {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  
  const timestamp = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `cybersphere-security-report-${timestamp}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/* ─────────────────────────────────────────
   LIVE THREAT FEED (Simulated locally)
   ───────────────────────────────────────── */
export function getThreatFeed(): ThreatFeedItem[] {
  return [
    { id:'tf1', title:'New phishing campaign targeting banking users via SMS', severity:'critical', source:'AbuseIPDB', timestamp: new Date(Date.now()-120000).toISOString() },
    { id:'tf2', title:'VirusTotal: 47 new malicious domains flagged in last hour', severity:'high', source:'VirusTotal', timestamp: new Date(Date.now()-300000).toISOString() },
    { id:'tf3', title:'Typosquat attack: "paypa1.com" impersonating PayPal', severity:'critical', source:'PhishGuard AI', timestamp: new Date(Date.now()-600000).toISOString() },
    { id:'tf4', title:'CORS misconfiguration exposes user data on 3 domains', severity:'high', source:'CloudScan', timestamp: new Date(Date.now()-900000).toISOString() },
    { id:'tf5', title:'Malicious QR codes spreading via WhatsApp groups', severity:'medium', source:'ThreatIntel', timestamp: new Date(Date.now()-1200000).toISOString() },
    { id:'tf6', title:'Google Safe Browsing updated: 1,200 new phishing URLs', severity:'high', source:'Google', timestamp: new Date(Date.now()-1800000).toISOString() },
  ];
}
