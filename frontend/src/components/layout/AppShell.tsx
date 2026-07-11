import { Outlet, useNavigate } from 'react-router-dom';
import StaggeredMenu from '../ui/StaggeredMenu';
import PixelSnow from '../ui/PixelSnow';

export default function AppShell() {
  const navigate = useNavigate();

  const menuItems = [
    { label: 'Dashboard', ariaLabel: 'Go to dashboard overview', link: '/dashboard', onClick: () => navigate('/dashboard') },
    { label: 'PhishGuard', ariaLabel: 'Detect phishing links', link: '/phishguard', onClick: () => navigate('/phishguard') },
    { label: 'SecureShare', ariaLabel: 'Share files securely', link: '/secureshare', onClick: () => navigate('/secureshare') },
    { label: 'CloudScan', ariaLabel: 'Audit website headers', link: '/cloudscan', onClick: () => navigate('/cloudscan') }
  ];

  const socialItems = [
    { label: 'Twitter', link: 'https://x.com/saturn3ra' },
    { label: 'LinkedIn', link: 'https://www.linkedin.com/in/gaur4avkumar/' }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-cyber-bg">
      {/* Global interactive PixelSnow background */}
      <div className="fixed inset-0 z-0">
        <PixelSnow
          color="#ffffff"
          flakeSize={0.012}
          minFlakeSize={1.5}
          pixelResolution={180}
          speed={1.0}
          density={0.25}
          direction={120}
          brightness={1.0}
        />
      </div>

      {/* Floating Staggered Menu */}
      <StaggeredMenu
        position="left"
        isFixed={true}
        items={menuItems}
        socialItems={socialItems}
        displaySocials={true}
        displayItemNumbering={true}
        menuButtonColor="#e2e8f0"
        openMenuButtonColor="#00f5ff"
        accentColor="#00f5ff"
        changeMenuColorOnOpen={true}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <main className="flex-1 overflow-y-auto pt-24 px-6 pb-6 bg-cyber-bg/50 flex flex-col">
          <div className="flex-1">
            <Outlet />
          </div>
          <footer className="mt-16 pt-8 pb-4 text-center border-t border-white/5 text-[10px] font-mono text-cyber-muted tracking-wider select-none">
            CYBERSPHERE SECURITY PLATFORM // © {new Date().getFullYear()} SECURING DATA ASSETS VIA ZERO-TRUST CRYPTOGRAPHY & AI ENGINE // ALL SYSTEMS OPERATIONAL
          </footer>
        </main>
      </div>
    </div>
  );
}
