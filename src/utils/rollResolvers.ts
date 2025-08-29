/**
 * Roll Modifier Resolvers
 * 
 * Configurable resolvers for D&D mechanics that replace hardcoded special cases.
 * Each resolver takes a roll context and returns applicable modifiers.
 */

import {
  RollContext,
  RollModifier,
  ModifierSource,
  ModifierType,
  ApplicationTiming,
  DiceExpression
} from '../types/rolls';

import { parseDiceExpression } from './diceParser';

// =============================================================================
// ABILITY SCORE RESOLVERS
// =============================================================================

/**
 * Resolve ability score modifiers based on roll type and context
 */
export function resolveAbilityModifiers(context: RollContext): RollModifier[] {
  const modifiers: RollModifier[] = [];
  const character = context.character;
  
  // Determine which ability applies
  let abilityName: keyof typeof character.ability_scores | null = null;
  
  switch (context.source.type) {
    case 'weapon':
      // Check weapon properties for finesse
      if (context.source.tags.includes('finesse')) {
        // Use higher of STR or DEX for finesse weapons
        const str = character.ability_scores.strength || 10;
        const dex = character.ability_scores.dexterity || 10;
        abilityName = str >= dex ? 'strength' : 'dexterity';
      } else if (context.source.tags.includes('ranged')) {
        abilityName = 'dexterity';
      } else {
        abilityName = 'strength';
      }
      break;
      
    case 'spell':
      // Determine spellcasting ability - would need class info
      // For now, assume Charisma (Warlock default)
      abilityName = 'charisma';
      break;
      
    case 'skill':
      // Map skills to abilities
      abilityName = getSkillAbility(context.source.name);
      break;
      
    case 'save':
      // Saving throw uses the save's ability
      abilityName = context.source.name.toLowerCase().replace(' save', '') as any;
      break;
  }
  
  if (abilityName && character.ability_scores[abilityName]) {
    const abilityScore = character.ability_scores[abilityName];
    const modifier = Math.floor((abilityScore - 10) / 2);
    
    if (modifier !== 0) {
      modifiers.push({
        id: `ability_${abilityName}`,
        name: `${capitalize(abilityName)} Modifier`,
        description: `${abilityScore} ${capitalize(abilityName)} provides ${modifier >= 0 ? '+' : ''}${modifier}`,
        source: ModifierSource.ABILITY_SCORE,
        type: ModifierType.FLAT_BONUS,
        value: modifier,
        application: ApplicationTiming.BEFORE_ROLL,
        stacks: false,
        priority: 10
      });
    }
  }
  
  return modifiers;
}

/**
 * Map skill names to their governing abilities
 */
function getSkillAbility(skillName: string): string {
  const skillMap: Record<string, string> = {
    'acrobatics': 'dexterity',
    'animal handling': 'wisdom',
    'arcana': 'intelligence',
    'athletics': 'strength',
    'deception': 'charisma',
    'history': 'intelligence',
    'insight': 'wisdom',
    'intimidation': 'charisma',
    'investigation': 'intelligence',
    'medicine': 'wisdom',
    'nature': 'intelligence',
    'perception': 'wisdom',
    'performance': 'charisma',
    'persuasion': 'charisma',
    'religion': 'intelligence',
    'sleight of hand': 'dexterity',
    'stealth': 'dexterity',
    'survival': 'wisdom'
  };
  
  return skillMap[skillName.toLowerCase()] || 'intelligence';
}

// =============================================================================
// PROFICIENCY RESOLVERS
// =============================================================================

/**
 * Resolve proficiency bonuses for attacks, saves, and skills
 */
export function resolveProficiencyModifiers(context: RollContext): RollModifier[] {
  const modifiers: RollModifier[] = [];
  const character = context.character;
  const proficiencyBonus = character.proficiencyBonus || Math.ceil(character.level / 4) + 1;
  
  // Check if character is proficient in this roll
  const isProficient = checkProficiency(context);
  const hasExpertise = checkExpertise(context);
  
  if (isProficient) {
    modifiers.push({
      id: 'proficiency_bonus',
      name: 'Proficiency Bonus',
      description: `Level ${character.level} proficiency bonus`,
      source: ModifierSource.PROFICIENCY,
      type: ModifierType.FLAT_BONUS,
      value: proficiencyBonus,
      application: ApplicationTiming.BEFORE_ROLL,
      stacks: false,
      priority: 20
    });
    
    if (hasExpertise) {
      modifiers.push({
        id: 'expertise_bonus',
        name: 'Expertise',
        description: 'Double proficiency bonus',
        source: ModifierSource.EXPERTISE,
        type: ModifierType.FLAT_BONUS,
        value: proficiencyBonus,
        application: ApplicationTiming.BEFORE_ROLL,
        stacks: false,
        priority: 21
      });
    }
  }
  
  return modifiers;
}

/**
 * Check if character has proficiency for this roll
 */
function checkProficiency(context: RollContext): boolean {
  const character = context.character;
  
  switch (context.source.type) {
    case 'weapon':
      // Check weapon proficiencies - would need character data
      return true; // Placeholder
      
    case 'skill':
      // Check skill proficiencies
      const skillProficiencies = (character as any).skillProficiencies || [];
      return skillProficiencies.includes(context.source.name.toLowerCase().replace(' ', '_'));
      
    case 'save':
      // Check saving throw proficiencies
      const saveProficiencies = (character as any).savingThrowProficiencies || [];
      const abilityName = context.source.name.toLowerCase().replace(' save', '');
      return saveProficiencies.includes(abilityName);
      
    default:
      return false;
  }
}

/**
 * Check if character has expertise for this roll
 */
function checkExpertise(context: RollContext): boolean {
  const character = context.character;
  
  if (context.source.type === 'skill') {
    const expertise = (character as any).expertise || [];
    return expertise.includes(context.source.name.toLowerCase().replace(' ', '_'));
  }
  
  return false;
}

// =============================================================================
// SPELL EFFECT RESOLVERS
// =============================================================================

/**
 * Resolve spell-based modifiers like Bless, Guidance, Bardic Inspiration
 */
export function resolveSpellModifiers(context: RollContext): RollModifier[] {
  const modifiers: RollModifier[] = [];
  const env = context.environment;
  
  // Bless spell (+1d4 to attacks and saves)
  if (env.blessed && (context.source.type === 'weapon' || context.source.type === 'save')) {
    modifiers.push({
      id: 'bless',
      name: 'Bless',
      description: 'Add 1d4 to attack rolls and saving throws',
      source: ModifierSource.SPELL,
      type: ModifierType.DICE_BONUS,
      value: parseDiceExpression('1d4'),
      application: ApplicationTiming.BEFORE_ROLL,
      stacks: false,
      priority: 50
    });
  }
  
  // Guidance cantrip (+1d4 to ability checks)
  if ((env as any).guidance && context.source.type === 'skill') {
    modifiers.push({
      id: 'guidance',
      name: 'Guidance',
      description: 'Add 1d4 to one ability check',
      source: ModifierSource.SPELL,
      type: ModifierType.DICE_BONUS,
      value: parseDiceExpression('1d4'),
      application: ApplicationTiming.BEFORE_ROLL,
      stacks: false,
      priority: 51
    });
  }
  
  // Bardic Inspiration (+1d6 to various rolls)
  if ((env as any).inspired) {
    modifiers.push({
      id: 'bardic_inspiration',
      name: 'Bardic Inspiration',
      description: 'Add Bardic Inspiration die to this roll',
      source: ModifierSource.SPELL,
      type: ModifierType.DICE_BONUS,
      value: parseDiceExpression('1d6'), // Would scale with bard level
      application: ApplicationTiming.BEFORE_ROLL,
      stacks: false,
      priority: 52
    });
  }
  
  return modifiers;
}

// =============================================================================
// CONDITION RESOLVERS
// =============================================================================

/**
 * Resolve advantage/disadvantage from various conditions
 */
export function resolveAdvantageModifiers(context: RollContext): RollModifier[] {
  const modifiers: RollModifier[] = [];
  const env = context.environment;
  
  // Hidden condition gives advantage on attacks
  if (env.hidden && context.source.type === 'weapon') {
    modifiers.push({
      id: 'hidden_advantage',
      name: 'Hidden Advantage',
      description: 'Attack with advantage when hidden',
      source: ModifierSource.CONDITION,
      type: ModifierType.ADVANTAGE,
      value: 0,
      application: ApplicationTiming.BEFORE_ROLL,
      stacks: false,
      priority: 30
    });
  }
  
  // Prone target conditions
  if ((env as any).targetProne && context.source.type === 'weapon') {
    const isRangedAttack = context.source.tags.includes('ranged');
    
    if (isRangedAttack) {
      modifiers.push({
        id: 'prone_disadvantage',
        name: 'Target Prone',
        description: 'Ranged attacks have disadvantage against prone targets',
        source: ModifierSource.CONDITION,
        type: ModifierType.DISADVANTAGE,
        value: 0,
        application: ApplicationTiming.BEFORE_ROLL,
        stacks: false,
        priority: 31
      });
    } else {
      modifiers.push({
        id: 'prone_advantage',
        name: 'Target Prone',
        description: 'Melee attacks have advantage against prone targets',
        source: ModifierSource.CONDITION,
        type: ModifierType.ADVANTAGE,
        value: 0,
        application: ApplicationTiming.BEFORE_ROLL,
        stacks: false,
        priority: 31
      });
    }
  }
  
  return modifiers;
}

// =============================================================================
// CLASS FEATURE RESOLVERS
// =============================================================================

/**
 * Resolve class-specific features (replaces hardcoded mechanics)
 */
export function resolveClassFeatureModifiers(context: RollContext): RollModifier[] {
  const modifiers: RollModifier[] = [];
  const character = context.character;
  
  // Rogue Sneak Attack
  if (isRogueWithSneakAttack(character, context)) {
    const sneakAttackDice = Math.ceil(character.level / 2);
    
    modifiers.push({
      id: 'sneak_attack',
      name: 'Sneak Attack',
      description: `Add ${sneakAttackDice}d6 damage when conditions are met`,
      source: ModifierSource.CLASS_FEATURE,
      type: ModifierType.DICE_BONUS,
      value: parseDiceExpression(`${sneakAttackDice}d6`),
      condition: (ctx) => canSneakAttack(ctx),
      application: ApplicationTiming.ON_DAMAGE,
      stacks: false,
      priority: 60
    });
  }
  
  // Warlock Agonizing Blast
  if (isWarlockWithAgonizingBlast(character, context)) {
    const chaModifier = Math.floor(((character.ability_scores.charisma || 10) - 10) / 2);
    
    modifiers.push({
      id: 'agonizing_blast',
      name: 'Agonizing Blast',
      description: 'Add Charisma modifier to Eldritch Blast damage',
      source: ModifierSource.CLASS_FEATURE,
      type: ModifierType.FLAT_BONUS,
      value: chaModifier,
      condition: (ctx) => isEldritchBlast(ctx),
      application: ApplicationTiming.ON_DAMAGE,
      stacks: false,
      priority: 61
    });
  }
  
  // Champion Fighter Improved Critical
  if (isChampionFighter(character)) {
    modifiers.push({
      id: 'improved_critical',
      name: 'Improved Critical',
      description: 'Critical hit on 19-20',
      source: ModifierSource.CLASS_FEATURE,
      type: ModifierType.CRITICAL_RANGE,
      value: 19,
      application: ApplicationTiming.BEFORE_ROLL,
      stacks: false,
      priority: 40
    });
  }
  
  return modifiers;
}

// =============================================================================
// EQUIPMENT RESOLVERS
// =============================================================================

/**
 * Resolve magical weapon and armor bonuses
 */
export function resolveEquipmentModifiers(context: RollContext): RollModifier[] {
  const modifiers: RollModifier[] = [];
  // Implementation would depend on character equipment data structure
  
  // Example: +1 weapon bonus
  if (context.source.type === 'weapon') {
    const weaponBonus = getWeaponMagicalBonus(context.source.name);
    if (weaponBonus > 0) {
      modifiers.push({
        id: 'weapon_enhancement',
        name: `+${weaponBonus} Weapon`,
        description: `Magical weapon enhancement bonus`,
        source: ModifierSource.ITEM,
        type: ModifierType.FLAT_BONUS,
        value: weaponBonus,
        application: ApplicationTiming.BEFORE_ROLL,
        stacks: false,
        priority: 25
      });
    }
  }
  
  return modifiers;
}

// =============================================================================
// DAMAGE TYPE RESOLVERS  
// =============================================================================

/**
 * Resolve damage resistance, vulnerability, and immunity
 */
export function resolveDamageTypeModifiers(context: RollContext): RollModifier[] {
  const modifiers: RollModifier[] = [];
  const target = context.target;
  
  if (!target || !context.source.properties?.damageType) {
    return modifiers;
  }
  
  const damageType = context.source.properties.damageType;
  
  // Vulnerability (double damage)
  if (target.conditions?.includes(`vulnerable_${damageType}`)) {
    modifiers.push({
      id: 'vulnerability',
      name: `${capitalize(damageType)} Vulnerability`,
      description: `Target takes double ${damageType} damage`,
      source: ModifierSource.CONDITION,
      type: ModifierType.MULTIPLIER,
      value: 2,
      application: ApplicationTiming.ON_DAMAGE,
      stacks: false,
      priority: 100
    });
  }
  
  // Resistance (half damage)
  if (target.conditions?.includes(`resistant_${damageType}`)) {
    modifiers.push({
      id: 'resistance',
      name: `${capitalize(damageType)} Resistance`,
      description: `Target takes half ${damageType} damage`,
      source: ModifierSource.CONDITION,
      type: ModifierType.DIVIDER,
      value: 2,
      application: ApplicationTiming.ON_DAMAGE,
      stacks: false,
      priority: 101
    });
  }
  
  return modifiers;
}

// =============================================================================
// SITUATIONAL RESOLVERS
// =============================================================================

/**
 * Resolve situational modifiers like flanking, cover, etc.
 */
export function resolveSituationalModifiers(context: RollContext): RollModifier[] {
  const modifiers: RollModifier[] = [];
  const env = context.environment;
  
  // Flanking advantage (optional rule)
  if ((env as any).flanking && context.source.type === 'weapon') {
    modifiers.push({
      id: 'flanking',
      name: 'Flanking',
      description: 'Attack with advantage when flanking',
      source: ModifierSource.CONDITION,
      type: ModifierType.ADVANTAGE,
      value: 0,
      application: ApplicationTiming.BEFORE_ROLL,
      stacks: false,
      priority: 35
    });
  }
  
  // Cover penalties
  const coverType = (env as any).cover;
  if (coverType && context.source.type === 'weapon') {
    let coverBonus = 0;
    let coverName = '';
    
    switch (coverType) {
      case 'half':
        coverBonus = 2;
        coverName = 'Half Cover';
        break;
      case 'three_quarters':
        coverBonus = 5;
        coverName = 'Three-Quarters Cover';
        break;
    }
    
    if (coverBonus > 0) {
      modifiers.push({
        id: 'cover_penalty',
        name: coverName,
        description: `Target has +${coverBonus} AC from cover`,
        source: ModifierSource.CONDITION,
        type: ModifierType.FLAT_BONUS,
        value: -coverBonus, // Negative because it makes attacks harder
        application: ApplicationTiming.BEFORE_ROLL,
        stacks: false,
        priority: 36
      });
    }
  }
  
  return modifiers;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function isRogueWithSneakAttack(character: any, context: RollContext): boolean {
  return (character.class?.toLowerCase().includes('rogue') || 
          character.classes?.some((c: any) => c.name.toLowerCase().includes('rogue'))) &&
         context.source.type === 'weapon' &&
         context.source.tags.includes('finesse');
}

function canSneakAttack(context: RollContext): boolean {
  return context.environment.advantage || 
         (context.environment as any).allyAdjacent ||
         context.environment.hidden;
}

function isWarlockWithAgonizingBlast(character: any, context: RollContext): boolean {
  // Check if character is warlock with Agonizing Blast invocation
  return character.class?.toLowerCase().includes('warlock') ||
         character.classes?.some((c: any) => c.name.toLowerCase().includes('warlock'));
}

function isEldritchBlast(context: RollContext): boolean {
  return context.source.name.toLowerCase().includes('eldritch blast');
}

function isChampionFighter(character: any): boolean {
  return character.subclass?.toLowerCase().includes('champion') ||
         character.classes?.some((c: any) => c.subclass?.toLowerCase().includes('champion'));
}

function getWeaponMagicalBonus(weaponName: string): number {
  // This would check the weapon's magical enhancement
  // For now, return 0 (no bonus)
  return 0;
}

// =============================================================================
// RESOLVER REGISTRY
// =============================================================================

/**
 * Default resolver functions that can be registered with the roll engine
 */
export const DEFAULT_RESOLVERS = {
  ability_modifiers: resolveAbilityModifiers,
  proficiency: resolveProficiencyModifiers,
  spell_effects: resolveSpellModifiers,
  advantage_conditions: resolveAdvantageModifiers,
  class_features: resolveClassFeatureModifiers,
  equipment: resolveEquipmentModifiers,
  damage_types: resolveDamageTypeModifiers,
  situational: resolveSituationalModifiers
} as const;

/**
 * Register all default resolvers with a roll engine instance
 */
export function registerDefaultResolvers(rollEngine: any): void {
  Object.entries(DEFAULT_RESOLVERS).forEach(([key, resolver]) => {
    rollEngine.registerModifierResolver?.(key, resolver);
  });
}