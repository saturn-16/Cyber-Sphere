import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface RiskMeterProps {
  score: number;   // 0–100
  size?: number;   // diameter in px
  animate?: boolean;
}

function getScoreColor(score: number): string {
  if (score <= 25) return '#39ff14';
  if (score <= 60) return '#ff9500';
  return '#ff0040';
}

function getLabel(score: number): string {
  if (score <= 25) return 'SAFE';
  if (score <= 60) return 'SUSPICIOUS';
  return 'DANGEROUS';
}

export default function RiskMeter({ score, size = 160, animate = true }: RiskMeterProps) {
  const [displayed, setDisplayed] = useState(0);
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = getScoreColor(score);
  const label = getLabel(score);

  // Animate counter
  useEffect(() => {
    if (!animate) { setDisplayed(score); return; }
    let start = 0;
    const step = score / 40;
    const interval = setInterval(() => {
      start += step;
      if (start >= score) { setDisplayed(score); clearInterval(interval); }
      else setDisplayed(Math.floor(start));
    }, 30);
    return () => clearInterval(interval);
  }, [score, animate]);

  const progress = (displayed / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background track */}
        <svg width={size} height={size} className="rotate-[-90deg]">
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={10}
          />
          {/* Animated progress arc */}
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color} strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="font-orbitron text-3xl font-bold"
            style={{ color, textShadow: `0 0 20px ${color}` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {displayed}
          </motion.span>
          <span className="text-cyber-muted text-[10px] font-mono tracking-widest">/100</span>
        </div>
      </div>
      <motion.span
        className="font-mono text-xs font-semibold tracking-widest px-3 py-1 rounded-md border"
        style={{ color, borderColor: `${color}40`, background: `${color}10` }}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        {label}
      </motion.span>
    </div>
  );
}
