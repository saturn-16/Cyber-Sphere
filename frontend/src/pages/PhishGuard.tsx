import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, MessageSquare, QrCode, Link, Upload, ChevronDown, ChevronUp, Clock, AlertCircle, Cpu, Globe, Search, UserCheck } from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonButton from '../components/ui/NeonButton';
import ThreatBadge from '../components/ui/ThreatBadge';
import RiskMeter from '../components/ui/RiskMeter';
import ScanProcessConsole from '../components/ui/ScanProcessConsole';
import { useEffect } from 'react';
import { scanUrl, scanMessage, scanQR, getScanHistory } from '../services/api';
import type { PhishScanResult } from '../types';

type Tab = 'url' | 'message' | 'qr';

const TABS = [
  { id: 'url' as Tab, label: 'URL Deep Scan', icon: Link },
  { id: 'message' as Tab, label: 'Neural Message Analysis', icon: MessageSquare },
  { id: 'qr' as Tab, label: 'Secure QR Decoder', icon: QrCode },
];

function ResultCard({ result }: { result: PhishScanResult }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border p-5 space-y-5"
      style={{
        background: result.threatLevel === 'safe' ? 'rgba(57,255,20,0.04)' : result.threatLevel === 'dangerous' ? 'rgba(255,0,64,0.04)' : 'rgba(255,149,0,0.04)',
        borderColor: result.threatLevel === 'safe' ? 'rgba(57,255,20,0.2)' : result.threatLevel === 'dangerous' ? 'rgba(255,0,64,0.2)' : 'rgba(255,149,0,0.2)',
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-cyber-muted font-mono tracking-tighter mb-1 uppercase opacity-60">TARGET VECTOR</div>
          <div className="text-sm text-cyber-text font-mono truncate">{result.target}</div>
        </div>
        <ThreatBadge level={result.threatLevel} size="lg" />
      </div>

      {/* Main Score & reasons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-black/20 border border-white/5">
          <RiskMeter score={result.riskScore} size={130} />
          <div className="text-[10px] font-mono text-cyber-muted mt-2 tracking-widest">AGGREGATE RISK INDEX</div>
        </div>
        
        <div className="space-y-3">
          <div className="text-[10px] font-mono text-cyber-muted tracking-widest uppercase mb-1">Engine Detection Vectors</div>
          {result.reasons.map((r, i) => (
            <div key={i} className="flex items-start gap-2 text-[13px]">
              <AlertCircle size={14} className={result.threatLevel === 'safe' ? 'text-cyber-green mt-0.5' : result.threatLevel === 'dangerous' ? 'text-cyber-red mt-0.5' : 'text-cyber-amber mt-0.5'} />
              <span className="text-cyber-text leading-tight">{r}</span>
            </div>
          ))}
          
          <button 
            onClick={() => alert("Audit request submitted to CyberSphere Security Operations Center (SOC). Reference ID: " + Math.random().toString(36).substring(7).toUpperCase())}
            className="flex items-center gap-2 mt-4 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[11px] text-cyber-muted hover:text-cyber-text hover:bg-white/10 transition-all uppercase tracking-widest font-bold"
          >
            <UserCheck size={13} className="text-cyber-cyan" />
            Request Manual SOC Audit
          </button>
        </div>
      </div>

      {/* Engine Breakdown - Deep Technical View */}
      {result.engineBreakdown && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
            <div className="flex items-center gap-1.5 text-[9px] text-cyber-muted mb-1 uppercase font-bold tracking-widest">
              <Cpu size={10} className="text-cyber-violet" /> Heuristics
            </div>
            <div className="text-xs font-mono text-cyber-text">{result.engineBreakdown.pattern_heuristics.status.toUpperCase()}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
            <div className="flex items-center gap-1.5 text-[9px] text-cyber-muted mb-1 uppercase font-bold tracking-widest">
              <Search size={10} className="text-cyber-cyan" /> Typosquat
            </div>
            <div className="text-xs font-mono text-cyber-text">{result.engineBreakdown.typosquatting_engine.status.toUpperCase()}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
            <div className="flex items-center gap-1.5 text-[9px] text-cyber-muted mb-1 uppercase font-bold tracking-widest">
              <Globe size={10} className="text-cyber-green" /> Whois Age
            </div>
            <div className="text-xs font-mono text-cyber-text">{result.engineBreakdown.whois_analysis.data.age_days} DAYS</div>
          </div>
        </div>
      )}

      {/* Neural Analysis */}
      {result.neuralAnalysis && (
        <div className="p-4 rounded-lg bg-cyber-violet/5 border border-cyber-violet/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-violet/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-cyber-violet/10 transition-colors" />
          <div className="flex items-center gap-2 mb-2 relative">
            <div className="w-1.5 h-1.5 rounded-full bg-cyber-violet animate-pulse" />
            <div className="text-[10px] font-mono text-cyber-violet tracking-widest uppercase font-bold">Neural Behavioral Insight</div>
          </div>
          <div className="text-sm text-cyber-text/90 leading-relaxed font-mono relative">
            {result.neuralAnalysis}
          </div>
        </div>
      )}

      {/* Expand for Recommendations */}
      <button onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-1 text-[11px] text-cyber-muted hover:text-cyber-cyan transition-colors uppercase tracking-widest font-mono">
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {expanded ? 'Collapse Mitigations' : 'View Security Mitigations'}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="pt-3 space-y-2 border-t border-cyber-border/50">
              <div className="text-[10px] font-mono text-cyber-muted tracking-widest uppercase mb-2">Recommended Mitigation Protocol</div>
              {result.recommendations.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-[13px] text-cyber-text">
                  <Shield size={13} className="text-cyber-cyan mt-0.5 flex-shrink-0" />
                  {r}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function HistoryTable({ history }: { history: PhishScanResult[] }) {
  if (!history.length) return (
    <div className="text-center py-8 text-cyber-muted text-xs font-mono uppercase tracking-widest">No forensic scan history found.</div>
  );
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="text-cyber-muted tracking-widest uppercase border-b border-cyber-border/30">
            <th className="text-left pb-3 pr-4 font-bold">Target Vector</th>
            <th className="text-left pb-3 pr-4 font-bold">Type</th>
            <th className="text-left pb-3 pr-4 font-bold">Risk Level</th>
            <th className="text-right pb-3 font-bold">Score</th>
            <th className="text-right pb-3 font-bold">Timestamp</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-cyber-border/20">
          {history.map(item => (
            <tr key={item.id} className="hover:bg-white/3 transition-colors group">
              <td className="py-3 pr-4 text-cyber-text max-w-[200px] truncate">{item.target}</td>
              <td className="py-3 pr-4 text-cyber-muted uppercase text-[10px]">{item.scanType}</td>
              <td className="py-3 pr-4"><ThreatBadge level={item.threatLevel} size="sm" /></td>
              <td className="py-3 text-right font-bold text-[13px]" style={{
                color: item.riskScore <= 25 ? '#39ff14' : item.riskScore <= 60 ? '#ff9500' : '#ff0040'
              }}>{item.riskScore}</td>
              <td className="py-3 text-right text-cyber-muted text-[10px] opacity-60">
                {new Date(item.timestamp).toLocaleTimeString([], { hour12: false })}
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

  const fetchHistory = async () => {
    try {
      const data = await getScanHistory();
      setHistory(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const runScan = async () => {
    setScanning(true); setResult(null);
    try {
      let res: PhishScanResult;
      if (tab === 'url') res = await scanUrl(url);
      else if (tab === 'message') res = await scanMessage(message);
      else res = await scanQR(qrFile!);
      
      // Delay setting the result slightly to let the console animation finish
      setTimeout(() => {
        setResult(res);
        setScanning(false);
        fetchHistory();
      }, 6000);
    } catch (error) {
      console.error(error);
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
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-2xl bg-cyber-violet/10 border border-cyber-violet/20 shadow-lg shadow-cyber-violet/5">
            <Shield className="text-cyber-violet" size={26} />
          </div>
          <div>
            <h2 className="font-orbitron text-xl font-black text-cyber-text tracking-wider uppercase">Advanced Threat Engine</h2>
            <p className="text-[10px] text-cyber-muted font-mono tracking-[0.2em] uppercase opacity-70">Forensic-grade Multi-Vector Analysis</p>
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-2 text-[10px] font-mono border border-cyber-green/30 bg-cyber-green/5 px-3 py-1.5 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse" />
            <span className="text-cyber-green font-bold tracking-widest">SYSTEM OPERATIONAL</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1.5 rounded-2xl bg-white/5 mb-8 border border-white/5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => { if(!scanning) { setTab(id); setResult(null); } }}
              disabled={scanning}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all ${
                tab === id 
                ? 'bg-cyber-violet/20 text-cyber-violet border border-cyber-violet/30 shadow-inner' 
                : 'text-cyber-muted hover:text-cyber-text hover:bg-white/5'
              }`}>
              <Icon size={16} />{label}
            </button>
          ))}
        </div>

        {/* Input areas */}
        <AnimatePresence mode="wait">
          {tab === 'url' && (
            <motion.div key="url" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <label className="block text-[10px] font-mono text-cyber-muted tracking-widest uppercase mb-3 font-bold opacity-70">Target URL / Hostname</label>
              <div className="flex gap-3">
                <div className="relative flex-1 group">
                  <div className="absolute inset-0 bg-cyber-violet/5 blur-md rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <Link className="absolute left-4 top-1/2 -translate-y-1/2 text-cyber-muted group-focus-within:text-cyber-violet transition-colors" size={18} />
                  <input value={url} onChange={e => setUrl(e.target.value)}
                    placeholder="https://analyze-target.com"
                    disabled={scanning}
                    className="w-full bg-black/40 border border-cyber-border rounded-xl pl-11 pr-4 py-4 text-sm text-cyber-text placeholder-cyber-muted/30 font-mono focus:border-cyber-violet/50 focus:ring-0 transition-all relative z-10"
                    onKeyDown={e => e.key === 'Enter' && canScan && !scanning && runScan()} />
                </div>
                <NeonButton variant="violet" onClick={runScan} loading={scanning} disabled={!canScan || scanning}
                  className="px-8"
                  icon={<Shield size={18} />}>
                  EXECUTE SCAN
                </NeonButton>
              </div>
              <p className="text-[10px] text-cyber-muted mt-3 font-mono opacity-50 tracking-wide">
                ANALYSIS VECTORS: VIRUSTOTAL (89 ENGINES) • GOOGLE SAFE BROWSING • TYPOSQUATTING HEURISTICS • NEURAL BEHAVIORAL ANALYSIS
              </p>
            </motion.div>
          )}

          {tab === 'message' && (
            <motion.div key="msg" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <label className="block text-[10px] font-mono text-cyber-muted tracking-widest uppercase mb-3 font-bold opacity-70">Suspected Phishing Message Content</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5}
                disabled={scanning}
                placeholder="Paste the full email headers or message content for behavioral analysis..."
                className="w-full bg-black/40 border border-cyber-border rounded-xl p-4 text-sm text-cyber-text placeholder-cyber-muted/30 font-mono focus:border-cyber-violet/50 focus:ring-0 transition-all resize-none mb-4" />
              <NeonButton variant="violet" onClick={runScan} loading={scanning}
                disabled={message.trim().length <= 10 || scanning} icon={<MessageSquare size={18} />}>
                RUN NEURAL ANALYSIS
              </NeonButton>
            </motion.div>
          )}

          {tab === 'qr' && (
            <motion.div key="qr" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <label className="block text-[10px] font-mono text-cyber-muted tracking-widest uppercase mb-3 font-bold opacity-70">QR Matrix Image Upload</label>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => setQrFile(e.target.files?.[0] || null)} />
              <div
                onClick={() => !scanning && fileInputRef.current?.click()}
                className={`border-2 border-dashed border-cyber-border rounded-2xl p-10 text-center transition-all group mb-4 ${
                  scanning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-cyber-violet/50 hover:bg-cyber-violet/5'
                }`}>
                {qrFile ? (
                  <div>
                    <QrCode className="mx-auto mb-3 text-cyber-violet" size={40} />
                    <p className="text-sm font-bold text-cyber-text uppercase tracking-widest">{qrFile.name}</p>
                    <p className="text-[10px] text-cyber-muted mt-2 font-mono">{(qrFile.size/1024).toFixed(1)} KB • CLICK TO RE-UPLOAD</p>
                  </div>
                ) : (
                  <div>
                    <Upload className="mx-auto mb-3 text-cyber-muted group-hover:text-cyber-violet transition-colors" size={40} />
                    <p className="text-sm font-bold text-cyber-muted uppercase tracking-widest group-hover:text-cyber-text">Drop QR Matrix or Click to Upload</p>
                    <p className="text-[10px] text-cyber-muted/40 mt-2 font-mono">SUPPORTED FORMATS: PNG, JPG, WEBP, SVG</p>
                  </div>
                )}
              </div>
              <NeonButton variant="violet" onClick={runScan} loading={scanning}
                disabled={!qrFile || scanning} icon={<QrCode size={18} />}>
                DECODE & SCAN VECTORS
              </NeonButton>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scan Console */}
        <ScanProcessConsole isScanning={scanning} scanType={tab} />

        {/* Result */}
        {result && !scanning && <div className="mt-8"><ResultCard result={result} /></div>}
      </GlowCard>

      {/* History */}
      <GlowCard className="p-6">
        <h3 className="font-orbitron text-xs font-black text-cyber-text mb-6 flex items-center gap-3 uppercase tracking-widest">
          <Clock size={16} className="text-cyber-cyan" /> Central Forensic History
          <span className="ml-auto text-[10px] font-mono text-cyber-muted bg-white/5 px-2 py-1 rounded border border-white/5">{history.length} SCANS STORED</span>
        </h3>
        <HistoryTable history={history} />
      </GlowCard>
    </div>
  );
}
