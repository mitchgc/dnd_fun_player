/**
 * Unified Roll Engine
 * 
 * Core engine for executing D&D rolls with advanced features:
 * - Pre-roll analysis and preview
 * - Configurable critical hit rules
 * - Modifier resolution and stacking
 * - Advanced dice operations
 * - Performance monitoring
 */

import {
  RollDefinition,
  RollResult,
  RollContext,
  RollModifier,
  PreRollInfo,
  DicePreview,
  ModifierPreview,
  ConditionPreview,
  CriticalRules,
  RollEngineConfig,
  ModifierRegistry,
  DiceExpression,
  MultiDiceExpression,
  LabeledDiceExpression,
  LabeledRollResult,
  Operation,
  DiceRoll,
  RollBreakdown,
  RollMetadata,
  ModifierType,
  ApplicationTiming,
  RollEngineError,
  AppliedOperation,
  RollType
} from '../types/rolls';

import { 
  parseDiceExpression, 
  validateOperations, 
  estimateRange, 
  estimateAverage,
  hasAdvantage,
  hasDisadvantage,
  parseAnyDiceExpression
} from './diceParser';

// =============================================================================
// MAIN ROLL ENGINE CLASS
// =============================================================================

export class RollEngine {
  private config: RollEngineConfig;
  private modifierRegistry: ModifierRegistry;
  
  constructor(config: Partial<RollEngineConfig> = {}) {
    this.config = {
      criticalRules: {
        range: [20],
        damageStrategy: 'double_dice',
        affectedDice: 'weapon_only',
        failureRange: [1]
      },
      enablePreRollAnalysis: true,
      maxExecutionTime: 5000,
      enableLogging: false,
      ...config
    };
    
    this.modifierRegistry = {
      character: new Map(),
      items: new Map(),
      spells: new Map(),
      conditions: new Map(),
      temporary: []
    };
  }

  // =============================================================================
  // HELPER FUNCTIONS FOR SINGLE/MULTI EXPRESSIONS
  // =============================================================================

  /**
   * Get primary dice expression for critical hit checks
   * Gets the first attack-like expression from multi-expression
   */
  private getPrimaryExpression(multiExpr: MultiDiceExpression): DiceExpression | null {
    // Find the first expression that looks like an attack roll (d20)
    for (const labeledExpr of multiExpr.expressions) {
      if (labeledExpr.expression.parsed.sides === 20) {
        return labeledExpr.expression;
      }
    }
    // If no d20 found, return the first expression
    return multiExpr.expressions[0]?.expression || null;
  }

  // =============================================================================
  // PRE-ROLL ANALYSIS
  // =============================================================================

  /**
   * Analyze a roll definition to provide pre-roll information
   */
  async analyzeRoll(definition: RollDefinition): Promise<PreRollInfo> {
    const startTime = Date.now();
    
    try {
      // Gather all applicable modifiers
      const modifiers = await this.gatherModifiers(definition);
      
      // Analyze dice components
      const dice = this.analyzeDice(definition, modifiers);
      
      // Analyze conditions and special effects
      const conditions = this.analyzeConditions(definition, modifiers);
      
      // Calculate estimated ranges
      const estimatedRange = this.calculateEstimatedRange(dice, modifiers);
      
      // Determine critical hit information
      const criticalRange = this.determineCriticalRange(definition, modifiers);
      const criticalFailureRange = this.config.criticalRules.failureRange || [1];
      
      // Generate helpful notes
      const notes = this.generateRollNotes(definition, modifiers, conditions);
      
      // Generate preview breakdown using same structure as execution
      const breakdown = this.createPreviewBreakdown(definition, dice, modifiers);

      return {
        breakdown,
        conditions,
        estimatedRange,
        criticalRange,
        criticalFailureRange,
        notes,
        // Keep deprecated properties for backwards compatibility
        dice,
        modifiers: modifiers.map(mod => this.createModifierPreview(mod))
      };
      
    } catch (error) {
      throw new RollEngineError(
        `Pre-roll analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ANALYSIS_ERROR',
        { definition, executionTime: Date.now() - startTime }
      );
    }
  }

  /**
   * Execute a roll definition and return detailed results
   */
  async executeRoll(definition: RollDefinition): Promise<RollResult> {
    const startTime = Date.now();
    const rollId = this.generateRollId();
    
    try {
      // Validate execution time limit
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new RollEngineError('Roll execution timeout', 'TIMEOUT')), 
                  this.config.maxExecutionTime);
      });
      
      const rollPromise = this.performRoll(definition, rollId, startTime);
      
      return await Promise.race([rollPromise, timeoutPromise]) as RollResult;
      
    } catch (error) {
      if (this.config.enableLogging) {
        console.error(`Roll execution failed for ${definition.name}:`, error);
      }
      
      throw error instanceof RollEngineError ? error : new RollEngineError(
        `Roll execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EXECUTION_ERROR',
        { definition, rollId, executionTime: Date.now() - startTime }
      );
    }
  }

  private async performRoll(definition: RollDefinition, rollId: string, startTime: number): Promise<RollResult> {
    // Everything is now treated as a multi-expression (single expressions have one item)
    return await this.executeMultiExpression(definition, rollId, startTime);
  }

  private async executeSingleExpression(
    labeledExpr: LabeledDiceExpression,
    definition: RollDefinition,
    rollId: string,
    startTime: number,
    label: string
  ): Promise<RollResult> {
    // Create a temporary definition for this single expression
    const singleDefinition: RollDefinition = {
      ...definition,
      id: `${definition.id}_${label}`,
      name: `${definition.name} - ${label}`,
      baseExpression: parseAnyDiceExpression(labeledExpr.expression.expression),
      type: this.inferRollTypeFromLabel(labeledExpr.label) || definition.type
    };
    
    // 1. Gather applicable modifiers
    const modifiers = await this.gatherModifiers(singleDefinition);
    
    // 2. Apply pre-roll modifiers (advantage, disadvantage, etc.)
    const tempMultiExpr: MultiDiceExpression = {
      fullExpression: labeledExpr.expression.expression,
      expressions: [labeledExpr]
    };
    const adjustedMultiExpr = this.applyPreRollModifiers(tempMultiExpr, modifiers, singleDefinition.context);
    const adjustedExpression = adjustedMultiExpr.expressions[0].expression;
    
    // 3. Execute the dice rolls with operations
    const diceResults = await this.rollDiceWithOperations(adjustedExpression);
    
    // 4. Check for critical hits/failures
    const isCritical = this.checkCriticalHit(diceResults, singleDefinition.type);
    const isCriticalFailure = this.checkCriticalFailure(diceResults, singleDefinition.type);
    
    // 5. Apply critical hit modifications to damage
    if (isCritical && singleDefinition.type === 'damage') {
      await this.applyCriticalDamage(diceResults, singleDefinition, modifiers);
    }
    
    // 6. Apply modifiers
    const modifierResults = await this.applyModifiers(modifiers, singleDefinition, diceResults);
    
    // 7. Calculate final results
    const breakdown = this.createRollBreakdown(diceResults, modifierResults);
    const total = breakdown.reduce((sum, item) => sum + item.value, 0);
    
    // 8. Determine success/failure for appropriate roll types
    const success = this.determineSuccess(total, singleDefinition, isCritical, isCriticalFailure);
    
    return {
      total,
      breakdown,
      criticalSuccess: isCritical,
      criticalFailure: isCriticalFailure,
      success,
      targetNumber: definition.context.target?.ac || definition.context.target?.saveBonus,
      metadata: {
        type: singleDefinition.type,
        definition: singleDefinition,
        modifiersApplied: modifierResults.filter(m => m.applied).map(m => m.id),
        conditionsActive: this.getActiveConditions(definition.context),
        timestamp: startTime,
        rollId: `${rollId}_${label}`,
        executionTime: 0 // Will be set by parent
      }
    };
  }

  private async executeMultiExpression(
    definition: RollDefinition, 
    rollId: string, 
    startTime: number
  ): Promise<RollResult> {
    const multiExpression = definition.baseExpression;
    const multiResults: LabeledRollResult[] = [];
    let totalSum = 0;
    let hasAnyCritical = false;
    let hasAnyCriticalFailure = false;
    const allBreakdown: RollBreakdown[] = [];
    
    // Execute each labeled expression separately
    for (const labeledExpr of multiExpression.expressions) {
      const label = labeledExpr.label || 'Roll';
      
      // Execute this single expression
      const singleResult = await this.executeSingleExpression(labeledExpr, definition, rollId, startTime, label);
      
      // Accumulate results
      multiResults.push({
        label,
        result: singleResult
      });
      
      totalSum += singleResult.total;
      hasAnyCritical = hasAnyCritical || singleResult.criticalSuccess;
      hasAnyCriticalFailure = hasAnyCriticalFailure || singleResult.criticalFailure;
      
      // Add breakdown with clean labels
      singleResult.breakdown.forEach(item => {
        // For dice rolls, use the expression label instead of generic "Dice"
        const cleanLabel = item.type === 'die' ? label : item.label;
        allBreakdown.push({
          ...item,
          label: cleanLabel
        });
      });
    }
    
    const executionTime = Date.now() - startTime;
    
    return {
      total: totalSum,
      breakdown: allBreakdown,
      criticalSuccess: hasAnyCritical,
      criticalFailure: hasAnyCriticalFailure,
      multiResults,
      metadata: {
        type: definition.type,
        definition,
        modifiersApplied: [],
        conditionsActive: this.getActiveConditions(definition.context),
        timestamp: startTime,
        rollId,
        executionTime
      }
    };
  }
  
  private inferRollTypeFromLabel(label?: string): RollType | null {
    if (!label) return null;
    const lower = label.toLowerCase();
    if (lower.includes('attack')) return 'attack';
    if (lower.includes('damage')) return 'damage';
    if (lower.includes('heal')) return 'healing';
    if (lower.includes('save')) return 'save';
    return null;
  }
  
  private mapLabelToCategory(label?: string): 'base' | 'bonus' | 'critical' | 'conditional' {
    if (!label) return 'base';
    const lower = label.toLowerCase();
    if (lower.includes('bonus') || lower.includes('modifier')) return 'bonus';
    if (lower.includes('crit') || lower.includes('critical')) return 'critical';
    if (lower.includes('condition') || lower.includes('situational')) return 'conditional';
    return 'base';
  }

  // =============================================================================
  // MODIFIER SYSTEM
  // =============================================================================

  /**
   * Register modifiers for a character
   */
  registerCharacterModifiers(characterId: string, modifiers: RollModifier[]): void {
    this.modifierRegistry.character.set(characterId, modifiers);
  }

  /**
   * Register modifiers for items
   */
  registerItemModifiers(itemId: string, modifiers: RollModifier[]): void {
    this.modifierRegistry.items.set(itemId, modifiers);
  }

  /**
   * Add temporary modifiers (like spell effects)
   */
  addTemporaryModifiers(modifiers: RollModifier[]): void {
    this.modifierRegistry.temporary.push(...modifiers);
  }

  /**
   * Clear expired temporary modifiers
   */
  clearExpiredModifiers(): void {
    // Implementation would check expiration conditions
    this.modifierRegistry.temporary = [];
  }

  private async gatherModifiers(definition: RollDefinition): Promise<RollModifier[]> {
    const applicable: RollModifier[] = [];
    
    // Character modifiers
    const characterMods = this.modifierRegistry.character.get(definition.context.character.id) || [];
    for (const modifier of characterMods) {
      if (!modifier.condition || modifier.condition(definition.context)) {
        applicable.push(modifier);
      }
    }
    
    // Equipment modifiers (would iterate through character's equipment)
    // TODO: Implement equipment modifier gathering
    
    // Temporary modifiers
    for (const modifier of this.modifierRegistry.temporary) {
      if (!modifier.condition || modifier.condition(definition.context)) {
        applicable.push(modifier);
      }
    }
    
    // Sort by priority and handle stacking
    return this.sortAndDeduplicateModifiers(applicable);
  }

  private sortAndDeduplicateModifiers(modifiers: RollModifier[]): RollModifier[] {
    // Sort by priority (lower numbers first)
    modifiers.sort((a, b) => a.priority - b.priority);
    
    // Group by source and type for stacking rules
    const stacking = new Map<string, RollModifier[]>();
    const result: RollModifier[] = [];
    
    for (const modifier of modifiers) {
      const key = `${modifier.source}_${modifier.type}`;
      
      if (modifier.stacks) {
        result.push(modifier);
      } else {
        const existing = stacking.get(key);
        if (!existing || existing.length === 0) {
          stacking.set(key, [modifier]);
          result.push(modifier);
        } else {
          // Keep the higher value modifier
          const current = existing[0];
          const currentValue = typeof current.value === 'number' ? current.value : 0;
          const newValue = typeof modifier.value === 'number' ? modifier.value : 0;
          
          if (newValue > currentValue) {
            result[result.indexOf(current)] = modifier;
            stacking.set(key, [modifier]);
          }
        }
      }
    }
    
    return result;
  }

  // =============================================================================
  // DICE ROLLING SYSTEM
  // =============================================================================

  private applyPreRollModifiers(
    multiExpression: MultiDiceExpression, 
    modifiers: RollModifier[], 
    context: RollContext
  ): MultiDiceExpression {
    // Check for advantage/disadvantage
    const hasAdvantageModifier = modifiers.some(m => m.type === ModifierType.ADVANTAGE);
    const hasDisadvantageModifier = modifiers.some(m => m.type === ModifierType.DISADVANTAGE);
    
    // Environmental advantage/disadvantage
    const environmentalAdvantage = context.environment.advantage && !context.environment.disadvantage;
    const environmentalDisadvantage = context.environment.disadvantage && !context.environment.advantage;
    
    const totalAdvantage = hasAdvantageModifier || environmentalAdvantage;
    const totalDisadvantage = hasDisadvantageModifier || environmentalDisadvantage;
    
    // Apply modifiers to each expression in the multi-expression
    const modifiedExpressions = multiExpression.expressions.map(labeledExpr => {
      const expression = labeledExpr.expression;
      
      // Apply advantage/disadvantage to d20 rolls only
      if (expression.parsed.sides === 20 && (totalAdvantage || totalDisadvantage)) {
        if (totalAdvantage && totalDisadvantage) {
          // Advantage and disadvantage cancel out - roll normally
          return labeledExpr;
        } else if (totalAdvantage) {
          // Roll with advantage (2d20kh1)
          const modExpr = `2d20kh1${expression.parsed.modifier > 0 ? '+' + expression.parsed.modifier : expression.parsed.modifier || ''}`;
          return {
            ...labeledExpr,
            expression: parseDiceExpression(modExpr)
          };
        } else if (totalDisadvantage) {
          // Roll with disadvantage (2d20kl1)
          const modExpr = `2d20kl1${expression.parsed.modifier > 0 ? '+' + expression.parsed.modifier : expression.parsed.modifier || ''}`;
          return {
            ...labeledExpr,
            expression: parseDiceExpression(modExpr)
          };
        }
      }
      
      return labeledExpr;
    });
    
    return {
      ...multiExpression,
      expressions: modifiedExpressions
    };
  }

  private async rollDiceWithOperations(expression: DiceExpression): Promise<DiceRoll> {
    const { count, sides, operations } = expression.parsed;
    
    // Validate operations
    const validationErrors = validateOperations(operations, count, sides);
    if (validationErrors.length > 0) {
      throw new RollEngineError(
        `Invalid dice operations: ${validationErrors.join(', ')}`,
        'INVALID_OPERATIONS',
        { expression, errors: validationErrors }
      );
    }
    
    // Roll initial dice
    let rolls: number[] = [];
    for (let i = 0; i < count; i++) {
      rolls.push(this.rollSingleDie(sides));
    }
    
    const appliedOperations: AppliedOperation[] = [];
    let rerolled = false;
    
    // Apply operations in order
    for (const operation of operations) {
      const operationResult = await this.applyDiceOperation(rolls, operation, sides);
      rolls = operationResult.finalRolls;
      appliedOperations.push(operationResult);
      
      if (operation.type === 'reroll' || operation.type === 'explode') {
        rerolled = true;
      }
    }
    
    const total = rolls.reduce((sum, roll) => sum + roll, 0) + (expression.parsed.modifier || 0);
    
    return {
      rolls,
      sides,
      total,
      operations: appliedOperations,
      rerolled,
      critical: false // Individual dice don't crit, only attack rolls can crit
    };
  }

  private rollSingleDie(sides: number): number {
    if (this.config.customDiceRoller) {
      return this.config.customDiceRoller(sides);
    }
    return Math.floor(Math.random() * sides) + 1;
  }

  private async applyDiceOperation(rolls: number[], operation: Operation, sides: number): Promise<AppliedOperation> {
    const originalRolls = [...rolls];
    let finalRolls = [...rolls];
    const affectedIndices: number[] = [];
    let description = '';
    
    switch (operation.type) {
      case 'keep_highest':
        if (typeof operation.value === 'number') {
          const sorted = finalRolls.map((roll, idx) => ({ roll, idx }))
                                  .sort((a, b) => b.roll - a.roll);
          const kept = sorted.slice(0, operation.value);
          finalRolls = kept.map(item => item.roll);
          affectedIndices.push(...kept.map(item => item.idx));
          description = `Kept ${operation.value} highest dice`;
        }
        break;
        
      case 'keep_lowest':
        if (typeof operation.value === 'number') {
          const sorted = finalRolls.map((roll, idx) => ({ roll, idx }))
                                  .sort((a, b) => a.roll - b.roll);
          const kept = sorted.slice(0, operation.value);
          finalRolls = kept.map(item => item.roll);
          affectedIndices.push(...kept.map(item => item.idx));
          description = `Kept ${operation.value} lowest dice`;
        }
        break;
        
      case 'reroll':
        const rerollValues = Array.isArray(operation.value) ? operation.value : [operation.value];
        for (let i = 0; i < finalRolls.length; i++) {
          if (rerollValues.includes(finalRolls[i])) {
            finalRolls[i] = this.rollSingleDie(sides);
            affectedIndices.push(i);
          }
        }
        description = `Rerolled dice showing ${rerollValues.join(', ')}`;
        break;
        
      case 'explode':
        if (typeof operation.value === 'number') {
          let i = 0;
          while (i < finalRolls.length) {
            if (finalRolls[i] >= operation.value) {
              const newRoll = this.rollSingleDie(sides);
              finalRolls.push(newRoll);
              affectedIndices.push(finalRolls.length - 1);
            }
            i++;
          }
          description = `Exploded dice on ${operation.value}+`;
        }
        break;
        
      case 'minimum':
        if (typeof operation.value === 'number') {
          for (let i = 0; i < finalRolls.length; i++) {
            if (finalRolls[i] < operation.value) {
              finalRolls[i] = operation.value;
              affectedIndices.push(i);
            }
          }
          description = `Set minimum die value to ${operation.value}`;
        }
        break;
    }
    
    return {
      type: operation.type,
      originalRolls,
      finalRolls,
      affectedIndices,
      description
    };
  }

  // =============================================================================
  // ANALYSIS HELPERS
  // =============================================================================

  private analyzeDice(definition: RollDefinition, modifiers: RollModifier[]): DicePreview[] {
    const dice: DicePreview[] = [];
    
    // All expressions are now MultiDiceExpression - iterate through each
    const multiExpr = definition.baseExpression;
    
    multiExpr.expressions.forEach((labeledExpr, index) => {
      const label = labeledExpr.label 
        ? `${labeledExpr.label.charAt(0).toUpperCase()}${labeledExpr.label.slice(1)}` 
        : (multiExpr.expressions.length === 1 ? `Base ${definition.name}` : `Expression ${index + 1}`);
      
      dice.push({
        label,
        expression: labeledExpr.expression.expression,
        source: definition.context.source.name,
        criticalAffected: labeledExpr.label === 'damage' || definition.type === 'damage',
        category: this.mapLabelToCategory(labeledExpr.label)
      });
    });
    
    // Additional dice from modifiers
    for (const modifier of modifiers) {
      if (modifier.type === ModifierType.DICE_BONUS && typeof modifier.value !== 'number') {
        dice.push({
          label: modifier.name,
          expression: modifier.value.expression,
          source: modifier.source,
          criticalAffected: modifier.application === ApplicationTiming.ON_CRITICAL,
          category: 'bonus'
        });
      }
    }
    
    return dice;
  }

  private analyzeConditions(definition: RollDefinition, modifiers: RollModifier[]): ConditionPreview[] {
    const conditions: ConditionPreview[] = [];
    
    // Check for advantage/disadvantage
    const hasAdv = definition.context.environment.advantage || 
                   modifiers.some(m => m.type === ModifierType.ADVANTAGE);
    const hasDisadv = definition.context.environment.disadvantage || 
                      modifiers.some(m => m.type === ModifierType.DISADVANTAGE);
    
    if (hasAdv && !hasDisadv) {
      conditions.push({
        label: 'Advantage',
        description: 'Roll twice, keep highest',
        active: true,
        icon: '⬆️',
        type: 'advantage'
      });
    } else if (hasDisadv && !hasAdv) {
      conditions.push({
        label: 'Disadvantage', 
        description: 'Roll twice, keep lowest',
        active: true,
        icon: '⬇️',
        type: 'disadvantage'
      });
    }
    
    // Check for expanded critical range
    const criticalRange = this.determineCriticalRange(definition, modifiers);
    if (criticalRange.length > 1 || criticalRange[0] !== 20) {
      conditions.push({
        label: `Critical ${criticalRange.join('-')}`,
        description: `Critical hits on ${criticalRange.join(', ')}`,
        active: true,
        icon: '⭐',
        type: 'special'
      });
    }
    
    return conditions;
  }

  private calculateEstimatedRange(dice: DicePreview[], modifiers: RollModifier[]): { min: number; max: number; average: number } {
    let min = 0;
    let max = 0;
    let average = 0;
    
    // Calculate from dice
    for (const die of dice) {
      try {
        const expr = parseDiceExpression(die.expression);
        const range = estimateRange(expr);
        const avg = estimateAverage(expr);
        
        min += range.min;
        max += range.max;
        average += avg;
      } catch {
        // Skip invalid expressions
      }
    }
    
    // Add flat modifiers
    for (const modifier of modifiers) {
      if (modifier.type === ModifierType.FLAT_BONUS && typeof modifier.value === 'number') {
        min += modifier.value;
        max += modifier.value;
        average += modifier.value;
      }
    }
    
    return { 
      min: Math.max(0, Math.round(min)), 
      max: Math.round(max), 
      average: Math.round(average)
    };
  }

  private determineCriticalRange(definition: RollDefinition, modifiers: RollModifier[]): number[] {
    // Critical hits only apply to d20 attack/spell attack rolls in D&D 5e
    const primaryExpression = this.getPrimaryExpression(definition.baseExpression);
    if (!['attack', 'spell_attack'].includes(definition.type) || 
        !primaryExpression || 
        primaryExpression.parsed.sides !== 20) {
      return []; // No critical range for non-attack rolls or non-d20s
    }
    
    // Start with configured critical range (default [20])
    let range = [...this.config.criticalRules.range];
    
    // Check for expanded critical range modifiers (e.g., Champion Fighter 19-20)
    for (const modifier of modifiers) {
      if (modifier.type === ModifierType.CRITICAL_RANGE && typeof modifier.value === 'number') {
        range.push(modifier.value);
      }
    }
    
    return range.sort((a, b) => a - b);
  }

  private createModifierPreview(modifier: RollModifier): ModifierPreview {
    return {
      label: modifier.name,
      value: typeof modifier.value === 'number' ? 
             (modifier.value >= 0 ? `+${modifier.value}` : `${modifier.value}`) :
             modifier.value.expression,
      source: modifier.source,
      timing: modifier.application,
      condition: modifier.condition ? 'Conditional' : undefined,
      category: this.getModifierCategory(modifier)
    };
  }

  private getModifierCategory(modifier: RollModifier): 'ability' | 'proficiency' | 'item' | 'spell' | 'condition' {
    switch (modifier.source) {
      case 'ability_score': return 'ability';
      case 'proficiency': 
      case 'expertise': return 'proficiency';
      case 'item': return 'item';
      case 'spell': return 'spell';
      default: return 'condition';
    }
  }

  private generateRollNotes(definition: RollDefinition, modifiers: RollModifier[], conditions: ConditionPreview[]): string[] {
    const notes: string[] = [];
    
    // Note about advantage/disadvantage cancellation
    const hasAdv = conditions.some(c => c.type === 'advantage');
    const hasDisadv = conditions.some(c => c.type === 'disadvantage');
    
    if (hasAdv && hasDisadv) {
      notes.push('Advantage and disadvantage cancel out - rolling normally');
    }
    
    // Note about conditional modifiers
    const conditionalMods = modifiers.filter(m => m.condition);
    if (conditionalMods.length > 0) {
      notes.push(`${conditionalMods.length} conditional modifier(s) may apply`);
    }
    
    return notes;
  }

  // =============================================================================
  // RESULT CALCULATION
  // =============================================================================

  private checkCriticalHit(diceResults: DiceRoll, rollType: string): boolean {
    // Only attack rolls and spell attacks can crit in D&D 5e
    if (!['attack', 'spell_attack'].includes(rollType)) {
      return false;
    }
    
    // Critical hits only happen on d20 rolls
    if (diceResults.sides !== 20) {
      return false;
    }
    
    // Check if any roll is in the critical range
    return diceResults.rolls.some(roll => 
      this.config.criticalRules.range.includes(roll)
    );
  }

  private checkCriticalFailure(diceResults: DiceRoll, rollType: string): boolean {
    // Critical failures only happen on d20 rolls for specific types
    if (!['attack', 'spell_attack', 'save', 'death_save'].includes(rollType)) {
      return false;
    }
    
    // Critical failures only happen on d20 rolls
    if (diceResults.sides !== 20) {
      return false;
    }
    
    const failureRange = this.config.criticalRules.failureRange || [1];
    return diceResults.rolls.some(roll => failureRange.includes(roll));
  }

  private async applyCriticalDamage(
    diceResults: DiceRoll, 
    definition: RollDefinition, 
    modifiers: RollModifier[]
  ): Promise<void> {
    // Implementation depends on critical damage strategy
    // For now, just mark as critical - detailed implementation needed
    diceResults.critical = true;
  }

  private async applyModifiers(
    modifiers: RollModifier[], 
    definition: RollDefinition, 
    diceResults: DiceRoll
  ): Promise<Array<{id: string, applied: boolean, value: number}>> {
    const results: Array<{id: string, applied: boolean, value: number}> = [];
    
    for (const modifier of modifiers) {
      if (modifier.application === ApplicationTiming.BEFORE_ROLL) {
        continue; // Already applied
      }
      
      let applied = true;
      let value = 0;
      
      if (typeof modifier.value === 'number') {
        value = modifier.value;
      }
      
      results.push({
        id: modifier.id,
        applied,
        value
      });
    }
    
    return results;
  }

  private createRollBreakdown(
    diceResults: DiceRoll, 
    modifierResults: Array<{id: string, applied: boolean, value: number}>
  ): RollBreakdown[] {
    const breakdown: RollBreakdown[] = [];
    
    // Add dice results with operation details
    const diceValue = diceResults.rolls.reduce((sum, roll) => sum + roll, 0);
    
    // Show dice with operation information
    if (diceResults.operations && diceResults.operations.length > 0) {
      // Show original rolls and what operations were applied
      const lastOp = diceResults.operations[diceResults.operations.length - 1];
      breakdown.push({
        type: 'die',
        label: `Dice (${lastOp.description})`,
        value: diceValue,
        details: {
          originalRoll: lastOp.originalRolls.reduce((sum, r) => sum + r, 0),
          rolls: diceResults.rolls,
          sides: diceResults.sides,
          rerolled: diceResults.rerolled,
          dropped: lastOp.originalRolls.length > diceResults.rolls.length,
          source: `Original: [${lastOp.originalRolls.join(', ')}]`
        }
      });
    } else {
      // No operations, just show the dice
      breakdown.push({
        type: 'die',
        label: 'Dice',
        value: diceValue,
        details: {
          rolls: diceResults.rolls,
          sides: diceResults.sides,
          rerolled: diceResults.rerolled
        }
      });
    }
    
    // Add the built-in modifier from dice expression (e.g., the +5 in "1d20+5")
    const expressionModifier = diceResults.total - diceValue;
    if (expressionModifier !== 0) {
      breakdown.push({
        type: 'modifier',
        label: 'Bonus',
        value: expressionModifier,
        details: {
          source: 'Expression'
        }
      });
    }
    
    // Add other modifiers
    for (const mod of modifierResults) {
      if (mod.applied && mod.value !== 0) {
        breakdown.push({
          type: 'modifier',
          label: 'Modifier',
          value: mod.value
        });
      }
    }
    
    return breakdown;
  }

  private determineSuccess(
    total: number, 
    definition: RollDefinition, 
    isCritical: boolean, 
    isCriticalFailure: boolean
  ): boolean | undefined {
    const target = definition.context.target;
    
    if (!target) return undefined;
    
    // Critical auto-success/failure for certain roll types
    if (definition.type === 'save' || definition.type === 'attack') {
      if (isCritical) return true;
      if (isCriticalFailure) return false;
    }
    
    // Compare against target
    if (target.ac !== undefined) {
      return total >= target.ac;
    }
    
    if (target.saveBonus !== undefined) {
      return total >= target.saveBonus;
    }
    
    return undefined;
  }

  private getActiveConditions(context: RollContext): string[] {
    const conditions: string[] = [];
    
    if (context.environment.advantage) conditions.push('advantage');
    if (context.environment.disadvantage) conditions.push('disadvantage');
    if (context.environment.hidden) conditions.push('hidden');
    if (context.environment.blessed) conditions.push('blessed');
    
    return conditions;
  }

  private generateRollId(): string {
    return `roll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createPreviewBreakdown(
    definition: RollDefinition, 
    dice: DicePreview[], 
    modifiers: RollModifier[]
  ): RollBreakdown[] {
    const breakdown: RollBreakdown[] = [];
    
    // Process dice previews into breakdown format
    dice.forEach((dicePreview) => {
      // Parse the dice expression
      const diceExpression = parseDiceExpression(dicePreview.expression);
      const parseResult = diceExpression.parsed;
      
      // Clean up label consistently with execution
      const cleanLabel = dicePreview.label
        .replace(/^.*?:\s*/, '')
        .replace(/\s*Dice\s*/i, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        .trim();
      
      // Calculate estimated roll value using proper mathematical functions
      const diceExpr = parseDiceExpression(dicePreview.expression);
      const baseValue = estimateAverage(diceExpr) - (parseResult.modifier || 0); // Remove modifier since we add it separately
      
      // Create dice breakdown item (without modifier if it's in the expression)
      breakdown.push({
        type: 'die',
        label: cleanLabel,
        value: baseValue,
        details: {
          originalRoll: baseValue,
          sides: parseResult.sides,
          source: dicePreview.source,
          rerolled: false,
          rolls: Array(parseResult.count).fill(Math.round(baseValue / (parseResult.count || 1)))
        }
      });
      
      // If there's a modifier in the dice expression, add it as separate breakdown item
      if (parseResult.modifier && parseResult.modifier !== 0) {
        breakdown.push({
          type: 'modifier',
          label: cleanLabel,
          value: parseResult.modifier,
          details: {
            source: dicePreview.source
          }
        });
      }
    });
    
    // Process separate modifiers
    modifiers.forEach((modifier) => {
      if (typeof modifier.value === 'number' && modifier.value !== 0) {
        const cleanLabel = modifier.name
          .replace(/^.*?:\s*/, '')
          .replace(/_/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase())
          .trim();
          
        breakdown.push({
          type: 'modifier',
          label: cleanLabel,
          value: modifier.value,
          details: {
            source: modifier.source.toString()
          }
        });
      }
    });
    
    return breakdown;
  }
}

// Export singleton instance
export const rollEngine = new RollEngine();