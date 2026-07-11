import { motion } from 'framer-motion';

interface LetterCascadeProps {
  text: string;
  staggerFrom?: 'first' | 'last' | 'center';
  className?: string;
  staggerDelay?: number;
  hoverBounce?: boolean;
  style?: React.CSSProperties;
}

export default function LetterCascade({
  text,
  staggerFrom = 'center',
  className = '',
  staggerDelay = 0.04,
  hoverBounce = true,
  style = {}
}: LetterCascadeProps) {
  const chars = text.split('');
  const centerIndex = Math.floor(chars.length / 2);

  const getDelay = (index: number) => {
    if (staggerFrom === 'first') {
      return index * staggerDelay;
    }
    if (staggerFrom === 'last') {
      return (chars.length - 1 - index) * staggerDelay;
    }
    // center
    return Math.abs(index - centerIndex) * staggerDelay;
  };

  return (
    <span className={`inline-flex flex-wrap ${className}`} style={style}>
      {chars.map((char, index) => {
        if (char === ' ') {
          return <span key={index}>&nbsp;</span>;
        }

        return (
          <motion.span
            key={index}
            initial={{ opacity: 0, y: -25 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={hoverBounce ? {
              y: -10,
              scale: 1.1,
              transition: { type: 'spring', stiffness: 400, damping: 8 }
            } : undefined}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 14,
              delay: getDelay(index)
            }}
            className="inline-block cursor-default select-none"
            style={{ display: 'inline-block' }}
          >
            {char}
          </motion.span>
        );
      })}
    </span>
  );
}
