/**
 * Character System Main Export Index
 * 
 * This file provides a single entry point for all character-related functionality.
 * 
 * Import structure:
 * - D&D 5e Rules: Core mathematical calculations
 * - Skills System: Skill definitions and utilities  
 * - Character System: Character creation and management
 * - Roll Actions: Roll generation and utilities
 * - Templates: Predefined characters and templates
 */

// =============================================================================
// D&D 5E RULES AND CALCULATIONS
// =============================================================================
export {
  calculateAbilityModifier,
  calculateProficiencyBonus,
  calculateHitPoints,
  calculateArmorClass,
  calculateSneakAttackDice,
  calculateSpellSlots,
  calculateWeaponAttackBonus,
  calculateWeaponDamageBonus,
  calculateSpellSaveDC,
  calculateSpellAttackBonus,
  calculateSkillModifier,
  calculateSavingThrow,
  calculateAllAbilityModifiers,
  isValidAbilityScore,
  isValidLevel
} from './dnd5eRules.js';

// =============================================================================
// SKILLS SYSTEM
// =============================================================================
export {
  SKILLS,
  SKILL_CATEGORIES,
  getSkillModifier,
  getSkillData,
  getAllSkillsData,
  getSkillsByCategory,
  getSkillsByProficiency,
  getExpertiseSkills,
  calculateAllSkillModifiers,
  getSkillBreakdown,
  isValidSkill,
  getAllSkillKeys,
  getSkillsByAbility
} from './skillsSystem.js';

// =============================================================================
// CHARACTER SYSTEM
// =============================================================================
export {
  createCharacter,
  validateCharacter,
  updateCharacter,
  levelUpCharacter,
  getCharacterSummary,
  cloneCharacter
} from './characterSystem.js';

// =============================================================================
// ROLL ACTIONS
// =============================================================================
export {
  generateRollActions,
  findRollAction,
  getRollActionsByType,
  getTopRollActions,
  getRollActionsByCategory,
  createCustomRollAction
} from './rollActionsGenerator.js';

// =============================================================================
// CHARACTER TEMPLATES
// =============================================================================
export {
  YUAN_TI_ROGUE,
  CHARACTER_TEMPLATES,
  createCharacterFromTemplate,
  getTemplateNames,
  getTemplateSummary,
  getAllTemplateSummaries
} from './characterTemplates.js';

// =============================================================================
// CONVENIENCE EXPORTS
// =============================================================================

// Export the default character for existing components
export { YUAN_TI_ROGUE as character } from './characterTemplates.js';

