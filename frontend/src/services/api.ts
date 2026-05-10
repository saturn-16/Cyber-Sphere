import axios from 'axios';
import type {
  PhishScanResult,
  CloudScanResult,
  SecureFile,
  DashboardStats,
  ThreatFeedItem,
} from '../types';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle expired sessions (401 errors)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/* ─────────────────────────────────────────
   PHISHGUARD
───────────────────────────────────────── */
export async function scanUrl(url: string): Promise<PhishScanResult> {
  const response = await api.post('/phish/url', { url });
  return response.data;
}

export async function scanMessage(message: string): Promise<PhishScanResult> {
  const response = await api.post('/phish/message', { message });
  return response.data;
}

export async function scanQR(file: File): Promise<PhishScanResult> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/phish/qr', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function getScanHistory(): Promise<PhishScanResult[]> {
  const response = await api.get('/phish/history');
  return response.data;
}

/* ─────────────────────────────────────────
   CLOUDSCAN
───────────────────────────────────────── */
export async function scanWebsite(domain: string): Promise<CloudScanResult> {
  const response = await api.post('/scan/website', { domain });
  return response.data;
}

export async function getCloudScanHistory(): Promise<any[]> {
  const response = await api.get('/scan/history');
  return response.data;
}

/* ─────────────────────────────────────────
   SECURESHARE
───────────────────────────────────────── */
export async function uploadFile(file: File, options: { password?: string; expiryHours?: number }): Promise<SecureFile> {
  const formData = new FormData();
  formData.append('file', file);
  if (options.password) formData.append('password', options.password);
  if (options.expiryHours) formData.append('expiry_hours', options.expiryHours.toString());

  const response = await api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function getFiles(): Promise<SecureFile[]> {
  const response = await api.get('/files/');
  return response.data;
}

export async function deleteFile(id: string): Promise<void> {
  await api.delete(`/files/${id}`);
}

export async function downloadFile(id: string): Promise<Blob> {
  const response = await api.get(`/files/download/${id}`, {
    responseType: 'blob',
  });
  return response.data;
}

/* ─────────────────────────────────────────
   DASHBOARD STATS
───────────────────────────────────────── */
export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await api.get('/dashboard/stats');
  return response.data;
}

/* ─────────────────────────────────────────
   LIVE THREAT FEED (simulated real-time)
───────────────────────────────────────── */
export function getThreatFeed(): ThreatFeedItem[] {
  // In a real app this might be a WebSocket connection.
  return [
    { id:'tf1', title:'New phishing campaign targeting banking users via SMS', severity:'critical', source:'AbuseIPDB', timestamp: new Date(Date.now()-120000).toISOString() },
    { id:'tf2', title:'VirusTotal: 47 new malicious domains flagged in last hour', severity:'high', source:'VirusTotal', timestamp: new Date(Date.now()-300000).toISOString() },
    { id:'tf3', title:'Typosquat attack: "paypa1.com" impersonating PayPal', severity:'critical', source:'PhishGuard AI', timestamp: new Date(Date.now()-600000).toISOString() },
    { id:'tf4', title:'CORS misconfiguration exposes user data on 3 domains', severity:'high', source:'CloudScan', timestamp: new Date(Date.now()-900000).toISOString() },
    { id:'tf5', title:'Malicious QR codes spreading via WhatsApp groups', severity:'medium', source:'ThreatIntel', timestamp: new Date(Date.now()-1200000).toISOString() },
    { id:'tf6', title:'Google Safe Browsing updated: 1,200 new phishing URLs', severity:'high', source:'Google', timestamp: new Date(Date.now()-1800000).toISOString() },
  ];
}
