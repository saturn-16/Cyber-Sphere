import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'cyan' | 'violet' | 'green' | 'red' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
}

const variantMap = {
  cyan:    'bg-cyber-cyan/10 border-cyber-cyan/50 text-cyber-cyan hover:bg-cyber-cyan hover:text-cyber-bg hover:shadow-neon-cyan',
  violet:  'bg-cyber-violet/10 border-cyber-violet/50 text-cyber-violet hover:bg-cyber-violet hover:text-white hover:shadow-neon-violet',
  green:   'bg-cyber-green/10 border-cyber-green/50 text-cyber-green hover:bg-cyber-green hover:text-cyber-bg hover:shadow-neon-green',
  red:     'bg-cyber-red/10 border-cyber-red/50 text-cyber-red hover:bg-cyber-red hover:text-white hover:shadow-neon-red',
  ghost:   'bg-transparent border-transparent text-cyber-muted hover:text-cyber-text hover:bg-white/5',
  outline: 'bg-transparent border-cyber-border text-cyber-text hover:border-cyber-cyan/50 hover:text-cyber-cyan',
};

const sizeMap = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

export default function NeonButton({
  children,
  variant = 'cyan',
  size = 'md',
  loading = false,
  icon,
  className,
  disabled,
  ...props
}: NeonButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      {...(props as any)}
      disabled={disabled || loading}
      className={clsx(
        'relative inline-flex items-center gap-2 rounded-lg border font-medium',
        'font-inter tracking-wide transition-all duration-200',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variantMap[variant],
        sizeMap[size],
        className
      )}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Processing…
        </span>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </motion.button>
  );
}
