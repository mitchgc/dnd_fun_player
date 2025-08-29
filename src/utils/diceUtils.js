import { getConditionalDamageBonuses } from './resourceManager';
import { parseDiceExpression } from './diceParser';

// Dice rolling utilities
export const rollDice = (sides) => Math.floor(Math.random() * sides) + 1;

// Calculate weapon stats using unified dice parser
export const getWeaponStats = (weaponName, isHidden, character) => {
  const weapon = character?.dnd_character_weapons?.find(w => 
    w.name.toLowerCase() === weaponName.toLowerCase()
  );
  if (!weapon) return { minDamage: 1, maxDamage: 6, minHit: 1, maxHit: 20, hasAdvantage: false };
  
  // Parse weapon damage dice using unified system
  const damageDice = weapon.damage_dice || '1d6';
  const parsedDamage = parseDiceExpression(damageDice);
  const damageBonus = weapon.damage_bonus || 0;
  
  // Calculate damage range from parsed dice
  let minDamage = parsedDamage.count + damageBonus; // minimum roll is count * 1
  let maxDamage = (parsedDamage.count * parsedDamage.sides) + damageBonus;
  
  // Add conditional damage potential using unified parser
  const conditionalBonuses = getConditionalDamageBonuses(
    character?.dnd_character_abilities || [], 
    weaponName, 
    'weapon',
    { isHidden, hasAdvantage: isHidden }
  );
  
  if (conditionalBonuses.length > 0) {
    for (const bonus of conditionalBonuses) {
      if (bonus.damage_dice) {
        try {
          const parsedConditional = parseDiceExpression(bonus.damage_dice);
          minDamage += parsedConditional.count; // minimum is count * 1
          maxDamage += parsedConditional.count * parsedConditional.sides;
        } catch (error) {
          console.warn('Failed to parse conditional damage dice:', bonus.damage_dice, error);
          // Fallback: treat as the old hardcoded 3d6 case
          if (bonus.damage_dice?.includes('3d6')) {
            minDamage += 3;
            maxDamage += 18;
          }
        }
      }
    }
  }
  
  // Hit range calculation
  const minHit = 1 + (weapon.attack_bonus || 0);
  const maxHit = 20 + (weapon.attack_bonus || 0);
  
  return { minDamage, maxDamage, minHit, maxHit, hasAdvantage: isHidden };
};

