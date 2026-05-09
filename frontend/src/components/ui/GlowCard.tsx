import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: 'cyan' | 'violet' | 'green' | 'red' | 'amber';
  hover?: boolean;
  animate?: boolean;
  onClick?: () => void;
}

const glowMap = {
  cyan:   'border-cyber-cyan/20 hover:border-cyber-cyan/40 hover:shadow-neon-cyan',
  violet: 'border-cyber-violet/20 hover:border-cyber-violet/40 hover:shadow-neon-violet',
  green:  'border-cyber-green/20 hover:border-cyber-green/40 hover:shadow-neon-green',
  red:    'border-cyber-red/20 hover:border-cyber-red/40 hover:shadow-neon-red',
  amber:  'border-cyber-amber/20 hover:border-cyber-amber/40 hover:shadow-neon-amber',
};

export default function GlowCard({
  children,
  className,
  glowColor = 'cyan',
  hover = true,
  animate = false,
  onClick,
}: GlowCardProps) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={hover ? { scale: 1.01, y: -2 } : {}}
      animate={animate ? { boxShadow: ['0 0 10px rgba(0,245,255,0.1)', '0 0 30px rgba(0,245,255,0.25)', '0 0 10px rgba(0,245,255,0.1)'] } : {}}
      transition={animate ? { duration: 2, repeat: Infinity } : { duration: 0.2 }}
      className={clsx(
        'glass rounded-xl border transition-all duration-300',
        glowMap[glowColor],
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
