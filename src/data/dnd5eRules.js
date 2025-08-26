/**
 * D&D 5e Core Rules and Mathematical Calculations
 * 
 * This module contains all the official D&D 5e mathematical formulas
 * and rule implementations. These are pure functions that follow
 * the official Player's Handbook rules.
 */

// =============================================================================
// CORE ABILITY CALCULATIONS
// =============================================================================

/**
 * Calculate ability modifier from ability score (PHB p.13)
 * @param {number} abilityScore - Raw ability score (1-30)
 * @returns {number} Ability modifier
 */
export const calculateAbilityModifier = (abilityScore) => {
  return Math.floor((abilityScore - 10) / 2);
};

/**
 * Calculate proficiency bonus based on character level (PHB p.15)
 * @param {number} level - Character level (1-20)
 * @returns {number} Proficiency bonus
 */
export const calculateProficiencyBonus = (level) => {
  return Math.ceil(level / 4) + 1;
};

// =============================================================================
// HEALTH AND COMBAT CALCULATIONS
// =============================================================================

/**
 * Calculate hit points based on class and level (PHB p.15)
 * Uses average HP progression for consistency
 * @param {string} hitDie - Hit die type (d6, d8, d10, d12)
 * @param {number} level - Character level
 * @param {number} conModifier - Constitution modifier
 * @returns {number} Hit points
 */
export const calculateHitPoints = (hitDie, level, conModifier) => {
  const hitDieValue = parseInt(hitDie.substring(1)); // Remove 'd' prefix
  const firstLevelHP = hitDieValue + conModifier;
  const additionalLevels = level - 1;
  const averageRoll = Math.floor(hitDieValue / 2) + 1;
  
  return firstLevelHP + (additionalLevels * (averageRoll + conModifier));
};

/**
 * Calculate armor class based on armor type and dexterity (PHB p.144)
 * @param {Object} armor - Armor object with type and baseAC
 * @param {number} dexModifier - Dexterity modifier
 * @returns {number} Armor class
 */
export const calculateArmorClass = (armor, dexModifier) => {
  if (!armor) return 10 + dexModifier; // Unarmored
  
  switch (armor.type) {
    case 'light':
      return armor.baseAC + dexModifier;
    case 'medium':
      return armor.baseAC + Math.min(dexModifier, 2);
    case 'heavy':
      return armor.baseAC;
    default:
      return 10 + dexModifier;
  }
};

// =============================================================================
// CLASS-SPECIFIC CALCULATIONS
// =============================================================================

/**
 * Calculate sneak attack dice for rogues (PHB p.96)
 * @param {number} level - Rogue level
 * @returns {number} Number of sneak attack dice
 */
export const calculateSneakAttackDice = (level) => {
  return Math.ceil(level / 2);
};

/**
 * Calculate spell slots for full casters (PHB spell slot tables)
 * @param {number} level - Caster level
 * @param {number} spellLevel - Spell level (1-9)
 * @returns {number} Number of spell slots
 */
export const calculateSpellSlots = (level, spellLevel) => {
  const spellSlotTable = {
    1: [2, 0, 0, 0, 0, 0, 0, 0, 0],
    2: [3, 0, 0, 0, 0, 0, 0, 0, 0],
    3: [4, 2, 0, 0, 0, 0, 0, 0, 0],
    4: [4, 3, 0, 0, 0, 0, 0, 0, 0],
    5: [4, 3, 2, 0, 0, 0, 0, 0, 0],
    6: [4, 3, 3, 0, 0, 0, 0, 0, 0],
    7: [4, 3, 3, 1, 0, 0, 0, 0, 0],
    8: [4, 3, 3, 2, 0, 0, 0, 0, 0],
    9: [4, 3, 3, 3, 1, 0, 0, 0, 0],
    10: [4, 3, 3, 3, 2, 0, 0, 0, 0],
    11: [4, 3, 3, 3, 2, 1, 0, 0, 0],
    12: [4, 3, 3, 3, 2, 1, 0, 0, 0],
    13: [4, 3, 3, 3, 2, 1, 1, 0, 0],
    14: [4, 3, 3, 3, 2, 1, 1, 0, 0],
    15: [4, 3, 3, 3, 2, 1, 1, 1, 0],
    16: [4, 3, 3, 3, 2, 1, 1, 1, 0],
    17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
    18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
    19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
    20: [4, 3, 3, 3, 3, 2, 2, 1, 1]
  };
  
  return spellSlotTable[level]?.[spellLevel - 1] || 0;
};

// =============================================================================
// WEAPON AND ATTACK CALCULATIONS
// =============================================================================

/**
 * Calculate weapon attack bonus (PHB p.194)
 * @param {Object} weapon - Weapon object with properties
 * @param {Object} character - Character object with ability modifiers
 * @returns {number} Total attack bonus
 */
export const calculateWeaponAttackBonus = (weapon, character) => {
  const isFinesse = weapon.properties?.includes('finesse');
  const isRanged = weapon.type === 'ranged';
  
  let abilityMod;
  if (isFinesse) {
    // Use higher of STR or DEX for finesse weapons
    abilityMod = Math.max(character.abilityModifiers.strength, character.abilityModifiers.dexterity);
  } else if (isRanged) {
    abilityMod = character.abilityModifiers.dexterity;
  } else {
    abilityMod = character.abilityModifiers.strength;
  }
  
  return abilityMod + character.proficiencyBonus;
};

/**
 * Calculate weapon damage bonus (PHB p.194)
 * @param {Object} weapon - Weapon object with properties
 * @param {Object} character - Character object with ability modifiers
 * @returns {number} Damage bonus
 */
export const calculateWeaponDamageBonus = (weapon, character) => {
  const isFinesse = weapon.properties?.includes('finesse');
  const isRanged = weapon.type === 'ranged';
  
  if (isFinesse) {
    return Math.max(character.abilityModifiers.strength, character.abilityModifiers.dexterity);
  } else if (isRanged) {
    return character.abilityModifiers.dexterity;
  } else {
    return character.abilityModifiers.strength;
  }
};

// =============================================================================
// SPELLCASTING CALCULATIONS
// =============================================================================

/**
 * Calculate spell save DC (PHB p.205)
 * @param {number} spellcastingAbilityMod - Spellcasting ability modifier
 * @param {number} proficiencyBonus - Proficiency bonus
 * @returns {number} Spell save DC
 */
export const calculateSpellSaveDC = (spellcastingAbilityMod, proficiencyBonus) => {
  return 8 + spellcastingAbilityMod + proficiencyBonus;
};

/**
 * Calculate spell attack bonus (PHB p.205)
 * @param {number} spellcastingAbilityMod - Spellcasting ability modifier
 * @param {number} proficiencyBonus - Proficiency bonus
 * @returns {number} Spell attack bonus
 */
export const calculateSpellAttackBonus = (spellcastingAbilityMod, proficiencyBonus) => {
  return spellcastingAbilityMod + proficiencyBonus;
};

// =============================================================================
// SKILL AND SAVE CALCULATIONS
// =============================================================================

/**
 * Calculate skill modifier for a specific skill (PHB p.174)
 * @param {string} skillKey - Skill identifier
 * @param {string} abilityKey - Associated ability for the skill
 * @param {Object} character - Character object
 * @returns {number} Total skill modifier
 */
export const calculateSkillModifier = (skillKey, abilityKey, character) => {
  const abilityScore = character.abilityScores[abilityKey];
  const abilityModifier = calculateAbilityModifier(abilityScore);
  let totalModifier = abilityModifier;
  
  // Add proficiency bonus if proficient
  if (character.skillProficiencies?.includes(skillKey)) {
    totalModifier += character.proficiencyBonus;
  }
  
  // Add expertise bonus if applicable (double proficiency)
  if (character.skillExpertise?.includes(skillKey)) {
    totalModifier += character.proficiencyBonus;
  }
  
  // Add any special bonuses
  if (character.skillBonuses?.[skillKey]) {
    totalModifier += character.skillBonuses[skillKey];
  }
  
  return totalModifier;
};

/**
 * Calculate saving throw modifier (PHB p.179)
 * @param {string} abilityKey - Ability being saved
 * @param {Object} character - Character object
 * @returns {number} Total saving throw modifier
 */
export const calculateSavingThrow = (abilityKey, character) => {
  const abilityModifier = character.abilityModifiers[abilityKey];
  const isProficient = character.savingThrowProficiencies?.includes(abilityKey);
  
  return abilityModifier + (isProficient ? character.proficiencyBonus : 0);
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get all ability modifiers from ability scores
 * @param {Object} abilityScores - Object with all six ability scores
 * @returns {Object} Object with all ability modifiers
 */
export const calculateAllAbilityModifiers = (abilityScores) => {
  return Object.keys(abilityScores).reduce((mods, ability) => {
    mods[ability] = calculateAbilityModifier(abilityScores[ability]);
    return mods;
  }, {});
};

/**
 * Validate ability score range (PHB p.13)
 * @param {number} score - Ability score to validate
 * @returns {boolean} Whether the score is valid
 */
export const isValidAbilityScore = (score) => {
  return typeof score === 'number' && score >= 1 && score <= 30;
};

/**
 * Validate character level range
 * @param {number} level - Character level to validate
 * @returns {boolean} Whether the level is valid
 */
export const isValidLevel = (level) => {
  return typeof level === 'number' && level >= 1 && level <= 20;
};