import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import PhishGuard from './pages/PhishGuard';
import SecureShare from './pages/SecureShare';
import CloudScan from './pages/CloudScan';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* AppShell layout is the default landing shell */}
        <Route path="/" element={<AppShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"   element={<Dashboard />} />
          <Route path="phishguard"  element={<PhishGuard />} />
          <Route path="secureshare" element={<SecureShare />} />
          <Route path="cloudscan"   element={<CloudScan />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
