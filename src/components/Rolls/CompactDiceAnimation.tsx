import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpring, animated, config } from '@react-spring/web';

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
  emoji: string;
  sides: number;
  color: string;
  shadowColor: string;
}

const DICE_VARIANTS: Record<string, DiceVariant> = {
  'd4': { emoji: '🔺', sides: 4, color: 'from-amber-400 to-orange-500', shadowColor: 'shadow-orange-500/30' },
  'd6': { emoji: '⚃', sides: 6, color: 'from-blue-400 to-indigo-500', shadowColor: 'shadow-blue-500/30' },
  'd8': { emoji: '🔶', sides: 8, color: 'from-emerald-400 to-green-500', shadowColor: 'shadow-green-500/30' },
  'd10': { emoji: '🔟', sides: 10, color: 'from-purple-400 to-violet-500', shadowColor: 'shadow-purple-500/30' },
  'd12': { emoji: '⬟', sides: 12, color: 'from-pink-400 to-rose-500', shadowColor: 'shadow-pink-500/30' },
  'd20': { emoji: '🎲', sides: 20, color: 'from-yellow-400 to-amber-500', shadowColor: 'shadow-yellow-500/30' },
  'd100': { emoji: '💯', sides: 100, color: 'from-red-400 to-pink-500', shadowColor: 'shadow-red-500/30' }
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

  // React Spring for physics-based rolling animation
  const [{ rotation, scale, y }, springApi] = useSpring(() => ({
    rotation: 0,
    scale: 1,
    y: 0,
    config: reducedMotion ? config.slow : config.wobbly
  }));

  // Framer Motion variants for different animation phases
  const diceVariants = {
    idle: {
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      scale: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" as const }
    },
    anticipation: {
      scale: [1, 1.05, 0.95],
      rotateZ: [0, -2, 2, 0],
      transition: { duration: 0.3, ease: "easeInOut" as const }
    },
    rolling: {
      rotateX: reducedMotion ? [0, 90] : [0, 360, 720, 360],
      rotateY: reducedMotion ? [0, 90] : [0, 180, 360, 180],
      rotateZ: reducedMotion ? [0, 90] : [0, 90, 180, 90],
      y: reducedMotion ? [0, -5, 0] : [0, -20, -10, -5, 0],
      scale: [1, 1.1, 0.95, 1.05, 1],
      transition: { 
        duration: reducedMotion ? 0.8 : 1.5,
        ease: "easeInOut" as const,
        times: reducedMotion ? [0, 1] : [0, 0.25, 0.5, 0.75, 1]
      }
    },
    settling: {
      scale: [1, 0.9, 1.02, 1],
      y: [0, 2, -1, 0],
      rotateZ: [0, 1, -0.5, 0],
      transition: { duration: 0.4, ease: "easeOut" as const }
    },
    result: {
      scale: rollResult === 20 ? 1.1 : rollResult === 1 ? 0.9 : 1,
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" as const }
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
      
      // Simulate roll timing
      const rollDuration = reducedMotion ? 800 : 1500;
      const settlingDelay = rollDuration + 100;
      const resultDelay = settlingDelay + 400;

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
        filter: 'drop-shadow(0 0 12px #fbbf24) brightness(1.2)',
        backgroundColor: 'rgba(251, 191, 36, 0.1)'
      };
    }
    
    if (displayResult === 1) {
      return {
        filter: 'drop-shadow(0 0 8px #ef4444) brightness(0.8)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)'
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
    perspective: '1000px'
  };

  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      style={containerStyle}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`dice-${animationPhase}`}
          className={`
            relative rounded-xl border-2 flex items-center justify-center
            ${isHidden ? 'border-purple-500 bg-gradient-to-br from-purple-900/50 to-indigo-900/50' : 'border-gray-500 bg-gradient-to-br from-gray-800/50 to-gray-900/50'}
            ${animationPhase === 'result' ? `bg-gradient-to-br ${diceVariant.color} ${diceVariant.shadowColor}` : ''}
            backdrop-blur-sm
          `}
          style={{
            width: '100%',
            height: '100%',
            fontSize: `${maxSize * 0.4}px`,
            ...getCriticalEffects()
          }}
          variants={diceVariants}
          initial="idle"
          animate={animationPhase === 'idle' ? 'idle' : animationPhase}
          exit="idle"
        >
          {/* Dice face or result */}
          <motion.div
            className="select-none"
            initial={{ opacity: 1 }}
            animate={{ 
              opacity: animationPhase === 'rolling' ? [1, 0.7, 1] : 1,
              rotate: animationPhase === 'rolling' && !reducedMotion ? [0, 180, 360] : 0
            }}
            transition={{ duration: 0.3 }}
          >
            {displayResult ? (
              <span className="font-bold text-white drop-shadow-lg">
                {displayResult}
              </span>
            ) : (
              <span className="drop-shadow-lg">
                {diceVariant.emoji}
              </span>
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