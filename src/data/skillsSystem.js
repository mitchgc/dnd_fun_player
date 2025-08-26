/**
 * D&D 5e Skills System
 * 
 * This module contains all skill definitions, categories, and utility functions
 * for managing character skills in D&D 5e.
 */

import { calculateSkillModifier } from './dnd5eRules.js';

// =============================================================================
// SKILL DEFINITIONS
// =============================================================================

/**
 * Complete D&D 5e skill definitions (PHB p.174-179)
 * Each skill includes its associated ability, description, category, and icon
 */
export const SKILLS = {
  // Strength-based
  athletics: {
    name: 'Athletics',
    ability: 'strength',
    description: 'Climbing, jumping, swimming, and other physical activities',
    category: 'physical',
    icon: '💪',
    examples: ['Climbing a cliff', 'Swimming across a river', 'Jumping a chasm', 'Breaking down doors']
  },
  
  // Dexterity-based
  acrobatics: {
    name: 'Acrobatics',
    ability: 'dexterity',
    description: 'Balance, tumbling, and staying upright in tricky situations',
    category: 'physical',
    icon: '🤸',
    examples: ['Staying upright on a tightrope', 'Landing safely after a fall', 'Performing acrobatic stunts']
  },
  sleightOfHand: {
    name: 'Sleight of Hand',
    ability: 'dexterity',
    description: 'Manual trickery, pickpocketing, and concealing objects',
    category: 'physical',
    icon: '🎩',
    examples: ['Picking a pocket', 'Palming a coin', 'Hiding a dagger', 'Lockpicking']
  },
  stealth: {
    name: 'Stealth',
    ability: 'dexterity',
    description: 'Hiding and moving silently',
    category: 'physical',
    icon: '👤',
    examples: ['Sneaking past guards', 'Hiding in shadows', 'Moving quietly', 'Avoiding detection']
  },
  
  // Intelligence-based
  arcana: {
    name: 'Arcana',
    ability: 'intelligence',
    description: 'Knowledge of magic, spells, and magical phenomena',
    category: 'knowledge',
    icon: '🔮',
    examples: ['Identifying a spell', 'Recalling magical lore', 'Understanding magical items']
  },
  history: {
    name: 'History',
    ability: 'intelligence',
    description: 'Knowledge of historical events and legends',
    category: 'knowledge',
    icon: '📜',
    examples: ['Recalling ancient battles', 'Knowing royal lineages', 'Understanding historical significance']
  },
  investigation: {
    name: 'Investigation',
    ability: 'intelligence',
    description: 'Looking for clues and making deductions',
    category: 'knowledge',
    icon: '🔍',
    examples: ['Searching a crime scene', 'Deciphering clues', 'Making logical deductions']
  },
  nature: {
    name: 'Nature',
    ability: 'intelligence',
    description: 'Knowledge of terrain, plants, animals, and weather',
    category: 'knowledge',
    icon: '🌿',
    examples: ['Identifying tracks', 'Predicting weather', 'Recognizing plants and animals']
  },
  religion: {
    name: 'Religion',
    ability: 'intelligence',
    description: 'Knowledge of deities, rites, and religious hierarchies',
    category: 'knowledge',
    icon: '⛪',
    examples: ['Recognizing religious symbols', 'Knowing religious customs', 'Understanding divine magic']
  },
  
  // Wisdom-based
  animalHandling: {
    name: 'Animal Handling',
    ability: 'wisdom',
    description: 'Calming and controlling animals',
    category: 'social',
    icon: '🐕',
    examples: ['Calming a frightened horse', 'Training a guard dog', 'Communicating with wild animals']
  },
  insight: {
    name: 'Insight',
    ability: 'wisdom',
    description: 'Determining true intentions and reading body language',
    category: 'social',
    icon: '👁️',
    examples: ['Detecting lies', 'Reading emotions', 'Sensing motivations', 'Understanding hidden agendas']
  },
  medicine: {
    name: 'Medicine',
    ability: 'wisdom',
    description: 'Stabilizing the dying and diagnosing illness',
    category: 'practical',
    icon: '⚕️',
    examples: ['Stabilizing a dying ally', 'Diagnosing poison', 'Treating wounds', 'Identifying diseases']
  },
  perception: {
    name: 'Perception',
    ability: 'wisdom',
    description: 'Spotting, hearing, or detecting things',
    category: 'practical',
    icon: '👂',
    examples: ['Noticing hidden enemies', 'Hearing whispered conversations', 'Spotting secret doors']
  },
  survival: {
    name: 'Survival',
    ability: 'wisdom',
    description: 'Following tracks, navigating wilderness, and finding food/shelter',
    category: 'practical',
    icon: '🏕️',
    examples: ['Tracking creatures', 'Finding food', 'Navigating by stars', 'Building shelter']
  },
  
  // Charisma-based
  deception: {
    name: 'Deception',
    ability: 'charisma',
    description: 'Hiding the truth through misdirection and lies',
    category: 'social',
    icon: '🎭',
    examples: ['Lying convincingly', 'Creating false identities', 'Misleading enemies']
  },
  intimidation: {
    name: 'Intimidation',
    ability: 'charisma',
    description: 'Influencing through threats and hostile actions',
    category: 'social',
    icon: '😠',
    examples: ['Threatening information from a prisoner', 'Scaring off enemies', 'Intimidating guards']
  },
  performance: {
    name: 'Performance',
    ability: 'charisma',
    description: 'Entertaining others through music, dance, acting, or storytelling',
    category: 'social',
    icon: '🎪',
    examples: ['Playing music in a tavern', 'Acting in a play', 'Telling captivating stories']
  },
  persuasion: {
    name: 'Persuasion',
    ability: 'charisma',
    description: 'Influencing others through tact and social graces',
    category: 'social',
    icon: '🤝',
    examples: ['Negotiating a deal', 'Convincing a guard to let you pass', 'Changing someone\'s mind']
  }
};

// =============================================================================
// SKILL CATEGORIES
// =============================================================================

/**
 * Skill categories for organization and UI display
 */
export const SKILL_CATEGORIES = {
  physical: {
    name: 'Physical',
    description: 'Skills involving physical prowess and dexterity',
    color: 'text-red-400',
    bgColor: 'bg-red-900/20',
    borderColor: 'border-red-500/30'
  },
  knowledge: {
    name: 'Knowledge',
    description: 'Skills based on learning and memory',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/20',
    borderColor: 'border-blue-500/30'
  },
  social: {
    name: 'Social',
    description: 'Skills for interacting with others',
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/20',
    borderColor: 'border-purple-500/30'
  },
  practical: {
    name: 'Practical',
    description: 'Skills for everyday survival and awareness',
    color: 'text-green-400',
    bgColor: 'bg-green-900/20',
    borderColor: 'border-green-500/30'
  }
};

// =============================================================================
// SKILL UTILITY FUNCTIONS
// =============================================================================

/**
 * Get specific skill modifier by skill key
 * @param {string} skillKey - Skill identifier
 * @param {Object} character - Character object
 * @returns {number} Skill modifier
 */
export const getSkillModifier = (skillKey, character) => {
  const skill = SKILLS[skillKey];
  if (!skill) return 0;
  
  return calculateSkillModifier(skillKey, skill.ability, character);
};

/**
 * Get skill data including name, modifier, and proficiency info
 * @param {string} skillKey - Skill identifier
 * @param {Object} character - Character object
 * @returns {Object|null} Complete skill data
 */
export const getSkillData = (skillKey, character) => {
  const skill = SKILLS[skillKey];
  if (!skill) return null;
  
  const modifier = getSkillModifier(skillKey, character);
  
  return {
    id: skillKey,
    name: skill.name,
    modifier,
    ability: skill.ability,
    category: skill.category,
    icon: skill.icon,
    description: skill.description,
    examples: skill.examples,
    isProficient: character.skillProficiencies?.includes(skillKey) || false,
    hasExpertise: character.skillExpertise?.includes(skillKey) || false
  };
};

/**
 * Get all skills data for a character, sorted by modifier
 * @param {Object} character - Character object
 * @returns {Array} Array of all skill data
 */
export const getAllSkillsData = (character) => {
  return Object.keys(SKILLS)
    .map(skillKey => getSkillData(skillKey, character))
    .filter(skill => skill !== null)
    .sort((a, b) => b.modifier - a.modifier);
};

/**
 * Get skills filtered by category
 * @param {Object} character - Character object
 * @param {string} category - Category to filter by
 * @returns {Array} Array of skills in the specified category
 */
export const getSkillsByCategory = (character, category) => {
  return getAllSkillsData(character).filter(skill => skill.category === category);
};

/**
 * Get skills by proficiency status
 * @param {Object} character - Character object
 * @param {boolean} proficientOnly - Whether to return only proficient skills
 * @returns {Array} Array of skills based on proficiency filter
 */
export const getSkillsByProficiency = (character, proficientOnly = true) => {
  return getAllSkillsData(character).filter(skill => 
    proficientOnly ? skill.isProficient : !skill.isProficient
  );
};

/**
 * Get skills with expertise
 * @param {Object} character - Character object
 * @returns {Array} Array of skills with expertise
 */
export const getExpertiseSkills = (character) => {
  return getAllSkillsData(character).filter(skill => skill.hasExpertise);
};

/**
 * Calculate total skill modifiers for a character
 * @param {Object} character - Character object
 * @returns {Object} Object with skillKey: modifier pairs
 */
export const calculateAllSkillModifiers = (character) => {
  const skillModifiers = {};
  
  Object.keys(SKILLS).forEach(skillKey => {
    skillModifiers[skillKey] = getSkillModifier(skillKey, character);
  });
  
  return skillModifiers;
};

/**
 * Get skill breakdown for detailed display
 * @param {string} skillKey - Skill identifier
 * @param {Object} character - Character object
 * @returns {Object|null} Detailed skill breakdown
 */
export const getSkillBreakdown = (skillKey, character) => {
  const skill = SKILLS[skillKey];
  if (!skill) return null;
  
  const abilityScore = character.abilityScores[skill.ability];
  const abilityModifier = Math.floor((abilityScore - 10) / 2);
  const isProficient = character.skillProficiencies?.includes(skillKey) || false;
  const hasExpertise = character.skillExpertise?.includes(skillKey) || false;
  const proficiencyBonus = isProficient ? character.proficiencyBonus : 0;
  const expertiseBonus = hasExpertise ? character.proficiencyBonus : 0;
  const specialBonus = character.skillBonuses?.[skillKey] || 0;
  
  const total = abilityModifier + proficiencyBonus + expertiseBonus + specialBonus;
  
  return {
    abilityScore,
    abilityModifier,
    proficiencyBonus,
    expertiseBonus,
    specialBonus,
    total,
    calculation: [
      { description: `${skill.ability.charAt(0).toUpperCase() + skill.ability.slice(1)} modifier`, value: abilityModifier },
      ...(proficiencyBonus > 0 ? [{ description: 'Proficiency bonus', value: proficiencyBonus }] : []),
      ...(expertiseBonus > 0 ? [{ description: 'Expertise bonus', value: expertiseBonus }] : []),
      ...(specialBonus !== 0 ? [{ description: 'Special bonuses', value: specialBonus }] : [])
    ]
  };
};

// =============================================================================
// SKILL VALIDATION
// =============================================================================

/**
 * Validate if a skill key is valid
 * @param {string} skillKey - Skill identifier to validate
 * @returns {boolean} Whether the skill key is valid
 */
export const isValidSkill = (skillKey) => {
  return skillKey in SKILLS;
};

/**
 * Get all valid skill keys
 * @returns {Array} Array of all skill keys
 */
export const getAllSkillKeys = () => {
  return Object.keys(SKILLS);
};

/**
 * Get skills by ability score
 * @param {string} ability - Ability score key
 * @returns {Array} Array of skill keys that use the specified ability
 */
export const getSkillsByAbility = (ability) => {
  return Object.keys(SKILLS).filter(skillKey => SKILLS[skillKey].ability === ability);
};