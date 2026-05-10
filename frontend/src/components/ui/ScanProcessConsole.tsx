import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface LogEntry {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
  timestamp: string;
}

export interface ScanPhase {
  message: string;
  duration: number;
  type?: 'info' | 'success' | 'warn' | 'error';
}

interface ScanProcessConsoleProps {
  isScanning: boolean;
  phases?: ScanPhase[];
  onComplete?: () => void;
  // Legacy support for fixed types
  scanType?: 'url' | 'message' | 'qr';
}

const ScanProcessConsole: React.FC<ScanProcessConsoleProps> = ({ isScanning, phases, onComplete, scanType }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      message,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }]);
  };

  useEffect(() => {
    if (isScanning) {
      setLogs([]);
      
      let currentPhases: ScanPhase[] = [];

      if (phases) {
        currentPhases = phases;
      } else if (scanType) {
        const sequences: Record<string, ScanPhase[]> = {
          url: [
            { message: "Initializing heuristic scan engine...", duration: 0 },
            { message: "Normalizing target URL...", duration: 600 },
            { message: "Querying Global Threat Intelligence (VirusTotal)...", duration: 1200 },
            { message: "Analyzing domain for typosquatting patterns...", duration: 2000 },
            { message: "Checking Google Safe Browsing API...", duration: 2800 },
            { message: "Retrieving WHOIS registration data...", duration: 3500 },
            { message: "Triggering Neural Behavioral Analysis...", duration: 4200, type: 'warn' },
            { message: "Correlating threat vectors and calculating risk score...", duration: 5000 },
            { message: "Scan complete. Generating report.", duration: 5800, type: 'success' },
          ],
          message: [
            { message: "Extracting message metadata...", duration: 0 },
            { message: "Identifying linguistic manipulation patterns...", duration: 800 },
            { message: "Scanning for embedded malicious links...", duration: 1500 },
            { message: "Executing Neural Social Engineering Analysis...", duration: 2500, type: 'warn' },
            { message: "Calculating threat probability...", duration: 3500 },
            { message: "Analysis complete.", duration: 4200, type: 'success' },
          ],
          qr: [
            { message: "Decoding QR matrix...", duration: 0 },
            { message: "QR payload extracted successfully.", duration: 700, type: 'success' },
            { message: "Scanning decoded URL target...", duration: 1400 },
            { message: "Querying threat databases...", duration: 2200 },
            { message: "Neural analysis triggered for QR context...", duration: 3000, type: 'warn' },
            { message: "Finalizing risk assessment.", duration: 3800, type: 'success' },
          ]
        };
        currentPhases = sequences[scanType] || [];
      }

      const timers: (ReturnType<typeof setTimeout>)[] = [];

      currentPhases.forEach((step, index) => {
        const timer = setTimeout(() => {
          addLog(step.message, step.type || 'info');
          if (index === currentPhases.length - 1 && onComplete) {
            onComplete();
          }
        }, step.duration);
        timers.push(timer);
      });

      return () => timers.forEach(clearTimeout);
    }
  }, [isScanning, phases, scanType, onComplete]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  if (!isScanning && logs.length === 0) return null;

  return (
    <div className="mt-4 rounded-lg bg-black/80 border border-cyber-border overflow-hidden font-mono text-[11px]">
      <div className="bg-white/5 px-3 py-1.5 border-b border-cyber-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-cyber-muted uppercase tracking-widest text-[10px] font-bold">
          <Terminal size={12} className="text-cyber-violet" />
          Neural Engine Console
        </div>
        {isScanning && <Loader2 size={10} className="animate-spin text-cyber-violet" />}
      </div>
      <div 
        ref={scrollRef}
        className="p-3 max-h-[150px] overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-white/10"
      >
        <AnimatePresence>
          {logs.map((log) => (
            <motion.div 
              key={log.id}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-2 items-start"
            >
              <span className="text-white/20 flex-shrink-0">[{log.timestamp}]</span>
              <span className={`
                ${log.type === 'info' ? 'text-cyber-muted' : ''}
                ${log.type === 'success' ? 'text-cyber-green' : ''}
                ${log.type === 'warn' ? 'text-cyber-amber font-bold' : ''}
                ${log.type === 'error' ? 'text-cyber-red' : ''}
              `}>
                {log.type === 'success' && <CheckCircle2 size={10} className="inline mr-1" />}
                {log.type === 'warn' && <AlertCircle size={10} className="inline mr-1" />}
                {log.message}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ScanProcessConsole;
