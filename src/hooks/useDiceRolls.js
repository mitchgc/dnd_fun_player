import { useState, useCallback } from 'react';
import { rollDice, rollAttack } from '../utils/diceUtils';
import { character } from '../data/index';

export const useDiceRolls = () => {
  const [rollLogs, setRollLogs] = useState([]);

  // Log roll function
  const logRoll = useCallback((logEntry) => {
    const timestamp = new Date().toLocaleTimeString();
    const entry = { ...logEntry, timestamp, id: Date.now() };
    setRollLogs(prev => [entry, ...prev]); // Add to beginning for newest first
  }, []);

  // Enhanced attack rolling
  const performAttackRoll = useCallback((selectedWeapon, isHidden) => {
    const result = rollAttack(selectedWeapon, isHidden, character, rollDice);

    // Log the attack roll details
    logRoll({
      type: 'attack',
      name: `${result.weapon} Attack`,
      dice: [
        { 
          name: 'Attack Roll', 
          dice: result.advantageRolls ? [`d20: ${result.advantageRolls[0]}`, `d20: ${result.advantageRolls[1]}`] : [`d20: ${result.attackRoll}`],
          bonus: character.weapons[selectedWeapon].attack,
          total: result.totalAttack,
          advantage: !!result.advantageRolls
        },
        {
          name: 'Damage Roll',
          dice: [
            `d${result.weaponDiceSize}: ${result.baseDamageRoll - 3}${result.isCritical ? ' (doubled for crit)' : ''}`
          ].concat(
            result.sneakAttackRolls.length > 0 ? 
              result.sneakAttackRolls.map((roll, i) => `d6: ${roll} (sneak attack${i >= character.sneakAttackDice && result.isCritical ? ' crit' : ''})`) 
              : []
          ),
          bonus: 3, // DEX modifier
          total: result.totalDamage
        }
      ],
      isCritical: result.isCritical,
      details: {
        advantage: !!result.advantageRolls,
        sneakAttack: result.sneakAttackRolls.length > 0,
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

  // Healing roll function
  const performHealingRoll = useCallback((action, currentHP) => {
    let healingAmount = 0;
    let result;
    
    if (action.healType === 'long-rest') {
      // Long rest - full heal and reset abilities
      healingAmount = character.maxHP - currentHP;
      result = {
        type: 'healing',
        name: action.name,
        healingAmount,
        healType: 'long-rest',
        description: 'Fully restored HP and reset all abilities',
        finalHP: character.maxHP
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
        finalHP: Math.min(character.maxHP, currentHP + healingAmount)
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
        finalHP: Math.min(character.maxHP, currentHP + healingAmount)
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
    performStandardRoll,
    performHealingRoll,
    logRoll,
    clearLogs
  };
};