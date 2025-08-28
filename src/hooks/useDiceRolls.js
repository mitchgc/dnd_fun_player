import { useState, useCallback } from 'react';
import { rollDice, rollAttack } from '../utils/diceUtils';
import { getPassiveDamageBonuses } from '../utils/resourceManager';

export const useDiceRolls = () => {
  const [rollLogs, setRollLogs] = useState([]);

  // Log roll function
  const logRoll = useCallback((logEntry) => {
    const timestamp = Date.now(); // Use Unix timestamp for consistency
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
    // Calculate beam count based on character level for Eldritch Blast
    let numBeams = 1;
    if (ability.ability_name?.toLowerCase().includes('eldritch blast') && character?.level) {
      if (character.level >= 17) numBeams = 4;
      else if (character.level >= 11) numBeams = 3; 
      else if (character.level >= 5) numBeams = 2;
    } else {
      numBeams = ability.ability_data?.num_beams || ability.ability_data?.current_beams || 1;
    }
    
    // Get passive damage bonuses (Agonizing Blast, etc.)
    const damageBonuses = getPassiveDamageBonuses(
      character.dnd_character_abilities || [], 
      ability.ability_name, 
      'spell_attack'
    );
    
    let attackRolls = [];
    let damageRolls = [];
    let totalDamage = 0;
    let hits = 0;
    let genieWrathUsed = false; // Track if Genie's Wrath has been applied this turn
    
    // Separate bonuses by frequency
    const perBeamBonuses = damageBonuses.filter(bonus => !bonus.once_per_turn);
    const oncePerTurnBonuses = damageBonuses.filter(bonus => bonus.once_per_turn);
    
    // Roll for each beam
    for (let i = 0; i < numBeams; i++) {
      const attackRoll = rollDice(20);
      const attackTotal = attackRoll + attackBonus + (isHidden ? 0 : 0); // Could add advantage later
      attackRolls.push({ roll: attackRoll, total: attackTotal, beamNumber: i + 1 });
      
      // Assume AC 15 for hit calculation (could be parameterized later)
      const hits_target = attackTotal >= 15;
      
      if (hits_target) {
        hits++;
        
        // Roll base damage using actual dice from ability data
        const parseDamageRoll = (diceString) => {
          const match = diceString.match(/(\d+)d(\d+)(?:\+(\d+))?/);
          if (!match) return { total: 0, rolls: [], bonus: 0, diceSize: 6 };
          
          const numDice = parseInt(match[1]);
          const diceSize = parseInt(match[2]);
          const bonus = parseInt(match[3] || 0);
          
          const rolls = [];
          let total = bonus;
          
          for (let i = 0; i < numDice; i++) {
            const roll = rollDice(diceSize);
            rolls.push(roll);
            total += roll;
          }
          
          return { total, rolls, bonus, diceSize, numDice };
        };
        
        const damageResult = parseDamageRoll(baseDamage);
        const damageRoll = damageResult.total || 0;
        let beamDamage = damageRoll;
        
        // Apply per-beam bonuses (like Agonizing Blast)
        let bonusDescription = [];
        let additionalDamageTypes = [];
        
        for (const bonus of perBeamBonuses) {
          const bonusValue = parseInt(String(bonus.damage || bonus.bonus_damage || '0').replace(/[^\d]/g, '')) || 0;
          if (!isNaN(bonusValue) && bonusValue > 0) {
            beamDamage += bonusValue;
            bonusDescription.push(`+${bonusValue} ${bonus.name}`);
            if (bonus.damage_type && bonus.damage_type !== damageType) {
              additionalDamageTypes.push(`${bonusValue} ${bonus.damage_type}`);
            }
          }
        }
        
        // Apply once-per-turn bonuses (like Genie's Wrath) only to first hitting beam
        if (!genieWrathUsed && oncePerTurnBonuses.length > 0) {
          for (const bonus of oncePerTurnBonuses) {
            const bonusValue = parseInt(String(bonus.damage || bonus.bonus_damage || '0').replace(/[^\d]/g, '')) || 0;
            if (!isNaN(bonusValue) && bonusValue > 0) {
              beamDamage += bonusValue;
              bonusDescription.push(`+${bonusValue} ${bonus.name} (once per turn)`);
              if (bonus.damage_type && bonus.damage_type !== damageType) {
                additionalDamageTypes.push(`${bonusValue} ${bonus.damage_type}`);
              }
            }
          }
          genieWrathUsed = true;
        }
        
        // Ensure all values are valid numbers
        const validBeamDamage = isNaN(beamDamage) ? damageRoll : beamDamage;
        const validBonus = isNaN(validBeamDamage - damageRoll) ? 0 : validBeamDamage - damageRoll;
        
        damageRolls.push({ 
          roll: damageRoll, 
          bonus: validBonus,
          total: validBeamDamage,
          bonuses: bonusDescription,
          rolls: damageResult.rolls,
          diceSize: damageResult.diceSize,
          baseDice: baseDamage,
          beamNumber: i + 1,
          additionalDamageTypes
        });
        totalDamage += validBeamDamage;
      }
    }
    
    // Structure result to work with existing attack display system
    // For multi-beam spells, we'll create multiple "attack" entries
    const result = {
      type: 'attack',
      name: ability.ability_name,
      weapon: ability.ability_name,
      attackRoll: attackRolls[0]?.roll || 0,
      totalAttack: attackRolls[0]?.total || 0,
      totalDamage: totalDamage || 0,
      total: totalDamage || 0,
      isCritical: false, // TODO: Add crit logic later
      // Additional data for multi-beam display
      attackRolls,
      damageRolls,
      hits,
      numBeams,
      damageType,
      damageBonuses: damageBonuses.map(b => b.name)
    };
    
    // Log each beam separately for clearer display
    const allDiceRolls = [];
    
    // Add attack rolls for all beams
    attackRolls.forEach((attack) => {
      allDiceRolls.push({
        name: `Beam ${attack.beamNumber} Attack`,
        dice: [`d20: ${attack.roll}`],
        bonus: attackBonus,
        total: attack.total,
        hit: attack.total >= 15
      });
    });
    
    // Add damage rolls only for hitting beams - with individual modifier breakdown
    damageRolls.forEach((damage) => {
      // Create separate entries for base damage and each modifier
      const damageEntries = [];
      
      // Base damage die
      damageEntries.push({
        name: `Beam ${damage.beamNumber} Base Damage`,
        dice: damage.rolls.map(roll => `d${damage.diceSize}: ${roll}`),
        bonus: 0,
        total: damage.roll,
        type: 'base_damage'
      });
      
      // Individual bonus modifiers
      damage.bonuses.forEach((bonusDesc, bonusIndex) => {
        // Extract bonus value from description like "+4 Agonizing Blast"
        const bonusMatch = bonusDesc.match(/\+(\d+)\s+(.+)/);
        if (bonusMatch) {
          const bonusValue = parseInt(bonusMatch[1]);
          const bonusName = bonusMatch[2];
          
          damageEntries.push({
            name: `${bonusName}`,
            dice: [],
            bonus: bonusValue,
            total: bonusValue,
            type: 'modifier'
          });
        }
      });
      
      // Add all damage entries for this beam
      allDiceRolls.push(...damageEntries);
    });

    console.log('🎯 Eldritch Blast Roll Data:', { 
      type: 'attack',
      name: ability.ability_name,
      dice: allDiceRolls,
      details: {
        totalDamage,
        hits: `${hits}/${numBeams}`,
        damageType,
        bonuses: damageBonuses.map(b => `${b.name}${b.once_per_turn ? ' (once per turn)' : ''}`)
      }
    });

    logRoll({
      type: 'attack',
      name: ability.ability_name,
      dice: allDiceRolls,
      details: {
        totalDamage,
        hits: `${hits}/${numBeams}`,
        damageType,
        bonuses: damageBonuses.map(b => `${b.name}${b.once_per_turn ? ' (once per turn)' : ''}`)
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
      // Short rest - roll hit dice based on character
      const hitDie = character.hitDie || 'd8';
      const hitDieSize = parseInt(hitDie.replace('d', ''));
      const conModifier = character.ability_scores ? Math.floor(((character.ability_scores.constitution || 10) - 10) / 2) : 0;
      
      const roll = rollDice(hitDieSize);
      healingAmount = roll + conModifier;
      
      result = {
        type: 'healing',
        name: action.name,
        healingAmount,
        healType: 'short-rest',
        hitDiceRoll: roll,
        conModifier,
        description: `Rolled ${roll} on ${hitDie} + ${conModifier} CON`,
        finalHP: Math.min(character.max_hp, currentHP + healingAmount)
      };
    } else if (action.healType === 'potion') {
      // Basic healing potion - 2d4+2
      let potionRolls = [];
      for (let i = 0; i < 2; i++) {
        const roll = rollDice(4);
        potionRolls.push(roll);
        healingAmount += roll;
      }
      healingAmount += 2; // +2 bonus
      
      result = {
        type: 'healing',
        name: action.name,
        healingAmount,
        healType: 'potion',
        potionRolls,
        description: `Rolled ${potionRolls.join(', ')} +2 (Basic Healing Potion)`,
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
          dice: result.hitDiceRoll ? [`${character.hitDie || 'd8'}: ${result.hitDiceRoll}`] :
                result.potionRolls ? result.potionRolls.map((r, i) => `d4: ${r}`) : 
                ['Full Rest'],
          bonus: result.conModifier || (action.healType === 'potion' ? 2 : 0),
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