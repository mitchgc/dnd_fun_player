import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CompactDiceAnimationProps {
  diceType?: 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';
  isRolling: boolean;
  rollResult?: number;
  onAnimationComplete?: (result: number) => void;
  modalSize?: { width: number; height: number };
  isHidden?: boolean;
  reducedMotion?: boolean;
  className?: string;
}

interface DiceVariant {
  shape: React.FC<{ size: number; color: string }> | string;
  sides: number;
  color: string;
  shadowColor: string;
  isExternal?: boolean;
}

// External SVG component for loading files from public folder
const ExternalSVG: React.FC<{ src: string; size: number; color: string }> = ({ src, size, color }) => (
  <div 
    className="dice-svg-container"
    style={{
      width: size,
      height: size,
      backgroundImage: `url(${src})`,
      backgroundSize: 'contain',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      filter: `drop-shadow(2px 2px 4px rgba(0,0,0,0.3))`
    }}
  />
);

// Geometric shape components for each die type
const D4Shape: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className="drop-shadow-md">
    <polygon 
      points="50,10 20,80 80,80" 
      fill={`url(#gradient-${color})`}
      stroke="#374151" 
      strokeWidth="2"
    />
    <defs>
      <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
    </defs>
  </svg>
);

const D6Shape: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className="drop-shadow-md">
    <rect 
      x="20" y="20" width="60" height="60" 
      fill={`url(#gradient-${color})`}
      stroke="#374151" 
      strokeWidth="2" 
      rx="8"
    />
    <defs>
      <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
    </defs>
  </svg>
);

const D8Shape: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className="drop-shadow-md">
    <polygon 
      points="50,15 25,35 25,65 50,85 75,65 75,35" 
      fill={`url(#gradient-${color})`}
      stroke="#374151" 
      strokeWidth="2"
    />
    <defs>
      <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
    </defs>
  </svg>
);

const D10Shape: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className="drop-shadow-md">
    <polygon 
      points="50,10 70,30 70,70 50,90 30,70 30,30" 
      fill={`url(#gradient-${color})`}
      stroke="#374151" 
      strokeWidth="2"
    />
    <defs>
      <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8b5cf6" />
        <stop offset="100%" stopColor="#5b21b6" />
      </linearGradient>
    </defs>
  </svg>
);

const D12Shape: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className="drop-shadow-md">
    <polygon 
      points="50,10 75,25 80,50 65,75 35,75 20,50 25,25" 
      fill={`url(#gradient-${color})`}
      stroke="#374151" 
      strokeWidth="2"
    />
    <defs>
      <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#be185d" />
      </linearGradient>
    </defs>
  </svg>
);

const D20Shape: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className="drop-shadow-md">
    <polygon 
      points="50,5 75,20 85,45 75,70 50,85 25,70 15,45 25,20" 
      fill={`url(#gradient-${color})`}
      stroke="#374151" 
      strokeWidth="2"
    />
    <polygon 
      points="50,5 50,25 35,35 25,20" 
      fill="rgba(255,255,255,0.2)"
    />
    <polygon 
      points="50,5 50,25 65,35 75,20" 
      fill="rgba(255,255,255,0.1)"
    />
    <defs>
      <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
    </defs>
  </svg>
);

const D100Shape: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className="drop-shadow-md">
    <polygon 
      points="50,10 70,30 70,70 50,90 30,70 30,30" 
      fill={`url(#gradient-${color})`}
      stroke="#374151" 
      strokeWidth="2"
    />
    <text 
      x="50" y="55" 
      textAnchor="middle" 
      fontSize="16" 
      fill="white" 
      fontWeight="bold"
    >
      %
    </text>
    <defs>
      <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#b91c1c" />
      </linearGradient>
    </defs>
  </svg>
);

const DICE_VARIANTS: Record<string, DiceVariant> = {
  'd4': { shape: D4Shape, sides: 4, color: 'amber', shadowColor: 'shadow-orange-500/30' },
  'd6': { shape: D6Shape, sides: 6, color: 'blue', shadowColor: 'shadow-blue-500/30' },
  'd8': { shape: D8Shape, sides: 8, color: 'emerald', shadowColor: 'shadow-green-500/30' },
  'd10': { shape: D10Shape, sides: 10, color: 'purple', shadowColor: 'shadow-purple-500/30' },
  'd12': { shape: D12Shape, sides: 12, color: 'pink', shadowColor: 'shadow-pink-500/30' },
  'd20': { shape: '/dice-twenty-faces-twenty.svg', sides: 20, color: 'yellow', shadowColor: 'shadow-yellow-500/30', isExternal: true },
  'd100': { shape: D100Shape, sides: 100, color: 'red', shadowColor: 'shadow-red-500/30' }
};

const CompactDiceAnimation: React.FC<CompactDiceAnimationProps> = ({
  diceType = 'd20',
  isRolling,
  rollResult,
  onAnimationComplete,
  modalSize = { width: 320, height: 200 },
  isHidden = false,
  reducedMotion = false,
  className = ''
}) => {
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'rolling' | 'settling' | 'result'>('idle');
  const [displayResult, setDisplayResult] = useState<number | null>(null);
  
  const diceVariant = DICE_VARIANTS[diceType];
  const maxSize = Math.min(modalSize.width * 0.25, 80); // Responsive but compact sizing

  // Framer Motion variants for different animation phases
  const diceVariants = {
    idle: {
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      scale: 1,
      y: 0,
      transition: { duration: 0.39, ease: "easeOut" as const }  // 0.3 * 1.3
    },
    anticipation: {
      scale: [1, 1.05, 0.95],
      rotateZ: [0, -2, 2, 0],
      transition: { duration: 0.39, ease: "easeInOut" as const }  // 0.3 * 1.3
    },
    rolling: {
      rotateX: reducedMotion ? [0, 90] : [0, 360, 720, 360],
      rotateY: reducedMotion ? [0, 90] : [0, 180, 360, 180],
      rotateZ: reducedMotion ? [0, 90] : [0, 90, 180, 90],
      y: reducedMotion ? [0, -5, 0] : [0, -20, -10, -5, 0],
      scale: [1, 1.1, 0.95, 1.05, 1],
      transition: { 
        duration: reducedMotion ? 1.04 : 1.95,  // 0.8 * 1.3 and 1.5 * 1.3
        ease: "easeInOut" as const,
        times: reducedMotion ? [0, 1] : [0, 0.25, 0.5, 0.75, 1]
      }
    },
    settling: {
      scale: [1, 0.9, 1.02, 1],
      y: [0, 2, -1, 0],
      rotateZ: [0, 1, -0.5, 0],
      transition: { duration: 0.52, ease: "easeOut" as const }  // 0.4 * 1.3
    },
    result: {
      scale: rollResult === 20 ? 1.1 : rollResult === 1 ? 0.9 : 1,
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      y: 0,
      transition: { duration: 0.39, ease: "easeOut" as const }  // 0.3 * 1.3
    }
  };

  // Handle animation phases
  useEffect(() => {
    if (!isRolling && animationPhase !== 'idle') {
      setAnimationPhase('idle');
      setDisplayResult(null);
      return;
    }

    if (isRolling && animationPhase === 'idle') {
      // Start animation sequence
      setAnimationPhase('rolling');
      
      // Simulate roll timing (slowed by 30%)
      const rollDuration = reducedMotion ? 1040 : 1950;  // 800 * 1.3 and 1500 * 1.3
      const settlingDelay = rollDuration + 130;  // 100 * 1.3
      const resultDelay = settlingDelay + 520;  // 400 * 1.3

      setTimeout(() => setAnimationPhase('settling'), rollDuration);
      setTimeout(() => {
        setAnimationPhase('result');
        if (rollResult) {
          setDisplayResult(rollResult);
          onAnimationComplete?.(rollResult);
        }
      }, resultDelay);
    }
  }, [isRolling, animationPhase, rollResult, onAnimationComplete, reducedMotion]);

  // Critical hit effects
  const getCriticalEffects = useCallback(() => {
    if (!displayResult) return {};
    
    if (displayResult === 20) {
      return {
        filter: 'drop-shadow(0 0 12px #fbbf24) brightness(1.2)'
      };
    }
    
    if (displayResult === 1) {
      return {
        filter: 'drop-shadow(0 0 8px #ef4444) brightness(0.8)'
      };
    }
    
    return {};
  }, [displayResult]);

  // Hardware-accelerated container styles
  const containerStyle = {
    width: maxSize,
    height: maxSize,
    willChange: 'transform',
    transform: 'translateZ(0)', // Force hardware acceleration
    backfaceVisibility: 'hidden' as const,
    // perspective: '1000px'
  };

  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      style={containerStyle}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`dice-${animationPhase}`}
          className="relative flex items-center justify-center"
          style={{
            width: '100%',
            height: '100%',
            ...getCriticalEffects()
          }}
          variants={diceVariants}
          initial="idle"
          animate={animationPhase === 'idle' ? 'idle' : animationPhase}
          exit="idle"
        >
          {/* Dice face or result */}
          <motion.div
            className="select-none flex items-center justify-center"
            initial={{ opacity: 1 }}
            animate={{ 
              opacity: animationPhase === 'rolling' ? [1, 0.7, 1] : 1,
              rotate: animationPhase === 'rolling' && !reducedMotion ? [0, 180, 360] : 0
            }}
            transition={{ duration: 0.39 }}  // 0.3 * 1.3
          >
            {displayResult ? (
              <span className="font-bold text-white drop-shadow-lg text-2xl">
                {displayResult}
              </span>
            ) : (
              diceVariant.isExternal ? (
                <ExternalSVG 
                  src={diceVariant.shape as string}
                  size={Math.floor(maxSize * 0.6)} 
                  color={diceVariant.color} 
                />
              ) : (
                React.createElement(diceVariant.shape as React.FC<{ size: number; color: string }>, {
                  size: Math.floor(maxSize * 0.6),
                  color: diceVariant.color
                })
              )
            )}
          </motion.div>

          {/* Sparkle effects for critical hits */}
          {displayResult === 20 && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 1] }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="absolute top-1 right-1 text-xs">✨</div>
              <div className="absolute bottom-1 left-1 text-xs">⭐</div>
              <div className="absolute top-1 left-1 text-xs">💫</div>
            </motion.div>
          )}

          {/* Failure indicator for critical miss */}
          {displayResult === 1 && (
            <motion.div
              className="absolute inset-0 pointer-events-none flex items-center justify-center"
              initial={{ opacity: 0, scale: 1.2 }}
              animate={{ opacity: [0, 0.7, 0], scale: [1.2, 1, 1] }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              <div className="text-red-400 text-xs font-bold">💥</div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Rolling indicator dots */}
      {animationPhase === 'rolling' && (
        <motion.div
          className="absolute -bottom-8 flex space-x-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${
                isHidden ? 'bg-purple-400' : 'bg-blue-400'
              }`}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default CompactDiceAnimation;