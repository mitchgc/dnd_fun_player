// Configurable spell attack resolvers to replace hardcoded special cases

/**
 * Spell configuration database
 * This replaces hardcoded string matching like "eldritch blast"
 */
export const SPELL_CONFIGURATIONS = {
  // Multi-beam spells that scale with level
  'eldritch_blast': {
    name: 'Eldritch Blast',
    type: 'spell_attack',
    damage_dice: '1d10',
    damage_type: 'force',
    scaling: {
      type: 'beam_count',
      levels: { 1: 1, 5: 2, 11: 3, 17: 4 }
    },
    tags: ['cantrip', 'ranged', 'multi_beam']
  },
  
  'scorching_ray': {
    name: 'Scorching Ray',
    type: 'spell_attack',
    damage_dice: '2d6',
    damage_type: 'fire',
    scaling: {
      type: 'beam_count',
      levels: { 2: 3 } // Always 3 beams at 2nd level
    },
    tags: ['spell', 'ranged', 'multi_beam']
  },
  
  // Add more spells as needed
};

/**
 * Get spell configuration by name (flexible matching)
 */
export function getSpellConfig(spellName) {
  if (!spellName) return null;
  
  const normalizedName = spellName.toLowerCase().replace(/[^a-z]/g, '_');
  
  // Direct lookup
  if (SPELL_CONFIGURATIONS[normalizedName]) {
    return SPELL_CONFIGURATIONS[normalizedName];
  }
  
  // Fuzzy matching for backwards compatibility
  for (const [key, config] of Object.entries(SPELL_CONFIGURATIONS)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return config;
    }
  }
  
  return null;
}

/**
 * Calculate beam count for multi-beam spells based on character level
 */
export function calculateBeamCount(spellConfig, characterLevel) {
  if (!spellConfig?.scaling || spellConfig.scaling.type !== 'beam_count') {
    return 1; // Single beam/attack
  }
  
  const levels = spellConfig.scaling.levels;
  let beamCount = 1;
  
  // Find the highest level threshold the character meets
  for (const [level, count] of Object.entries(levels)) {
    if (characterLevel >= parseInt(level)) {
      beamCount = count;
    }
  }
  
  return beamCount;
}

/**
 * Multi-attack resolver - replaces hardcoded Eldritch Blast logic
 */
export function resolveMultiAttackSpell(ability, character, isHidden = false) {
  // Get spell configuration
  const spellConfig = getSpellConfig(ability.ability_name);
  if (!spellConfig) {
    // Not a configured multi-attack spell, treat as single attack
    return resolveSingleSpellAttack(ability, character, isHidden);
  }
  
  // Calculate beam count based on character level and spell scaling
  const numBeams = calculateBeamCount(spellConfig, character?.level || 1);
  
  // Use spell config data, falling back to ability data
  const attackBonus = ability.ability_data?.attack_bonus || 0;
  const baseDamage = spellConfig.damage_dice || ability.ability_data?.damage || '1d10';
  const damageType = spellConfig.damage_type || ability.ability_data?.damage_type || 'force';
  
  return {
    type: 'multi_attack',
    spellName: spellConfig.name,
    numBeams,
    attackBonus,
    baseDamage,
    damageType,
    tags: spellConfig.tags || [],
    scaling: spellConfig.scaling
  };
}

/**
 * Single spell attack resolver - for non-multi-beam spells
 */
export function resolveSingleSpellAttack(ability, character, isHidden = false) {
  const attackBonus = ability.ability_data?.attack_bonus || 0;
  const baseDamage = ability.ability_data?.damage || '1d8';
  const damageType = ability.ability_data?.damage_type || 'magical';
  
  return {
    type: 'single_attack',
    spellName: ability.ability_name,
    numBeams: 1,
    attackBonus,
    baseDamage,
    damageType,
    tags: ['spell']
  };
}

/**
 * Main spell resolver function - replaces hardcoded spell attack logic
 * This function determines whether a spell is multi-attack or single attack
 * and returns the appropriate configuration
 */
export function resolveSpellAttack(ability, character, isHidden = false) {
  if (!ability || !character) {
    console.error('Ability and character data required for spell resolution');
    return null;
  }
  
  // Try to resolve as multi-attack spell first
  const multiAttackResult = resolveMultiAttackSpell(ability, character, isHidden);
  
  // If it's not a multi-attack spell, it will be resolved as single attack
  return multiAttackResult;
}