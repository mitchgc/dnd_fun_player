import { getConditionalDamageBonuses } from './resourceManager';

// Dice rolling utilities
export const rollDice = (sides) => Math.floor(Math.random() * sides) + 1;

// Calculate weapon stats with sneak attack potential
export const getWeaponStats = (weaponName, isHidden, character) => {
  const weapon = character?.dnd_character_weapons?.find(w => 
    w.name.toLowerCase() === weaponName.toLowerCase()
  );
  if (!weapon) return { minDamage: 1, maxDamage: 6, minHit: 1, maxHit: 20, hasAdvantage: false };
  
  let minDamage, maxDamage;
  const damageBonus = weapon.damage_bonus || 0;
  
  if (weapon.damage_dice?.includes('d8')) {
    minDamage = 1 + damageBonus;
    maxDamage = 8 + damageBonus;
  } else {
    minDamage = 1 + damageBonus;
    maxDamage = 6 + damageBonus;
  }
  
  // Add conditional damage potential (like Sneak Attack)
  const conditionalBonuses = getConditionalDamageBonuses(
    character?.dnd_character_abilities || [], 
    weaponName, 
    'weapon',
    { isHidden, hasAdvantage: isHidden }
  );
  
  if (conditionalBonuses.length > 0) {
    for (const bonus of conditionalBonuses) {
      if (bonus.damage_dice?.includes('3d6')) {
        minDamage += 3; // minimum 3d6
        maxDamage += 18; // maximum 3d6
      }
    }
  }
  
  // Hit range calculation
  const minHit = 1 + (weapon.attack_bonus || 0);
  const maxHit = 20 + (weapon.attack_bonus || 0);
  
  return { minDamage, maxDamage, minHit, maxHit, hasAdvantage: isHidden };
};

// Enhanced attack rolling with better critical hit handling
export const rollAttack = (selectedWeapon, isHidden, character, rollDiceFn = rollDice) => {
  const weapon = character?.dnd_character_weapons?.find(w => 
    w.name.toLowerCase() === selectedWeapon.toLowerCase()
  );
  if (!weapon) {
    console.error('Weapon not found:', selectedWeapon, 'Available weapons:', character?.dnd_character_weapons?.map(w => w.name));
    return null;
  }
  
  let attackRoll;
  let advantageRolls = null;
  
  // Roll with advantage if hidden
  if (isHidden) {
    const roll1 = rollDiceFn(20);
    const roll2 = rollDiceFn(20);
    attackRoll = Math.max(roll1, roll2);
    advantageRolls = [roll1, roll2];
  } else {
    attackRoll = rollDiceFn(20);
  }
  
  const totalAttack = attackRoll + (weapon.attack_bonus || 0);
  const isCritical = attackRoll === 20;
  
  let baseDamageRoll;
  let conditionalDamageRolls = [];
  let conditionalDamageTotal = 0;
  let totalDamage;
  
  // Roll weapon damage dice
  const damageBonus = weapon.damage_bonus || 0;
  if (weapon.damage_dice?.includes('d8')) {
    baseDamageRoll = rollDiceFn(8) + damageBonus;
    // Double dice on critical hit
    if (isCritical) {
      baseDamageRoll += rollDiceFn(8);
    }
  } else {
    baseDamageRoll = rollDiceFn(6) + damageBonus;
    // Double dice on critical hit
    if (isCritical) {
      baseDamageRoll += rollDiceFn(6);
    }
  }
  
  // Check for conditional damage bonuses (like Sneak Attack)
  const gameState = { 
    isHidden, 
    hasAdvantage: isHidden || advantageRolls, 
    allyNearby: false // Could be parameterized later
  };
  
  const conditionalBonuses = getConditionalDamageBonuses(
    character?.dnd_character_abilities || [], 
    selectedWeapon, 
    'weapon',
    gameState
  );
  
  for (const bonus of conditionalBonuses) {
    if (bonus.damage_dice?.includes('3d6')) {
      // Roll 3d6 for Sneak Attack
      for (let i = 0; i < 3; i++) {
        const roll = rollDiceFn(6);
        conditionalDamageRolls.push(roll);
        conditionalDamageTotal += roll;
      }
      
      // Double conditional damage dice on critical hit
      if (isCritical) {
        for (let i = 0; i < 3; i++) {
          const roll = rollDiceFn(6);
          conditionalDamageRolls.push(roll);
          conditionalDamageTotal += roll;
        }
      }
    }
  }
  
  totalDamage = baseDamageRoll + conditionalDamageTotal;
  
  return {
    attackRoll,
    advantageRolls,
    totalAttack,
    baseDamageRoll,
    sneakAttackRolls: conditionalDamageRolls, // Renamed for backwards compatibility
    sneakAttackTotal: conditionalDamageTotal, // Renamed for backwards compatibility
    conditionalDamageRolls,
    conditionalDamageTotal,
    conditionalBonuses: conditionalBonuses.map(b => ({ name: b.name, condition: b.condition_met })),
    totalDamage,
    weapon: weapon.name,
    weaponDiceSize: weapon.damage_dice?.includes('d8') ? 8 : 6,
    isCritical
  };
};