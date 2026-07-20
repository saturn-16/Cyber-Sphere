import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import PhishGuard from './pages/PhishGuard';
import SecureShare from './pages/SecureShare';
import CloudScan from './pages/CloudScan';
import Login from './pages/Login';
import { useAuthStore } from './store/authStore';
import React from 'react';

// ProtectedRoute checks if the operator is authenticated before granting access to dashboards
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Authentication Portal */}
        <Route path="/login" element={<Login />} />

        {/* Secured Console Panel Routes */}
        <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"   element={<Dashboard />} />
          <Route path="phishguard"  element={<PhishGuard />} />
          <Route path="secureshare" element={<SecureShare />} />
          <Route path="cloudscan"   element={<CloudScan />} />
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
