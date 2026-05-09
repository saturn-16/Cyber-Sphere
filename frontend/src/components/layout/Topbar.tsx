import { Bell, Shield, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard':   { title: 'Dashboard', subtitle: 'Security Operations Overview' },
  '/phishguard':  { title: 'PhishGuard', subtitle: 'Phishing & Threat Detection Engine' },
  '/secureshare': { title: 'SecureShare', subtitle: 'Encrypted File Sharing System' },
  '/cloudscan':   { title: 'CloudScan', subtitle: 'Web & Cloud Security Scanner' },
};

export default function Topbar() {
  const location = useLocation();
  const { user } = useAuthStore();
  const page = pageTitles[location.pathname] || { title: 'CyberSphere', subtitle: '' };

  return (
    <header className="h-16 flex-shrink-0 glass-strong border-b border-cyber-border px-6 flex items-center justify-between z-10">
      {/* Page title */}
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="font-orbitron font-bold text-cyber-text text-lg leading-none">
          {page.title}
        </h1>
        <p className="text-cyber-muted text-xs mt-0.5">{page.subtitle}</p>
      </motion.div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-white/5 border border-cyber-border rounded-lg px-3 py-2 text-sm text-cyber-muted hover:border-cyber-cyan/30 transition-all w-48">
          <Search size={14} />
          <span className="text-xs">Search…</span>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 bg-cyber-green/10 border border-cyber-green/30 rounded-lg px-3 py-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse" />
          <span className="text-[10px] font-mono text-cyber-green tracking-widest hidden sm:block">ALL SYSTEMS OPERATIONAL</span>
        </div>

        {/* Notifications */}
        <button className="relative w-9 h-9 glass rounded-lg border border-cyber-border hover:border-cyber-cyan/40 flex items-center justify-center text-cyber-muted hover:text-cyber-cyan transition-all">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyber-red" />
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyber-cyan/40 to-cyber-violet/40 border border-cyber-cyan/20 flex items-center justify-center">
          <Shield size={16} className="text-cyber-cyan" />
        </div>
      </div>
    </header>
  );
}
