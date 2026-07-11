import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, Eye, EyeOff, Zap, AlertCircle } from 'lucide-react';
import NeonButton from '../components/ui/NeonButton';
import ParticleBackground from '../components/ui/ParticleBackground';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Demo login shortcut
  const demoLogin = async () => {
    setEmail('demo@cybersphere.io');
    setPassword('demo1234');
    // Pre-create demo user if not exists
    const users = JSON.parse(localStorage.getItem('cybersphere_users') || '{}');
    if (!users['demo@cybersphere.io']) {
      users['demo@cybersphere.io'] = {
        password: 'demo1234',
        user: { id: 'demo-user-001', email: 'demo@cybersphere.io', displayName: 'Demo Analyst', createdAt: new Date().toISOString() }
      };
      localStorage.setItem('cybersphere_users', JSON.stringify(users));
    }
    try {
      await login('demo@cybersphere.io', 'demo1234');
      navigate('/dashboard');
    } catch {}
  };

  return (
    <div className="min-h-screen bg-cyber-bg flex items-center justify-center relative overflow-hidden">
      <ParticleBackground />

      {/* Radial glow center */}
      <div className="absolute inset-0 bg-cyber-radial opacity-50 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md px-4"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyber-cyan/10 border border-cyber-cyan/30 mb-4"
            style={{ boxShadow: '0 0 40px rgba(0,245,255,0.2)' }}
          >
            <Zap className="text-cyber-cyan" size={32} />
          </motion.div>
          <h1 className="font-orbitron text-3xl font-bold gradient-text-cyber">CyberSphere</h1>
          <p className="text-cyber-muted text-sm mt-1">Security Operations Platform</p>
        </div>

        {/* Card */}
        <div className="glass-strong rounded-2xl border border-cyber-cyan/15 p-8"
          style={{ boxShadow: '0 0 60px rgba(0,245,255,0.05)' }}>
          <h2 className="font-orbitron text-xl font-semibold text-cyber-text mb-1">Operator Login</h2>
          <p className="text-cyber-muted text-sm mb-6">Authenticate to access the security dashboard</p>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-cyber-red/10 border border-cyber-red/30 text-cyber-red text-sm mb-4"
            >
              <AlertCircle size={14} />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-cyber-muted mb-1.5 tracking-wider uppercase">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" size={15} />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="operator@cybersphere.io"
                  required
                  className="w-full bg-white/5 border border-cyber-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-cyber-text placeholder-cyber-muted/50 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-cyber-muted mb-1.5 tracking-wider uppercase">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" size={15} />
                <input
                  type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/5 border border-cyber-border rounded-lg pl-9 pr-10 py-2.5 text-sm text-cyber-text placeholder-cyber-muted/50 transition-all"
                />
                <button type="button" onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-muted hover:text-cyber-cyan transition-colors">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <NeonButton type="submit" loading={isLoading} className="w-full justify-center" size="lg">
              <Shield size={16} />
              Authenticate
            </NeonButton>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-cyber-border" />
            <span className="text-xs text-cyber-muted">or</span>
            <div className="flex-1 h-px bg-cyber-border" />
          </div>

          {/* Demo access */}
          <NeonButton variant="outline" className="w-full justify-center" onClick={demoLogin} loading={isLoading}>
            ⚡ Quick Demo Access
          </NeonButton>

          <p className="text-center text-sm text-cyber-muted mt-6">
            No account?{' '}
            <Link to="/signup" className="text-cyber-cyan hover:text-glow-cyan transition-all">
              Create operator account →
            </Link>
          </p>
        </div>

        <p className="text-center text-[11px] text-cyber-muted/50 mt-4">
          CyberSphere v1.0 · All connections encrypted · SOC-Grade Security
        </p>
      </motion.div>
    </div>
  );
}
