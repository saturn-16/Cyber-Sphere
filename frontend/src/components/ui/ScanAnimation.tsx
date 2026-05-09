import { motion, AnimatePresence } from 'framer-motion';
import { Shield } from 'lucide-react';

interface ScanAnimationProps {
  isScanning: boolean;
  label?: string;
}

export default function ScanAnimation({ isScanning, label = 'Analyzing threat vectors…' }: ScanAnimationProps) {
  return (
    <AnimatePresence>
      {isScanning && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="flex flex-col items-center justify-center gap-6 py-10"
        >
          {/* Rotating rings */}
          <div className="relative w-24 h-24">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border-2"
                style={{
                  borderColor: i === 0 ? 'rgba(0,245,255,0.8)' : i === 1 ? 'rgba(124,58,237,0.5)' : 'rgba(57,255,20,0.3)',
                  scale: 1 + i * 0.25,
                }}
                animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                transition={{ duration: 2 + i, repeat: Infinity, ease: 'linear' }}
              />
            ))}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Shield className="text-cyber-cyan" size={32} />
            </motion.div>
          </div>

          {/* Scan progress bar */}
          <div className="w-64">
            <div className="h-1 bg-cyber-border rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #00f5ff, #7c3aed)' }}
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </div>

          {/* Cycling status messages */}
          <motion.p
            className="text-cyber-muted text-sm font-mono"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {label}
          </motion.p>

          {/* Hex data animation */}
          <div className="flex gap-2 font-mono text-[10px] text-cyber-cyan/40">
            {Array.from({ length: 8 }, (_, i) => (
              <motion.span
                key={i}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
              >
                {Math.random().toString(16).slice(2, 4).toUpperCase()}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
