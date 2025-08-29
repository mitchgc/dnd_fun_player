/**
 * Weapon to Expression Converter
 * 
 * Converts legacy weapon data and character stats into text expressions
 * that the unified roll system can parse and execute.
 */

import { getConditionalDamageBonuses } from './resourceManager';

export interface WeaponStats {
  name: string;
  attackBonus: number;
  damageBonus: number;
  damageDice: string;
  attackExpression: string;
  damageExpression: string;
  fullExpression: string; // For legacy compatibility only
  separateAttack: string;
  separateDamage: string;
}

/**
 * Convert a weapon and character context to roll expressions
 */
export function convertWeaponToExpression(
  weaponName: string,
  character: any,
  gameState: {
    isHidden?: boolean;
    hasAdvantage?: boolean;
    hasDisadvantage?: boolean;
    allyNearby?: boolean;
  } = {}
): WeaponStats | null {
  const weapon = character?.dnd_character_weapons?.find((w: any) => 
    w.name.toLowerCase() === weaponName.toLowerCase()
  );
  
  if (!weapon) {
    console.error('Weapon not found:', weaponName);
    return null;
  }

  // Extract weapon bonuses
  const attackBonus = weapon.attack_bonus || 0;
  const damageBonus = weapon.damage_bonus || 0;
  
  // Parse damage dice (e.g., "1d8", "2d6", etc.)
  let baseDamageDice = weapon.damage_dice || '1d6';
  // Clean up the damage dice string
  baseDamageDice = baseDamageDice.replace(/[^d\d]/g, '');
  
  // Build attack expression
  let attackExpression = '1d20';
  
  // Add advantage/disadvantage
  if (gameState.hasAdvantage || gameState.isHidden) {
    attackExpression = '2d20kh1'; // advantage
  } else if (gameState.hasDisadvantage) {
    attackExpression = '2d20kl1'; // disadvantage
  }
  
  // Add attack bonus
  if (attackBonus !== 0) {
    attackExpression += attackBonus >= 0 ? `+${attackBonus}` : `${attackBonus}`;
  }
  
  // Build damage expression
  let damageExpression = baseDamageDice;
  
  // Add weapon damage bonus
  if (damageBonus !== 0) {
    damageExpression += damageBonus >= 0 ? `+${damageBonus}` : `${damageBonus}`;
  }
  
  // Check for conditional damage bonuses (like Sneak Attack)
  const conditionalBonuses = getConditionalDamageBonuses(
    character?.dnd_character_abilities || [], 
    weaponName, 
    'weapon',
    gameState
  );
  
  // Add conditional damage using configurable resolver
  const { resolveConditionalDamage } = require('./conditionalDamageResolvers');
  
  for (const bonus of conditionalBonuses) {
    const conditionalDamage = resolveConditionalDamage(bonus, character);
    
    if (conditionalDamage) {
      // Use the resolved conditional damage expression
      const label = conditionalDamage.name.toLowerCase().replace(/[^a-z]/g, '_');
      damageExpression += `,${label}:${conditionalDamage.expression}`;
    }
    // Fallback to old hardcoded logic for backward compatibility
    else if (bonus.damage_dice?.includes('3d6')) {
      damageExpression += ',sneak:3d6';
    }
  }
  
  // Create combined attack and damage expression (legacy compatibility)
  const fullExpression = `attack:${attackExpression},damage:${damageExpression}`;
  
  // Create separate expressions for proper attack-then-damage flow
  const separateAttack = attackExpression;
  const separateDamage = damageExpression;
  
  return {
    name: weapon.name,
    attackBonus,
    damageBonus,
    damageDice: baseDamageDice,
    attackExpression,
    damageExpression,
    fullExpression, // Keep for backwards compatibility
    separateAttack,
    separateDamage
  };
}

/**
 * Create a roll context from character and weapon data
 */
export function createWeaponRollContext(
  weaponName: string,
  character: any,
  gameState: {
    isHidden?: boolean;
    hasAdvantage?: boolean;
    hasDisadvantage?: boolean;
    allyNearby?: boolean;
  } = {}
) {
  const weapon = character?.dnd_character_weapons?.find((w: any) => 
    w.name.toLowerCase() === weaponName.toLowerCase()
  );

  return {
    character: {
      id: character.id,
      level: character.level,
      ability_scores: character.ability_scores,
      proficiencyBonus: character.proficiencyBonus
    },
    source: {
      type: 'weapon' as const,
      name: weaponName,
      tags: ['melee', 'weapon_attack'],
      properties: {
        damage: weapon?.damage_dice || '1d6',
        attackBonus: weapon?.attack_bonus || 0,
        damageBonus: weapon?.damage_bonus || 0
      }
    },
    target: {
      // Could add AC if available
    },
    environment: {
      advantage: gameState.hasAdvantage || gameState.isHidden || false,
      disadvantage: gameState.hasDisadvantage || false,
      hidden: gameState.isHidden || false,
      blessed: false,
      inspired: false,
      conditions: []
    }
  };
}

/**
 * Get weapon stats for preview/display purposes
 */
export function getWeaponPreviewStats(weaponName: string, character: any) {
  const weapon = character?.dnd_character_weapons?.find((w: any) => 
    w.name.toLowerCase() === weaponName.toLowerCase()
  );
  
  if (!weapon) return null;
  
  // Extract dice information
  const damageDice = weapon.damage_dice || '1d6';
  const diceMatch = damageDice.match(/(\d+)d(\d+)/);
  const diceCount = diceMatch ? parseInt(diceMatch[1]) : 1;
  const diceSides = diceMatch ? parseInt(diceMatch[2]) : 6;
  
  const attackBonus = weapon.attack_bonus || 0;
  const damageBonus = weapon.damage_bonus || 0;
  
  return {
    name: weapon.name,
    attackBonus,
    damageBonus,
    damageDice,
    diceCount,
    diceSides,
    minAttack: 1 + attackBonus,
    maxAttack: 20 + attackBonus,
    minDamage: diceCount + damageBonus,
    maxDamage: (diceCount * diceSides) + damageBonus
  };
}