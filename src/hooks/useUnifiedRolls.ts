import { useState, useCallback, useMemo } from 'react';
import { RollEngine } from '../utils/rollEngine';
import { parseAnyDiceExpression } from '../utils/diceParser';
import { 
  RollDefinition, 
  RollResult, 
  PreRollInfo, 
  RollContext,
  RollType,
  RollEngineConfig,
  CriticalRules 
} from '../types/rolls';

/**
 * Modern React hook for the unified D&D roll system
 * 
 * Provides:
 * - Pre-roll analysis showing dice, modifiers, and conditions
 * - Unified roll execution with full breakdown
 * - Roll history and logging
 * - Configurable critical hit rules and modifiers
 */
export const useUnifiedRolls = (config?: Partial<RollEngineConfig>) => {
  const [rollHistory, setRollHistory] = useState<RollResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [lastPreRollInfo, setLastPreRollInfo] = useState<PreRollInfo | null>(null);

  // Create roll engine instance with configuration
  const rollEngine = useMemo(() => {
    const defaultConfig: RollEngineConfig = {
      criticalRules: {
        range: [20], // Default for d20s, other dice sizes use max value
        damageStrategy: 'double_dice',
        affectedDice: 'all_damage',
        failureRange: [1]
      },
      enablePreRollAnalysis: true,
      maxExecutionTime: 5000,
      enableLogging: true,
      ...config
    };

    return new RollEngine(defaultConfig);
  }, [config]);

  /**
   * Analyze a roll before execution
   * Shows what dice will be rolled, what modifiers apply, etc.
   */
  const analyzeRoll = useCallback(async (definition: RollDefinition): Promise<PreRollInfo> => {
    setIsAnalyzing(true);
    try {
      const preRollInfo = await rollEngine.analyzeRoll(definition);
      setLastPreRollInfo(preRollInfo);
      return preRollInfo;
    } finally {
      setIsAnalyzing(false);
    }
  }, [rollEngine]);

  /**
   * Execute a roll with full breakdown and logging
   */
  const executeRoll = useCallback(async (definition: RollDefinition): Promise<RollResult> => {
    setIsRolling(true);
    try {
      const result = await rollEngine.executeRoll(definition);
      
      // Add to roll history
      setRollHistory(prev => [result, ...prev].slice(0, 100)); // Keep last 100 rolls
      
      // Clear pre-roll info since roll is complete
      setLastPreRollInfo(null);
      
      return result;
    } finally {
      setIsRolling(false);
    }
  }, [rollEngine]);

  /**
   * Analyze and execute a roll in one step
   * Useful for simple cases where pre-roll analysis isn't needed
   */
  const rollDirect = useCallback(async (definition: RollDefinition): Promise<RollResult> => {
    await analyzeRoll(definition); // Still analyze for consistency
    return executeRoll(definition);
  }, [analyzeRoll, executeRoll]);

  /**
   * Create common roll types with smart defaults
   */
  const createRollDefinition = useCallback((
    type: RollType,
    context: RollContext,
    customExpression?: string
  ): RollDefinition => {
    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Smart defaults based on roll type
    let baseExpression = customExpression || '1d20';
    let name: string = type;

    switch (type) {
      case 'attack':
        name = context.source.name + ' Attack';
        baseExpression = customExpression || '1d20';
        break;
      case 'damage':
        name = context.source.name + ' Damage';
        // Try to infer damage from source properties
        baseExpression = customExpression || 
          context.source.properties?.damage || 
          '1d6';
        break;
      case 'skill':
        name = context.source.name;
        break;
      case 'save':
        name = context.source.name + ' Save';
        break;
      case 'initiative':
        name = 'Initiative';
        break;
      case 'death_save':
        name = 'Death Save';
        break;
      case 'concentration':
        name = 'Concentration Save';
        break;
      case 'spell_attack':
        name = context.source.name + ' Spell Attack';
        break;
      case 'spell_save':
        name = context.source.name + ' Spell Save';
        break;
      case 'healing':
        name = context.source.name + ' Healing';
        baseExpression = customExpression || '2d4+2'; // Default healing potion
        break;
      case 'ability':
        name = context.source.name + ' Check';
        break;
    }

    return {
      id,
      type,
      name,
      baseExpression: typeof baseExpression === 'string' 
        ? parseAnyDiceExpression(baseExpression)
        : baseExpression,
      context,
      modifiers: [] // Will be resolved by the engine
    };
  }, []);

  /**
   * Convenience methods for common roll types
   */
  const rollAttack = useCallback(async (
    weaponName: string, 
    context: RollContext
  ): Promise<RollResult> => {
    const definition = createRollDefinition('attack', {
      ...context,
      source: { type: 'weapon', name: weaponName, tags: ['melee'] }
    });
    return rollDirect(definition);
  }, [createRollDefinition, rollDirect]);

  const rollDamage = useCallback(async (
    weaponName: string,
    damageExpression: string,
    context: RollContext
  ): Promise<RollResult> => {
    const definition = createRollDefinition('damage', {
      ...context,
      source: { type: 'weapon', name: weaponName, tags: ['damage'] }
    }, damageExpression);
    return rollDirect(definition);
  }, [createRollDefinition, rollDirect]);

  const rollSkill = useCallback(async (
    skillName: string,
    context: RollContext
  ): Promise<RollResult> => {
    const definition = createRollDefinition('skill', {
      ...context,
      source: { type: 'skill', name: skillName, tags: ['skill'] }
    });
    return rollDirect(definition);
  }, [createRollDefinition, rollDirect]);

  const rollSave = useCallback(async (
    saveName: string,
    context: RollContext
  ): Promise<RollResult> => {
    const definition = createRollDefinition('save', {
      ...context,
      source: { type: 'save', name: saveName, tags: ['save'] }
    });
    return rollDirect(definition);
  }, [createRollDefinition, rollDirect]);

  const rollInitiative = useCallback(async (context: RollContext): Promise<RollResult> => {
    const definition = createRollDefinition('initiative', {
      ...context,
      source: { type: 'ability', name: 'Initiative', tags: ['initiative'] }
    });
    return rollDirect(definition);
  }, [createRollDefinition, rollDirect]);

  const rollDeathSave = useCallback(async (context: RollContext): Promise<RollResult> => {
    const definition = createRollDefinition('death_save', {
      ...context,
      source: { type: 'save', name: 'Death Save', tags: ['death_save'] }
    });
    return rollDirect(definition);
  }, [createRollDefinition, rollDirect]);

  /**
   * Roll multi-dice expression (e.g., "1d20,1d8" or "attack:1d20+5,damage:1d8+3")
   */
  const rollMultiExpression = useCallback(async (
    expression: string,
    rollName: string,
    context: RollContext
  ): Promise<RollResult> => {
    const definition = createRollDefinition('raw', {
      ...context,
      source: { type: 'custom', name: rollName, tags: ['multi'] }
    }, expression);
    return rollDirect(definition);
  }, [createRollDefinition, rollDirect]);

  /**
   * Roll attack and damage together (legacy - prefer rollAttackThenDamage)
   */
  const rollAttackAndDamage = useCallback(async (
    weaponName: string,
    attackBonus: number,
    damageExpression: string,
    context: RollContext
  ): Promise<RollResult> => {
    const multiExpression = `attack:1d20${attackBonus >= 0 ? '+' : ''}${attackBonus},damage:${damageExpression}`;
    return rollMultiExpression(multiExpression, `${weaponName} Attack & Damage`, context);
  }, [rollMultiExpression]);

  /**
   * Roll attack first, then damage based on attack result
   * This is the preferred method for weapon attacks
   */
  const rollAttackThenDamage = useCallback(async (
    weaponName: string,
    attackExpression: string,
    damageExpression: string,
    context: RollContext
  ): Promise<{ attackResult: RollResult; damageResult?: RollResult }> => {
    // First roll the attack
    const attackDefinition = createRollDefinition('attack', {
      ...context,
      source: { type: 'weapon', name: weaponName, tags: ['attack'] }
    }, attackExpression);
    
    const attackResult = await rollDirect(attackDefinition);
    
    // Determine if we should roll damage
    const shouldRollDamage = true; // Always roll damage for now, could be conditional based on target AC later
    
    if (!shouldRollDamage) {
      return { attackResult };
    }
    
    // Determine if the attack was a critical hit
    const wasCritical = attackResult.criticalSuccess;
    
    // Modify damage expression for critical hits
    let finalDamageExpression = damageExpression;
    if (wasCritical) {
      // For critical hits, double the weapon dice (not modifiers)
      // Parse the damage expression and double dice components
      finalDamageExpression = applyCriticalDamage(damageExpression);
    }
    
    // Roll damage with modified expression
    const damageDefinition = createRollDefinition('damage', {
      ...context,
      source: { type: 'weapon', name: weaponName, tags: ['damage', wasCritical ? 'critical' : 'normal'] }
    }, finalDamageExpression);
    
    const damageResult = await rollDirect(damageDefinition);
    
    return { attackResult, damageResult };
  }, [createRollDefinition, rollDirect]);

  /**
   * Apply critical hit damage rules to a damage expression
   */
  const applyCriticalDamage = useCallback((damageExpression: string): string => {
    // Split by commas to handle multiple damage components
    const parts = damageExpression.split(',');
    
    return parts.map(part => {
      const trimmed = part.trim();
      
      // Check if it has a label (e.g., "sneak:3d6")
      const labelMatch = trimmed.match(/^([^:]+):(.+)$/);
      const expression = labelMatch ? labelMatch[2] : trimmed;
      const label = labelMatch ? labelMatch[1] : '';
      
      // Double dice in the expression (e.g., "1d8+3" becomes "2d8+3")
      const doubledExpression = expression.replace(/(\d+)d(\d+)/g, (match, count, sides) => {
        return `${parseInt(count) * 2}d${sides}`;
      });
      
      return label ? `${label}:${doubledExpression}` : doubledExpression;
    }).join(',');
  }, []);

  /**
   * Roll history management
   */
  const clearHistory = useCallback(() => {
    setRollHistory([]);
  }, []);

  const getLastRoll = useCallback((type?: RollType): RollResult | null => {
    if (!type) return rollHistory[0] || null;
    return rollHistory.find(roll => roll.metadata.type === type) || null;
  }, [rollHistory]);

  /**
   * Configuration updates
   * Note: Currently configuration is set at initialization.
   * Future versions may support runtime configuration updates.
   */
  const updateCriticalRules = useCallback((rules: Partial<CriticalRules>) => {
    console.warn('Runtime configuration updates not yet implemented. Please recreate the hook with new config.');
  }, []);

  return {
    // Core roll functions
    analyzeRoll,
    executeRoll,
    rollDirect,
    createRollDefinition,

    // Convenience roll methods
    rollAttack,
    rollDamage,
    rollSkill,
    rollSave,
    rollInitiative,
    rollDeathSave,
    rollMultiExpression,
    rollAttackAndDamage,
    rollAttackThenDamage,

    // State and history
    rollHistory,
    lastPreRollInfo,
    isAnalyzing,
    isRolling,
    clearHistory,
    getLastRoll,

    // Configuration
    updateCriticalRules,
    rollEngine,

    // Statistics
    stats: {
      totalRolls: rollHistory.length,
      criticalHits: rollHistory.filter(r => r.criticalSuccess).length,
      criticalFailures: rollHistory.filter(r => r.criticalFailure).length,
      averageRoll: rollHistory.length > 0 
        ? rollHistory.reduce((sum, r) => sum + r.total, 0) / rollHistory.length 
        : 0
    }
  };
};

export type UseUnifiedRollsReturn = ReturnType<typeof useUnifiedRolls>;