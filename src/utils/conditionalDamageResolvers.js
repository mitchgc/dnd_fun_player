// Configurable conditional damage resolvers to replace hardcoded special cases

/**
 * Conditional damage configuration database
 * This replaces hardcoded assumptions like "3d6" for all conditional damage
 */
export const CONDITIONAL_DAMAGE_CONFIGURATIONS = {
  // Rogue Sneak Attack - scales by level
  'sneak_attack': {
    name: 'Sneak Attack',
    description: 'Extra damage when you have advantage or an ally is adjacent',
    scaling: {
      type: 'level_based',
      formula: (level) => Math.ceil(level / 2), // 1d6 at level 1-2, 2d6 at 3-4, etc.
      dice_type: 'd6',
      max_dice: 10 // Cap at 10d6 for 20th level rogue
    },
    conditions: [
      'has_advantage',
      'ally_adjacent_to_target', 
      'target_cant_see_attacker'
    ],
    frequency: 'once_per_turn',
    tags: ['rogue', 'finesse_weapon', 'ranged_weapon']
  },
  
  // Paladin Divine Smite - scales by spell slot level
  'divine_smite': {
    name: 'Divine Smite',
    description: 'Extra radiant damage using spell slot',
    scaling: {
      type: 'resource_based',
      base_dice: 2, // 2d8 base
      additional_per_level: 1, // +1d8 per spell slot level above 1st
      dice_type: 'd8',
      max_dice: 5 // 2d8 + 3d8 = 5d8 max (4th level slot)
    },
    conditions: ['has_spell_slot'],
    frequency: 'on_demand',
    damage_type: 'radiant',
    extra_vs_undead_fiend: '1d8', // Extra die vs undead/fiends
    tags: ['paladin', 'melee_weapon', 'spell_slot']
  },
  
  // Ranger Hunter's Mark - fixed damage
  'hunters_mark': {
    name: "Hunter's Mark",
    description: 'Extra damage against marked target',
    scaling: {
      type: 'fixed',
      dice_expression: '1d6'
    },
    conditions: ['target_is_marked'],
    frequency: 'per_hit',
    damage_type: 'weapon', // Same type as weapon
    duration: 'concentration',
    tags: ['ranger', 'spell', 'concentration']
  },
  
  // Barbarian Rage Damage - scales by level
  'rage_damage': {
    name: 'Rage Damage',
    description: 'Extra damage while raging',
    scaling: {
      type: 'level_based',
      formula: (level) => {
        if (level >= 16) return 4;
        if (level >= 9) return 3; 
        return 2;
      },
      dice_type: 'flat' // Flat bonus, not dice
    },
    conditions: ['is_raging'],
    frequency: 'per_hit',
    damage_type: 'weapon',
    tags: ['barbarian', 'melee_weapon', 'strength']
  }
};

/**
 * Get conditional damage configuration by name (flexible matching)
 */
export function getConditionalDamageConfig(damageName) {
  if (!damageName) return null;
  
  const normalizedName = damageName.toLowerCase().replace(/[^a-z]/g, '_');
  
  // Direct lookup
  if (CONDITIONAL_DAMAGE_CONFIGURATIONS[normalizedName]) {
    return CONDITIONAL_DAMAGE_CONFIGURATIONS[normalizedName];
  }
  
  // Fuzzy matching for backwards compatibility
  for (const [key, config] of Object.entries(CONDITIONAL_DAMAGE_CONFIGURATIONS)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return config;
    }
  }
  
  return null;
}

/**
 * Calculate conditional damage dice based on character level and configuration
 */
export function calculateConditionalDamage(config, character, context = {}) {
  if (!config || !config.scaling) {
    return null;
  }
  
  const characterLevel = character?.level || 1;
  const scaling = config.scaling;
  
  switch (scaling.type) {
    case 'level_based': {
      let diceCount;
      if (typeof scaling.formula === 'function') {
        diceCount = scaling.formula(characterLevel);
      } else {
        diceCount = Math.ceil(characterLevel / 2); // Default rogue progression
      }
      
      // Apply max dice limit
      if (scaling.max_dice) {
        diceCount = Math.min(diceCount, scaling.max_dice);
      }
      
      if (scaling.dice_type === 'flat') {
        return {
          expression: diceCount.toString(),
          damage_type: config.damage_type || 'weapon',
          dice_count: 0,
          flat_bonus: diceCount
        };
      } else {
        return {
          expression: `${diceCount}${scaling.dice_type}`,
          damage_type: config.damage_type || 'weapon',
          dice_count: diceCount,
          dice_size: parseInt(scaling.dice_type.replace('d', '')),
          flat_bonus: 0
        };
      }
    }
    
    case 'resource_based': {
      const spellLevel = context.spell_slot_level || 1;
      let totalDice = scaling.base_dice;
      
      if (spellLevel > 1) {
        totalDice += (spellLevel - 1) * scaling.additional_per_level;
      }
      
      // Apply max dice limit
      if (scaling.max_dice) {
        totalDice = Math.min(totalDice, scaling.max_dice);
      }
      
      return {
        expression: `${totalDice}${scaling.dice_type}`,
        damage_type: config.damage_type || 'radiant',
        dice_count: totalDice,
        dice_size: parseInt(scaling.dice_type.replace('d', '')),
        flat_bonus: 0
      };
    }
    
    case 'fixed': {
      const { parseDiceExpression } = require('./diceParser');
      try {
        const parsed = parseDiceExpression(scaling.dice_expression);
        return {
          expression: scaling.dice_expression,
          damage_type: config.damage_type || 'weapon',
          dice_count: parsed.count,
          dice_size: parsed.sides,
          flat_bonus: parsed.modifier || 0
        };
      } catch (error) {
        console.warn('Failed to parse fixed conditional damage:', scaling.dice_expression);
        return null;
      }
    }
    
    default:
      console.warn('Unknown conditional damage scaling type:', scaling.type);
      return null;
  }
}

/**
 * Main conditional damage resolver - replaces hardcoded 3d6 logic
 */
export function resolveConditionalDamage(bonusData, character, context = {}) {
  if (!bonusData || !character) {
    return null;
  }
  
  // Try to identify the conditional damage type
  let configKey = null;
  
  // Check if bonus has explicit type
  if (bonusData.type) {
    configKey = bonusData.type.toLowerCase();
  }
  // Try to infer from name
  else if (bonusData.name) {
    const name = bonusData.name.toLowerCase();
    if (name.includes('sneak')) configKey = 'sneak_attack';
    else if (name.includes('smite')) configKey = 'divine_smite';
    else if (name.includes('hunter')) configKey = 'hunters_mark';
    else if (name.includes('rage')) configKey = 'rage_damage';
  }
  // Legacy: check damage_dice for hardcoded patterns
  else if (bonusData.damage_dice) {
    if (bonusData.damage_dice.includes('3d6')) {
      // Assume it's sneak attack if it's 3d6
      configKey = 'sneak_attack';
    }
  }
  
  if (!configKey) {
    console.warn('Could not identify conditional damage type:', bonusData);
    return null;
  }
  
  const config = CONDITIONAL_DAMAGE_CONFIGURATIONS[configKey];
  if (!config) {
    console.warn('No configuration found for conditional damage:', configKey);
    return null;
  }
  
  // Calculate the conditional damage based on character level and configuration
  const damageInfo = calculateConditionalDamage(config, character, context);
  
  if (!damageInfo) {
    return null;
  }
  
  return {
    name: config.name,
    description: config.description,
    expression: damageInfo.expression,
    damage_type: damageInfo.damage_type,
    dice_count: damageInfo.dice_count,
    dice_size: damageInfo.dice_size,
    flat_bonus: damageInfo.flat_bonus,
    frequency: config.frequency,
    conditions: config.conditions,
    tags: config.tags
  };
}

/**
 * Legacy compatibility function for existing code that expects damage_dice strings
 */
export function getLevelScaledSneakAttack(characterLevel) {
  const config = CONDITIONAL_DAMAGE_CONFIGURATIONS.sneak_attack;
  const character = { level: characterLevel };
  const damageInfo = calculateConditionalDamage(config, character);
  
  return damageInfo ? damageInfo.expression : '3d6'; // Fallback to old hardcoded value
}