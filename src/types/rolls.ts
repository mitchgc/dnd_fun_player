/**
 * Unified Roll System Types
 * 
 * Core TypeScript interfaces for the unified D&D rolling system.
 * Supports advanced dice notation, configurable modifiers, and pre-roll analysis.
 */

export type RollType = 
  | 'attack' 
  | 'damage' 
  | 'skill' 
  | 'save' 
  | 'ability' 
  | 'initiative' 
  | 'concentration'
  | 'death_save'
  | 'spell_save'
  | 'spell_attack'
  | 'healing'
  | 'raw';

// =============================================================================
// DICE EXPRESSION SYSTEM
// =============================================================================

export interface DiceExpression {
  /** Raw expression string like "3d6+2kh1" for parsing */
  expression: string;
  /** Parsed components for execution */
  parsed: {
    count: number;
    sides: number;
    modifier?: number;
    operations: Operation[];
  };
}

/** Multi-expression support for comma-separated dice expressions */
export interface MultiDiceExpression {
  /** Original full expression string */
  fullExpression: string;
  /** Individual dice expressions */
  expressions: LabeledDiceExpression[];
}

/** Individual dice expression with optional label */
export interface LabeledDiceExpression {
  /** Optional label like "attack" or "damage" */
  label?: string;
  /** The dice expression */
  expression: DiceExpression;
}

export interface Operation {
  type: 'keep_highest' | 'keep_lowest' | 'drop_highest' | 'drop_lowest' 
       | 'reroll' | 'explode' | 'minimum' | 'maximum';
  value: number | number[]; // how many to keep/drop, or threshold for reroll/explode/minimum
}

// =============================================================================
// ROLL DEFINITION SYSTEM
// =============================================================================

export interface RollDefinition {
  id: string;
  type: RollType;
  name: string;
  baseExpression: MultiDiceExpression; // Always use unified format
  context: RollContext;
  modifiers: RollModifier[];
}

// =============================================================================
// MODIFIER SYSTEM
// =============================================================================

export interface RollModifier {
  id: string;
  name: string;
  description?: string;
  source: ModifierSource;
  type: ModifierType;
  value: number | DiceExpression;
  condition?: (context: RollContext) => boolean;
  application: ApplicationTiming;
  stacks: boolean;
  priority: number; // Lower numbers apply first
}

export enum ModifierSource {
  ABILITY_SCORE = 'ability_score',
  PROFICIENCY = 'proficiency',
  EXPERTISE = 'expertise',
  ITEM = 'item',
  SPELL = 'spell',
  CLASS_FEATURE = 'class_feature',
  FEAT = 'feat',
  CONDITION = 'condition',
  HOMEBREW = 'homebrew',
  TEMPORARY = 'temporary'
}

export enum ModifierType {
  FLAT_BONUS = 'flat',          // +2
  DICE_BONUS = 'dice',          // +1d4
  ADVANTAGE = 'advantage',       // Roll twice, keep highest
  DISADVANTAGE = 'disadvantage', // Roll twice, keep lowest
  REROLL = 'reroll',            // Reroll certain values
  MINIMUM = 'minimum',          // Treat rolls below X as X
  MAXIMUM = 'maximum',          // Treat rolls above X as X
  CRITICAL_RANGE = 'crit_range', // Crit on 19-20
  MULTIPLIER = 'multiplier',    // Double damage (vulnerability)
  DIVIDER = 'divider',          // Half damage (resistance)
  REPLACE_DIE = 'replace_die',  // Replace die with specific value (Portent)
  EXTRA_ATTACK = 'extra_attack' // Additional attack rolls
}

export enum ApplicationTiming {
  BEFORE_ROLL = 'before',      // Advantage, bless
  DURING_ROLL = 'during',      // Rerolls, minimum damage
  AFTER_ROLL = 'after',        // Lucky feat, cutting words
  ON_DAMAGE = 'on_damage',     // Resistance, vulnerability
  ON_CRITICAL = 'on_critical', // Brutal Critical extra dice
  ONCE_PER_TURN = 'once_turn', // Sneak attack
  ONCE_PER_REST = 'once_rest'  // Inspiration
}

// =============================================================================
// CRITICAL HIT SYSTEM
// =============================================================================

export interface CriticalRules {
  /** Critical hit range - [20] standard, [19,20] Champion */
  range: number[];
  /** How to calculate critical damage */
  damageStrategy: 'double_dice' | 'max_base_dice' | 'double_total';
  /** Which dice are affected by critical hits */
  affectedDice: 'weapon_only' | 'all_damage' | 'exclude_modifiers';
  /** Additional dice on critical (Brutal Critical) */
  additionalDice?: string;
  /** Critical failure range - [1] standard */
  failureRange?: number[];
}

// =============================================================================
// PRE-ROLL ANALYSIS SYSTEM
// =============================================================================

export interface PreRollInfo {
  /** Preview breakdown using same structure as executed rolls */
  breakdown: RollBreakdown[];
  /** Active conditions affecting the roll */
  conditions: ConditionPreview[];
  /** Estimated damage/result range */
  estimatedRange: { min: number; max: number; average: number };
  /** Critical hit range for this roll */
  criticalRange: number[];
  /** Critical failure range for this roll */
  criticalFailureRange: number[];
  /** Special notes about the roll */
  notes: string[];
  
  /** @deprecated Use breakdown instead */
  dice?: DicePreview[];
  /** @deprecated Use breakdown instead */
  modifiers?: ModifierPreview[];
}

export interface DicePreview {
  /** User-friendly label */
  label: string;
  /** Dice expression */
  expression: string;
  /** Source of these dice */
  source: string;
  /** Whether these dice are affected by critical hits */
  criticalAffected: boolean;
  /** Color/styling hint for UI */
  category: 'base' | 'bonus' | 'critical' | 'conditional';
}

export interface ModifierPreview {
  /** User-friendly label */
  label: string;
  /** Modifier value as string */
  value: string;
  /** Source of the modifier */
  source: string;
  /** When this modifier applies */
  timing: ApplicationTiming;
  /** Whether this is conditional */
  condition?: string;
  /** Color/styling hint for UI */
  category: 'ability' | 'proficiency' | 'item' | 'spell' | 'condition';
}

export interface ConditionPreview {
  /** User-friendly label */
  label: string;
  /** Detailed description */
  description: string;
  /** Whether this condition is currently active */
  active: boolean;
  /** Icon or emoji for UI */
  icon?: string;
  /** Condition type for styling */
  type: 'advantage' | 'disadvantage' | 'bonus' | 'penalty' | 'special';
}

// =============================================================================
// ROLL CONTEXT SYSTEM
// =============================================================================

export interface RollContext {
  character: {
    id: string;
    level: number;
    ability_scores: Record<string, number>;
    proficiencyBonus: number;
    [key: string]: any;
  };
  source: {
    type: 'weapon' | 'spell' | 'ability' | 'skill' | 'save' | 'custom';
    name: string;
    tags: string[]; // ['melee', 'finesse', 'spell_attack', 'fire', etc.]
    properties?: Record<string, any>;
  };
  target?: {
    ac?: number;
    saveBonus?: number;
    conditions?: string[]; // ['prone', 'stunned', etc.]
  };
  environment: {
    advantage: boolean;
    disadvantage: boolean;
    hidden: boolean;
    blessed: boolean;
    inspired: boolean;
    conditions: string[];
    [key: string]: any;
  };
}

// =============================================================================
// ROLL RESULT SYSTEM
// =============================================================================

export interface RollResult {
  /** Final total result */
  total: number;
  /** Detailed breakdown of the roll */
  breakdown: RollBreakdown[];
  /** Whether this was a critical success */
  criticalSuccess: boolean;
  /** Whether this was a critical failure */
  criticalFailure: boolean;
  /** Whether the roll succeeded (for saves, skill checks) */
  success?: boolean;
  /** Target number that was rolled against */
  targetNumber?: number;
  /** Additional results for multi-rolls (like multiple attacks) */
  additionalResults?: RollResult[];
  /** Roll metadata */
  metadata: RollMetadata;
  /** Multiple labeled results for multi-expression rolls */
  multiResults?: LabeledRollResult[];
}

/** Individual result from a labeled dice expression */
export interface LabeledRollResult {
  /** Label for this result (e.g. "attack", "damage") */
  label: string;
  /** The roll result */
  result: RollResult;
}

export interface RollBreakdown {
  /** Type of this breakdown component */
  type: 'die' | 'modifier' | 'reroll' | 'critical' | 'condition';
  /** User-friendly label */
  label: string;
  /** Numerical value */
  value: number;
  /** Additional details */
  details?: {
    /** Original die roll before modifiers */
    originalRoll?: number;
    /** Die size */
    sides?: number;
    /** Source of this component */
    source?: string;
    /** Whether this was rerolled */
    rerolled?: boolean;
    /** Whether this was dropped (for advantage/disadvantage) */
    dropped?: boolean;
    /** Individual die rolls for multi-dice */
    rolls?: number[];
    /** Whether this is a flat number (merged 1d1 + modifier) */
    isFlatNumber?: boolean;
  };
}

export interface RollMetadata {
  /** Type of roll that was performed */
  type: RollType;
  /** Original roll definition */
  definition: RollDefinition;
  /** Modifiers that were applied */
  modifiersApplied: string[];
  /** Conditions that were active */
  conditionsActive: string[];
  /** Timestamp when roll was executed */
  timestamp: number;
  /** Unique identifier for this roll */
  rollId: string;
  /** Duration of roll execution in ms */
  executionTime?: number;
}

// =============================================================================
// DICE OPERATION RESULTS
// =============================================================================

export interface DiceRoll {
  /** Individual die results */
  rolls: number[];
  /** Die size */
  sides: number;
  /** Total before modifiers */
  total: number;
  /** Operations applied */
  operations: AppliedOperation[];
  /** Whether any rerolls occurred */
  rerolled: boolean;
  /** Whether this roll was critical */
  critical: boolean;
}

export interface AppliedOperation {
  /** Type of operation */
  type: Operation['type'];
  /** Original rolls */
  originalRolls: number[];
  /** Rolls after operation */
  finalRolls: number[];
  /** Which rolls were affected */
  affectedIndices: number[];
  /** Description of what happened */
  description: string;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export interface DiceParseResult {
  /** Number of dice */
  count: number;
  /** Die size */
  sides: number;
  /** Flat modifier */
  modifier: number;
  /** Parsed operations */
  operations: Operation[];
  /** Whether the parse was successful */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
}

export interface ModifierRegistry {
  /** Character-based modifiers */
  character: Map<string, RollModifier[]>;
  /** Item-based modifiers */
  items: Map<string, RollModifier[]>;
  /** Spell-based modifiers */
  spells: Map<string, RollModifier[]>;
  /** Condition-based modifiers */
  conditions: Map<string, RollModifier[]>;
  /** Temporary modifiers */
  temporary: RollModifier[];
}

// =============================================================================
// CONFIGURATION INTERFACES
// =============================================================================

export interface RollEngineConfig {
  /** Critical hit rules */
  criticalRules: CriticalRules;
  /** Whether to enable pre-roll analysis */
  enablePreRollAnalysis: boolean;
  /** Maximum execution time before timeout */
  maxExecutionTime: number;
  /** Whether to log roll details */
  enableLogging: boolean;
  /** Custom dice rolling function */
  customDiceRoller?: (sides: number) => number;
}

export interface ResolverConfig {
  /** Whether to auto-resolve ability modifiers */
  autoResolveAbilities: boolean;
  /** Whether to auto-resolve proficiency bonuses */
  autoResolveProficiency: boolean;
  /** Whether to apply homebrew modifiers */
  enableHomebrew: boolean;
  /** Custom modifier resolvers */
  customResolvers: Map<string, ModifierResolver>;
}

export type ModifierResolver = (context: RollContext) => RollModifier[];

// =============================================================================
// ERROR TYPES
// =============================================================================

export class RollEngineError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'RollEngineError';
  }
}

export class DiceParseError extends RollEngineError {
  constructor(expression: string, reason: string) {
    super(`Failed to parse dice expression "${expression}": ${reason}`, 'DICE_PARSE_ERROR', { expression, reason });
  }
}

export class ModifierError extends RollEngineError {
  constructor(modifierId: string, reason: string) {
    super(`Modifier error for "${modifierId}": ${reason}`, 'MODIFIER_ERROR', { modifierId, reason });
  }
}