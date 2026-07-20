import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import PixelBlast from '../components/ui/PixelBlast';
import { isFirebaseConfigured } from '../services/firebase';

export default function Login() {
  const { loginWithGoogle, loginWithGithub, isAuthenticated, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      await loginWithGoogle();
    } catch (err: any) {
      setError('Authentication revoked');
    }
  };

  const handleGithubLogin = async () => {
    try {
      setError(null);
      await loginWithGithub();
    } catch (err: any) {
      setError('Authentication revoked');
    }
  };

  return (
    <div className="flex h-screen w-screen bg-black overflow-hidden font-sans text-white select-none">
      {/* Left Panel - PixelBlast Interactive Canvas */}
      <div className="relative hidden md:flex md:w-7/12 h-full bg-black border-r border-white/5 flex-col justify-between p-12 overflow-hidden">
        {/* Interactive Pixel Background */}
        <div className="absolute inset-0 z-0">
          <PixelBlast
            variant="circle"
            pixelSize={6}
            color="#00f5ff"
            patternScale={2.5}
            patternDensity={1.1}
            pixelSizeJitter={0.4}
            enableRipples={true}
            rippleSpeed={0.5}
            rippleThickness={0.12}
            rippleIntensityScale={1.6}
            liquid={true}
            liquidStrength={0.1}
            liquidRadius={1.1}
            liquidWobbleSpeed={4.0}
            speed={0.4}
            edgeFade={0.3}
            transparent={true}
          />
        </div>

        {/* Ambient Dark Overlay to protect text readability */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black via-transparent to-black/30 pointer-events-none z-10" />



        {/* Middle Hero Slogan */}
        <div className="relative z-20 my-auto max-w-lg space-y-6">
          <div className="space-y-2">
            <span className="inline-block text-[10px] tracking-[0.3em] text-[#00f5ff] font-mono border border-[#00f5ff]/20 px-2.5 py-1 rounded bg-[#00f5ff]/5 uppercase">
              Operational Command Access
            </span>
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-none bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-transparent">
              Defending the Digital Sphere.
            </h1>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-md">
            Next-generation zero-trust threat intelligence, automated passive compliance audits, and neural-guided anti-phishing protection.
          </p>

        </div>

        {/* Bottom Status / Footer */}
        <div className="relative z-20 font-mono text-[9px] text-zinc-500 tracking-wider flex justify-between items-center border-t border-white/5 pt-4">
          <span>SECURE GATEWAY ENCRYPTED VIA AES-GCM</span>
          <span>© {new Date().getFullYear()} CYBERSPHERE</span>
        </div>
      </div>

      {/* Right Panel - Login Card */}
      <div className="w-full md:w-5/12 h-full flex flex-col justify-center items-center px-8 sm:px-16 bg-[#030303] relative">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-30 pointer-events-none" />
        
        {/* Branding header */}
        <div className="absolute top-8 left-8 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00f5ff] to-purple-600 flex items-center justify-center shadow-lg shadow-[#00f5ff]/20">
            <span className="font-mono font-bold text-black text-sm">Ω</span>
          </div>
          <div>
            <span className="font-mono text-sm tracking-[0.2em] font-semibold text-white">CYBERSPHERE</span>
            <div className="text-[9px] text-[#00f5ff] tracking-wider font-mono">SYS.VER.2.0.4</div>
          </div>
        </div>

        <div className="w-full max-w-md space-y-8 relative z-10">
          {/* Header titles */}
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-3xl font-extrabold tracking-tight text-white font-mono uppercase">
              Operator Access
            </h2>
            <p className="text-sm text-zinc-400">
              Authenticate via authorized credential providers to access the CyberSphere command center.
            </p>
          </div>

          {/* Error message card */}
          {error && (
            <div className="p-4 bg-red-950/30 border border-red-500/20 rounded-lg text-xs text-red-400 font-mono flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping mr-2" />
              <span>ERROR: {error}</span>
            </div>
          )}

          {/* Social login buttons */}
          <div className="space-y-4 pt-4">
            {/* Google Sign-In */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-3 px-5 py-3.5 bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/5 hover:border-[#00f5ff]/30 rounded-xl transition-all duration-300 group shadow-lg shadow-black/30 hover:shadow-[#00f5ff]/5 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {/* Google Colored Icon */}
              <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-105" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              <span className="text-sm font-medium tracking-wide text-zinc-200 group-hover:text-white font-mono uppercase">
                {isLoading ? 'Processing...' : 'Access with Google'}
              </span>
            </button>

            {/* GitHub Sign-In */}
            <button
              onClick={handleGithubLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-3 px-5 py-3.5 bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/5 hover:border-purple-500/30 rounded-xl transition-all duration-300 group shadow-lg shadow-black/30 hover:shadow-purple-500/5 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {/* GitHub White Icon */}
              <svg className="w-5 h-5 fill-zinc-300 transition-transform duration-300 group-hover:scale-105 group-hover:fill-white" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              <span className="text-sm font-medium tracking-wide text-zinc-200 group-hover:text-white font-mono uppercase">
                {isLoading ? 'Processing...' : 'Access with GitHub'}
              </span>
            </button>
          </div>

          {/* Firebase Configuration Banner */}
          <div className="pt-8 text-center border-t border-white/5 space-y-3">
            {isFirebaseConfigured ? (
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>FIREBASE AUTHORIZATION ACTIVE</span>
              </div>
            ) : (
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-[10px] text-yellow-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                <span>SANDBOX MODE (DEMO AUTH ACTIVE)</span>
              </div>
            )}
            
            <p className="text-[10px] text-zinc-500 leading-normal max-w-xs mx-auto">
              {!isFirebaseConfigured 
                ? "To enable production credentials, configure VITE_FIREBASE_API_KEY and other Firebase variables in your Vercel/local environment."
                : "Credentials will be automatically verified against your configured Firebase Auth database."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
