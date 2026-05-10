import React from 'react';
import { motion } from 'framer-motion';

const Logo: React.FC<{ className?: string; size?: number }> = ({ className = "", size = 32 }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative group" style={{ width: size, height: size }}>
        {/* Glow Background */}
        <div className="absolute inset-0 bg-cyber-violet/40 blur-lg rounded-full group-hover:bg-cyber-violet/60 transition-all duration-500" />
        
        {/* SVG Icon */}
        <svg 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 w-full h-full drop-shadow-2xl"
        >
          {/* Outer Shield Hexagon */}
          <path 
            d="M50 5L85 25V75L50 95L15 75V25L50 5Z" 
            className="stroke-cyber-violet fill-black/40"
            strokeWidth="4" 
            strokeLinejoin="round" 
          />
          
          {/* Inner Circuit Pattern */}
          <path 
            d="M50 25V40M35 50H25M75 50H65M50 60V75" 
            className="stroke-cyber-violet"
            strokeWidth="3" 
            strokeLinecap="round" 
            opacity="0.6"
          />
          
          {/* Central Core */}
          <circle cx="50" cy="50" r="8" className="fill-cyber-violet animate-pulse" />
          
          {/* Orbiting Elements */}
          <circle cx="50" cy="50" r="35" className="stroke-cyber-cyan/30" strokeWidth="1" strokeDasharray="5 5" />
          <motion.circle 
            cx="85" cy="25" r="4" 
            className="fill-cyber-cyan"
            animate={{ 
              cx: [85, 15, 15, 85, 85],
              cy: [25, 25, 75, 75, 25] 
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />
        </svg>
      </div>
      
      <div className="flex flex-col leading-none">
        <span className="font-orbitron font-black text-cyber-text tracking-[0.15em] text-lg uppercase">
          Cyber<span className="text-cyber-violet">Sphere</span>
        </span>
        <span className="text-[9px] font-mono text-cyber-muted tracking-[0.3em] uppercase opacity-50">
          Neural Security Platform
        </span>
      </div>
    </div>
  );
};

export default Logo;
