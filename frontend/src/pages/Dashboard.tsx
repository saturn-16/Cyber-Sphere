import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Shield, Share2, Globe, TrendingUp, AlertTriangle,
  Activity, Clock, Zap, ExternalLink, ChevronRight,
} from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import ThreatBadge from '../components/ui/ThreatBadge';
import { getDashboardStats, getThreatFeed } from '../services/api';
import type { DashboardStats, ThreatFeedItem, ActivityItem } from '../types';

const STAGGER = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const ITEM = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

function StatCard({ icon: Icon, label, value, sub, color, onClick }: any) {
  return (
    <motion.div variants={ITEM}>
      <GlowCard glowColor={color === '#00f5ff' ? 'cyan' : color === '#7c3aed' ? 'violet' : color === '#39ff14' ? 'green' : 'amber'}
        className="p-5 cursor-pointer" onClick={onClick}>
        <div className="flex items-start justify-between mb-4">
          <div className="p-2.5 rounded-lg" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
            <Icon size={20} style={{ color }} />
          </div>
          <ChevronRight size={14} className="text-cyber-muted" />
        </div>
        <div className="font-orbitron text-3xl font-bold text-cyber-text mb-1" style={{ textShadow: `0 0 20px ${color}50` }}>
          {value}
        </div>
        <div className="text-sm text-cyber-muted">{label}</div>
        {sub && <div className="text-[11px] text-cyber-muted/60 mt-1">{sub}</div>}
      </GlowCard>
    </motion.div>
  );
}

function ActivityFeed({ items }: { items: ActivityItem[] }) {
  const icons = { scan: Shield, upload: Share2, download: Globe, alert: AlertTriangle };
  const colors = { safe: '#39ff14', suspicious: '#ff9500', dangerous: '#ff0040', unknown: '#64748b' };
  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const Icon = icons[item.type] || Activity;
        const color = colors[item.severity || 'unknown'];
        return (
          <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-3 p-3 rounded-lg bg-white/3 border border-cyber-border hover:bg-white/5 transition-all group">
            <div className="p-1.5 rounded-md flex-shrink-0" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
              <Icon size={13} style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-cyber-text">{item.message}</p>
              <p className="text-[11px] text-cyber-muted mt-0.5 flex items-center gap-1">
                <Clock size={10} />
                {new Date(item.timestamp).toLocaleTimeString()}
              </p>
            </div>
            {item.severity && <ThreatBadge level={item.severity} size="sm" showIcon={false} />}
          </motion.div>
        );
      })}
    </div>
  );
}

function ThreatFeedTicker({ items }: { items: ThreatFeedItem[] }) {
  const sevColor = { critical: '#ff0040', high: '#ff9500', medium: '#0ea5e9' };
  return (
    <div className="flex items-center gap-3 overflow-hidden">
      <div className="flex-shrink-0 flex items-center gap-2 bg-cyber-red/10 border border-cyber-red/30 rounded px-2 py-1">
        <div className="w-1.5 h-1.5 rounded-full bg-cyber-red animate-pulse" />
        <span className="text-[10px] font-mono text-cyber-red tracking-widest">LIVE</span>
      </div>
      <div className="overflow-hidden flex-1">
        <motion.div
          className="flex gap-8 whitespace-nowrap"
          animate={{ x: [0, -1200] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        >
          {[...items, ...items].map((item, i) => (
            <span key={i} className="text-xs font-mono" style={{ color: sevColor[item.severity] }}>
              [{item.severity.toUpperCase()}] {item.title} — {item.source}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg border border-cyber-cyan/20 p-3 text-xs">
      <p className="text-cyber-muted mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [feed, setFeed] = useState<ThreatFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getDashboardStats().then(s => { setStats(s); setLoading(false); });
    setFeed(getThreatFeed());
  }, []);

  const quickActions = [
    { label: 'Scan URL', icon: Shield, color: '#00f5ff', to: '/phishguard' },
    { label: 'Share File', icon: Share2, color: '#39ff14', to: '/secureshare' },
    { label: 'Scan Website', icon: Globe, color: '#ff9500', to: '/cloudscan' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
          <Zap className="text-cyber-cyan" size={32} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Threat feed ticker */}
      <div className="glass rounded-xl border border-cyber-border p-3">
        <ThreatFeedTicker items={feed} />
      </div>

      {/* Stat cards */}
      <motion.div
        variants={STAGGER} initial="hidden" animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard icon={Shield} label="Total Scans" value={stats!.totalScans} sub="All time" color="#00f5ff" onClick={() => navigate('/phishguard')} />
        <StatCard icon={AlertTriangle} label="Threats Detected" value={stats!.threatsDetected} sub="Blocked & reported" color="#ff0040" />
        <StatCard icon={Share2} label="Files Shared" value={stats!.filesShared} sub="Encrypted" color="#39ff14" onClick={() => navigate('/secureshare')} />
        <StatCard icon={TrendingUp} label="Security Score" value={`${stats!.securityScore}%`} sub="Organization avg." color="#7c3aed" onClick={() => navigate('/cloudscan')} />
      </motion.div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area chart */}
        <GlowCard className="lg:col-span-2 p-5">
          <h3 className="font-orbitron text-sm font-semibold text-cyber-text mb-4 flex items-center gap-2">
            <Activity size={16} className="text-cyber-cyan" /> Scan Activity (7 days)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats!.scanTrend}>
              <defs>
                <linearGradient id="cyan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f5ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00f5ff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="red" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff0040" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ff0040" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="scans" name="Scans" stroke="#00f5ff" fill="url(#cyan)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="threats" name="Threats" stroke="#ff0040" fill="url(#red)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </GlowCard>

        {/* Pie chart */}
        <GlowCard className="p-5" glowColor="violet">
          <h3 className="font-orbitron text-sm font-semibold text-cyber-text mb-4 flex items-center gap-2">
            <Shield size={16} className="text-cyber-violet" /> Threat Distribution
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={stats!.threatDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                {stats!.threatDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="transparent"
                    style={{ filter: `drop-shadow(0 0 6px ${entry.color}80)` }} />
                ))}
              </Pie>
              <Legend formatter={(v) => <span className="text-xs text-cyber-muted">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </GlowCard>
      </div>

      {/* Bottom row: activity + quick actions + Expert Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity feed */}
        <GlowCard className="lg:col-span-2 p-5">
          <h3 className="font-orbitron text-sm font-semibold text-cyber-text mb-4 flex items-center gap-2">
            <Clock size={16} className="text-cyber-cyan" /> Recent Activity
          </h3>
          <ActivityFeed items={stats!.recentActivity} />
        </GlowCard>

        <div className="space-y-4">
          {/* Quick actions */}
          <GlowCard glowColor="violet" className="p-5">
            <h3 className="font-orbitron text-sm font-semibold text-cyber-text mb-4 flex items-center gap-2">
              <Zap size={16} className="text-cyber-violet" /> Quick Actions
            </h3>
            <div className="space-y-3">
              {quickActions.map(({ label, icon: Icon, color, to }) => (
                <motion.button key={label} whileHover={{ x: 4 }} onClick={() => navigate(to)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border transition-all group"
                  style={{ background: `${color}08`, borderColor: `${color}25` }}>
                  <div className="flex items-center gap-3">
                    <Icon size={16} style={{ color }} />
                    <span className="text-sm text-cyber-text">{label}</span>
                  </div>
                  <ExternalLink size={13} className="text-cyber-muted group-hover:text-cyber-text transition-colors" />
                </motion.button>
              ))}
            </div>
            {/* Module status */}
            <div className="mt-4 pt-4 border-t border-cyber-border space-y-2">
              {['PhishGuard Engine', 'SecureShare Vault', 'CloudScan Service'].map(m => (
                <div key={m} className="flex items-center justify-between">
                  <span className="text-xs text-cyber-muted">{m}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse" />
                    <span className="text-[10px] font-mono text-cyber-green">ONLINE</span>
                  </div>
                </div>
              ))}
            </div>
          </GlowCard>

          {/* Expert Insights */}
          <GlowCard glowColor="amber" className="p-5">
            <h3 className="font-orbitron text-[11px] font-bold text-cyber-amber mb-3 flex items-center gap-2 uppercase tracking-widest">
              <Shield size={14} /> Expert Security Insights
            </h3>
            <div className="space-y-4">
              <div className="border-l-2 border-cyber-amber/30 pl-3">
                <p className="text-xs font-bold text-cyber-text mb-1">Typosquatting Alert</p>
                <p className="text-[10px] text-cyber-muted leading-relaxed">
                  We've noticed a 40% increase in 'lookalike' domains targeting corporate SSO portals. Always check the TLD.
                </p>
              </div>
              <div className="border-l-2 border-cyber-amber/30 pl-3">
                <p className="text-xs font-bold text-cyber-text mb-1">Zero-Trust Best Practice</p>
                <p className="text-[10px] text-cyber-muted leading-relaxed">
                  Never trust a QR code from an unverified source. Attackers are using 'Quishing' to bypass email filters.
                </p>
              </div>
            </div>
          </GlowCard>
        </div>
      </div>
    </div>
  );
}
