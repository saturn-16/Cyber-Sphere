import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, MessageSquare, QrCode, Link, Upload, ChevronDown, ChevronUp, Clock, AlertCircle } from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonButton from '../components/ui/NeonButton';
import ThreatBadge from '../components/ui/ThreatBadge';
import RiskMeter from '../components/ui/RiskMeter';
import ScanAnimation from '../components/ui/ScanAnimation';
import { scanUrl, scanMessage, scanQR, getScanHistory, saveScanToHistory } from '../services/api';
import type { PhishScanResult } from '../types';

type Tab = 'url' | 'message' | 'qr';

const TABS = [
  { id: 'url' as Tab, label: 'URL Scanner', icon: Link },
  { id: 'message' as Tab, label: 'Message Scanner', icon: MessageSquare },
  { id: 'qr' as Tab, label: 'QR Code', icon: QrCode },
];

function ResultCard({ result }: { result: PhishScanResult }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border p-5 space-y-4"
      style={{
        background: result.threatLevel === 'safe' ? 'rgba(57,255,20,0.04)' : result.threatLevel === 'dangerous' ? 'rgba(255,0,64,0.04)' : 'rgba(255,149,0,0.04)',
        borderColor: result.threatLevel === 'safe' ? 'rgba(57,255,20,0.2)' : result.threatLevel === 'dangerous' ? 'rgba(255,0,64,0.2)' : 'rgba(255,149,0,0.2)',
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-cyber-muted font-mono mb-1">TARGET</div>
          <div className="text-sm text-cyber-text font-mono truncate">{result.target}</div>
        </div>
        <ThreatBadge level={result.threatLevel} size="lg" />
      </div>

      {/* Score + reasons */}
      <div className="flex gap-6 items-start">
        <RiskMeter score={result.riskScore} size={120} />
        <div className="flex-1 space-y-2">
          <div className="text-xs font-mono text-cyber-muted tracking-widest uppercase mb-2">Detection Reasons</div>
          {result.reasons.map((r, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <AlertCircle size={13} className={result.threatLevel === 'safe' ? 'text-cyber-green mt-0.5' : result.threatLevel === 'dangerous' ? 'text-cyber-red mt-0.5' : 'text-cyber-amber mt-0.5'} />
              <span className="text-cyber-text">{r}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Expand for extra details */}
      <button onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-1 text-xs text-cyber-muted hover:text-cyber-cyan transition-colors">
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {expanded ? 'Hide' : 'Show'} security recommendations
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="pt-2 space-y-2 border-t border-cyber-border/50">
              <div className="text-xs font-mono text-cyber-muted tracking-widest uppercase mb-2">Recommendations</div>
              {result.recommendations.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-cyber-text">
                  <Shield size={12} className="text-cyber-cyan mt-0.5 flex-shrink-0" />
                  {r}
                </div>
              ))}
              {result.virusTotalHits !== undefined && (
                <div className="flex items-center gap-2 mt-2 text-xs font-mono text-cyber-muted">
                  <span className="text-cyber-cyan">VirusTotal:</span>
                  <span>{result.virusTotalHits}/{result.virusTotalTotal} engines flagged</span>
                  {result.safeBrowsingFlag && <span className="text-cyber-red ml-2">⚠ Google Safe Browsing: FLAGGED</span>}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function HistoryTable({ history }: { history: PhishScanResult[] }) {
  if (!history.length) return (
    <div className="text-center py-8 text-cyber-muted text-sm">No scans yet. Run your first scan above.</div>
  );
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs font-mono text-cyber-muted tracking-wider uppercase border-b border-cyber-border">
            <th className="text-left pb-3 pr-4">Target</th>
            <th className="text-left pb-3 pr-4">Type</th>
            <th className="text-left pb-3 pr-4">Level</th>
            <th className="text-right pb-3">Score</th>
            <th className="text-right pb-3">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-cyber-border/50">
          {history.map(item => (
            <tr key={item.id} className="hover:bg-white/3 transition-colors">
              <td className="py-3 pr-4 font-mono text-cyber-text max-w-[200px] truncate">{item.target}</td>
              <td className="py-3 pr-4 font-mono text-cyber-muted capitalize">{item.scanType}</td>
              <td className="py-3 pr-4"><ThreatBadge level={item.threatLevel} size="sm" /></td>
              <td className="py-3 text-right font-orbitron font-bold" style={{
                color: item.riskScore <= 25 ? '#39ff14' : item.riskScore <= 60 ? '#ff9500' : '#ff0040'
              }}>{item.riskScore}</td>
              <td className="py-3 text-right text-cyber-muted text-[11px]">
                {new Date(item.timestamp).toLocaleTimeString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PhishGuard() {
  const [tab, setTab] = useState<Tab>('url');
  const [url, setUrl] = useState('');
  const [message, setMessage] = useState('');
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<PhishScanResult | null>(null);
  const [history, setHistory] = useState<PhishScanResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchHistory = useCallback(() => {
    getScanHistory()
      .then(setHistory)
      .catch(err => console.error("Failed to fetch scan history:", err));
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const runScan = async () => {
    setScanning(true); setResult(null);
    let res: PhishScanResult;
    try {
      if (tab === 'url') res = await scanUrl(url);
      else if (tab === 'message') res = await scanMessage(message);
      else res = await scanQR(qrFile!);
      saveScanToHistory(res);
      setResult(res);
      fetchHistory();
    } catch (err) {
      console.error("Scan failed:", err);
      alert("Scan failed. Please verify connection and try again.");
    } finally {
      setScanning(false);
    }
  };


  const canScan = (tab === 'url' && url.trim())
    || (tab === 'message' && message.trim().length > 10)
    || (tab === 'qr' && qrFile);

  return (
    <div className="space-y-6">
      {/* Scanner card */}
      <GlowCard glowColor="violet" className="p-6">
        {/* Module header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-cyber-violet/15 border border-cyber-violet/30">
            <Shield className="text-cyber-violet" size={22} />
          </div>
          <div>
            <h2 className="font-orbitron text-lg font-bold text-cyber-text">PhishGuard</h2>
            <p className="text-xs text-cyber-muted">AI-Powered Phishing & Threat Detection</p>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs font-mono">
            <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
            <span className="text-cyber-green">ENGINE ACTIVE</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/5 mb-6">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => { setTab(id); setResult(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                tab === id ? 'bg-cyber-violet/20 text-cyber-violet border border-cyber-violet/30' : 'text-cyber-muted hover:text-cyber-text'
              }`}>
              <Icon size={14} />{label}
            </button>
          ))}
        </div>

        {/* Input areas */}
        <AnimatePresence mode="wait">
          {tab === 'url' && (
            <motion.div key="url" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <label className="block text-xs font-mono text-cyber-muted tracking-widest uppercase mb-2">Enter URL to Scan</label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" size={15} />
                  <input value={url} onChange={e => setUrl(e.target.value)}
                    placeholder="https://suspicious-site.com"
                    className="w-full bg-white/5 border border-cyber-border rounded-lg pl-9 pr-4 py-3 text-sm text-cyber-text placeholder-cyber-muted/50 font-mono transition-all"
                    onKeyDown={e => e.key === 'Enter' && canScan && !scanning && runScan()} />
                </div>
                <NeonButton variant="violet" onClick={runScan} loading={scanning} disabled={!canScan || scanning}
                  icon={<Shield size={15} />}>
                  Scan URL
                </NeonButton>
              </div>
              <p className="text-xs text-cyber-muted mt-2">
                Checks against VirusTotal (89 engines), Google Safe Browsing, typosquatting detection, and AI threat analysis.
              </p>
            </motion.div>
          )}

          {tab === 'message' && (
            <motion.div key="msg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <label className="block text-xs font-mono text-cyber-muted tracking-widest uppercase mb-2">Paste Suspicious Message or Email</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5}
                placeholder="Paste the full email or message content here..."
                className="w-full bg-white/5 border border-cyber-border rounded-lg p-3 text-sm text-cyber-text placeholder-cyber-muted/50 transition-all resize-none mb-3" />
              <NeonButton variant="violet" onClick={runScan} loading={scanning}
                disabled={message.trim().length <= 10 || scanning} icon={<MessageSquare size={15} />}>
                Analyze Message
              </NeonButton>
            </motion.div>
          )}

          {tab === 'qr' && (
            <motion.div key="qr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <label className="block text-xs font-mono text-cyber-muted tracking-widest uppercase mb-2">Upload QR Code Image</label>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => setQrFile(e.target.files?.[0] || null)} />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-cyber-border rounded-xl p-8 text-center cursor-pointer hover:border-cyber-violet/50 hover:bg-cyber-violet/5 transition-all group mb-3">
                {qrFile ? (
                  <div>
                    <QrCode className="mx-auto mb-2 text-cyber-violet" size={32} />
                    <p className="text-sm text-cyber-text">{qrFile.name}</p>
                    <p className="text-xs text-cyber-muted mt-1">{(qrFile.size/1024).toFixed(1)} KB · Click to change</p>
                  </div>
                ) : (
                  <div>
                    <Upload className="mx-auto mb-2 text-cyber-muted group-hover:text-cyber-violet transition-colors" size={32} />
                    <p className="text-sm text-cyber-muted">Click to upload QR code image</p>
                    <p className="text-xs text-cyber-muted/60 mt-1">PNG, JPG, WEBP supported</p>
                  </div>
                )}
              </div>
              <NeonButton variant="violet" onClick={runScan} loading={scanning}
                disabled={!qrFile || scanning} icon={<QrCode size={15} />}>
                Decode & Scan QR
              </NeonButton>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scan animation */}
        <ScanAnimation isScanning={scanning}
          label={tab === 'url' ? 'Querying VirusTotal & Safe Browsing…' : tab === 'message' ? 'Analyzing message patterns…' : 'Decoding QR code…'} />

        {/* Result */}
        {result && !scanning && <div className="mt-4"><ResultCard result={result} /></div>}
      </GlowCard>

      {/* History */}
      <GlowCard className="p-6">
        <h3 className="font-orbitron text-sm font-bold text-cyber-text mb-4 flex items-center gap-2">
          <Clock size={15} className="text-cyber-cyan" /> Scan History
          <span className="ml-auto text-xs font-mono text-cyber-muted">{history.length} scans</span>
        </h3>
        <HistoryTable history={history} />
      </GlowCard>
    </div>
  );
}
