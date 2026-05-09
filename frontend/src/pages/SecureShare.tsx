import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2, Upload, Lock, Clock, Trash2, Copy, Check,
  Shield, AlertTriangle, FileText, Download, Link,
} from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonButton from '../components/ui/NeonButton';
import { uploadFile, getFiles, deleteFile } from '../services/api';
import type { SecureFile } from '../types';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/1048576).toFixed(1)} MB`;
}

function MalwareBadge({ status }: { status: SecureFile['malwareStatus'] }) {
  const cfg = {
    clean:    { label: 'CLEAN',    color: '#39ff14' },
    infected: { label: 'INFECTED', color: '#ff0040' },
    scanning: { label: 'SCANNING', color: '#0ea5e9' },
    unknown:  { label: 'UNKNOWN',  color: '#64748b' },
  }[status];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold border"
      style={{ color: cfg.color, borderColor: `${cfg.color}40`, background: `${cfg.color}10` }}>
      {status === 'scanning' && <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: cfg.color }} />}
      {cfg.label}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="p-1.5 rounded text-cyber-muted hover:text-cyber-cyan hover:bg-cyber-cyan/10 transition-all">
      {copied ? <Check size={13} className="text-cyber-green" /> : <Copy size={13} />}
    </button>
  );
}

function UploadZone({ onUpload }: { onUpload: (f: File) => void }) {
  const [options, setOptions] = useState({ password: '', expiryHours: 0, usePassword: false });
  const [dropping, setDropping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pending, setPending] = useState<File | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setPending(accepted[0]);
    setDropping(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDragEnter: () => setDropping(true),
    onDragLeave: () => setDropping(false),
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!pending) return;
    setUploading(true);
    // Simulate encryption progress
    for (let i = 0; i <= 100; i += 4) {
      await new Promise(r => setTimeout(r, 40));
      setProgress(i);
    }
    await uploadFile(pending, { password: options.usePassword ? options.password : undefined, expiryHours: options.expiryHours || undefined });
    onUpload(pending);
    setPending(null);
    setProgress(0);
    setUploading(false);
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
        isDragActive || dropping ? 'border-cyber-cyan/60 bg-cyber-cyan/5' : 'border-cyber-border hover:border-cyber-green/40 hover:bg-cyber-green/3'
      }`}>
        <input {...getInputProps()} />
        <motion.div animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}>
          <Upload className={`mx-auto mb-3 transition-colors ${isDragActive ? 'text-cyber-cyan' : 'text-cyber-muted'}`} size={36} />
        </motion.div>
        {pending ? (
          <div>
            <FileText className="mx-auto mb-2 text-cyber-green" size={24} />
            <p className="font-medium text-cyber-text">{pending.name}</p>
            <p className="text-sm text-cyber-muted mt-1">{formatBytes(pending.size)}</p>
            <p className="text-xs text-cyber-cyan mt-2">File ready · Click to change</p>
          </div>
        ) : (
          <div>
            <p className="text-cyber-text font-medium">Drag & drop files here</p>
            <p className="text-sm text-cyber-muted mt-1">or click to browse</p>
            <p className="text-xs text-cyber-muted/60 mt-3">All files are AES-256 encrypted before upload</p>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Password toggle */}
        <div className="p-3 rounded-lg bg-white/3 border border-cyber-border space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-cyber-text">
              <Lock size={13} className="text-cyber-cyan" /> Password Protection
            </div>
            <button onClick={() => setOptions(o => ({ ...o, usePassword: !o.usePassword }))}
              className={`w-9 h-5 rounded-full transition-all relative ${options.usePassword ? 'bg-cyber-cyan' : 'bg-cyber-border'}`}>
              <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${options.usePassword ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
          {options.usePassword && (
            <input type="password" value={options.password} onChange={e => setOptions(o => ({ ...o, password: e.target.value }))}
              placeholder="Set share password…"
              className="w-full bg-white/5 border border-cyber-border rounded-lg px-3 py-2 text-sm text-cyber-text placeholder-cyber-muted/50 transition-all" />
          )}
        </div>

        {/* Expiry */}
        <div className="p-3 rounded-lg bg-white/3 border border-cyber-border">
          <div className="flex items-center gap-2 text-sm text-cyber-text mb-2">
            <Clock size={13} className="text-cyber-amber" /> Link Expiry
          </div>
          <select value={options.expiryHours} onChange={e => setOptions(o => ({ ...o, expiryHours: +e.target.value }))}
            className="w-full bg-white/5 border border-cyber-border rounded-lg px-3 py-2 text-sm text-cyber-text transition-all">
            <option value={0}>Never expires</option>
            <option value={1}>1 hour</option>
            <option value={24}>24 hours</option>
            <option value={72}>3 days</option>
            <option value={168}>1 week</option>
          </select>
        </div>
      </div>

      {/* Encryption progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono text-cyber-muted">
            <span>{progress < 50 ? '🔐 AES-256 Encrypting…' : progress < 90 ? '🦠 Malware Scanning…' : '☁️ Uploading…'}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-cyber-border rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-cyber-cyan to-cyber-violet"
              animate={{ width: `${progress}%` }} transition={{ duration: 0.1 }} />
          </div>
        </div>
      )}

      <NeonButton variant="green" onClick={handleUpload} loading={uploading} disabled={!pending || uploading}
        className="w-full justify-center" icon={<Shield size={15} />}>
        Encrypt & Upload Securely
      </NeonButton>
    </div>
  );
}

function FileCard({ file, onDelete }: { file: SecureFile; onDelete: () => void }) {
  const shareUrl = `${window.location.origin}/share/${file.shareToken}`;
  const isExpired = file.expiryTime && new Date(file.expiryTime) < new Date();
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl border transition-all ${file.malwareStatus === 'infected'
        ? 'border-cyber-red/30 bg-cyber-red/5'
        : isExpired ? 'border-cyber-muted/20 opacity-60' : 'border-cyber-border hover:border-cyber-green/30'}`}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-white/5 flex-shrink-0">
          {file.malwareStatus === 'infected' ? <AlertTriangle size={18} className="text-cyber-red" /> : <FileText size={18} className="text-cyber-green" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-medium text-cyber-text truncate">{file.filename}</span>
            <MalwareBadge status={file.malwareStatus} />
            {file.encrypted && <span className="text-[10px] font-mono text-cyber-cyan border border-cyber-cyan/30 px-1.5 py-0.5 rounded">AES-256</span>}
            {file.passwordProtected && <Lock size={10} className="text-cyber-amber" />}
          </div>
          <div className="flex items-center gap-3 text-xs text-cyber-muted flex-wrap">
            <span>{formatBytes(file.size)}</span>
            <span>↓ {file.downloadCount} downloads</span>
            {file.expiryTime && <span className={isExpired ? 'text-cyber-red' : ''}>
              {isExpired ? 'EXPIRED' : `Expires ${new Date(file.expiryTime).toLocaleDateString()}`}
            </span>}
          </div>
          {/* Share link */}
          {file.shareToken && !isExpired && file.malwareStatus !== 'infected' && (
            <div className="flex items-center gap-2 mt-2 bg-white/3 rounded-lg px-3 py-1.5 border border-cyber-border">
              <Link size={11} className="text-cyber-muted flex-shrink-0" />
              <span className="text-[11px] font-mono text-cyber-muted truncate flex-1">{shareUrl}</span>
              <CopyButton text={shareUrl} />
            </div>
          )}
          {file.malwareStatus === 'infected' && (
            <div className="mt-2 flex items-center gap-2 text-xs text-cyber-red">
              <AlertTriangle size={11} /> File quarantined — malware detected, sharing disabled
            </div>
          )}
        </div>
        {/* Actions */}
        <div className="flex gap-1 flex-shrink-0">
          {file.malwareStatus === 'clean' && !isExpired && (
            <button className="p-1.5 rounded text-cyber-muted hover:text-cyber-cyan hover:bg-cyber-cyan/10 transition-all">
              <Download size={14} />
            </button>
          )}
          <button onClick={onDelete} className="p-1.5 rounded text-cyber-muted hover:text-cyber-red hover:bg-cyber-red/10 transition-all">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function SecureShare() {
  const [files, setFiles] = useState<SecureFile[]>([]);

  const refresh = async () => {
    try {
      const data = await getFiles();
      setFiles(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refresh();
    const intervalId = setInterval(() => {
      setFiles(prev => {
        if (prev.some(f => f.malwareStatus === 'scanning')) {
          getFiles().then(setFiles).catch(console.error);
        }
        return prev;
      });
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const stats = {
    total: files.length,
    encrypted: files.filter(f => f.encrypted).length,
    clean: files.filter(f => f.malwareStatus === 'clean').length,
    infected: files.filter(f => f.malwareStatus === 'infected').length,
  };

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Files', value: stats.total, color: '#00f5ff' },
          { label: 'Encrypted', value: stats.encrypted, color: '#7c3aed' },
          { label: 'Clean', value: stats.clean, color: '#39ff14' },
          { label: 'Quarantined', value: stats.infected, color: '#ff0040' },
        ].map(({ label, value, color }) => (
          <GlowCard key={label} className="p-4 text-center" glowColor={color === '#00f5ff' ? 'cyan' : color === '#7c3aed' ? 'violet' : color === '#39ff14' ? 'green' : 'red'}>
            <div className="font-orbitron text-2xl font-bold mb-1" style={{ color }}>{value}</div>
            <div className="text-xs text-cyber-muted">{label}</div>
          </GlowCard>
        ))}
      </div>

      {/* Upload zone */}
      <GlowCard glowColor="green" className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-cyber-green/15 border border-cyber-green/30">
            <Share2 className="text-cyber-green" size={22} />
          </div>
          <div>
            <h2 className="font-orbitron text-lg font-bold text-cyber-text">SecureShare Vault</h2>
            <p className="text-xs text-cyber-muted">AES-256 Encrypted File Sharing with Malware Scanning</p>
          </div>
        </div>
        <UploadZone onUpload={refresh} />
      </GlowCard>

      {/* File list */}
      <GlowCard className="p-6">
        <h3 className="font-orbitron text-sm font-bold text-cyber-text mb-4 flex items-center gap-2">
          <Shield size={15} className="text-cyber-cyan" /> Vault Contents
          <span className="ml-auto text-xs font-mono text-cyber-muted">{files.length} files</span>
        </h3>
        {files.length === 0 ? (
          <div className="text-center py-12 text-cyber-muted">
            <Share2 className="mx-auto mb-3 opacity-30" size={40} />
            <p className="text-sm">No files uploaded yet.</p>
            <p className="text-xs mt-1 text-cyber-muted/60">All files are AES-256 encrypted before storage.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {files.map(file => (
                <FileCard key={file.id} file={file} onDelete={async () => { await deleteFile(file.id); refresh(); }} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </GlowCard>
    </div>
  );
}
