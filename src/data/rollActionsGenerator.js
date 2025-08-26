/**
 * Roll Actions Generation System
 * 
 * This module generates all possible roll actions for characters,
 * organizing them by type and providing utilities for dice rolling.
 */

import { getAllSkillsData, SKILLS } from './skillsSystem.js';
import { getAbilityModifier, getProficiencyBonus } from '../hooks/useCharacterData.js';

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
        description: weapon.description || `Attack with ${weapon.name}`,
        diceType: 'd20'
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
  if (!character.ability_scores) {
    return [];
  }

  return Object.keys(SKILLS).map(skillKey => {
    const skill = SKILLS[skillKey];
    const abilityScore = character.ability_scores[skill.ability] || 10;
    const abilityMod = getAbilityModifier(abilityScore);
    const profBonus = getProficiencyBonus(character.level || 1);
    
    const skillProficiencies = character.skillProficiencies || character.ability_scores?.skillProficiencies || [];
    const skillExpertise = character.skillExpertise || character.ability_scores?.skillExpertise || [];
    
    const isProficient = skillProficiencies.includes(skillKey);
    const hasExpertise = skillExpertise.includes(skillKey);
    
    // Calculate total modifier
    let modifier = abilityMod;
    if (isProficient) {
      modifier += hasExpertise ? (profBonus * 2) : profBonus;
    }
    
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
      description: skill.description,
      diceType: 'd20'
    };
  }).sort((a, b) => b.modifier - a.modifier);
};

/**
 * Generate ability check actions
 * @param {Object} character - Character object
 * @returns {Array} Array of ability check actions
 */
const generateAbilityActions = (character) => {
  if (!character.ability_scores) {
    return [];
  }

  const abilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
  
  return abilities.map(ability => {
    const abilityScore = character.ability_scores[ability] || 10;
    const modifier = getAbilityModifier(abilityScore);
    
    return {
      id: ability,
      name: `${ability.charAt(0).toUpperCase() + ability.slice(1)} Check`,
      modifier,
      type: 'ability',
      ability,
      description: `Raw ${ability} ability check`,
      diceType: 'd20'
    };
  }).sort((a, b) => b.modifier - a.modifier);
};

/**
 * Generate saving throw actions
 * @param {Object} character - Character object
 * @returns {Array} Array of saving throw actions
 */
const generateSavingThrowActions = (character) => {
  if (!character.ability_scores) {
    return [];
  }

  const abilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
  const savingThrowProficiencies = character.savingThrowProficiencies || character.ability_scores?.savingThrowProficiencies || [];
  const profBonus = getProficiencyBonus(character.level || 1);
  
  return abilities.map(ability => {
    const abilityScore = character.ability_scores[ability] || 10;
    const abilityMod = getAbilityModifier(abilityScore);
    const isProficient = savingThrowProficiencies.includes(ability);
    const modifier = abilityMod + (isProficient ? profBonus : 0);
    
    return {
      id: `${ability}-save`,
      name: `${ability.charAt(0).toUpperCase() + ability.slice(1)} Save`,
      modifier,
      type: 'save',
      ability,
      proficient: isProficient,
      description: `${ability.charAt(0).toUpperCase() + ability.slice(1)} saving throw`,
      diceType: 'd20'
    };
  }).sort((a, b) => b.modifier - a.modifier);
};

/**
 * Generate combat-related roll actions
 * @param {Object} character - Character object
 * @returns {Array} Array of combat actions
 */
const generateCombatActions = (character) => {
  if (!character.ability_scores) {
    return [];
  }

  const dexScore = character.ability_scores.dexterity || 10;
  const conScore = character.ability_scores.constitution || 10;
  const dexMod = getAbilityModifier(dexScore);
  const conMod = getAbilityModifier(conScore);
  
  const savingThrowProficiencies = character.savingThrowProficiencies || character.ability_scores?.savingThrowProficiencies || [];
  const profBonus = getProficiencyBonus(character.level || 1);
  const isConProficient = savingThrowProficiencies.includes('constitution');
  const concentrationMod = conMod + (isConProficient ? profBonus : 0);
  
  // Add initiative bonus if character has it
  const initiativeBonus = character.initiative_bonus || 0;
  const initiativeMod = dexMod + initiativeBonus;

  return [
    {
      id: 'initiative',
      name: 'Initiative',
      modifier: initiativeMod,
      type: 'initiative',
      description: 'Roll for turn order in combat',
      diceType: 'd20'
    },
    {
      id: 'death-save',
      name: 'Death Saving Throw',
      modifier: 0,
      type: 'death-save',
      description: 'Stabilize when dying (DC 10)',
      diceType: 'd20'
    },
    {
      id: 'concentration',
      name: 'Concentration Save',
      modifier: concentrationMod,
      type: 'concentration',
      description: 'Maintain concentration on spells',
      diceType: 'd20'
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
      description: 'Roll Hit Dice to recover HP',
      diceType: hitDie.replace('d', 'd') // This will be d8, d10, etc.
    },
    {
      id: 'long-rest',
      name: 'Long Rest Healing (8 hours)',
      modifier: 0,
      type: 'healing',
      healType: 'long-rest',
      description: 'Recover all HP and reset abilities',
      diceType: 'd20' // Placeholder for long rest
    },
    {
      id: 'superior-potion',
      name: 'Superior Healing Potion',
      modifier: 0,
      type: 'healing',
      healType: 'potion',
      dice: '8d4+8',
      description: 'Roll 8d4+8 healing',
      diceType: 'd4'
    },
    {
      id: 'greater-potion',
      name: 'Greater Healing Potion',
      modifier: 0,
      type: 'healing',
      healType: 'potion',
      dice: '4d4+4',
      description: 'Roll 4d4+4 healing',
      diceType: 'd4'
    },
    {
      id: 'basic-potion',
      name: 'Basic Healing Potion',
      modifier: 0,
      type: 'healing',
      healType: 'potion',
      dice: '2d4+2',
      description: 'Roll 2d4+2 healing',
      diceType: 'd4'
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
      description: 'Roll for random percentile events',
      diceType: 'd100'
    },
    { 
      id: 'd20', 
      name: 'Raw d20', 
      modifier: 0, 
      type: 'raw', 
      dice: 20,
      description: 'Basic d20 roll without modifiers',
      diceType: 'd20'
    },
    { 
      id: 'd12', 
      name: 'Raw d12', 
      modifier: 0, 
      type: 'raw', 
      dice: 12,
      description: 'Roll a d12',
      diceType: 'd12'
    },
    { 
      id: 'd10', 
      name: 'Raw d10', 
      modifier: 0, 
      type: 'raw', 
      dice: 10,
      description: 'Roll a d10',
      diceType: 'd10'
    },
    { 
      id: 'd8', 
      name: 'Raw d8', 
      modifier: 0, 
      type: 'raw', 
      dice: 8,
      description: 'Roll a d8',
      diceType: 'd8'
    },
    { 
      id: 'd6', 
      name: 'Raw d6', 
      modifier: 0, 
      type: 'raw', 
      dice: 6,
      description: 'Roll a d6',
      diceType: 'd6'
    },
    { 
      id: 'd4', 
      name: 'Raw d4', 
      modifier: 0, 
      type: 'raw', 
      dice: 4,
      description: 'Roll a d4',
      diceType: 'd4'
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