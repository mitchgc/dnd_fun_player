import React from 'react';
import PropTypes from 'prop-types';

const DamageInput = ({
  damageInput,
  character,
  currentHP,
  isKeyboardOpen,
  onClose,
  onDamageInputChange,
  onApplyDamage
}) => {
  const handleAmountChange = (value) => {
    const amount = parseInt(value) || 0;
    let finalDamage = amount;
    
    // Apply defensive abilities
    if (damageInput.selectedDefenses.includes('uncanny-dodge')) {
      finalDamage = Math.floor(finalDamage / 2);
    }
    if (damageInput.selectedDefenses.includes('poison-resistance') && amount > 0) {
      // Assume poison damage for demo - in real app would need damage type
      finalDamage = Math.floor(finalDamage / 2);
    }
    
    onDamageInputChange({
      ...damageInput,
      amount: value,
      finalDamage
    });
  };

  const handleDefenseToggle = (key) => {
    let newDefenses;
    const isSelected = damageInput.selectedDefenses.includes(key);
    
    if (isSelected) {
      newDefenses = damageInput.selectedDefenses.filter(d => d !== key);
    } else {
      newDefenses = [...damageInput.selectedDefenses, key];
    }
    
    let finalDamage = parseInt(damageInput.amount) || 0;
    
    // Apply defensive abilities
    if (newDefenses.includes('uncanny-dodge')) {
      finalDamage = Math.floor(finalDamage / 2);
    }
    if (newDefenses.includes('poison-resistance')) {
      finalDamage = Math.floor(finalDamage / 2);
    }
    
    onDamageInputChange({
      ...damageInput,
      selectedDefenses: newDefenses,
      finalDamage
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Take Damage</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            DM announces damage:
          </label>
          <input
            type="number"
            placeholder="Enter damage amount..."
            value={damageInput.amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            className={`w-full border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:border-red-500 focus:outline-none ${
              isKeyboardOpen 
                ? 'p-4 text-xl' // Larger padding and text for mobile keyboards
                : 'p-3 text-lg' // Normal size for desktop
            }`}
            autoFocus
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Defensive Abilities:
          </label>
          <div className="space-y-2">
            {(character?.dnd_character_abilities || [])
              .filter(ability => ability?.name && (ability.ability_type === 'reaction' || ability.name.toLowerCase().includes('resistance') || ability.name.toLowerCase().includes('dodge')))
              .map((ability) => {
                const key = ability.name.toLowerCase().replace(/\s+/g, '-');
                const isSelected = damageInput.selectedDefenses.includes(key);
                const isAvailable = ability.uses_remaining > 0 || ability.uses_per_rest === null;
                
                return (
                  <button
                    key={ability.id}
                    disabled={!isAvailable}
                    onClick={() => handleDefenseToggle(key)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      !isAvailable 
                        ? 'bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed'
                        : isSelected
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-gray-700 border-gray-600 text-white hover:border-blue-500 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🛡️</span>
                      <div>
                        <div className="font-semibold">{ability.name}</div>
                        <div className="text-sm text-gray-300">{ability.description}</div>
                        {!isAvailable && (
                          <div className="text-xs text-red-400">No uses remaining</div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
        
        {damageInput.amount && (
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Original damage:</span>
              <span className="text-red-400 font-bold">{damageInput.amount}</span>
            </div>
            {damageInput.selectedDefenses.length > 0 && (
              <div className="flex justify-between items-center mt-1">
                <span className="text-gray-300">After defenses:</span>
                <span className="text-orange-400 font-bold">{damageInput.finalDamage}</span>
              </div>
            )}
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-600">
              <span className="text-white font-semibold">Final HP:</span>
              <span className={`font-bold text-lg ${
                currentHP - damageInput.finalDamage <= 0 ? 'text-red-400' : 'text-green-400'
              }`}>
                {Math.max(0, currentHP - damageInput.finalDamage)}/{character.max_hp}
              </span>
            </div>
          </div>
        )}
        
        <button
          onClick={() => onApplyDamage(damageInput)}
          disabled={!damageInput.amount}
          className={`w-full p-3 rounded-lg font-bold transition-colors ${
            damageInput.amount
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          Apply Damage
        </button>
      </div>
    </div>
  );
};

DamageInput.propTypes = {
  damageInput: PropTypes.shape({
    amount: PropTypes.string.isRequired,
    selectedDefenses: PropTypes.array.isRequired,
    finalDamage: PropTypes.number.isRequired
  }).isRequired,
  character: PropTypes.shape({
    max_hp: PropTypes.number.isRequired,
    dnd_character_abilities: PropTypes.array
  }).isRequired,
  currentHP: PropTypes.number.isRequired,
  isKeyboardOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onDamageInputChange: PropTypes.func.isRequired,
  onApplyDamage: PropTypes.func.isRequired
};

export default DamageInput;