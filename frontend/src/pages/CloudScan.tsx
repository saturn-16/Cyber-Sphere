import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Search, Shield, ChevronDown, ChevronUp,
  AlertTriangle, Info, CheckCircle, XCircle, Lock,
  Terminal, Activity, Cpu
} from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import GlowCard from '../components/ui/GlowCard';
import NeonButton from '../components/ui/NeonButton';
import ScanProcessConsole from '../components/ui/ScanProcessConsole';
import { scanWebsite } from '../services/api';
import type { CloudScanResult, CloudScanVuln } from '../types';

const SEV_CONFIG: Record<CloudScanVuln['severity'], { color: string; label: string; icon: any }> = {
  critical: { color: '#ff0040', label: 'CRITICAL', icon: XCircle },
  high:     { color: '#ff6b35', label: 'HIGH',     icon: AlertTriangle },
  medium:   { color: '#ff9500', label: 'MEDIUM',   icon: AlertTriangle },
  low:      { color: '#0ea5e9', label: 'LOW',      icon: Info },
  info:     { color: '#64748b', label: 'INFO',     icon: Info },
};

const SCAN_PHASES = [
  { message: "Initializing Forensic Probe...", duration: 800 },
  { message: "Resolving DNS & Host Metadata...", duration: 1000 },
  { message: "Probing SSL/TLS Certificates...", duration: 1200 },
  { message: "Analyzing HTTP Security Headers...", duration: 1500 },
  { message: "Scanning for Exposure Vectors (.env, .git)...", duration: 2000 },
  { message: "Neural Pattern Analysis Active...", duration: 1800 },
  { message: "Finalizing Security Posture Report...", duration: 1000 },
];

function SeverityBadge({ sev }: { sev: CloudScanVuln['severity'] }) {
  const { color, label } = SEV_CONFIG[sev];
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold border tracking-widest"
      style={{ color, borderColor: `${color}40`, background: `${color}10` }}>{label}</span>
  );
}

function VulnCard({ vuln }: { vuln: CloudScanVuln }) {
  const [open, setOpen] = useState(false);
  const { color, icon: Icon } = SEV_CONFIG[vuln.severity];
  if (!vuln.detected) return null;
  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: `${color}30`, background: `${color}05` }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/3 transition-all">
        <div className="p-2 rounded-lg flex-shrink-0" style={{ background: `${color}15` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <SeverityBadge sev={vuln.severity} />
          </div>
          <p className="text-sm font-medium text-cyber-text">{vuln.title}</p>
        </div>
        {open ? <ChevronUp size={14} className="text-cyber-muted flex-shrink-0" /> : <ChevronDown size={14} className="text-cyber-muted flex-shrink-0" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3 border-t border-cyber-border/30">
              <div className="pt-3">
                <div className="text-xs font-mono text-cyber-muted uppercase tracking-widest mb-1">Technical Impact</div>
                <p className="text-sm text-cyber-text leading-relaxed">{vuln.description}</p>
              </div>
              <div>
                <div className="text-xs font-mono text-cyber-cyan uppercase tracking-widest mb-1">Expert Remediation</div>
                <p className="text-sm text-cyber-text bg-cyber-cyan/5 rounded-lg p-3 border border-cyber-cyan/15">{vuln.fix}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SecurityScore({ score }: { score: number }) {
  const color = score >= 70 ? '#39ff14' : score >= 40 ? '#ff9500' : '#ff0040';
  const label = score >= 70 ? 'SECURE' : score >= 40 ? 'AT RISK' : 'VULNERABLE';
  const circumference = 2 * Math.PI * 54;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-36 h-36">
        <svg width="144" height="144" className="-rotate-90">
          <circle cx="72" cy="72" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
          <motion.circle cx="72" cy="72" r="54" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (score / 100) * circumference }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 10px ${color})` }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-orbitron text-4xl font-black" style={{ color }}>{score}</span>
          <span className="text-cyber-muted text-xs">/100</span>
        </div>
      </div>
      <span className="font-mono text-xs font-bold tracking-widest px-3 py-1 rounded border"
        style={{ color, borderColor: `${color}40`, background: `${color}10` }}>{label}</span>
    </div>
  );
}

export default function CloudScan() {
  const [domain, setDomain] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<CloudScanResult | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const runScan = async () => {
    if (!domain.trim()) return;
    setScanning(true); setResult(null);
    const res = await scanWebsite(domain.trim());
    setResult(res);
    setScanning(false);
  };

  const detected = result?.vulnerabilities.filter(v => v.detected) || [];
  const counts = detected.reduce((acc, v) => ({ ...acc, [v.severity]: (acc[v.severity as keyof typeof acc] || 0) + 1 }), {} as any);
  const filtered = filter === 'all' ? detected : detected.filter(v => v.severity === filter);

  const radarData = result?.engineBreakdown ? [
    { subject: 'Headers', A: result.engineBreakdown.headers.score },
    { subject: 'SSL/TLS', A: result.engineBreakdown.ssl_tls.score },
    { subject: 'Exposure', A: result.engineBreakdown.exposure.score },
    { subject: 'Protocol', A: result.engineBreakdown.protocol.score },
    { subject: 'CORS', A: result.engineBreakdown.cors_policy.score },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Scanner input */}
      <GlowCard glowColor="amber" className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-cyber-amber/15 border border-cyber-amber/30">
            <Globe className="text-cyber-amber" size={22} />
          </div>
          <div>
            <h2 className="font-orbitron text-lg font-bold text-cyber-text tracking-tight">CloudScan <span className="text-[10px] text-cyber-amber font-mono ml-2 opacity-60 uppercase tracking-[0.3em]">Forensic Probe</span></h2>
            <p className="text-xs text-cyber-muted">Industrial-Grade Web & Cloud Infrastructure Analysis</p>
          </div>
        </div>

        <div className="flex gap-3 mb-2">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" size={15} />
            <input value={domain} onChange={e => setDomain(e.target.value)}
              placeholder="Enter target domain or URL..."
              className="w-full bg-white/5 border border-cyber-border rounded-lg pl-9 pr-4 py-3 text-sm text-cyber-text placeholder-cyber-muted/50 font-mono transition-all focus:border-cyber-amber/40 focus:bg-white/8 outline-none"
              onKeyDown={e => e.key === 'Enter' && !scanning && runScan()} />
          </div>
          <NeonButton variant="amber" onClick={runScan} loading={scanning} disabled={!domain.trim() || scanning}
            icon={<Search size={15} />}>
            Run Analysis
          </NeonButton>
        </div>

        {scanning && (
          <div className="mt-6">
            <ScanProcessConsole 
              phases={SCAN_PHASES} 
              isScanning={scanning} 
              onComplete={() => {}} 
            />
          </div>
        )}
      </GlowCard>

      {/* Results */}
      {result && !scanning && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <GlowCard className="p-6 flex flex-col items-center justify-center" glowColor={result.securityScore >= 70 ? 'green' : result.securityScore >= 40 ? 'amber' : 'red'}>
              <SecurityScore score={result.securityScore} />
              <div className="mt-4 text-center">
                <p className="text-xs text-cyber-muted font-mono">{result.domain}</p>
                <p className="text-[10px] text-cyber-muted/60 mt-1 flex items-center gap-1 justify-center">
                  <Activity size={10} /> {result.responseTime}ms Latency · Scanned {new Date(result.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </GlowCard>

            <GlowCard className="p-5" glowColor="cyan">
              <h3 className="font-orbitron text-[11px] font-bold text-cyber-cyan mb-4 flex items-center gap-2 uppercase tracking-widest">
                <Cpu size={14} /> Intelligence Radar
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.05)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Radar dataKey="A" stroke="#00f5ff" fill="#00f5ff" fillOpacity={0.15} strokeWidth={1.5} />
                </RadarChart>
              </ResponsiveContainer>
            </GlowCard>

            <GlowCard className="p-5">
              <h3 className="font-orbitron text-[11px] font-bold text-cyber-text mb-4 uppercase tracking-widest">Findings Summary</h3>
              <div className="space-y-2">
                {(['critical','high','medium','low','info'] as const).map(sev => {
                  const { color, label } = SEV_CONFIG[sev];
                  const c = counts[sev] || 0;
                  return (
                    <div key={sev} className="flex items-center gap-3">
                      <span className="w-16 text-[10px] font-mono font-bold" style={{ color }}>{label}</span>
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ background: color }}
                          initial={{ width: 0 }} animate={{ width: `${(c / Math.max(detected.length, 1)) * 100}%` }}
                          transition={{ duration: 0.8, delay: 0.3 }} />
                      </div>
                      <span className="text-[10px] font-mono text-cyber-muted w-4 text-right">{c}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-3 border-t border-cyber-border flex items-center gap-2">
                <Lock size={12} className={result.sslValid ? 'text-cyber-green' : 'text-cyber-red'} />
                <span className="text-[10px] text-cyber-muted uppercase tracking-wider">SSL Tunnel: </span>
                <span className={`text-[10px] font-mono font-bold ${result.sslValid ? 'text-cyber-green' : 'text-cyber-red'}`}>
                  {result.sslValid ? `VALID · TLS 1.3` : 'INSECURE / EXPOSED'}
                </span>
              </div>
            </GlowCard>
          </div>

          {/* Neural Insights */}
          {result.neuralAnalysis && (
            <GlowCard className="p-6 overflow-hidden relative" glowColor="violet">
              <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12">
                <Terminal size={80} className="text-cyber-violet" />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-cyber-violet/20 border border-cyber-violet/40">
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                    <Shield className="text-cyber-violet" size={18} />
                  </motion.div>
                </div>
                <h3 className="font-orbitron text-xs font-bold text-cyber-text tracking-widest uppercase">Neural Vulnerability Insight</h3>
                <span className="px-2 py-0.5 rounded-full bg-cyber-violet/10 border border-cyber-violet/30 text-[9px] font-mono text-cyber-violet font-bold tracking-widest uppercase">Expert Assessment</span>
              </div>
              <p className="text-sm text-cyber-text/90 leading-relaxed max-w-4xl relative z-10 font-medium italic">
                "{result.neuralAnalysis}"
              </p>
            </GlowCard>
          )}

          {/* Vulnerabilities list */}
          <GlowCard className="p-6">
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <h3 className="font-orbitron text-xs font-bold text-cyber-text flex items-center gap-2 uppercase tracking-widest">
                <AlertTriangle size={15} className="text-cyber-amber" />
                Technical Findings ({detected.length})
              </h3>
              <div className="flex gap-1 flex-wrap ml-auto">
                {['all','critical','high','medium','low','info'].map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-all ${filter === f ? 'bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/30 shadow-[0_0_10px_rgba(0,245,255,0.1)]' : 'text-cyber-muted hover:text-cyber-text'}`}>
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <AnimatePresence>
                {filtered.map(v => <VulnCard key={v.id} vuln={v} />)}
              </AnimatePresence>
              {filtered.length === 0 && (
                <div className="text-center py-10 text-cyber-muted text-sm border-2 border-dashed border-cyber-border rounded-xl">
                  <CheckCircle className="mx-auto mb-3 text-cyber-green opacity-40" size={32} />
                  No {filter !== 'all' ? filter : ''} threat vectors identified in current scan range.
                </div>
              )}
            </div>
          </GlowCard>
        </motion.div>
      )}
    </div>
  );
}
