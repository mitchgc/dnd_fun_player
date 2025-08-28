/**
 * Transforms old roll log format to new unified roll display format
 */

/**
 * Convert a legacy roll log to unified roll format(s)
 * Splits attack rolls into separate attack and damage rolls
 */
export const transformRollLogToUnified = (log) => {
  const rolls = [];

  // Handle attack rolls (which have both attack and damage)
  if ((log.type === 'attack' || log.type === 'spell_attack') && log.dice.length >= 2) {
    // Check if this is a multi-beam attack (like Eldritch Blast)
    const hasMultipleBeams = log.dice.some(dice => dice.name?.includes('Beam'));
    
    if (hasMultipleBeams) {
      // Handle multi-beam attacks
      const beamGroups = {};
      
      // Group dice entries by beam number
      log.dice.forEach(diceEntry => {
        if (diceEntry.name?.includes('Beam')) {
          const beamMatch = diceEntry.name.match(/Beam (\d+)/);
          if (beamMatch) {
            const beamNum = beamMatch[1];
            if (!beamGroups[beamNum]) {
              beamGroups[beamNum] = { attacks: [], damage: [] };
            }
            
            if (diceEntry.name.includes('Attack')) {
              beamGroups[beamNum].attacks.push(diceEntry);
            } else if (diceEntry.name.includes('Damage') || diceEntry.type === 'modifier') {
              beamGroups[beamNum].damage.push(diceEntry);
            }
          }
        } else if (diceEntry.type === 'modifier') {
          // This is a standalone modifier (like Agonizing Blast)
          // Add it to all beam damage groups
          Object.keys(beamGroups).forEach(beamNum => {
            beamGroups[beamNum].damage.push({...diceEntry});
          });
        }
      });
      
      // Create separate rolls for each beam
      Object.entries(beamGroups).forEach(([beamNum, beamData]) => {
        // Attack roll for this beam
        if (beamData.attacks.length > 0) {
          const attackDice = beamData.attacks[0];
          rolls.push({
            id: `${log.id}-beam${beamNum}-attack`,
            type: log.type,
            name: `Beam ${beamNum} Attack`,
            total: attackDice.total,
            timestamp: log.timestamp,
            breakdown: transformDiceGroupToBreakdown(attackDice, log.details, false, log.name)
          });
        }
        
        // Combined damage roll for this beam
        if (beamData.damage.length > 0) {
          let totalDamage = 0;
          const combinedBreakdown = [];
          
          beamData.damage.forEach(damageEntry => {
            totalDamage += damageEntry.total;
            if (damageEntry.type === 'base_damage') {
              // Base damage dice
              combinedBreakdown.push({
                type: 'die',
                label: `d${damageEntry.dice?.[0]?.match(/d(\d+)/)?.[1] || '10'}`,
                value: damageEntry.total,
                sides: parseInt(damageEntry.dice?.[0]?.match(/d(\d+)/)?.[1] || '10')
              });
            } else if (damageEntry.type === 'modifier') {
              // Modifier like Agonizing Blast
              combinedBreakdown.push({
                type: 'modifier',
                label: damageEntry.name,
                value: damageEntry.total
              });
            }
          });
          
          rolls.push({
            id: `${log.id}-beam${beamNum}-damage`,
            type: 'damage',
            name: `Beam ${beamNum} Damage`,
            total: totalDamage,
            timestamp: log.timestamp,
            breakdown: combinedBreakdown
          });
        }
      });
    } else {
      // Standard single attack/damage pair
      // Attack roll
      const attackDice = log.dice[0];
      const attackRoll = {
        id: `${log.id}-attack`,
        type: log.type,
        name: log.name,
        total: attackDice.total,
        timestamp: log.timestamp,
        breakdown: transformDiceGroupToBreakdown(attackDice, log.details, false, log.name)
      };
      rolls.push(attackRoll);

      // Damage roll
      const damageDice = log.dice[1];
      const damageRoll = {
        id: `${log.id}-damage`,
        type: 'damage',
        name: `${log.name.replace(' Attack', '')} Damage`,
        total: damageDice.total,
        timestamp: log.timestamp,
        breakdown: transformDiceGroupToBreakdown(damageDice, log.details, true, log.name)
      };
      rolls.push(damageRoll);
    }
  } 
  // Handle spell save rolls (damage only)
  else if (log.type === 'spell_save') {
    const diceGroup = log.dice[0];
    const spellRoll = {
      id: log.id,
      type: 'damage',
      name: log.name,
      total: diceGroup.total,
      timestamp: log.timestamp,
      breakdown: transformDiceGroupToBreakdown(diceGroup, log.details, true, log.name)
    };
    rolls.push(spellRoll);
  }
  // Handle other single roll types
  else {
    const diceGroup = log.dice[0];
    const singleRoll = {
      id: log.id,
      type: log.type,
      name: log.name,
      total: diceGroup.total,
      timestamp: log.timestamp,
      breakdown: transformDiceGroupToBreakdown(diceGroup, log.details, false, log.name)
    };
    rolls.push(singleRoll);
  }

  return rolls;
};

/**
 * Transform a dice group to breakdown format
 */
const transformDiceGroupToBreakdown = (diceGroup, details, isDamage = false, rollName = '') => {
  const breakdown = [];

  // Simple dice labels without prefixes
  const getDiceLabel = (sides) => `d${sides}`;

  // Handle dice rolls
  if (diceGroup.dice && diceGroup.dice.length > 0) {
    // Check if this is an advantage/disadvantage roll
    if (details?.advantage && !isDamage) {
      // For advantage, we should have 2 d20 rolls
      const advantageRolls = diceGroup.dice.slice(0, 2).map(die => {
        // Parse dice values like "d20: 16" -> 16 or just "16" -> 16
        const match = die.toString().match(/(?:d\d+:\s*)?(\d+)/);
        return match ? parseInt(match[1]) : parseInt(die);
      });
      
      breakdown.push({
        type: 'die',
        label: 'd20 Advantage',
        value: Math.max(...advantageRolls),
        sides: 20,
        advantage: advantageRolls
      });
    } else if (details?.disadvantage && !isDamage) {
      // For disadvantage, we should have 2 d20 rolls
      const disadvantageRolls = diceGroup.dice.slice(0, 2).map(die => {
        // Parse dice values like "d20: 16" -> 16 or just "16" -> 16
        const match = die.toString().match(/(?:d\d+:\s*)?(\d+)/);
        return match ? parseInt(match[1]) : parseInt(die);
      });
      
      breakdown.push({
        type: 'die',
        label: 'd20 Disadvantage', 
        value: Math.min(...disadvantageRolls),
        sides: 20,
        disadvantage: disadvantageRolls
      });
    } else {
      // Regular dice rolls - group by die type
      const diceByType = {};
      diceGroup.dice.forEach(die => {
        // Extract die size from string like "d8: 4" -> 8
        const dieMatch = die.toString().match(/d(\d+):\s*(\d+)|^(\d+)$/);
        if (dieMatch) {
          const sides = dieMatch[1] || '6'; // Default to d6 if no die type specified
          const value = parseInt(dieMatch[2] || dieMatch[3]);
          
          if (!diceByType[sides]) {
            diceByType[sides] = [];
          }
          diceByType[sides].push(value);
        }
      });

      // Add each die type as a breakdown item
      Object.entries(diceByType).forEach(([sides, values]) => {
        const sidesInt = parseInt(sides);
        if (values.length === 1) {
          breakdown.push({
            type: 'die',
            label: getDiceLabel(sidesInt),
            value: values[0],
            sides: sidesInt
          });
        } else {
          // Multiple dice of same type
          values.forEach((value, index) => {
            breakdown.push({
              type: 'die',
              label: getDiceLabel(sidesInt),
              value: value,
              sides: sidesInt
            });
          });
        }
      });
    }
  }

  // Add modifiers/bonuses
  if (diceGroup.bonus && diceGroup.bonus > 0) {
    const modifierLabel = isDamage 
      ? `Modifier (+${diceGroup.bonus})`
      : `${diceGroup.name.includes('Attack') ? 'Weapon' : 'Skill'} Modifier (+${diceGroup.bonus})`;
    
    breakdown.push({
      type: 'modifier',
      label: modifierLabel,
      value: diceGroup.bonus
    });
  }

  return breakdown;
};

/**
 * Create a unified roll from scratch (for new rolls)
 */
export const createUnifiedRoll = (type, name, dice, modifiers, options = {}) => {
  const breakdown = [];
  let total = 0;

  // Add dice to breakdown
  dice.forEach(die => {
    breakdown.push({
      type: 'die',
      label: options.advantage ? `d${die.sides} Advantage` : 
             options.disadvantage ? `d${die.sides} Disadvantage` : 
             `d${die.sides}`,
      value: die.value,
      sides: die.sides,
      advantage: options.advantage ? die.rolls : undefined,
      disadvantage: options.disadvantage ? die.rolls : undefined
    });
    total += die.value;
  });

  // Add modifiers to breakdown
  modifiers.forEach(modifier => {
    breakdown.push({
      type: 'modifier',
      label: modifier.label,
      value: modifier.value
    });
    total += modifier.value;
  });

  return {
    type,
    name,
    total,
    breakdown,
    timestamp: Date.now()
  };
};