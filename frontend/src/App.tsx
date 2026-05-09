import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import PhishGuard from './pages/PhishGuard';
import SecureShare from './pages/SecureShare';
import CloudScan from './pages/CloudScan';
import Login from './pages/Login';
import Signup from './pages/Signup';
import SharedFile from './pages/SharedFile';
import { useAuthStore } from './store/authStore';

/** Protected route — redirects to login if not authenticated */
function Protected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/share/:token" element={<SharedFile />} />

        {/* Protected routes inside the AppShell layout */}
        <Route path="/" element={
          <Protected>
            <AppShell />
          </Protected>
        }>
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
