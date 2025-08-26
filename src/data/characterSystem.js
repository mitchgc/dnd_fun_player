/**
 * Character Creation and Management System
 * 
 * This module handles character creation, validation, and core character
 * management functionality using D&D 5e rules.
 */

import { 
  calculateProficiencyBonus,
  calculateAllAbilityModifiers,
  calculateHitPoints,
  calculateArmorClass,
  calculateSneakAttackDice,
  calculateSavingThrow,
  isValidAbilityScore,
  isValidLevel
} from './dnd5eRules.js';

import { calculateAllSkillModifiers } from './skillsSystem.js';

// =============================================================================
// CHARACTER TEMPLATES AND PARTY MANAGEMENT
// =============================================================================

/**
 * Create Emba - the specific second character
 * @returns {Object} Emba's complete character object
 */
export const createEmba = () => {
  const embaData = {
    name: 'Emba',
    race: 'Kobold',
    characterClass: 'Warlock',
    level: 5,
    abilityScores: {
      strength: 9,
      dexterity: 12,
      constitution: 12,
      intelligence: 14,
      wisdom: 12,
      charisma: 18
    },
    hitDie: 'd8',
    maxHPOverride: 23,
    acOverride: 13,
    skillProficiencies: ['arcana', 'deception', 'history', 'investigation'],
    savingThrowProficiencies: ['wisdom', 'charisma'],
    weapons: {
      eldritchBlast: {
        name: 'Eldritch Blast',
        damage: '1d10',
        damageType: 'force',
        properties: ['cantrip', 'ranged'],
        range: '120 ft',
        attackBonus: 7,
        damageBonus: 4
      },
      lightCrossbow: {
        name: 'Light Crossbow',
        damage: '1d8',
        damageType: 'piercing',
        properties: ['ranged', 'ammunition'],
        range: '80/320 ft',
        attackBonus: 4
      }
    },
    armor: {
      name: 'Studded Leather',
      ac: 12,
      type: 'light'
    },
    equipment: [
      'Flute', 'Crossbow bolts (20)', 'Component pouch', 'Backpack',
      'Book', 'Ink bottle', 'Ink pen', 'Parchment (10)', 'Traveler\'s clothes',
      'Bag of sand', 'Maps', 'Jewelry (10 gp)'
    ],
    specialAbilities: {
      darkvision: { name: 'Darkvision', description: '60 ft darkvision' },
      geniesVessel: { name: "Genie's Vessel", description: '+3 fire damage bonus' },
      pactMagic: { name: 'Pact Magic', description: '2 spell slots (3rd level)' }
    },
    spells: {
      cantrips: ['Eldritch Blast', 'Thunderclap', 'Minor Illusion'],
      spellsKnown: ['Armor of Agathys', 'Charm Person', 'Hex', 'Darkness', 'Crown of Madness']
    },
    languages: ['Common', 'Dwarvish', 'Draconic'],
    notes: 'Kobold Warlock (Efreeti). HP: 23, AC: 13. Weight: 31.5 lb, Coins: 118 gp'
  }
  
  return createCharacter(embaData)
}

/**
 * Create a simple second character template that can be customized
 * @param {Object} characterData - Basic character info
 * @returns {Object} Character object ready for customization
 */
export const createSecondCharacter = (characterData = {}) => {
  const defaultCharacter = {
    name: characterData.name || 'Second Character',
    race: characterData.race || 'Human',
    characterClass: characterData.characterClass || 'Fighter',
    level: characterData.level || 1,
    abilityScores: characterData.abilityScores || {
      strength: 15,
      dexterity: 14,
      constitution: 13,
      intelligence: 12,
      wisdom: 10,
      charisma: 8
    },
    weapons: characterData.weapons || {
      longsword: {
        name: 'Longsword',
        damage: '1d8',
        damageType: 'slashing',
        properties: ['versatile']
      }
    },
    armor: characterData.armor || {
      name: 'Chain Mail',
      ac: 16,
      type: 'heavy'
    },
    skillProficiencies: characterData.skillProficiencies || ['athletics', 'intimidation'],
    savingThrowProficiencies: characterData.savingThrowProficiencies || ['strength', 'constitution']
  }
  
  return createCharacter(defaultCharacter)
}

/**
 * Party management functions
 */
export const createParty = (characters = []) => {
  return {
    id: generatePartyId(),
    members: characters,
    createdAt: new Date().toISOString(),
    session: {
      currentTurn: 0,
      initiative: [],
      conditions: {}
    }
  }
}

export const addCharacterToParty = (party, character) => {
  return {
    ...party,
    members: [...party.members, character],
    lastModified: new Date().toISOString()
  }
}

// Generate unique IDs
const generatePartyId = () => `party_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// =============================================================================
// CHARACTER CREATION
// =============================================================================

/**
 * Create a complete D&D 5e character with proper calculations
 * @param {Object} characterData - Character configuration object
 * @returns {Object} Complete character object with calculated stats
 */
export const createCharacter = ({
  // Basic Information
  id = null,
  name,
  race,
  characterClass,
  level,
  background = null,
  
  // Core Stats
  abilityScores = {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10
  },
  
  // Class Features
  hitDie = 'd8',
  skillProficiencies = [],
  skillExpertise = [],
  savingThrowProficiencies = [],
  
  // Equipment
  weapons = {},
  armor = null,
  equipment = [],
  
  // Special Features and Abilities
  specialAbilities = {},
  features = [],
  spells = [],
  
  // Optional Overrides (for custom builds)
  maxHPOverride = null,
  acOverride = null,
  
  // Bonuses and Modifiers
  skillBonuses = {},
  abilityBonuses = {},
  
  // Backstory and Roleplay
  backstory = {},
  
  // Metadata
  notes = ''
}) => {
  // Validate inputs
  validateCharacterInputs({ name, race, characterClass, level, abilityScores });
  
  // Calculate final ability scores (base + bonuses)
  const finalAbilityScores = Object.keys(abilityScores).reduce((scores, ability) => {
    scores[ability] = abilityScores[ability] + (abilityBonuses[ability] || 0);
    return scores;
  }, {});
  
  // Calculate derived stats
  const abilityModifiers = calculateAllAbilityModifiers(finalAbilityScores);
  const proficiencyBonus = calculateProficiencyBonus(level);
  const conModifier = abilityModifiers.constitution;
  
  // Calculate hit points
  const maxHP = maxHPOverride || calculateHitPoints(hitDie, level, conModifier);
  
  // Calculate armor class
  const ac = acOverride || calculateArmorClass(armor, abilityModifiers.dexterity);
  
  // Create character object for skill calculations
  const characterForSkills = {
    abilityScores: finalAbilityScores,
    proficiencyBonus,
    skillProficiencies,
    skillExpertise,
    skillBonuses
  };
  
  // Calculate all skills
  const skills = calculateAllSkillModifiers(characterForSkills);
  
  // Calculate saving throws
  const savingThrows = Object.keys(abilityModifiers).reduce((saves, ability) => {
    saves[ability] = calculateSavingThrow(ability, {
      abilityModifiers,
      savingThrowProficiencies,
      proficiencyBonus
    });
    return saves;
  }, {});
  
  // Calculate class-specific features
  const classFeatures = calculateClassFeatures(characterClass, level);
  
  return {
    // Identifiers
    id: id || generateCharacterId(),
    
    // Basic Information
    name,
    race,
    class: characterClass,
    level,
    background,
    hitDie,
    
    // Core Stats
    abilityScores: finalAbilityScores,
    abilityModifiers,
    proficiencyBonus,
    
    // Combat Stats
    maxHP,
    ac,
    initiative: abilityModifiers.dexterity,
    speed: 30, // Default speed, can be overridden by race
    
    // Skills and Saves
    skills,
    savingThrows,
    skillProficiencies,
    skillExpertise,
    savingThrowProficiencies,
    
    // Equipment
    weapons,
    armor,
    equipment,
    
    // Class and Race Features
    specialAbilities,
    defensiveAbilities: specialAbilities, // Map specialAbilities to defensiveAbilities for component compatibility
    features: [...features, ...classFeatures],
    spells,
    
    // Class-specific calculations
    ...calculateClassSpecificStats(characterClass, level),
    
    // Bonuses and Modifiers
    skillBonuses,
    abilityBonuses,
    
    // Roleplay Information
    backstory,
    notes,
    
    // Metadata
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString()
  };
};

// =============================================================================
// CHARACTER VALIDATION
// =============================================================================

/**
 * Validate character creation inputs
 * @param {Object} inputs - Character creation inputs
 * @throws {Error} If validation fails
 */
const validateCharacterInputs = ({ name, race, characterClass, level, abilityScores }) => {
  // Required fields
  if (!name || typeof name !== 'string') {
    throw new Error('Character name is required and must be a string');
  }
  
  if (!race || typeof race !== 'string') {
    throw new Error('Character race is required and must be a string');
  }
  
  if (!characterClass || typeof characterClass !== 'string') {
    throw new Error('Character class is required and must be a string');
  }
  
  // Level validation
  if (!isValidLevel(level)) {
    throw new Error('Character level must be between 1 and 20');
  }
  
  // Ability scores validation
  const requiredAbilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
  for (const ability of requiredAbilities) {
    if (!abilityScores[ability] || !isValidAbilityScore(abilityScores[ability])) {
      throw new Error(`Invalid ${ability} score: must be between 1 and 30`);
    }
  }
};

/**
 * Validate an existing character object
 * @param {Object} character - Character object to validate
 * @returns {boolean} Whether the character is valid
 */
export const validateCharacter = (character) => {
  try {
    const requiredFields = ['id', 'name', 'race', 'class', 'level', 'abilityScores'];
    
    for (const field of requiredFields) {
      if (!character[field]) {
        return false;
      }
    }
    
    validateCharacterInputs({
      name: character.name,
      race: character.race,
      characterClass: character.class,
      level: character.level,
      abilityScores: character.abilityScores
    });
    
    return true;
  } catch (error) {
    return false;
  }
};

// =============================================================================
// CLASS-SPECIFIC CALCULATIONS
// =============================================================================

/**
 * Calculate class-specific statistics
 * @param {string} characterClass - Character class
 * @param {number} level - Character level
 * @returns {Object} Class-specific stats
 */
const calculateClassSpecificStats = (characterClass, level) => {
  const stats = {};
  
  // Rogue-specific calculations
  if (characterClass.toLowerCase().includes('rogue')) {
    stats.sneakAttackDice = calculateSneakAttackDice(level);
  }
  
  // Add other class-specific calculations here as needed
  // Example: Barbarian rage damage, Fighter action surge uses, etc.
  
  return stats;
};

/**
 * Calculate class features gained at specific levels
 * @param {string} characterClass - Character class
 * @param {number} level - Character level
 * @returns {Array} Array of class features
 */
const calculateClassFeatures = (characterClass, level) => {
  const features = [];
  
  // This is a simplified version - in a full implementation,
  // you'd have complete class feature tables
  if (characterClass.toLowerCase().includes('rogue')) {
    if (level >= 1) {
      features.push({
        name: 'Expertise',
        description: 'Double proficiency bonus for two skills',
        level: 1
      });
      features.push({
        name: 'Sneak Attack',
        description: `Deal extra ${calculateSneakAttackDice(level)}d6 damage when you have advantage`,
        level: 1
      });
    }
    
    if (level >= 2) {
      features.push({
        name: 'Cunning Action',
        description: 'Dash, Disengage, or Hide as a bonus action',
        level: 2
      });
    }
    
    if (level >= 5) {
      features.push({
        name: 'Uncanny Dodge',
        description: 'Halve damage from one attack per turn',
        level: 5
      });
    }
  }
  
  return features;
};

// =============================================================================
// CHARACTER MODIFICATION
// =============================================================================

/**
 * Update character with new data
 * @param {Object} character - Existing character
 * @param {Object} updates - Updates to apply
 * @returns {Object} Updated character
 */
export const updateCharacter = (character, updates) => {
  const updatedCharacter = {
    ...character,
    ...updates,
    lastModified: new Date().toISOString()
  };
  
  // If ability scores changed, recalculate derived stats
  if (updates.abilityScores || updates.level) {
    return createCharacter({
      ...character,
      ...updates
    });
  }
  
  return updatedCharacter;
};

/**
 * Level up a character
 * @param {Object} character - Character to level up
 * @param {Object} levelUpChoices - Choices made during level up
 * @returns {Object} Leveled up character
 */
export const levelUpCharacter = (character, levelUpChoices = {}) => {
  if (character.level >= 20) {
    throw new Error('Character is already at maximum level');
  }
  
  const newLevel = character.level + 1;
  
  // Calculate new hit points (using average + con mod)
  const hitDieValue = parseInt(character.hitDie.substring(1));
  const averageRoll = Math.floor(hitDieValue / 2) + 1;
  const hpGain = averageRoll + character.abilityModifiers.constitution;
  const newMaxHP = character.maxHP + Math.max(1, hpGain); // Minimum 1 HP gain
  
  return updateCharacter(character, {
    level: newLevel,
    maxHP: newMaxHP,
    proficiencyBonus: calculateProficiencyBonus(newLevel),
    ...levelUpChoices
  });
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate a unique character ID
 * @returns {string} Unique character ID
 */
const generateCharacterId = () => {
  return `character-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get character summary for display
 * @param {Object} character - Character object
 * @returns {Object} Character summary
 */
export const getCharacterSummary = (character) => {
  return {
    id: character.id,
    name: character.name,
    race: character.race,
    class: character.class,
    level: character.level,
    hp: character.maxHP,
    ac: character.ac,
    proficiencyBonus: character.proficiencyBonus,
    topSkills: Object.entries(character.skills)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([skill, modifier]) => ({ skill, modifier }))
  };
};

/**
 * Clone a character (for creating variants or backups)
 * @param {Object} character - Character to clone
 * @param {Object} modifications - Optional modifications to apply
 * @returns {Object} Cloned character
 */
export const cloneCharacter = (character, modifications = {}) => {
  const clonedCharacter = {
    ...character,
    id: generateCharacterId(),
    name: `${character.name} (Copy)`,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    ...modifications
  };
  
  return clonedCharacter;
};