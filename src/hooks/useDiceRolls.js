import { useState, useCallback } from 'react';
import { rollDice, rollAttack } from '../utils/diceUtils';
import { getPassiveDamageBonuses } from '../utils/resourceManager';

export const useDiceRolls = () => {
  const [rollLogs, setRollLogs] = useState([]);

  // Log roll function
  const logRoll = useCallback((logEntry) => {
    const timestamp = new Date().toLocaleTimeString();
    const entry = { ...logEntry, timestamp, id: Date.now() };
    setRollLogs(prev => [entry, ...prev]); // Add to beginning for newest first
  }, []);

  // Enhanced attack rolling (character will be passed as parameter)
  const performAttackRoll = useCallback((selectedWeapon, isHidden, character) => {
    if (!character) {
      console.error('Character data required for attack roll');
      return null;
    }
    const result = rollAttack(selectedWeapon, isHidden, character, rollDice);
    
    if (!result) {
      console.error('Attack roll failed');
      return null;
    }

    const weapon = character.dnd_character_weapons?.find(w => w.name === selectedWeapon);
    const damageBonus = weapon?.damage_bonus || 0;

    // Log the attack roll details
    logRoll({
      type: 'attack',
      name: `${result.weapon} Attack`,
      dice: [
        { 
          name: 'Attack Roll', 
          dice: result.advantageRolls ? [`d20: ${result.advantageRolls[0]}`, `d20: ${result.advantageRolls[1]}`] : [`d20: ${result.attackRoll}`],
          bonus: weapon?.attack_bonus || 0,
          total: result.totalAttack,
          advantage: !!result.advantageRolls
        },
        {
          name: 'Damage Roll',
          dice: [
            `d${result.weaponDiceSize}: ${result.baseDamageRoll - damageBonus}${result.isCritical ? ' (doubled for crit)' : ''}`
          ].concat(
            result.conditionalDamageRolls?.length > 0 ? 
              result.conditionalDamageRolls.map((roll, i) => {
                const bonus = result.conditionalBonuses?.[0];
                return `d6: ${roll} (${bonus?.name || 'conditional'}${result.isCritical ? ' crit' : ''})`;
              }) 
              : []
          ),
          bonus: damageBonus,
          total: result.totalDamage,
          conditionalBonuses: result.conditionalBonuses
        }
      ],
      isCritical: result.isCritical,
      details: {
        advantage: !!result.advantageRolls,
        conditionalDamage: result.conditionalDamageRolls?.length > 0,
        conditionalBonuses: result.conditionalBonuses,
        weapon: result.weapon
      }
    });

    // Add the required type property for RollResult component
    return {
      ...result,
      type: 'attack'
    };
  }, [logRoll]);

  // Standard roll function
  const performStandardRoll = useCallback((action) => {
    const diceSize = action.dice || 20;
    const roll = rollDice(diceSize);
    
    if (action.type === 'raw') {
      // Raw dice rolls (no modifiers)
      const result = {
        type: action.type,
        name: action.name,
        roll,
        modifier: 0,
        total: roll,
        dice: `1d${diceSize}`
      };

      logRoll({
        type: 'raw',
        name: action.name,
        dice: [{
          name: 'Raw Roll',
          dice: [`d${diceSize}: ${roll}`],
          bonus: 0,
          total: roll
        }],
        details: {
          diceSize,
          critSuccess: roll === diceSize,
          critFail: roll === 1
        }
      });

      return result;
    } else if (action.type === 'death-save') {
      // Death saves (special handling)
      const total = roll;
      const result = {
        type: action.type,
        name: action.name,
        roll,
        modifier: 0,
        total,
        dice: '1d20',
        success: roll >= 10,
        critSuccess: roll === 20,
        critFail: roll === 1
      };

      logRoll({
        type: 'death-save',
        name: action.name,
        dice: [{
          name: 'Death Save',
          dice: [`d20: ${roll}`],
          bonus: 0,
          total: roll
        }],
        details: {
          success: roll >= 10,
          critSuccess: roll === 20,
          critFail: roll === 1
        }
      });

      return result;
    } else {
      // Handle skill checks, ability checks, saves, etc.
      const total = roll + action.modifier;
      const result = {
        type: action.type,
        name: action.name,
        roll,
        modifier: action.modifier,
        total,
        dice: diceSize === 20 ? '1d20' : `1d${diceSize}`,
        proficient: action.proficient,
        expertise: action.expertise
      };

      logRoll({
        type: action.type,
        name: action.name,
        dice: [{
          name: action.name,
          dice: [`d${diceSize}: ${roll}`],
          bonus: action.modifier,
          total,
          proficient: action.proficient,
          expertise: action.expertise
        }],
        details: {
          proficient: action.proficient,
          expertise: action.expertise,
          diceSize
        }
      });

      return result;
    }
  }, [logRoll]);

  // Spell attack roll function (e.g., Eldritch Blast)
  const performSpellAttack = useCallback((ability, isHidden, character) => {
    if (!character || !ability) {
      console.error('Character and ability data required for spell attack');
      return null;
    }
    
    const attackBonus = ability.ability_data?.attack_bonus || 0;
    const baseDamage = ability.ability_data?.damage || '1d10';
    const damageType = ability.ability_data?.damage_type || 'force';
    const numBeams = ability.ability_data?.num_beams || 1;
    
    // Get passive damage bonuses (Agonizing Blast, etc.)
    const damageBonuses = getPassiveDamageBonuses(
      character.dnd_character_abilities || [], 
      ability.ability_name, 
      'spell'
    );
    
    let attackRolls = [];
    let damageRolls = [];
    let totalDamage = 0;
    let hits = 0;
    
    // Roll for each beam
    for (let i = 0; i < numBeams; i++) {
      const attackRoll = rollDice(20);
      const attackTotal = attackRoll + attackBonus + (isHidden ? 0 : 0); // Could add advantage later
      attackRolls.push({ roll: attackRoll, total: attackTotal });
      
      // Assume AC 15 for hit calculation (could be parameterized later)
      const hits_target = attackTotal >= 15;
      
      if (hits_target) {
        hits++;
        
        // Roll base damage
        const damageRoll = rollDice(10); // d10 for Eldritch Blast
        let beamDamage = damageRoll;
        
        // Apply passive damage bonuses
        let bonusDescription = [];
        for (const bonus of damageBonuses) {
          beamDamage += bonus.damage;
          bonusDescription.push(`+${bonus.damage} ${bonus.name}`);
        }
        
        damageRolls.push({ 
          roll: damageRoll, 
          bonus: beamDamage - damageRoll,
          total: beamDamage,
          bonuses: bonusDescription
        });
        totalDamage += beamDamage;
      }
    }
    
    const result = {
      type: 'spell_attack',
      name: ability.ability_name,
      attackRolls,
      damageRolls,
      totalDamage,
      hits,
      numBeams,
      damageType,
      damageBonuses: damageBonuses.map(b => b.name)
    };
    
    // Log the spell attack
    logRoll({
      type: 'spell_attack',
      name: ability.ability_name,
      dice: attackRolls.map((attack, i) => ({
        name: `Beam ${i + 1} Attack`,
        dice: [`d20: ${attack.roll}`],
        bonus: attackBonus,
        total: attack.total,
        hit: attack.total >= 15
      })).concat(
        damageRolls.map((damage, i) => ({
          name: `Beam ${i + 1} Damage`,
          dice: [`d10: ${damage.roll}`],
          bonus: damage.bonus,
          total: damage.total,
          bonuses: damage.bonuses
        }))
      ),
      details: {
        totalDamage,
        hits: `${hits}/${numBeams}`,
        damageType,
        bonuses: damageBonuses.map(b => b.name)
      }
    });
    
    return result;
  }, [logRoll]);

  // Healing roll function (character will be passed as parameter)
  const performHealingRoll = useCallback((action, currentHP, character) => {
    if (!character) {
      console.error('Character data required for healing roll');
      return null;
    }
    let healingAmount = 0;
    let result;
    
    if (action.healType === 'long-rest') {
      // Long rest - full heal and reset abilities
      healingAmount = character.max_hp - currentHP;
      result = {
        type: 'healing',
        name: action.name,
        healingAmount,
        healType: 'long-rest',
        description: 'Fully restored HP and reset all abilities',
        finalHP: character.max_hp
      };
    } else if (action.healType === 'short-rest') {
      // Short rest - roll hit dice (3d8 for level 5 rogue)
      let hitDiceRolls = [];
      for (let i = 0; i < 3; i++) {
        const roll = rollDice(8);
        hitDiceRolls.push(roll);
        healingAmount += roll;
      }
      
      result = {
        type: 'healing',
        name: action.name,
        healingAmount,
        healType: 'short-rest',
        hitDiceRolls,
        description: `Rolled ${hitDiceRolls.join(', ')} on 3d8`,
        finalHP: Math.min(character.max_hp, currentHP + healingAmount)
      };
    } else if (action.healType === 'potion') {
      // Roll potion dice
      let potionRolls = [];
      
      if (action.id === 'superior-potion') {
        // 8d4+8
        for (let i = 0; i < 8; i++) {
          const roll = rollDice(4);
          potionRolls.push(roll);
          healingAmount += roll;
        }
        healingAmount += 8; // +8 bonus
      } else if (action.id === 'basic-potion') {
        // 2d4+2
        for (let i = 0; i < 2; i++) {
          const roll = rollDice(4);
          potionRolls.push(roll);
          healingAmount += roll;
        }
        healingAmount += 2; // +2 bonus
      }
      
      result = {
        type: 'healing',
        name: action.name,
        healingAmount,
        healType: 'potion',
        potionRolls,
        description: `Rolled ${potionRolls.join(', ')} ${action.id === 'superior-potion' ? '+8' : '+2'}`,
        finalHP: Math.min(character.max_hp, currentHP + healingAmount)
      };
    } else if (action.healType === 'custom') {
      // Custom healing - this will be handled differently
      result = {
        type: 'healing',
        name: action.name,
        healType: 'custom',
        needsInput: true,
        description: 'Enter healing amount'
      };
    }

    // Log the healing
    if (action.healType !== 'custom') {
      logRoll({
        type: 'healing',
        name: action.name,
        dice: [{
          name: 'Healing',
          dice: result.hitDiceRolls ? result.hitDiceRolls.map((r, i) => `d8: ${r}`) : 
                result.potionRolls ? result.potionRolls.map((r, i) => `d4: ${r}`) : 
                ['Full Rest'],
          bonus: action.id === 'superior-potion' ? 8 : action.id === 'basic-potion' ? 2 : 0,
          total: healingAmount
        }],
        details: {
          healType: action.healType,
          finalHP: result.finalHP
        }
      });
    }

    return result;
  }, [logRoll]);

  const clearLogs = useCallback(() => {
    setRollLogs([]);
  }, []);

  return {
    rollLogs,
    performAttackRoll,
    performSpellAttack,
    performStandardRoll,
    performHealingRoll,
    logRoll,
    clearLogs
  };
};