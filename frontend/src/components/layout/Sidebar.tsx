import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Shield, Share2, Globe, LogOut,
  ChevronLeft, ChevronRight, Zap, Settings, User,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { clsx } from 'clsx';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'text-cyber-cyan' },
  { to: '/phishguard',icon: Shield,          label: 'PhishGuard', color: 'text-cyber-violet' },
  { to: '/secureshare',icon: Share2,         label: 'SecureShare',color: 'text-cyber-green' },
  { to: '/cloudscan', icon: Globe,           label: 'CloudScan',  color: 'text-cyber-amber' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative flex-shrink-0 h-screen flex flex-col glass-strong border-r border-cyber-border overflow-hidden z-20"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-cyber-border h-16">
        <div className="relative flex-shrink-0 w-9 h-9">
          <div className="absolute inset-0 rounded-lg bg-cyber-cyan/20 border border-cyber-cyan/40 flex items-center justify-center">
            <Zap size={18} className="text-cyber-cyan" />
          </div>
          <div className="absolute inset-0 rounded-lg animate-pulse-neon opacity-50" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <span className="font-orbitron font-bold text-lg gradient-text-cyber">
                CyberSphere
              </span>
              <div className="text-[10px] font-mono text-cyber-muted tracking-widest">
                SECURITY PLATFORM
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, color }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => clsx(
              'group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative',
              isActive
                ? 'bg-cyber-cyan/10 border border-cyber-cyan/20 text-cyber-cyan'
                : 'text-cyber-muted hover:text-cyber-text hover:bg-white/5 border border-transparent'
            )}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-lg bg-cyber-cyan/5 border border-cyber-cyan/20"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon
                  size={18}
                  className={clsx('flex-shrink-0 relative z-10', isActive ? color : 'text-cyber-muted group-hover:text-cyber-text')}
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={clsx(
                        'text-sm font-medium relative z-10 whitespace-nowrap',
                        isActive ? color : ''
                      )}
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="p-2 border-t border-cyber-border space-y-1">
        {/* User info */}
        <div className={clsx('flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/3', collapsed && 'justify-center')}>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyber-cyan to-cyber-violet flex items-center justify-center flex-shrink-0">
            <User size={12} className="text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-w-0">
                <div className="text-xs font-medium text-cyber-text truncate">
                  {user?.displayName || user?.email?.split('@')[0] || 'Operator'}
                </div>
                <div className="text-[10px] text-cyber-muted truncate">{user?.email}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Settings */}
        <button className={clsx('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-cyber-muted hover:text-cyber-text hover:bg-white/5 transition-all', collapsed && 'justify-center')}>
          <Settings size={16} className="flex-shrink-0" />
          <AnimatePresence>{!collapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm">Settings</motion.span>}</AnimatePresence>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={clsx('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-cyber-red/70 hover:text-cyber-red hover:bg-cyber-red/10 transition-all', collapsed && 'justify-center')}
        >
          <LogOut size={16} className="flex-shrink-0" />
          <AnimatePresence>{!collapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm">Logout</motion.span>}</AnimatePresence>
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full glass border border-cyber-border text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan/40 flex items-center justify-center transition-all z-30"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  );
}
