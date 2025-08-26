// Dice rolling utilities
export const rollDice = (sides) => Math.floor(Math.random() * sides) + 1;

// Calculate weapon stats with sneak attack potential
export const getWeaponStats = (weaponKey, isHidden, character) => {
  const weapon = character.weapons[weaponKey];
  let minDamage, maxDamage;
  
  if (weapon.damage.includes('d8')) {
    minDamage = 1 + 3;
    maxDamage = 8 + 3;
  } else {
    minDamage = 1 + 3;
    maxDamage = 6 + 3;
  }
  
  // Add sneak attack potential when hidden
  if (isHidden) {
    minDamage += character.sneakAttackDice; // minimum sneak attack
    maxDamage += character.sneakAttackDice * 6; // maximum sneak attack
  }
  
  // Hit range calculation
  const minHit = 1 + weapon.attack;
  const maxHit = 20 + weapon.attack;
  
  return { minDamage, maxDamage, minHit, maxHit, hasAdvantage: isHidden };
};

// Enhanced attack rolling with better critical hit handling
export const rollAttack = (selectedWeapon, isHidden, character, rollDice) => {
  const weapon = character.weapons[selectedWeapon];
  let attackRoll;
  let advantageRolls = null;
  
  // Roll with advantage if hidden
  if (isHidden) {
    const roll1 = rollDice(20);
    const roll2 = rollDice(20);
    attackRoll = Math.max(roll1, roll2);
    advantageRolls = [roll1, roll2];
  } else {
    attackRoll = rollDice(20);
  }
  
  const totalAttack = attackRoll + weapon.attack;
  const isCritical = attackRoll === 20;
  
  let baseDamageRoll;
  let sneakAttackRolls = [];
  let sneakAttackTotal = 0;
  let totalDamage;
  
  // Roll weapon damage dice
  if (weapon.damage.includes('d8')) {
    baseDamageRoll = rollDice(8) + 3;
    // Double dice on critical hit
    if (isCritical) {
      baseDamageRoll += rollDice(8);
    }
  } else {
    baseDamageRoll = rollDice(6) + 3;
    // Double dice on critical hit
    if (isCritical) {
      baseDamageRoll += rollDice(6);
    }
  }
  
  // Add sneak attack only if hidden (simplified for single-player)
  if (isHidden) {
    for (let i = 0; i < character.sneakAttackDice; i++) {
      const roll = rollDice(6);
      sneakAttackRolls.push(roll);
      sneakAttackTotal += roll;
    }
    
    // Double sneak attack dice on critical hit
    if (isCritical) {
      for (let i = 0; i < character.sneakAttackDice; i++) {
        const roll = rollDice(6);
        sneakAttackRolls.push(roll);
        sneakAttackTotal += roll;
      }
    }
  }
  
  totalDamage = baseDamageRoll + sneakAttackTotal;
  
  return {
    attackRoll,
    advantageRolls,
    totalAttack,
    baseDamageRoll,
    sneakAttackRolls,
    sneakAttackTotal,
    totalDamage,
    weapon: weapon.name,
    weaponDiceSize: weapon.damage.includes('d8') ? 8 : 6,
    isCritical
  };
};