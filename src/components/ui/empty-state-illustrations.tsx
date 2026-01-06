/**
 * Empty State Illustrations - SVG illustrations for empty states
 * 
 * Custom illustrated empty states for different contexts
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface IllustrationProps {
  className?: string;
  animated?: boolean;
}

// Generic empty box illustration
export function EmptyBoxIllustration({ className, animated = true }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-48 h-40', className)}
    >
      <motion.g
        initial={animated ? { y: 10, opacity: 0 } : undefined}
        animate={animated ? { y: 0, opacity: 1 } : undefined}
        transition={{ duration: 0.5 }}
      >
        {/* Shadow */}
        <ellipse
          cx="100"
          cy="145"
          rx="50"
          ry="10"
          className="fill-muted/30"
        />
        
        {/* Box back */}
        <path
          d="M40 60L100 30L160 60L160 110L100 140L40 110Z"
          className="fill-muted stroke-border"
          strokeWidth="2"
        />
        
        {/* Box front left */}
        <path
          d="M40 60L100 90L100 140L40 110Z"
          className="fill-background stroke-border"
          strokeWidth="2"
        />
        
        {/* Box front right */}
        <path
          d="M160 60L100 90L100 140L160 110Z"
          className="fill-card stroke-border"
          strokeWidth="2"
        />
        
        {/* Box top */}
        <path
          d="M40 60L100 90L160 60L100 30Z"
          className="fill-muted/50 stroke-border"
          strokeWidth="2"
        />
        
        {/* Lid left */}
        <motion.path
          d="M40 60L100 30L100 20L40 50Z"
          className="fill-primary/20 stroke-primary"
          strokeWidth="2"
          initial={animated ? { rotate: 0, originX: '40px', originY: '60px' } : undefined}
          animate={animated ? { rotate: -15 } : undefined}
          transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        />
        
        {/* Lid right */}
        <motion.path
          d="M160 60L100 30L100 20L160 50Z"
          className="fill-primary/20 stroke-primary"
          strokeWidth="2"
          initial={animated ? { rotate: 0, originX: '160px', originY: '60px' } : undefined}
          animate={animated ? { rotate: 15 } : undefined}
          transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        />
      </motion.g>
    </svg>
  );
}

// No data / charts illustration
export function NoDataIllustration({ className, animated = true }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-48 h-40', className)}
    >
      <motion.g
        initial={animated ? { opacity: 0 } : undefined}
        animate={animated ? { opacity: 1 } : undefined}
        transition={{ duration: 0.5 }}
      >
        {/* Background circle */}
        <circle cx="100" cy="80" r="60" className="fill-muted/30" />
        
        {/* Chart bars */}
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.rect
            key={i}
            x={50 + i * 25}
            y={100}
            width="15"
            height="0"
            rx="2"
            className="fill-muted"
            initial={animated ? { height: 0 } : undefined}
            animate={animated ? { 
              height: [0, 20 + i * 10, 15 + i * 8],
              y: [100, 80 - i * 10, 85 - i * 8]
            } : undefined}
            transition={{ 
              duration: 1.5, 
              delay: i * 0.1,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut'
            }}
          />
        ))}
        
        {/* Dashed line */}
        <path
          d="M40 70 L160 70"
          className="stroke-border"
          strokeWidth="2"
          strokeDasharray="6 4"
        />
        
        {/* Question mark */}
        <motion.g
          initial={animated ? { scale: 0 } : undefined}
          animate={animated ? { scale: 1 } : undefined}
          transition={{ delay: 0.3, type: 'spring' }}
        >
          <circle cx="100" cy="50" r="20" className="fill-primary/10 stroke-primary" strokeWidth="2" />
          <text x="100" y="56" textAnchor="middle" className="fill-primary text-lg font-bold">?</text>
        </motion.g>
      </motion.g>
    </svg>
  );
}

// No results / search illustration
export function NoResultsIllustration({ className, animated = true }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-48 h-40', className)}
    >
      <motion.g
        initial={animated ? { opacity: 0, y: 10 } : undefined}
        animate={animated ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.5 }}
      >
        {/* Magnifying glass */}
        <motion.g
          animate={animated ? { x: [0, 5, 0], y: [0, -3, 0] } : undefined}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <circle cx="90" cy="70" r="35" className="fill-muted/30 stroke-border" strokeWidth="3" />
          <circle cx="90" cy="70" r="25" className="fill-background stroke-muted" strokeWidth="2" />
          <line x1="115" y1="95" x2="145" y2="125" className="stroke-border" strokeWidth="6" strokeLinecap="round" />
          <line x1="117" y1="97" x2="143" y2="123" className="stroke-muted" strokeWidth="3" strokeLinecap="round" />
        </motion.g>
        
        {/* X marks */}
        <motion.g
          initial={animated ? { opacity: 0, scale: 0 } : undefined}
          animate={animated ? { opacity: 1, scale: 1 } : undefined}
          transition={{ delay: 0.5 }}
        >
          <g transform="translate(75, 55)">
            <line x1="0" y1="0" x2="30" y2="30" className="stroke-destructive/50" strokeWidth="3" strokeLinecap="round" />
            <line x1="30" y1="0" x2="0" y2="30" className="stroke-destructive/50" strokeWidth="3" strokeLinecap="round" />
          </g>
        </motion.g>
      </motion.g>
    </svg>
  );
}

// Success / completed illustration
export function SuccessIllustration({ className, animated = true }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-48 h-40', className)}
    >
      <motion.g
        initial={animated ? { opacity: 0 } : undefined}
        animate={animated ? { opacity: 1 } : undefined}
        transition={{ duration: 0.5 }}
      >
        {/* Background circle */}
        <motion.circle
          cx="100"
          cy="80"
          r="50"
          className="fill-green-500/10 stroke-green-500"
          strokeWidth="3"
          initial={animated ? { scale: 0 } : undefined}
          animate={animated ? { scale: 1 } : undefined}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        />
        
        {/* Checkmark */}
        <motion.path
          d="M70 80 L90 100 L130 60"
          className="stroke-green-500"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={animated ? { pathLength: 0 } : undefined}
          animate={animated ? { pathLength: 1 } : undefined}
          transition={{ delay: 0.3, duration: 0.5, ease: 'easeOut' }}
        />
        
        {/* Sparkles */}
        {[
          { x: 40, y: 40, delay: 0.5 },
          { x: 160, y: 50, delay: 0.6 },
          { x: 150, y: 120, delay: 0.7 },
          { x: 50, y: 115, delay: 0.8 },
        ].map((spark, i) => (
          <motion.circle
            key={i}
            cx={spark.x}
            cy={spark.y}
            r="4"
            className="fill-yellow-400"
            initial={animated ? { scale: 0, opacity: 0 } : undefined}
            animate={animated ? { scale: [0, 1.2, 1], opacity: [0, 1, 0.6] } : undefined}
            transition={{ delay: spark.delay, duration: 0.4 }}
          />
        ))}
      </motion.g>
    </svg>
  );
}

// Money / finance illustration
export function FinanceIllustration({ className, animated = true }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-48 h-40', className)}
    >
      <motion.g
        initial={animated ? { opacity: 0, y: 10 } : undefined}
        animate={animated ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.5 }}
      >
        {/* Coins stack */}
        {[0, 1, 2].map((i) => (
          <motion.g
            key={i}
            initial={animated ? { y: 20, opacity: 0 } : undefined}
            animate={animated ? { y: 0, opacity: 1 } : undefined}
            transition={{ delay: i * 0.15 }}
          >
            <ellipse
              cx={70 + i * 30}
              cy={100 - i * 15}
              rx="25"
              ry="8"
              className="fill-yellow-400/80 stroke-yellow-500"
              strokeWidth="2"
            />
            <ellipse
              cx={70 + i * 30}
              cy={95 - i * 15}
              rx="25"
              ry="8"
              className="fill-yellow-300 stroke-yellow-500"
              strokeWidth="2"
            />
          </motion.g>
        ))}
        
        {/* Dollar sign */}
        <motion.g
          initial={animated ? { scale: 0 } : undefined}
          animate={animated ? { scale: 1 } : undefined}
          transition={{ delay: 0.5, type: 'spring' }}
        >
          <circle cx="140" cy="50" r="25" className="fill-green-500/20 stroke-green-500" strokeWidth="2" />
          <text x="140" y="58" textAnchor="middle" className="fill-green-600 text-2xl font-bold">$</text>
        </motion.g>
        
        {/* Arrow up */}
        <motion.path
          d="M160 90 L160 60 M150 70 L160 60 L170 70"
          className="stroke-green-500"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={animated ? { opacity: 0, y: 10 } : undefined}
          animate={animated ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: 0.7 }}
        />
      </motion.g>
    </svg>
  );
}
