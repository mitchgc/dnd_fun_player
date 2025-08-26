/**
 * Roll Actions - Direct exports from the modular character system
 * 
 * This file provides direct access to roll actions functionality
 * and character switching capability.
 */

// Direct exports from the modular system
export {
  generateRollActions,
  findRollAction,
  getRollActionsByType,
  getTopRollActions,
  getRollActionsByCategory,
  createCustomRollAction
} from './rollActionsGenerator.js';

export {
  getSkillModifier,
  getSkillData,
  getAllSkillsData
} from './skillsSystem.js';

import {
  YUAN_TI_ROGUE,
  EMBA_KOBOLD_WARLOCK
} from './characterTemplates.js';

// Characters lookup
const CHARACTERS = {
  chels: YUAN_TI_ROGUE,
  emba: EMBA_KOBOLD_WARLOCK
};

// Character selection with localStorage persistence
const STORAGE_KEY = 'dnd-helper-selected-character';

let currentCharacterId = localStorage.getItem(STORAGE_KEY) || 'chels'; // Default to Chels

export const getSelectedCharacter = () => {
  return CHARACTERS[currentCharacterId] || YUAN_TI_ROGUE;
};

export const setSelectedCharacter = (characterId) => {
  if (CHARACTERS[characterId]) {
    currentCharacterId = characterId;
    localStorage.setItem(STORAGE_KEY, characterId);
    return true;
  }
  return false;
};

export const getCurrentCharacterId = () => currentCharacterId;

// Export characters for external use
export { YUAN_TI_ROGUE, EMBA_KOBOLD_WARLOCK };
export { CHARACTERS };

// Legacy export for backward compatibility
export const character = getSelectedCharacter();