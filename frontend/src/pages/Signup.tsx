import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import NeonButton from '../components/ui/NeonButton';
import ParticleBackground from '../components/ui/ParticleBackground';
import { useAuthStore } from '../store/authStore';
import Logo from '../components/layout/Logo';

export default function Signup() {
  const [form, setForm] = useState({ displayName: '', email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { signup, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const passwordStrength = (pw: string): { score: number; label: string; color: string } => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const map = [
      { label: '', color: '' },
      { label: 'Weak', color: '#ff0040' },
      { label: 'Fair', color: '#ff9500' },
      { label: 'Good', color: '#0ea5e9' },
      { label: 'Strong', color: '#39ff14' },
    ];
    return { score, ...map[score] };
  };

  const strength = passwordStrength(form.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    try {
      await signup(form.email, form.password, form.displayName);
      navigate('/dashboard');
    } catch (err: any) { setError(err.message); }
  };

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="min-h-screen bg-cyber-bg flex items-center justify-center relative overflow-hidden py-8">
      <ParticleBackground />
      <div className="absolute inset-0 bg-cyber-radial opacity-50 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <div className="flex flex-col items-center mb-8">
           <Logo size={64} className="mb-2" />
           <p className="text-cyber-muted text-[10px] font-mono tracking-[0.4em] uppercase opacity-50">Industrial Grade · Neural Core</p>
        </div>

        <div className="glass-strong rounded-2xl border border-cyber-violet/15 p-8"
          style={{ boxShadow: '0 0 60px rgba(124,58,237,0.05)' }}>

          <h2 className="font-orbitron text-xl font-semibold text-cyber-text mb-1">Register Operator</h2>
          <p className="text-cyber-muted text-sm mb-6">Gain access to the full security suite</p>

          {error && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-cyber-red/10 border border-cyber-red/30 text-cyber-red text-sm mb-4">
              <AlertCircle size={14} />{error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: 'displayName', label: 'Display Name', type: 'text', icon: User, placeholder: 'Security Analyst' },
              { key: 'email', label: 'Email', type: 'email', icon: Mail, placeholder: 'analyst@organization.com' },
            ].map(({ key, label, type, icon: Icon, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-cyber-muted mb-1.5 tracking-wider uppercase">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" size={15} />
                  <input type={type} value={(form as any)[key]} onChange={update(key)} placeholder={placeholder} required
                    className="w-full bg-white/5 border border-cyber-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-cyber-text placeholder-cyber-muted/50 transition-all" />
                </div>
              </div>
            ))}

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-cyber-muted mb-1.5 tracking-wider uppercase">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" size={15} />
                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={update('password')}
                  placeholder="Min. 8 characters" required
                  className="w-full bg-white/5 border border-cyber-border rounded-lg pl-9 pr-10 py-2.5 text-sm text-cyber-text placeholder-cyber-muted/50 transition-all" />
                <button type="button" onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-muted hover:text-cyber-cyan transition-colors">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {/* Strength bar */}
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                        style={{ background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.1)' }} />
                    ))}
                  </div>
                  <span className="text-[11px]" style={{ color: strength.color }}>{strength.label}</span>
                </div>
              )}
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-xs font-medium text-cyber-muted mb-1.5 tracking-wider uppercase">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" size={15} />
                <input type="password" value={form.confirm} onChange={update('confirm')}
                  placeholder="Repeat password" required
                  className="w-full bg-white/5 border border-cyber-border rounded-lg pl-9 pr-10 py-2.5 text-sm text-cyber-text placeholder-cyber-muted/50 transition-all" />
                {form.confirm && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {form.password === form.confirm
                      ? <CheckCircle size={15} className="text-cyber-green" />
                      : <AlertCircle size={15} className="text-cyber-red" />}
                  </div>
                )}
              </div>
            </div>

            <NeonButton type="submit" variant="violet" loading={isLoading} className="w-full justify-center" size="lg">
              Create Operator Account
            </NeonButton>
          </form>

          <p className="text-center text-sm text-cyber-muted mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-cyber-cyan hover:underline transition-all">Sign in →</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
