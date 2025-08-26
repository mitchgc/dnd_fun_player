import React from 'react';
import PropTypes from 'prop-types';
import { Target, Sword, Heart, Eye, Sparkles } from 'lucide-react';

const RollResult = ({
  result,
  selectedAction,
  character,
  isHidden,
  onClose,
  onReroll
}) => {
  const renderAttackResult = () => (
    <div className="space-y-3">
      {/* Attack Roll Section - Simple with Hover Details */}
      <div className="bg-gray-700 p-3 rounded-lg border border-gray-600 group cursor-help relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="text-green-400" size={16} />
            <span className="text-white font-medium">Attack Roll</span>
          </div>
          <span className="text-2xl font-bold text-green-400">{result.totalAttack}</span>
        </div>
        {/* Hover Details */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-3 bg-gray-800 border border-gray-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 min-w-max pointer-events-none">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="text-green-400" size={14} />
            <span className="text-white text-sm font-medium">Attack Roll Breakdown</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="bg-gray-700 px-2 py-1 rounded text-sm font-mono text-white">{result.attackRoll}</span>
            <span className="text-sm text-gray-400">+{selectedAction?.modifier || 0}</span>
            <span className="text-sm text-gray-400">=</span>
            <span className="text-sm font-bold text-white">{result.totalAttack}</span>
          </div>
        </div>
      </div>

      {/* Damage Section - Simple with Hover Details */}
      <div className="bg-gray-700 p-3 rounded-lg border border-gray-600 group cursor-help relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sword className="text-red-400" size={16} />
            <span className="text-white font-medium">Damage</span>
          </div>
          <span className="text-2xl font-bold text-red-400">{result.totalDamage}</span>
        </div>
        {/* Hover Details */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-3 bg-gray-800 border border-gray-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 min-w-max pointer-events-none">
          <div className="flex items-center space-x-2 mb-2">
            <Sword className="text-red-400" size={14} />
            <span className="text-white text-sm font-medium">Damage Breakdown</span>
          </div>
          <div className="flex items-center space-x-2 flex-wrap">
            {result.weaponDiceSize && (
              <span className="bg-gray-700 px-2 py-1 rounded text-sm font-mono text-white">{result.baseDamageRoll - 3}</span>
            )}
            <span className="text-sm text-gray-400">+3</span>
            {result.sneakAttackTotal > 0 && (
              <>
                <span className="text-sm text-gray-400">+{result.sneakAttackTotal}</span>
                <span className="text-sm text-purple-300">(Sneak)</span>
              </>
            )}
            <span className="text-sm text-gray-400">=</span>
            <span className="text-sm font-bold text-white">{result.totalDamage}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHealingResult = () => (
    <div className="space-y-3">
      <div className="bg-gray-700 p-3 rounded-lg border border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="text-green-400" size={16} />
            <span className="text-white font-medium">Healing</span>
          </div>
          <span className="text-2xl font-bold text-green-400">
            +{result.healingAmount || 'Full'}
          </span>
        </div>
      </div>
      
      {result.description && (
        <div className="text-sm text-gray-300 bg-gray-800 p-2 rounded">
          {result.description}
        </div>
      )}
      
      <div className="bg-gray-700 p-3 rounded-lg border border-gray-600">
        <div className="flex items-center justify-between">
          <span className="text-white font-medium">New HP:</span>
          <span className="text-2xl font-bold text-green-400">
            {result.healType === 'long-rest' ? character.maxHP : 
             `${Math.min(character.maxHP, result.finalHP || 0)}/${character.maxHP}`}
          </span>
        </div>
      </div>
    </div>
  );

  const renderStandardResult = () => (
    <div className="text-lg text-gray-300 group cursor-help relative">
      {selectedAction?.name || 'Roll'} = 
      <span className={`text-3xl ml-2 ${
        result.roll === 20 ? 'text-yellow-400' : 
        result.roll === 1 ? 'text-red-400' : 
        'text-green-400'
      }`}>
        {result.total}
      </span>
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-3 bg-gray-800 border border-gray-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 min-w-max">
        <div className="flex items-center space-x-2">
          <Eye className="text-green-400" size={14} />
          <span className="text-white text-sm font-medium">{selectedAction?.name || 'Roll'}</span>
        </div>
        <div className="flex items-center space-x-1 mt-1">
          <span className="bg-gray-700 px-2 py-0.5 rounded text-xs font-mono text-white">{result.roll}</span>
          <span className="text-xs text-gray-400">+{result.modifier}</span>
          <span className="text-xs font-bold text-white">= {result.total}</span>
        </div>
      </div>
    </div>
  );

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
          {result.type !== 'attack' && result.type !== 'healing' && renderStandardResult()}
        </div>
        
        {result.roll === 20 && (
          <div className="text-yellow-400 font-bold text-lg">NATURAL 20! ⭐</div>
        )}
        
        {result.roll === 1 && (
          <div className="text-red-400 font-bold text-lg">NATURAL 1! 💥</div>
        )}
        
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