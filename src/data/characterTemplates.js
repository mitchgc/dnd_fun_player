/**
 * Character Templates and Predefined Characters
 * 
 * This module contains predefined character templates and the specific
 * characters used in the application, including the Yuan-ti Rogue Scout.
 */

import { createCharacter } from './characterSystem.js';

// =============================================================================
// PREDEFINED CHARACTERS
// =============================================================================

/**
 * Yuan-ti Rogue Scout (Level 5) - Main application character
 */
export const YUAN_TI_ROGUE = createCharacter({
  name: "Rogue Scout",
  race: "Yuan-ti",
  characterClass: "Rogue (Scout)",
  level: 5,
  background: "Urban Bounty Hunter",
  hitDie: 'd8',
  
  abilityScores: {
    strength: 10,      // +0
    dexterity: 16,     // +3 
    constitution: 10,  // +0
    intelligence: 14,  // +2
    wisdom: 17,        // +3
    charisma: 9        // -1
  },
  
  skillProficiencies: [
    'stealth',        // Rogue class
    'insight',        // Rogue class
    'perception',     // Rogue class
    'investigation',  // Rogue class
    'survival',       // Scout archetype
    'nature',         // Scout archetype
    'sleightOfHand',  // Background
    'intimidation'    // Background
  ],
  
  skillExpertise: [
    'stealth',        // Rogue expertise (level 1)
    'insight'         // Rogue expertise (level 1)
  ],
  
  savingThrowProficiencies: ['dexterity', 'intelligence'],
  
  // Override HP for specific build
  maxHPOverride: 27,
  acOverride: 15, // Studded leather + Dex
  
  weapons: {
    rapier: {
      name: "Rapier",
      type: "melee",
      damage: "1d8",
      damageType: "piercing",
      properties: ["finesse"],
      attackBonus: 6, // +3 Dex, +3 Prof
      damageBonus: 3,  // +3 Dex
      description: "A sleek blade perfect for precise strikes"
    },
    shortbow: {
      name: "Shortbow",
      type: "ranged",
      damage: "1d6",
      damageType: "piercing", 
      properties: ["ammunition", "two-handed"],
      range: [80, 320],
      attackBonus: 6, // +3 Dex, +3 Prof
      damageBonus: 3,  // +3 Dex
      description: "Quick ranged attacks from the shadows"
    }
  },
  
  specialAbilities: {
    'uncanny-dodge': {
      name: 'Uncanny Dodge',
      description: 'Halve damage from one attack per turn',
      type: 'reaction',
      usesPerTurn: 1,
      icon: '🛡️',
      available: true,
      effect: 'halve'
    },
    'cunning-action': {
      name: 'Cunning Action',
      description: 'Dash, Disengage, or Hide as a bonus action',
      type: 'bonus-action',
      icon: '💨'
    },
    'magic-resistance': {
      name: 'Magic Resistance',
      description: 'Advantage on saving throws vs magic (Yuan-ti)',
      type: 'passive',
      icon: '🧙‍♂️',
      effect: 'advantage'
    },
    'poison-immunity': {
      name: 'Poison Immunity',
      description: 'Immune to poison damage and poisoned condition (Yuan-ti)',
      type: 'passive',
      icon: '☠️',
      effect: 'resist-poison'
    },
    'skirmisher': {
      name: 'Skirmisher',
      description: 'Move up to half speed as reaction when enemy ends turn within 5 feet',
      type: 'reaction',
      icon: '🏃'
    }
  },
  
  backstory: {
    background: "Urban Bounty Hunter",
    description: "Born to the Durge Clan Yuan-ti of the Plates of Fydello. Left to seek fortune in the city of Abriz, joined up as a debt collecting freelancer.",
    traits: "Slow to trust, Cold and detached on the job",
    bonds: "Soft spot for animals",
    flaws: "Sneeze in bright light",
    appearance: "Half human, half snake, scales covered by a shawl. 5'7\", 160 lbs."
  }
});

/**
 * Emba - Kobold Warlock (Level 5) - Second application character
 */
export const EMBA_KOBOLD_WARLOCK = createCharacter({
  name: "Emba",
  race: "Kobold",
  characterClass: "Warlock (The Genie - Efreeti)",
  level: 5,
  background: "Entertainer",
  hitDie: 'd8',
  
  abilityScores: {
    strength: 9,       // -1
    dexterity: 12,     // +1
    constitution: 12,  // +1
    intelligence: 14,  // +2
    wisdom: 12,        // +1
    charisma: 18       // +4
  },
  
  skillProficiencies: [
    'arcana',        // Warlock class
    'deception',     // Warlock class
    'history',       // Background
    'investigation'  // Background
  ],
  
  skillExpertise: [],
  
  savingThrowProficiencies: ['wisdom', 'charisma'],
  
  // Override HP and AC for specific build
  maxHPOverride: 23,
  acOverride: 13, // 11 + 1 Dex (Studded Leather)
  
  weapons: {
    eldritchBlast: {
      name: "Eldritch Blast",
      type: "cantrip",
      damage: "1d10",
      damageType: "force",
      properties: ["cantrip", "ranged"],
      range: [120, 120],
      attackBonus: 7, // +4 Cha, +3 Prof
      damageBonus: 4,  // +4 Cha (Agonizing Blast)
      description: "A beam of crackling energy that can push enemies back"
    },
    lightCrossbow: {
      name: "Light Crossbow",
      type: "ranged",
      damage: "1d8",
      damageType: "piercing",
      properties: ["ammunition", "loading", "two-handed"],
      range: [80, 320],
      attackBonus: 4, // +1 Dex, +3 Prof
      damageBonus: 1,  // +1 Dex
      description: "Simple ranged weapon for backup attacks"
    },
    dagger: {
      name: "Small Knife (Dagger)",
      type: "melee",
      damage: "1d4",
      damageType: "piercing",
      properties: ["finesse", "light", "thrown"],
      range: [20, 60],
      attackBonus: 4, // +1 Dex, +3 Prof (finesse)
      damageBonus: 1,  // +1 Dex
      description: "Small utility knife, can be thrown"
    }
  },
  
  specialAbilities: {
    'darkvision': {
      name: 'Darkvision',
      description: 'Can see in dim light within 60 feet as bright light, darkness as dim light',
      type: 'passive',
      icon: '👁️',
      range: '60 ft'
    },
    'draconic-cry': {
      name: 'Draconic Cry',
      description: 'Bonus action: allies gain advantage on attacks vs enemies within 10 ft who can hear you',
      type: 'bonus-action',
      icon: '🐲',
      usesPerLongRest: 3 // Prof bonus
    },
    'kobold-legacy': {
      name: 'Kobold Legacy (Defiance)',
      description: 'Advantage on saving throws to avoid or end frightened condition',
      type: 'passive',
      icon: '💪',
      effect: 'advantage-vs-fear'
    },
    'genies-vessel': {
      name: "Genie's Vessel",
      description: 'Enter vessel as action (1/long rest), +3 fire damage to one damage roll per turn',
      type: 'action',
      icon: '🧞',
      usesPerLongRest: 1,
      damageBonus: '+3 fire'
    },
    'pact-magic': {
      name: 'Pact Magic',
      description: '2 spell slots (3rd level) that recover on short or long rest',
      type: 'passive',
      icon: '✨',
      spellSlots: '2 (3rd level)'
    },
    'eldritch-invocations': {
      name: 'Eldritch Invocations',
      description: 'Agonizing Blast (+Cha damage), Repelling Blast (push 10 ft), Devil\'s Sight (see in darkness 120 ft)',
      type: 'passive',
      icon: '🌟'
    },
    'pact-of-talisman': {
      name: 'Pact of the Talisman',
      description: 'Add d4 to failed ability check (prof bonus per long rest)',
      type: 'reaction',
      icon: '🧿',
      usesPerLongRest: 3 // Prof bonus
    },
    'fey-touched': {
      name: 'Fey Touched',
      description: 'Cast comprehend languages and misty step once per long rest each',
      type: 'action',
      icon: '🧚',
      usesPerLongRest: 2 // One each spell
    }
  },
  
  backstory: {
    background: "Entertainer",
    description: "A theatrical kobold warlock who made a pact with an efreeti for magical power. Uses dramatic flair and fire magic to command attention and control the battlefield.",
    traits: "Theatrical and attention-seeking, uses magic for dramatic effect",
    bonds: "Connected to their genie patron and the vessel that houses them",
    flaws: "Craves attention and may act recklessly to be the center of focus",
    appearance: "Small kobold with reddish scales and bright eyes. Carries a ornate vessel and wears traveler's clothes. Often gestures dramatically when casting."
  }
});

// =============================================================================
// CHARACTER TEMPLATES
// =============================================================================

/**
 * Character template definitions for quick character creation
 */
export const CHARACTER_TEMPLATES = {
  rogueScout: {
    name: "Rogue Scout",
    race: "Yuan-ti",
    characterClass: "Rogue (Scout)",
    level: 5,
    description: "A sneaky scout with expertise in stealth and survival",
    abilityScores: {
      strength: 10, dexterity: 16, constitution: 10,
      intelligence: 14, wisdom: 17, charisma: 9
    },
    skillProficiencies: ['stealth', 'insight', 'perception', 'investigation', 'survival', 'nature', 'sleightOfHand', 'intimidation'],
    skillExpertise: ['stealth', 'insight'],
    savingThrowProficiencies: ['dexterity', 'intelligence']
  },
  
  fighterKnight: {
    name: "Fighter Knight",
    race: "Human",
    characterClass: "Fighter (Champion)",
    level: 5,
    description: "A noble warrior skilled in combat and leadership",
    abilityScores: {
      strength: 16, dexterity: 14, constitution: 15,
      intelligence: 10, wisdom: 13, charisma: 12
    },
    skillProficiencies: ['athletics', 'intimidation', 'perception', 'survival'],
    skillExpertise: [],
    savingThrowProficiencies: ['strength', 'constitution'],
    weapons: {
      longsword: {
        name: "Longsword",
        type: "melee",
        damage: "1d8",
        damageType: "slashing",
        properties: ["versatile"],
        attackBonus: 8,
        damageBonus: 3
      },
      crossbow: {
        name: "Light Crossbow",
        type: "ranged",
        damage: "1d8",
        damageType: "piercing",
        properties: ["ammunition", "loading", "two-handed"],
        range: [80, 320],
        attackBonus: 8,
        damageBonus: 2
      }
    }
  },
  
  wizardScholar: {
    name: "Wizard Scholar",
    race: "High Elf",
    characterClass: "Wizard (School of Divination)",
    level: 5,
    description: "A scholarly spellcaster focused on knowledge and magic",
    abilityScores: {
      strength: 8, dexterity: 14, constitution: 13,
      intelligence: 16, wisdom: 12, charisma: 10
    },
    skillProficiencies: ['arcana', 'history', 'investigation', 'perception'],
    skillExpertise: [],
    savingThrowProficiencies: ['intelligence', 'wisdom'],
    weapons: {
      dagger: {
        name: "Dagger",
        type: "melee",
        damage: "1d4",
        damageType: "piercing",
        properties: ["finesse", "light", "thrown"],
        attackBonus: 5,
        damageBonus: 2
      }
    }
  },
  
  clericHealer: {
    name: "Cleric Healer",
    race: "Hill Dwarf",
    characterClass: "Cleric (Life Domain)",
    level: 5,
    description: "A divine healer devoted to protecting and healing allies",
    abilityScores: {
      strength: 13, dexterity: 10, constitution: 15,
      intelligence: 12, wisdom: 16, charisma: 14
    },
    skillProficiencies: ['insight', 'medicine', 'persuasion', 'religion'],
    skillExpertise: [],
    savingThrowProficiencies: ['wisdom', 'charisma'],
    weapons: {
      mace: {
        name: "Mace",
        type: "melee",
        damage: "1d6",
        damageType: "bludgeoning",
        properties: [],
        attackBonus: 4,
        damageBonus: 1
      }
    }
  },
  
  rangerHunter: {
    name: "Ranger Hunter",
    race: "Wood Elf",
    characterClass: "Ranger (Hunter)",
    level: 5,
    description: "A skilled tracker and archer who protects the wilderness",
    abilityScores: {
      strength: 13, dexterity: 16, constitution: 14,
      intelligence: 12, wisdom: 15, charisma: 10
    },
    skillProficiencies: ['athletics', 'insight', 'investigation', 'nature', 'perception', 'stealth', 'survival'],
    skillExpertise: [],
    savingThrowProficiencies: ['strength', 'dexterity'],
    weapons: {
      longbow: {
        name: "Longbow",
        type: "ranged",
        damage: "1d8",
        damageType: "piercing",
        properties: ["ammunition", "heavy", "two-handed"],
        range: [150, 600],
        attackBonus: 8,
        damageBonus: 3
      },
      shortsword: {
        name: "Shortsword",
        type: "melee",
        damage: "1d6",
        damageType: "piercing",
        properties: ["finesse", "light"],
        attackBonus: 8,
        damageBonus: 3
      }
    }
  }
};

// =============================================================================
// TEMPLATE UTILITIES
// =============================================================================

/**
 * Create a character from a template
 * @param {string} templateName - Name of the template to use
 * @param {Object} customizations - Optional customizations to apply
 * @returns {Object} Created character
 */
export const createCharacterFromTemplate = (templateName, customizations = {}) => {
  const template = CHARACTER_TEMPLATES[templateName];
  if (!template) {
    throw new Error(`Unknown character template: ${templateName}`);
  }
  
  return createCharacter({
    ...template,
    ...customizations
  });
};

/**
 * Get available template names
 * @returns {Array} Array of template names
 */
export const getTemplateNames = () => {
  return Object.keys(CHARACTER_TEMPLATES);
};

/**
 * Get template summary for display
 * @param {string} templateName - Template name
 * @returns {Object|null} Template summary or null if not found
 */
export const getTemplateSummary = (templateName) => {
  const template = CHARACTER_TEMPLATES[templateName];
  if (!template) return null;
  
  return {
    name: template.name,
    race: template.race,
    class: template.characterClass,
    level: template.level,
    description: template.description,
    primaryAbility: getPrimaryAbility(template.abilityScores),
    skillCount: template.skillProficiencies.length,
    expertiseCount: template.skillExpertise.length
  };
};

/**
 * Get the primary ability (highest ability score) for a template
 * @param {Object} abilityScores - Ability scores object
 * @returns {string} Primary ability name
 */
const getPrimaryAbility = (abilityScores) => {
  let highest = 0;
  let primaryAbility = 'strength';
  
  for (const [ability, score] of Object.entries(abilityScores)) {
    if (score > highest) {
      highest = score;
      primaryAbility = ability;
    }
  }
  
  return primaryAbility;
};

/**
 * Get all template summaries
 * @returns {Array} Array of template summaries
 */
export const getAllTemplateSummaries = () => {
  return getTemplateNames().map(templateName => ({
    id: templateName,
    ...getTemplateSummary(templateName)
  }));
};

