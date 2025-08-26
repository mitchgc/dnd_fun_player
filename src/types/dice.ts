// Dice Animation TypeScript Definitions

export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

export type AnimationPhase = 'idle' | 'anticipation' | 'rolling' | 'settling' | 'result';

export interface DiceVariant {
  emoji: string;
  sides: number;
  color: string;
  shadowColor: string;
  gradient: string;
}

export interface DiceAnimationConfig {
  /** Duration of the rolling phase in milliseconds */
  rollingDuration: number;
  /** Duration of the settling phase in milliseconds */
  settlingDuration: number;
  /** Duration of the result reveal in milliseconds */
  resultDuration: number;
  /** Whether to use reduced motion animations */
  reducedMotion: boolean;
  /** Physics-based spring configuration */
  springConfig: {
    tension: number;
    friction: number;
    mass: number;
  };
}

export interface CompactDiceAnimationProps {
  /** Type of dice to animate */
  diceType?: DiceType;
  /** Whether the dice is currently rolling */
  isRolling: boolean;
  /** Final result of the dice roll */
  rollResult?: number;
  /** Callback when animation completes */
  onAnimationComplete?: (result: number) => void;
  /** Size constraints from parent modal */
  modalSize?: {
    width: number;
    height: number;
  };
  /** Whether character is hidden (affects styling) */
  isHidden?: boolean;
  /** Respect reduced motion preferences */
  reducedMotion?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Animation timing overrides */
  animationConfig?: Partial<DiceAnimationConfig>;
}

export interface DiceAnimationState {
  /** Current phase of the animation */
  phase: AnimationPhase;
  /** Current dice result being displayed */
  displayResult: number | null;
  /** Animation start timestamp */
  startTime: number | null;
  /** Whether critical hit effects are active */
  isCriticalHit: boolean;
  /** Whether critical miss effects are active */
  isCriticalMiss: boolean;
}

export interface DicePhysicsProps {
  /** Rotation values for each axis */
  rotation: {
    x: number;
    y: number;
    z: number;
  };
  /** Scale factor for size changes */
  scale: number;
  /** Vertical position offset */
  y: number;
  /** Opacity for fade effects */
  opacity: number;
}

export interface CriticalEffectConfig {
  /** Whether to show sparkle effects for natural 20 */
  showSparkles: boolean;
  /** Whether to show explosion effect for natural 1 */
  showExplosion: boolean;
  /** Color scheme for critical hit effects */
  criticalHitColor: string;
  /** Color scheme for critical miss effects */
  criticalMissColor: string;
  /** Duration of critical effects in milliseconds */
  effectDuration: number;
}

export interface PerformanceMetrics {
  /** Average frame rate during animation */
  averageFPS: number;
  /** Peak memory usage during animation */
  peakMemoryUsage: number;
  /** Total animation duration */
  totalDuration: number;
  /** Number of dropped frames */
  droppedFrames: number;
}

export interface AccessibilityConfig {
  /** Respect prefers-reduced-motion setting */
  respectReducedMotion: boolean;
  /** Provide screen reader announcements */
  announceResults: boolean;
  /** Focus management during animation */
  manageFocus: boolean;
  /** Alternative text for dice states */
  altText: {
    rolling: string;
    result: (result: number, diceType: DiceType) => string;
    criticalHit: string;
    criticalMiss: string;
  };
}

export interface DiceThemeConfig {
  /** Color scheme variants for different dice types */
  variants: Record<DiceType, DiceVariant>;
  /** Animation timing preferences */
  timing: DiceAnimationConfig;
  /** Critical effect configuration */
  criticalEffects: CriticalEffectConfig;
  /** Accessibility settings */
  accessibility: AccessibilityConfig;
}

// Utility types for component props
export type DiceAnimationEventHandler<T = void> = (result: number) => T;

export type DiceAnimationCallback = DiceAnimationEventHandler<void>;

export type DiceAnimationPromise = DiceAnimationEventHandler<Promise<void>>;

// Default configurations
export const DEFAULT_DICE_CONFIG: DiceAnimationConfig = {
  rollingDuration: 1500,
  settlingDuration: 400,
  resultDuration: 300,
  reducedMotion: false,
  springConfig: {
    tension: 300,
    friction: 30,
    mass: 1
  }
};

export const REDUCED_MOTION_CONFIG: DiceAnimationConfig = {
  rollingDuration: 800,
  settlingDuration: 200,
  resultDuration: 150,
  reducedMotion: true,
  springConfig: {
    tension: 400,
    friction: 40,
    mass: 0.8
  }
};

// Framer Motion variant types
export interface MotionVariants {
  idle: Record<string, any>;
  anticipation: Record<string, any>;
  rolling: Record<string, any>;
  settling: Record<string, any>;
  result: Record<string, any>;
}

// React Spring animation values
export interface SpringValues {
  rotation: number;
  scale: number;
  y: number;
  opacity: number;
}

export interface SpringAPI {
  start: (values: Partial<SpringValues>) => void;
  stop: () => void;
  set: (values: Partial<SpringValues>) => void;
}