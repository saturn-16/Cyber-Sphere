import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Shield, Lock, AlertTriangle, FileText } from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonButton from '../components/ui/NeonButton';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function SharedFile() {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${API_URL}/files/share/${token}`);
      if (password) {
        url.searchParams.append('password', password);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid or missing password.');
        } else if (response.status === 404) {
          throw new Error('File not found or link has expired.');
        } else if (response.status === 410) {
          throw new Error('This share link has expired.');
        } else {
          throw new Error('Failed to download file.');
        }
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'downloaded-file';
      if (contentDisposition && contentDisposition.includes('filename=')) {
        const matches = contentDisposition.match(/filename="?([^"]+)"?/);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      setError(err.message || 'An error occurred during download.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Shield className="text-cyber-cyan" size={32} />
          <h1 className="font-orbitron text-2xl font-bold text-cyber-text tracking-wider">
            Cyber<span className="text-cyber-cyan">Sphere</span>
          </h1>
        </div>

        <GlowCard className="p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyber-cyan/10 border border-cyber-cyan/30 mb-4">
              <FileText className="text-cyber-cyan" size={32} />
            </div>
            <h2 className="font-orbitron text-xl font-bold text-cyber-text">Secure Download</h2>
            <p className="text-sm text-cyber-muted mt-2">
              This file has been AES-256 encrypted. Please enter the password if required.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-cyber-muted mb-1 flex items-center gap-1">
                <Lock size={12} /> Password (if protected)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full bg-white/5 border border-cyber-border rounded-lg px-4 py-2 text-sm text-cyber-text placeholder-cyber-muted/50 focus:border-cyber-cyan transition-all outline-none"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-cyber-red/10 border border-cyber-red/30 text-cyber-red text-sm">
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            <NeonButton
              onClick={handleDownload}
              loading={loading}
              className="w-full justify-center"
              icon={<Download size={16} />}
            >
              Decrypt & Download
            </NeonButton>
          </div>
        </GlowCard>
      </div>
    </div>
  );
}
