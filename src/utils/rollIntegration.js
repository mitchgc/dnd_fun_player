// Integration helpers to connect existing components with unified roll system

import { resolveSpellAttack } from './spellResolvers';
import { resolveConditionalDamage } from './conditionalDamageResolvers';
import { createTargetContext, resolveSpellAttackWithTarget } from './targetSystem';
import { resolveSkillCheck, resolveAbilityCheck, resolveSavingThrow } from './skillCheckResolvers';
import { parseDiceExpression } from './diceParser';
import { analyzeRoll } from './rollEngine';

/**
 * Integration wrapper for spell attacks (replaces hardcoded Eldritch Blast logic)
 */
export function performSpellAttackUnified(ability, character, context = {}) {
  try {
    // Use spell resolver to get configuration
    const spellConfig = resolveSpellAttack(ability, character, context.isHidden || false);
    
    if (!spellConfig) {
      console.error('Failed to resolve spell configuration for:', ability.ability_name);
      return null;
    }
    
    // Create roll definition for the unified system
    const rollDefinition = {
      type: spellConfig.type === 'multi_attack' ? 'spell_multi_attack' : 'spell_attack',
      context: {
        character,
        action: {
          name: spellConfig.spellName,
          type: 'spell_attack',
          attack_bonus: spellConfig.attackBonus,
          damage: spellConfig.baseDamage,
          damage_type: spellConfig.damageType
        },
        environment: {
          hidden: context.isHidden || false,
          target: context.target || null
        },
        target: context.target ? createTargetContext(context.target) : null
      },
      baseExpression: {
        expressions: [
          {
            label: 'attack',
            expression: context.isHidden ? '2d20kh1' : '1d20',
            modifier: spellConfig.attackBonus || 0
          }
        ]
      }
    };
    
    // Add damage expressions for each beam
    const numBeams = spellConfig.numBeams || 1;
    for (let i = 0; i < numBeams; i++) {
      rollDefinition.baseExpression.expressions.push({
        label: numBeams > 1 ? `damage_beam_${i + 1}` : 'damage',
        expression: spellConfig.baseDamage || '1d10'
      });
    }
    
    return {
      rollDefinition,
      spellConfig,
      numBeams,
      unified: true
    };
    
  } catch (error) {
    console.error('Error in unified spell attack:', error);
    return null;
  }
}

/**
 * Integration wrapper for weapon attacks with conditional damage
 */
export function performWeaponAttackUnified(weapon, character, context = {}) {
  try {
    const attackBonus = weapon.attack_bonus || 0;
    const damageExpression = weapon.damage_dice || '1d6';
    const damageBonus = weapon.damage_bonus || 0;
    
    // Build attack expression with advantage if hidden
    let attackExpression = context.isHidden ? '2d20kh1' : '1d20';
    if (attackBonus !== 0) {
      attackExpression += attackBonus >= 0 ? `+${attackBonus}` : `${attackBonus}`;
    }
    
    // Build damage expression
    let finalDamageExpression = damageExpression;
    if (damageBonus !== 0) {
      finalDamageExpression += damageBonus >= 0 ? `+${damageBonus}` : `${damageBonus}`;
    }
    
    const rollDefinition = {
      type: 'weapon_attack',
      context: {
        character,
        action: {
          name: weapon.name,
          type: 'weapon_attack',
          attack_bonus: attackBonus,
          damage: finalDamageExpression
        },
        environment: {
          hidden: context.isHidden || false,
          target: context.target || null
        },
        target: context.target ? createTargetContext(context.target) : null
      },
      baseExpression: {
        expressions: [
          { label: 'attack', expression: attackExpression },
          { label: 'damage', expression: finalDamageExpression }
        ]
      }
    };
    
    // Add conditional damage (like sneak attack) using resolver
    const conditionalBonuses = context.conditionalBonuses || [];
    for (const bonus of conditionalBonuses) {
      const conditionalDamage = resolveConditionalDamage(bonus, character, context);
      
      if (conditionalDamage) {
        rollDefinition.baseExpression.expressions.push({
          label: conditionalDamage.name.toLowerCase().replace(/[^a-z]/g, '_'),
          expression: conditionalDamage.expression
        });
      }
    }
    
    return {
      rollDefinition,
      weapon,
      unified: true
    };
    
  } catch (error) {
    console.error('Error in unified weapon attack:', error);
    return null;
  }
}

/**
 * Integration wrapper for skill checks
 */
export function performSkillCheckUnified(character, skillName, dc = null, context = {}) {
  try {
    const skillConfig = resolveSkillCheck(character, skillName, dc, context);
    
    const rollDefinition = {
      type: 'skill_check',
      context: {
        character,
        action: {
          name: `${skillName} Check`,
          type: 'skill_check',
          skill: skillConfig.normalizedSkill,
          ability: skillConfig.abilityName,
          dc: dc
        },
        environment: context
      },
      baseExpression: {
        expressions: [
          { 
            label: skillConfig.normalizedSkill, 
            expression: skillConfig.diceExpression 
          }
        ]
      }
    };
    
    return {
      rollDefinition,
      skillConfig,
      unified: true
    };
    
  } catch (error) {
    console.error('Error in unified skill check:', error);
    return null;
  }
}

/**
 * Integration wrapper for ability checks
 */
export function performAbilityCheckUnified(character, abilityName, dc = null, context = {}) {
  try {
    const abilityConfig = resolveAbilityCheck(character, abilityName, dc, context);
    
    const rollDefinition = {
      type: 'ability_check',
      context: {
        character,
        action: {
          name: `${abilityName} Check`,
          type: 'ability_check',
          ability: abilityConfig.normalizedAbility,
          dc: dc
        },
        environment: context
      },
      baseExpression: {
        expressions: [
          { 
            label: abilityConfig.normalizedAbility, 
            expression: abilityConfig.diceExpression 
          }
        ]
      }
    };
    
    return {
      rollDefinition,
      abilityConfig,
      unified: true
    };
    
  } catch (error) {
    console.error('Error in unified ability check:', error);
    return null;
  }
}

/**
 * Integration wrapper for saving throws
 */
export function performSavingThrowUnified(character, saveName, dc = null, context = {}) {
  try {
    const saveConfig = resolveSavingThrow(character, saveName, dc, context);
    
    const rollDefinition = {
      type: 'saving_throw',
      context: {
        character,
        action: {
          name: `${saveName} Save`,
          type: 'saving_throw',
          save: saveConfig.normalizedSave,
          dc: dc
        },
        environment: context
      },
      baseExpression: {
        expressions: [
          { 
            label: `${saveConfig.normalizedSave}_save`, 
            expression: saveConfig.diceExpression 
          }
        ]
      }
    };
    
    return {
      rollDefinition,
      saveConfig,
      unified: true
    };
    
  } catch (error) {
    console.error('Error in unified saving throw:', error);
    return null;
  }
}

