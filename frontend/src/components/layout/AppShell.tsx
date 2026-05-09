import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ParticleBackground from '../ui/ParticleBackground';

export default function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-cyber-bg">
      {/* Global particle canvas */}
      <ParticleBackground />

      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 bg-cyber-bg/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
