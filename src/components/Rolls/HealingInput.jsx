import React, { useState } from 'react';
import PropTypes from 'prop-types';

const HealingInput = ({
  character,
  currentHP,
  isKeyboardOpen,
  onClose,
  onApplyHealing
}) => {
  const [healingAmount, setHealingAmount] = useState('');

  const handleAmountChange = (value) => {
    setHealingAmount(value);
  };

  const handleApplyClick = () => {
    const amount = parseInt(healingAmount) || 0;
    if (amount > 0) {
      onApplyHealing(amount);
    }
  };

  const maxHP = character?.max_hp || character?.maxHP || 100;
  const finalHP = Math.min(maxHP, currentHP + (parseInt(healingAmount) || 0));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Custom Healing</h2>
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
            Enter healing amount:
          </label>
          <input
            type="number"
            placeholder="Enter healing amount..."
            value={healingAmount}
            onChange={(e) => handleAmountChange(e.target.value)}
            className={`w-full border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:border-green-500 focus:outline-none ${
              isKeyboardOpen 
                ? 'p-4 text-xl' // Larger padding and text for mobile keyboards
                : 'p-3 text-lg' // Normal size for desktop
            }`}
            autoFocus
            min="1"
          />
        </div>
        
        {healingAmount && (
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Current HP:</span>
              <span className="text-green-400 font-bold">{currentHP}/{maxHP}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-gray-300">Healing amount:</span>
              <span className="text-green-400 font-bold">+{healingAmount}</span>
            </div>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-600">
              <span className="text-white font-semibold">Final HP:</span>
              <span className="font-bold text-lg text-green-400">
                {finalHP}/{maxHP}
              </span>
            </div>
          </div>
        )}
        
        <button
          onClick={handleApplyClick}
          disabled={!healingAmount || parseInt(healingAmount) <= 0}
          className={`w-full p-3 rounded-lg font-bold transition-colors ${
            healingAmount && parseInt(healingAmount) > 0
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          Apply Healing
        </button>
      </div>
    </div>
  );
};

HealingInput.propTypes = {
  character: PropTypes.shape({
    max_hp: PropTypes.number.isRequired,
  }).isRequired,
  currentHP: PropTypes.number.isRequired,
  isKeyboardOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onApplyHealing: PropTypes.func.isRequired
};

export default HealingInput;