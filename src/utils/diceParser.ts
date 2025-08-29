/**
 * Advanced Dice Expression Parser
 * 
 * Supports D&D 5e dice notation including:
 * - Basic: "1d20", "3d6", "2d8+3"
 * - Advantage/Disadvantage: "2d20kh1", "2d20kl1"
 * - Drop dice: "4d6dl1" (ability score generation)
 * - Rerolls: "2d6r1,2" (Great Weapon Fighting)
 * - Exploding: "1d6x6" (explode on 6s)
 * - Minimum: "2d6m3" (minimum 3 per die)
 * - Complex: "3d6+2kh1r1x6" (multiple operations)
 */

import { DiceExpression, Operation, DiceParseResult, DiceParseError, MultiDiceExpression, LabeledDiceExpression } from '../types/rolls';

// =============================================================================
// DICE EXPRESSION PARSER
// =============================================================================

/**
 * Parse a dice expression string into structured data
 * @param expression - Dice expression like "3d6+2kh1"
 * @returns Parsed dice expression or throws DiceParseError
 */
export function parseDiceExpression(expression: string): DiceExpression {
  const result = tryParseDiceExpression(expression);
  
  if (!result.valid) {
    throw new DiceParseError(expression, result.error || 'Unknown parsing error');
  }
  
  return {
    expression: expression.trim(),
    parsed: {
      count: result.count,
      sides: result.sides,
      modifier: result.modifier,
      operations: result.operations
    }
  };
}

/**
 * Try to parse dice expression without throwing
 * @param expression - Dice expression string
 * @returns Parse result with success/error info
 */
export function tryParseDiceExpression(expression: string): DiceParseResult {
  try {
    const normalized = expression.trim().toLowerCase().replace(/\s+/g, '');
    
    if (!normalized) {
      return {
        count: 0,
        sides: 0,
        modifier: 0,
        operations: [],
        valid: false,
        error: 'Empty expression'
      };
    }

    // Extract the basic dice part (XdY)
    const diceMatch = normalized.match(/^(\d+)?d(\d+)/);
    if (!diceMatch) {
      // Handle raw numbers like "5" (treated as 1-sided die with fixed value)
      const numberMatch = normalized.match(/^[+-]?(\d+)$/);
      if (numberMatch) {
        const value = parseInt(normalized, 10);
        return {
          count: 1,
          sides: 1,
          modifier: value - 1, // Since 1d1 always rolls 1, we add (value-1) as modifier to get the desired value
          operations: [],
          valid: true
        };
      }
      
      return {
        count: 0,
        sides: 0,
        modifier: 0,
        operations: [],
        valid: false,
        error: 'Invalid dice format - expected XdY or number'
      };
    }

    const count = parseInt(diceMatch[1] || '1', 10);
    const sides = parseInt(diceMatch[2], 10);

    // Validate basic dice values
    if (count <= 0 || count > 100) {
      return {
        count: 0,
        sides: 0,
        modifier: 0,
        operations: [],
        valid: false,
        error: `Invalid dice count: ${count} (must be 1-100)`
      };
    }

    if (![2, 3, 4, 6, 8, 10, 12, 20, 100].includes(sides)) {
      return {
        count: 0,
        sides: 0,
        modifier: 0,
        operations: [],
        valid: false,
        error: `Invalid die size: d${sides} (supported: d2,d3,d4,d6,d8,d10,d12,d20,d100)`
      };
    }

    // Extract the rest after the basic dice
    const remainder = normalized.substring(diceMatch[0].length);
    
    // Parse modifier
    const modifier = parseModifier(remainder);
    
    // Parse operations
    const operations = parseOperations(remainder);

    return {
      count,
      sides,
      modifier,
      operations,
      valid: true
    };

  } catch (error) {
    return {
      count: 0,
      sides: 0,
      modifier: 0,
      operations: [],
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown parsing error'
    };
  }
}

// =============================================================================
// OPERATION PARSERS
// =============================================================================

/**
 * Parse modifier from dice expression remainder
 * @param remainder - String after dice part (e.g., "+5kh1" -> "+5")
 */
function parseModifier(remainder: string): number {
  const modifierMatch = remainder.match(/([+-]\d+)/);
  return modifierMatch ? parseInt(modifierMatch[1], 10) : 0;
}

/**
 * Parse operations from dice expression remainder
 * @param remainder - String after dice part
 */
function parseOperations(remainder: string): Operation[] {
  const operations: Operation[] = [];
  
  // Remove the modifier part to focus on operations
  const operationsStr = remainder.replace(/[+-]\d+/, '');
  
  // Keep highest: kh1, kh2, etc.
  const khMatch = operationsStr.match(/kh(\d+)/);
  if (khMatch) {
    operations.push({
      type: 'keep_highest',
      value: parseInt(khMatch[1], 10)
    });
  }
  
  // Keep lowest: kl1, kl2, etc.
  const klMatch = operationsStr.match(/kl(\d+)/);
  if (klMatch) {
    operations.push({
      type: 'keep_lowest',
      value: parseInt(klMatch[1], 10)
    });
  }
  
  // Drop highest: dh1, dh2, etc.
  const dhMatch = operationsStr.match(/dh(\d+)/);
  if (dhMatch) {
    operations.push({
      type: 'drop_highest',
      value: parseInt(dhMatch[1], 10)
    });
  }
  
  // Drop lowest: dl1, dl2, etc.
  const dlMatch = operationsStr.match(/dl(\d+)/);
  if (dlMatch) {
    operations.push({
      type: 'drop_lowest',
      value: parseInt(dlMatch[1], 10)
    });
  }
  
  // Reroll: r1, r1,2, r1,2,3, etc.
  const rMatch = operationsStr.match(/r([\d,]+)/);
  if (rMatch) {
    const rerollValues = rMatch[1].split(',').map(v => parseInt(v.trim(), 10));
    operations.push({
      type: 'reroll',
      value: rerollValues
    });
  }
  
  // Exploding: x6, x10, etc.
  const xMatch = operationsStr.match(/x(\d+)/);
  if (xMatch) {
    operations.push({
      type: 'explode',
      value: parseInt(xMatch[1], 10)
    });
  }
  
  // Minimum: m1, m2, etc.
  const mMatch = operationsStr.match(/m(\d+)/);
  if (mMatch) {
    operations.push({
      type: 'minimum',
      value: parseInt(mMatch[1], 10)
    });
  }
  
  return operations;
}

// =============================================================================
// DICE OPERATION VALIDATION
// =============================================================================

/**
 * Validate operations against dice count and type
 * @param operations - Operations to validate
 * @param count - Number of dice
 * @param sides - Die size
 */
export function validateOperations(operations: Operation[], count: number, sides: number): string[] {
  const errors: string[] = [];
  
  for (const op of operations) {
    switch (op.type) {
      case 'keep_highest':
      case 'keep_lowest':
        if (typeof op.value !== 'number' || op.value >= count) {
          errors.push(`Cannot keep ${op.value} dice when only rolling ${count}`);
        }
        if (typeof op.value === 'number' && op.value <= 0) {
          errors.push(`Keep value must be positive`);
        }
        break;
        
      case 'drop_highest':
      case 'drop_lowest':
        if (typeof op.value !== 'number' || op.value >= count) {
          errors.push(`Cannot drop ${op.value} dice when only rolling ${count}`);
        }
        if (typeof op.value === 'number' && op.value <= 0) {
          errors.push(`Drop value must be positive`);
        }
        break;
        
      case 'reroll':
        if (Array.isArray(op.value)) {
          for (const val of op.value) {
            if (val < 1 || val > sides) {
              errors.push(`Reroll value ${val} outside die range 1-${sides}`);
            }
          }
        } else {
          if (op.value < 1 || op.value > sides) {
            errors.push(`Reroll value ${op.value} outside die range 1-${sides}`);
          }
        }
        break;
        
      case 'explode':
        if (typeof op.value !== 'number' || op.value < 1 || op.value > sides) {
          errors.push(`Explode value ${op.value} outside die range 1-${sides}`);
        }
        break;
        
      case 'minimum':
        if (typeof op.value !== 'number' || op.value < 1 || op.value > sides) {
          errors.push(`Minimum value ${op.value} outside die range 1-${sides}`);
        }
        break;
    }
  }
  
  // Check for conflicting operations
  const hasKeep = operations.some(op => op.type === 'keep_highest' || op.type === 'keep_lowest');
  const hasDrop = operations.some(op => op.type === 'drop_highest' || op.type === 'drop_lowest');
  
  if (hasKeep && hasDrop) {
    errors.push('Cannot use both keep and drop operations in the same expression');
  }
  
  const keepHighest = operations.find(op => op.type === 'keep_highest');
  const keepLowest = operations.find(op => op.type === 'keep_lowest');
  
  if (keepHighest && keepLowest) {
    errors.push('Cannot keep both highest and lowest dice in the same expression');
  }
  
  return errors;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create a simple dice expression for common cases
 * @param count - Number of dice
 * @param sides - Die size
 * @param modifier - Optional modifier
 */
export function createDiceExpression(count: number, sides: number, modifier: number = 0): DiceExpression {
  const baseExpression = `${count}d${sides}`;
  const modifierStr = modifier > 0 ? `+${modifier}` : modifier < 0 ? `${modifier}` : '';
  const expression = baseExpression + modifierStr;
  
  return {
    expression,
    parsed: {
      count,
      sides,
      modifier,
      operations: []
    }
  };
}

/**
 * Create advantage dice expression (2d20kh1)
 */
export function createAdvantageExpression(): DiceExpression {
  return parseDiceExpression('2d20kh1');
}

/**
 * Create disadvantage dice expression (2d20kl1)
 */
export function createDisadvantageExpression(): DiceExpression {
  return parseDiceExpression('2d20kl1');
}

/**
 * Create ability score generation expression (4d6dl1)
 */
export function createAbilityScoreExpression(): DiceExpression {
  return parseDiceExpression('4d6dl1');
}

/**
 * Create Great Weapon Fighting expression (reroll 1s and 2s)
 * @param count - Number of dice
 * @param sides - Die size
 */
export function createGreatWeaponFightingExpression(count: number, sides: number): DiceExpression {
  return parseDiceExpression(`${count}d${sides}r1,2`);
}

/**
 * Create a common attack + damage multi-expression
 * @param attackBonus - Attack roll bonus
 * @param damageExpression - Damage dice expression
 */
export function createAttackDamageExpression(attackBonus: number = 0, damageExpression: string = '1d8'): MultiDiceExpression {
  const attackExpr = `1d20${attackBonus >= 0 ? '+' : ''}${attackBonus}`;
  return parseMultiDiceExpression(`attack:${attackExpr},damage:${damageExpression}`);
}

// =============================================================================
// EXPRESSION UTILITIES
// =============================================================================

/**
 * Check if expression has advantage
 */
export function hasAdvantage(expression: DiceExpression): boolean {
  return expression.parsed.count === 2 && 
         expression.parsed.sides === 20 &&
         expression.parsed.operations.some(op => op.type === 'keep_highest' && op.value === 1);
}

/**
 * Check if expression has disadvantage
 */
export function hasDisadvantage(expression: DiceExpression): boolean {
  return expression.parsed.count === 2 && 
         expression.parsed.sides === 20 &&
         expression.parsed.operations.some(op => op.type === 'keep_lowest' && op.value === 1);
}

/**
 * Get the effective number of dice after operations
 */
export function getEffectiveDiceCount(expression: DiceExpression): number {
  let count = expression.parsed.count;
  
  for (const op of expression.parsed.operations) {
    switch (op.type) {
      case 'keep_highest':
      case 'keep_lowest':
        count = Math.min(count, typeof op.value === 'number' ? op.value : count);
        break;
      case 'drop_highest':
      case 'drop_lowest':
        count = count - (typeof op.value === 'number' ? op.value : 0);
        break;
      // Exploding dice can increase count, but we can't predict how much
    }
  }
  
  return Math.max(0, count);
}

/**
 * Estimate the average result for a dice expression
 */
export function estimateAverage(expression: DiceExpression): number {
  const { count, sides, modifier, operations } = expression.parsed;
  
  // Check for keep highest/lowest operations
  const keepHighest = operations.find(op => op.type === 'keep_highest');
  const keepLowest = operations.find(op => op.type === 'keep_lowest');
  
  if (keepHighest && typeof keepHighest.value === 'number' && keepHighest.value === 1) {
    // This is advantage: rolling multiple dice and keeping the highest 1
    return Math.round(calculateExpectedValue(sides, count, 'kh') + modifier);
  }
  
  if (keepLowest && typeof keepLowest.value === 'number' && keepLowest.value === 1) {
    // This is disadvantage: rolling multiple dice and keeping the lowest 1
    return Math.round(calculateExpectedValue(sides, count, 'kl') + modifier);
  }
  
  // For other keep operations, use the proper mathematical calculation
  if (keepHighest && typeof keepHighest.value === 'number') {
    return Math.round(calculateExpectedValueKeep(sides, count, keepHighest.value, 'kh') + modifier);
  }
  
  if (keepLowest && typeof keepLowest.value === 'number') {
    return Math.round(calculateExpectedValueKeep(sides, count, keepLowest.value, 'kl') + modifier);
  }
  
  // Base case: no keep operations, just standard dice
  const dieAverage = (sides + 1) / 2;
  let effectiveCount = count;
  
  // Adjust for minimum values
  const minimumOp = operations.find(op => op.type === 'minimum');
  let adjustedAverage = dieAverage;
  
  if (minimumOp && typeof minimumOp.value === 'number') {
    // Calculate the expected value with minimum constraint
    adjustedAverage = calculateExpectedValueWithMinimum(sides, minimumOp.value);
  }
  
  return Math.round((effectiveCount * adjustedAverage) + modifier);
}

/**
 * Calculate the expected value of rolling n dice and keeping the highest/lowest 1
 * Based on the mathematical formula for order statistics
 */
function calculateExpectedValue(sides: number, n: number, mode: 'kh' | 'kl'): number {
  let total = 0;
  for (let k = 1; k <= sides; k++) {
    let prob = 0;
    if (mode === 'kh') {
      // Probability that the maximum of n dice is k
      prob = Math.pow(k / sides, n) - Math.pow((k - 1) / sides, n);
    } else if (mode === 'kl') {
      // Probability that the minimum of n dice is k
      prob = Math.pow((sides + 1 - k) / sides, n) - Math.pow((sides - k) / sides, n);
    }
    total += k * prob;
  }
  return total;
}

/**
 * Calculate expected value when keeping multiple dice (more complex case)
 * This is an approximation for now - exact calculation is more complex
 */
function calculateExpectedValueKeep(sides: number, n: number, keep: number, mode: 'kh' | 'kl'): number {
  if (keep >= n) {
    // Keeping all dice, just return standard average
    return n * (sides + 1) / 2;
  }
  
  // For now, approximate by calculating the expected value of the k-th order statistic
  // This is a simplified approximation - the exact calculation involves order statistics
  const dieAverage = (sides + 1) / 2;
  
  if (mode === 'kh') {
    // When keeping highest k dice, the expected value is higher than the mean
    // Rough approximation: shift towards the higher end
    const shift = (keep / n) * (sides - dieAverage);
    return keep * (dieAverage + shift * 0.5);
  } else {
    // When keeping lowest k dice, the expected value is lower than the mean
    const shift = (keep / n) * (dieAverage - 1);
    return keep * (dieAverage - shift * 0.5);
  }
}

/**
 * Calculate expected value with a minimum die value constraint
 */
function calculateExpectedValueWithMinimum(sides: number, minimum: number): number {
  let total = 0;
  for (let k = 1; k <= sides; k++) {
    const actualValue = Math.max(k, minimum);
    const prob = 1 / sides;
    total += actualValue * prob;
  }
  return total;
}

/**
 * Estimate the minimum and maximum possible results
 */
export function estimateRange(expression: DiceExpression): { min: number; max: number } {
  const { count, sides, modifier, operations } = expression.parsed;
  
  // Check for keep operations
  const keepHighest = operations.find(op => op.type === 'keep_highest');
  const keepLowest = operations.find(op => op.type === 'keep_lowest');
  
  let min = 1;
  let max = sides;
  let effectiveCount = count;
  
  if (keepHighest && typeof keepHighest.value === 'number') {
    // When keeping highest k dice out of n, min stays 1 but we keep k dice
    effectiveCount = keepHighest.value;
    min = keepHighest.value * 1;  // minimum is k dice each rolling 1
    max = keepHighest.value * sides;  // maximum is k dice each rolling max
  } else if (keepLowest && typeof keepLowest.value === 'number') {
    // When keeping lowest k dice out of n, same logic
    effectiveCount = keepLowest.value;
    min = keepLowest.value * 1;
    max = keepLowest.value * sides;
  } else {
    // No keep operations, use all dice
    min = count * 1;
    max = count * sides;
  }
  
  // Apply minimum constraint
  const minimumOp = operations.find(op => op.type === 'minimum');
  if (minimumOp && typeof minimumOp.value === 'number') {
    const minConstraint = minimumOp.value;
    min = Math.max(min, effectiveCount * minConstraint);
  }
  
  // Exploding dice make max potentially infinite, so we cap it reasonably
  const hasExploding = operations.some(op => op.type === 'explode');
  if (hasExploding) {
    max = max * 2; // Rough estimate - exploding dice could go higher
  }
  
  return { 
    min: Math.max(0, min + modifier), 
    max: max + modifier 
  };
}

// =============================================================================
// MULTI-EXPRESSION PARSER
// =============================================================================

/**
 * Parse any dice expression - single or multiple
 * Supports: "1d20", "1d20,1d8", "attack:1d20+5,damage:1d8+3"
 * @param fullExpression - Any dice expression
 * @returns Unified multi-dice expression (single expressions become single-item arrays)
 */
export function parseAnyDiceExpression(fullExpression: string): MultiDiceExpression {
  const trimmed = fullExpression.trim();
  
  // Split on commas (single expressions will have one part)
  const parts = trimmed.split(',').map(part => part.trim()).filter(part => part.length > 0);
  const expressions: LabeledDiceExpression[] = [];
  
  if (parts.length === 0) {
    throw new DiceParseError(fullExpression, 'Empty expression');
  }
  
  for (const part of parts) {
    const labeledExpression = parseLabeledExpression(part);
    expressions.push(labeledExpression);
  }
  
  return {
    fullExpression: trimmed,
    expressions
  };
}

/**
 * Legacy function - now just calls parseAnyDiceExpression
 * @deprecated Use parseAnyDiceExpression instead
 */
export function parseMultiDiceExpression(fullExpression: string): MultiDiceExpression {
  return parseAnyDiceExpression(fullExpression);
}

/**
 * Parse a single expression that might have a label
 * Supports: "attack:1d20+5", "1d8+3", "damage:2d6"
 * @param expressionPart - Single expression part
 * @returns Labeled dice expression
 */
function parseLabeledExpression(expressionPart: string): LabeledDiceExpression {
  const trimmed = expressionPart.trim();
  
  // Check for label (text followed by colon)
  const labelMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*):(.+)$/);
  
  if (labelMatch) {
    // Has label
    const label = labelMatch[1];
    const diceExpression = labelMatch[2].trim();
    
    return {
      label,
      expression: parseDiceExpression(diceExpression)
    };
  } else {
    // No label
    return {
      expression: parseDiceExpression(trimmed)
    };
  }
}

/**
 * Try to parse multi-dice expression without throwing
 * @param fullExpression - Full expression string
 * @returns Parse result with success/error info
 */
export function tryParseMultiDiceExpression(fullExpression: string): {
  multiExpression?: MultiDiceExpression;
  valid: boolean;
  error?: string;
} {
  try {
    const multiExpression = parseMultiDiceExpression(fullExpression);
    return {
      multiExpression,
      valid: true
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown parsing error'
    };
  }
}

/**
 * Check if an expression contains multiple dice expressions
 * @param expression - Expression to check
 * @returns True if multi-expression (contains comma)
 */
export function isMultiExpression(expression: string): boolean {
  return expression.trim().includes(',');
}

/**
 * Check if an expression has explicit labels
 * @param expression - Expression to check
 * @returns True if contains labels (contains colon)
 */
export function hasLabels(expression: string): boolean {
  return expression.trim().includes(':');
}

/**
 * Get all labels from a multi-expression
 * @param multiExpression - Multi dice expression
 * @returns Array of labels (empty strings for unlabeled)
 */
export function getExpressionLabels(multiExpression: MultiDiceExpression): string[] {
  return multiExpression.expressions.map(expr => expr.label || '');
}

/**
 * Create a multi-expression from individual expressions
 * @param expressions - Array of labeled expressions
 * @returns Multi dice expression
 */
export function createMultiDiceExpression(expressions: LabeledDiceExpression[]): MultiDiceExpression {
  const fullExpression = expressions.map(expr => {
    const label = expr.label ? `${expr.label}:` : '';
    return `${label}${expr.expression.expression}`;
  }).join(',');
  
  return {
    fullExpression,
    expressions
  };
}