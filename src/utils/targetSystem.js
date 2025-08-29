// Configurable target system to replace hardcoded AC assumptions

/**
 * Default target configurations for different encounter types
 */
export const DEFAULT_TARGET_CONFIGURATIONS = {
  // Standard encounter difficulty targets
  'easy': { ac: 12, name: 'Easy Target', description: 'Low-level enemy or minion' },
  'medium': { ac: 15, name: 'Medium Target', description: 'Standard enemy' },
  'hard': { ac: 17, name: 'Hard Target', description: 'Tough enemy or boss' },
  'deadly': { ac: 19, name: 'Deadly Target', description: 'Elite enemy or major boss' },
  
  // Specific creature types
  'goblin': { ac: 13, name: 'Goblin', description: 'Small humanoid' },
  'orc': { ac: 13, name: 'Orc', description: 'Medium humanoid' },
  'skeleton': { ac: 13, name: 'Skeleton', description: 'Medium undead' },
  'zombie': { ac: 8, name: 'Zombie', description: 'Medium undead (slow)' },
  'owlbear': { ac: 13, name: 'Owlbear', description: 'Large monstrosity' },
  'dragon_wyrmling': { ac: 17, name: 'Dragon Wyrmling', description: 'Medium dragon' },
  'knight': { ac: 18, name: 'Knight', description: 'Medium humanoid (heavy armor)' },
  'mage': { ac: 12, name: 'Mage', description: 'Medium humanoid (robes)' },
  
  // Practice targets
  'training_dummy': { ac: 10, name: 'Training Dummy', description: 'Stationary practice target' },
  'armor_stand': { ac: 16, name: 'Armor Stand', description: 'Heavy armor display' }
};

/**
 * Get target configuration by name or default to medium difficulty
 */
export function getTargetConfig(targetName = null, context = {}) {
  if (!targetName) {
    // Default to medium difficulty if no target specified
    return DEFAULT_TARGET_CONFIGURATIONS.medium;
  }
  
  const normalizedName = targetName.toLowerCase().replace(/[^a-z]/g, '_');
  
  // Direct lookup
  if (DEFAULT_TARGET_CONFIGURATIONS[normalizedName]) {
    return DEFAULT_TARGET_CONFIGURATIONS[normalizedName];
  }
  
  // Fuzzy matching
  for (const [key, config] of Object.entries(DEFAULT_TARGET_CONFIGURATIONS)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return config;
    }
  }
  
  // If we have character level context, suggest appropriate difficulty
  if (context.characterLevel) {
    const level = context.characterLevel;
    if (level <= 4) return DEFAULT_TARGET_CONFIGURATIONS.easy;
    else if (level <= 10) return DEFAULT_TARGET_CONFIGURATIONS.medium;
    else if (level <= 16) return DEFAULT_TARGET_CONFIGURATIONS.hard;
    else return DEFAULT_TARGET_CONFIGURATIONS.deadly;
  }
  
  // Final fallback
  return DEFAULT_TARGET_CONFIGURATIONS.medium;
}

/**
 * Calculate hit probability based on attack bonus and target AC
 */
export function calculateHitProbability(attackBonus, targetAC) {
  const requiredRoll = targetAC - attackBonus;
  
  if (requiredRoll <= 1) return 0.95; // 95% chance (natural 1 always misses)
  if (requiredRoll > 20) return 0.05; // 5% chance (natural 20 always hits)
  
  return (21 - requiredRoll) / 20;
}

/**
 * Determine if an attack hits based on attack total and target AC
 */
export function determineHit(attackTotal, targetAC, isNatural20 = false, isNatural1 = false) {
  // Natural 20 always hits (critical hit)
  if (isNatural20) {
    return { hits: true, critical: true, reason: 'Natural 20' };
  }
  
  // Natural 1 always misses (critical miss)
  if (isNatural1) {
    return { hits: false, critical: false, reason: 'Natural 1' };
  }
  
  // Normal hit determination
  const hits = attackTotal >= targetAC;
  return { 
    hits, 
    critical: false, 
    reason: hits ? `${attackTotal} >= ${targetAC}` : `${attackTotal} < ${targetAC}` 
  };
}

/**
 * Create a target context for encounters
 */
export function createTargetContext(targetName, customAC = null, customName = null) {
  const baseConfig = getTargetConfig(targetName);
  
  return {
    name: customName || baseConfig.name,
    ac: customAC !== null ? customAC : baseConfig.ac,
    description: baseConfig.description,
    source: customAC !== null ? 'custom' : 'default'
  };
}

/**
 * Enhanced spell attack resolver that uses configurable target system
 */
export function resolveSpellAttackWithTarget(attackTotal, attackRoll, targetContext = null) {
  const target = targetContext || getTargetConfig('medium');
  
  const isNatural20 = attackRoll === 20;
  const isNatural1 = attackRoll === 1;
  
  const hitResult = determineHit(attackTotal, target.ac, isNatural20, isNatural1);
  
  return {
    hits: hitResult.hits,
    isCritical: hitResult.critical,
    target: target,
    attackTotal,
    targetAC: target.ac,
    reason: hitResult.reason,
    hitProbability: calculateHitProbability(attackTotal - attackRoll, target.ac)
  };
}

/**
 * Legacy compatibility function - replaces hardcoded AC 15 checks
 */
export function checkHitLegacy(attackTotal, targetName = 'medium') {
  const target = getTargetConfig(targetName);
  return attackTotal >= target.ac;
}