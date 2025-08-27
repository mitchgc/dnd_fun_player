import React from 'react';
import PropTypes from 'prop-types';
import { Target, Sword, Heart, Eye, Sparkles } from 'lucide-react';
import UnifiedRollDisplay from './UnifiedRollDisplay';
import { createUnifiedRoll } from '../../utils/rollDataTransforms';

const RollResult = ({
  result,
  selectedAction,
  character,
  isHidden,
  onClose,
  onReroll
}) => {
  const renderAttackResult = () => {
    // Create unified roll objects for attack and damage
    const attackRoll = createUnifiedRoll(
      'attack',
      selectedAction?.name || 'Attack',
      [{ 
        sides: 20, 
        value: result.attackRoll,
        rolls: result.advantageRolls || [result.attackRoll]
      }],
      [{ 
        label: 'Weapon Modifier', 
        value: selectedAction?.modifier || 0 
      }],
      { 
        advantage: !!result.advantageRolls && result.advantageRolls.length === 2,
        disadvantage: !!result.disadvantageRolls && result.disadvantageRolls.length === 2
      }
    );

    // Build damage dice array
    const damageDice = [];
    const isCritical = result.isCritical || result.attackRoll === 20;
    
    if (result.weaponDiceSize) {
      const totalWeaponDamage = result.baseDamageRoll - (selectedAction?.damageBonus || 0);
      
      if (isCritical) {
        // For critical hits, we need to show 2 dice (the original die + the critical die)
        // Since diceUtils already rolled both dice and gave us the total, we need to approximate the individual rolls
        // This is not perfect but gives the right visual representation
        const avgRoll = (result.weaponDiceSize + 1) / 2; // Average roll for the die
        const firstDie = Math.max(1, Math.min(result.weaponDiceSize, Math.round(totalWeaponDamage / 2)));
        const secondDie = totalWeaponDamage - firstDie;
        
        damageDice.push({
          sides: result.weaponDiceSize,
          value: firstDie
        });
        damageDice.push({
          sides: result.weaponDiceSize,
          value: secondDie,
          criticalExtra: true
        });
      } else {
        // Normal hit - just one die
        damageDice.push({
          sides: result.weaponDiceSize,
          value: totalWeaponDamage
        });
      }
    }
    
    if (result.sneakAttackRolls && result.sneakAttackRolls.length > 0) {
      result.sneakAttackRolls.forEach((roll, index) => {
        damageDice.push({
          sides: 6,
          value: roll,
          isCritical: isCritical && index >= result.sneakAttackRolls.length / 2 // Second half are critical bonus dice
        });
      });
    }

    // Build damage modifiers
    const damageModifiers = [];
    if (selectedAction?.damageBonus) {
      damageModifiers.push({
        label: 'Modifier',
        value: selectedAction.damageBonus
      });
    }

    const damageRoll = createUnifiedRoll(
      'damage',
      `${selectedAction?.weapon || 'Weapon'} Damage`,
      damageDice,
      damageModifiers
    );

    return (
      <div className="space-y-3">
        <UnifiedRollDisplay roll={attackRoll} />
        <UnifiedRollDisplay roll={damageRoll} />
      </div>
    );
  };

  const renderHealingResult = () => {
    // Create unified roll for healing display
    const healingDice = [];
    const healingModifiers = [];
    
    // Handle different heal types with proper dice representation
    if (result.healType === 'short-rest') {
      if (result.hitDiceRoll) {
        healingDice.push({
          sides: 8, // Assuming d8 hit die, could be dynamic
          value: result.hitDiceRoll
        });
      }
      if (result.conModifier) {
        healingModifiers.push({
          label: 'CON Modifier',
          value: result.conModifier
        });
      }
    } else if (result.healType === 'potion') {
      if (result.potionRolls) {
        result.potionRolls.forEach(roll => {
          healingDice.push({
            sides: 4,
            value: roll
          });
        });
        healingModifiers.push({
          label: 'Potion Bonus',
          value: 2
        });
      }
    } else if (result.healType === 'long-rest') {
      // Long rest - no dice, just full heal
      healingDice.push({
        sides: null, // Special case for full heal
        value: result.healingAmount || 0,
        isFullHeal: true
      });
    } else if (result.healType === 'custom') {
      // Custom healing - no dice, just the amount
      healingDice.push({
        sides: null,
        value: result.healingAmount || 0,
        isCustom: true
      });
    }

    const healingRoll = createUnifiedRoll(
      'healing',
      selectedAction?.name || 'Healing',
      healingDice,
      healingModifiers
    );

    return <UnifiedRollDisplay roll={healingRoll} />;
  };

  const renderSpellSaveResult = () => {
    const spellRoll = createUnifiedRoll(
      'spell_save',
      selectedAction?.name || 'Spell',
      [{ 
        sides: 12, // Assuming d12 based on the hover details
        value: result.roll 
      }],
      [] // No modifiers for spell damage typically
    );

    return <UnifiedRollDisplay roll={spellRoll} />;
  };

  const renderStandardResult = () => {
    // Determine roll type - could be skill check, save, or other d20 roll
    const rollType = selectedAction?.type || 'skill';
    
    const standardRoll = createUnifiedRoll(
      rollType,
      selectedAction?.name || 'Roll',
      [{ 
        sides: 20, 
        value: result.roll,
        rolls: result.advantageRolls || result.disadvantageRolls || [result.roll]
      }],
      result.modifier ? [{ 
        label: rollType === 'skill' ? 'Skill Modifier' : 'Modifier', 
        value: result.modifier 
      }] : [],
      { 
        advantage: !!result.advantageRolls && result.advantageRolls.length === 2,
        disadvantage: !!result.disadvantageRolls && result.disadvantageRolls.length === 2
      }
    );

    return <UnifiedRollDisplay roll={standardRoll} />;
  };

  return (
    <div className="space-y-4 text-center">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">
          {selectedAction?.name || 'Roll Result'}
        </h2>
        
        <button 
          onClick={onReroll}
          className="text-4xl hover:scale-110 active:scale-95 transition-transform cursor-pointer"
          title="Click to roll again"
        >
          {result.roll === 20 ? '⭐' : result.roll === 1 ? '💥' : '🎲'}
        </button>
      </div>
      
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
        <div className="text-2xl font-bold text-white mb-2">
          {result.type === 'attack' && renderAttackResult()}
          {result.type === 'healing' && renderHealingResult()}
          {result.type === 'spell_save' && renderSpellSaveResult()}
          {result.type !== 'attack' && result.type !== 'healing' && result.type !== 'spell_save' && renderStandardResult()}
        </div>
        
        {selectedAction?.id === 'stealth' && result.total >= 15 && (
          <div className="text-purple-400 font-bold text-lg mt-2">Successfully Hidden! 👤</div>
        )}
      </div>
      
      <button
        onClick={onClose}
        className={`w-full p-3 rounded-lg font-bold transition-colors ${
          isHidden 
            ? 'bg-purple-600 hover:bg-purple-700 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        Continue
      </button>
    </div>
  );
};

RollResult.propTypes = {
  result: PropTypes.shape({
    type: PropTypes.string.isRequired,
    roll: PropTypes.number,
    total: PropTypes.number,
    totalAttack: PropTypes.number,
    totalDamage: PropTypes.number,
    healingAmount: PropTypes.number,
    healType: PropTypes.string,
    finalHP: PropTypes.number,
    description: PropTypes.string,
    baseDamageRoll: PropTypes.number,
    sneakAttackTotal: PropTypes.number,
    weaponDiceSize: PropTypes.number,
    modifier: PropTypes.number
  }).isRequired,
  selectedAction: PropTypes.object,
  character: PropTypes.object.isRequired,
  isHidden: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onReroll: PropTypes.func.isRequired
};

export default RollResult;