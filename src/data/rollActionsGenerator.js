/**
 * Roll Actions Generation System
 * 
 * This module generates all possible roll actions for characters,
 * organizing them by type and providing utilities for dice rolling.
 */

import { getAllSkillsData, SKILLS } from './skillsSystem.js';

// =============================================================================
// ROLL ACTION GENERATION
// =============================================================================

/**
 * Generate all possible roll actions for a character
 * @param {Object} character - Character object
 * @returns {Object} Complete roll actions organized by category
 */
export const generateRollActions = (character) => {
  return {
    attacks: generateAttackActions(character),
    skills: generateSkillActions(character),
    abilities: generateAbilityActions(character),
    saves: generateSavingThrowActions(character),
    combat: generateCombatActions(character),
    healing: generateHealingActions(character),
    utility: generateUtilityActions()
  };
};

// =============================================================================
// INDIVIDUAL ACTION GENERATORS
// =============================================================================

/**
 * Generate attack roll actions for character weapons
 * @param {Object} character - Character object
 * @returns {Array} Array of attack actions
 */
const generateAttackActions = (character) => {
  if (!character.weapons || Object.keys(character.weapons).length === 0) {
    return [];
  }
  
  return Object.keys(character.weapons)
    .map(weaponKey => {
      const weapon = character.weapons[weaponKey];
      return {
        id: `${weaponKey}-attack`,
        name: `${weapon.name} Attack`,
        modifier: weapon.attackBonus,
        type: 'attack',
        weapon: weaponKey,
        damage: weapon.damage,
        damageBonus: weapon.damageBonus,
        damageType: weapon.damageType,
        range: weapon.range,
        properties: weapon.properties,
        description: weapon.description || `Attack with ${weapon.name}`
      };
    })
    .sort((a, b) => b.modifier - a.modifier);
};

/**
 * Generate skill check actions
 * @param {Object} character - Character object
 * @returns {Array} Array of skill actions
 */
const generateSkillActions = (character) => {
  return Object.keys(SKILLS).map(skillKey => {
    const skill = SKILLS[skillKey];
    const modifier = character.skills[skillKey] || 0;
    const isProficient = character.skillProficiencies?.includes(skillKey) || false;
    const hasExpertise = character.skillExpertise?.includes(skillKey) || false;
    
    return {
      id: skillKey.replace(/([A-Z])/g, '-$1').toLowerCase(),
      name: skill.name,
      modifier,
      type: 'skill',
      proficient: isProficient,
      expertise: hasExpertise,
      ability: skill.ability,
      category: skill.category,
      icon: skill.icon,
      description: skill.description
    };
  }).sort((a, b) => b.modifier - a.modifier);
};

/**
 * Generate ability check actions
 * @param {Object} character - Character object
 * @returns {Array} Array of ability check actions
 */
const generateAbilityActions = (character) => {
  const abilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
  
  return abilities.map(ability => ({
    id: ability,
    name: `${ability.charAt(0).toUpperCase() + ability.slice(1)} Check`,
    modifier: character.abilityModifiers[ability],
    type: 'ability',
    ability,
    description: `Raw ${ability} ability check`
  })).sort((a, b) => b.modifier - a.modifier);
};

/**
 * Generate saving throw actions
 * @param {Object} character - Character object
 * @returns {Array} Array of saving throw actions
 */
const generateSavingThrowActions = (character) => {
  const abilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
  
  return abilities.map(ability => ({
    id: `${ability}-save`,
    name: `${ability.charAt(0).toUpperCase() + ability.slice(1)} Save`,
    modifier: character.savingThrows[ability],
    type: 'save',
    ability,
    proficient: character.savingThrowProficiencies?.includes(ability) || false,
    description: `${ability.charAt(0).toUpperCase() + ability.slice(1)} saving throw`
  })).sort((a, b) => b.modifier - a.modifier);
};

/**
 * Generate combat-related roll actions
 * @param {Object} character - Character object
 * @returns {Array} Array of combat actions
 */
const generateCombatActions = (character) => {
  return [
    {
      id: 'initiative',
      name: 'Initiative',
      modifier: character.abilityModifiers.dexterity,
      type: 'initiative',
      description: 'Roll for turn order in combat'
    },
    {
      id: 'death-save',
      name: 'Death Saving Throw',
      modifier: 0,
      type: 'death-save',
      description: 'Stabilize when dying (DC 10)'
    },
    {
      id: 'concentration',
      name: 'Concentration Save',
      modifier: character.savingThrows.constitution,
      type: 'concentration',
      description: 'Maintain concentration on spells'
    }
  ].sort((a, b) => b.modifier - a.modifier);
};

/**
 * Generate healing roll actions
 * @param {Object} character - Character object
 * @returns {Array} Array of healing actions
 */
const generateHealingActions = (character) => {
  const hitDiceCount = character.level || 1;
  const hitDie = character.hitDie || 'd8';
  
  return [
    {
      id: 'short-rest',
      name: 'Short Rest Healing (1 hour)',
      modifier: 0,
      type: 'healing',
      healType: 'short-rest',
      dice: `${hitDiceCount}${hitDie}`,
      description: 'Roll Hit Dice to recover HP'
    },
    {
      id: 'long-rest',
      name: 'Long Rest Healing (8 hours)',
      modifier: 0,
      type: 'healing',
      healType: 'long-rest',
      description: 'Recover all HP and reset abilities'
    },
    {
      id: 'superior-potion',
      name: 'Superior Healing Potion',
      modifier: 0,
      type: 'healing',
      healType: 'potion',
      dice: '8d4+8',
      description: 'Roll 8d4+8 healing'
    },
    {
      id: 'greater-potion',
      name: 'Greater Healing Potion',
      modifier: 0,
      type: 'healing',
      healType: 'potion',
      dice: '4d4+4',
      description: 'Roll 4d4+4 healing'
    },
    {
      id: 'basic-potion',
      name: 'Basic Healing Potion',
      modifier: 0,
      type: 'healing',
      healType: 'potion',
      dice: '2d4+2',
      description: 'Roll 2d4+2 healing'
    },
    {
      id: 'custom-healing',
      name: 'Custom Healing',
      modifier: 0,
      type: 'healing',
      healType: 'custom',
      description: 'Enter custom healing amount'
    }
  ];
};

/**
 * Generate utility roll actions
 * @returns {Array} Array of utility actions
 */
const generateUtilityActions = () => {
  return [
    { 
      id: 'd100', 
      name: 'Percentile (d100)', 
      modifier: 0, 
      type: 'raw', 
      dice: 100,
      description: 'Roll for random percentile events'
    },
    { 
      id: 'd20', 
      name: 'Raw d20', 
      modifier: 0, 
      type: 'raw', 
      dice: 20,
      description: 'Basic d20 roll without modifiers'
    },
    { 
      id: 'd12', 
      name: 'Raw d12', 
      modifier: 0, 
      type: 'raw', 
      dice: 12,
      description: 'Roll a d12'
    },
    { 
      id: 'd10', 
      name: 'Raw d10', 
      modifier: 0, 
      type: 'raw', 
      dice: 10,
      description: 'Roll a d10'
    },
    { 
      id: 'd8', 
      name: 'Raw d8', 
      modifier: 0, 
      type: 'raw', 
      dice: 8,
      description: 'Roll a d8'
    },
    { 
      id: 'd6', 
      name: 'Raw d6', 
      modifier: 0, 
      type: 'raw', 
      dice: 6,
      description: 'Roll a d6'
    },
    { 
      id: 'd4', 
      name: 'Raw d4', 
      modifier: 0, 
      type: 'raw', 
      dice: 4,
      description: 'Roll a d4'
    },
    { 
      id: 'hide-toggle', 
      name: 'Hide/Reveal', 
      modifier: 0, 
      type: 'toggle',
      description: 'Toggle character visibility'
    }
  ];
};

// =============================================================================
// ROLL ACTION UTILITIES
// =============================================================================

/**
 * Find a specific roll action by ID across all categories
 * @param {Object} rollActions - Generated roll actions object
 * @param {string} actionId - Action ID to find
 * @returns {Object|null} Found action or null
 */
export const findRollAction = (rollActions, actionId) => {
  const allActions = [
    ...rollActions.attacks,
    ...rollActions.skills,
    ...rollActions.abilities,
    ...rollActions.saves,
    ...rollActions.combat,
    ...rollActions.healing,
    ...rollActions.utility
  ];
  
  return allActions.find(action => action.id === actionId) || null;
};

/**
 * Get roll actions by type
 * @param {Object} rollActions - Generated roll actions object
 * @param {string} type - Action type to filter by
 * @returns {Array} Array of actions of the specified type
 */
export const getRollActionsByType = (rollActions, type) => {
  const allActions = [
    ...rollActions.attacks,
    ...rollActions.skills,
    ...rollActions.abilities,
    ...rollActions.saves,
    ...rollActions.combat,
    ...rollActions.healing,
    ...rollActions.utility
  ];
  
  return allActions.filter(action => action.type === type);
};

/**
 * Get the top roll actions by modifier
 * @param {Object} rollActions - Generated roll actions object
 * @param {number} count - Number of actions to return
 * @returns {Array} Array of top actions by modifier
 */
export const getTopRollActions = (rollActions, count = 5) => {
  const allActions = [
    ...rollActions.attacks,
    ...rollActions.skills,
    ...rollActions.abilities,
    ...rollActions.saves,
    ...rollActions.combat
  ];
  
  return allActions
    .filter(action => action.modifier !== undefined)
    .sort((a, b) => b.modifier - a.modifier)
    .slice(0, count);
};

/**
 * Get roll actions by category
 * @param {Object} rollActions - Generated roll actions object
 * @param {string} category - Category name
 * @returns {Array} Array of actions in the specified category
 */
export const getRollActionsByCategory = (rollActions, category) => {
  return rollActions[category] || [];
};

/**
 * Create a quick roll action for custom rolls
 * @param {string} name - Action name
 * @param {number} modifier - Roll modifier
 * @param {string} type - Action type
 * @param {Object} options - Additional options
 * @returns {Object} Roll action object
 */
export const createCustomRollAction = (name, modifier, type = 'custom', options = {}) => {
  return {
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    modifier,
    type,
    description: options.description || `Custom ${type} roll`,
    ...options
  };
};