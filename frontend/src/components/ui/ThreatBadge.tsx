import { clsx } from 'clsx';
import type { ThreatLevel } from '../../types';
import { ShieldCheck, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';

interface ThreatBadgeProps {
  level: ThreatLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const config: Record<ThreatLevel, { label: string; classes: string; icon: React.FC<any> }> = {
  safe:      { label: 'SAFE',      classes: 'bg-cyber-green/10 border-cyber-green/40 text-cyber-green',  icon: ShieldCheck },
  suspicious:{ label: 'SUSPICIOUS',classes: 'bg-cyber-amber/10 border-cyber-amber/40 text-cyber-amber',  icon: AlertTriangle },
  dangerous: { label: 'DANGEROUS', classes: 'bg-cyber-red/10 border-cyber-red/40 text-cyber-red',        icon: XCircle },
  unknown:   { label: 'UNKNOWN',   classes: 'bg-white/5 border-white/20 text-cyber-muted',               icon: HelpCircle },
};

const sizeMap = {
  sm: 'px-2 py-0.5 text-[10px] gap-1',
  md: 'px-3 py-1 text-xs gap-1.5',
  lg: 'px-4 py-1.5 text-sm gap-2',
};

const iconSize = { sm: 10, md: 12, lg: 14 };

export default function ThreatBadge({ level, size = 'md', showIcon = true }: ThreatBadgeProps) {
  const safeLevel = (level && config[level]) ? level : 'unknown';
  const { label, classes, icon: Icon } = config[safeLevel];
  return (
    <span className={clsx(
      'inline-flex items-center font-mono font-semibold rounded-md border tracking-widest',
      classes,
      sizeMap[size]
    )}>
      {showIcon && <Icon size={iconSize[size]} />}
      {label}
    </span>
  );
}
