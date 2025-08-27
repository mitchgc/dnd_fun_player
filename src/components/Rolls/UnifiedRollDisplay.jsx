import React from 'react';
import PropTypes from 'prop-types';
import { Target, Eye, Sword, Shield, Heart, Sparkles, Dice6 } from 'lucide-react';
import { formatRelativeTime } from '../../utils/timeUtils';

const UnifiedRollDisplay = ({ roll, className = '', showCriticals = true }) => {
  const getIconAndColorForRollType = (type) => {
    switch (type) {
      case 'attack':
        return { icon: <Target size={16} />, color: 'text-green-400' };
      case 'damage':
        return { icon: <Sword size={16} />, color: 'text-red-400' };
      case 'spell_attack':
        return { icon: <Sparkles size={16} />, color: 'text-purple-400' };
      case 'spell_save':
        return { icon: <Sparkles size={16} />, color: 'text-orange-400' };
      case 'skill':
        return { icon: <Eye size={16} />, color: 'text-purple-400' };
      case 'ability':
        return { icon: <Shield size={16} />, color: 'text-blue-400' };
      case 'save':
        return { icon: <Heart size={16} />, color: 'text-yellow-400' };
      case 'healing':
        return { icon: <Heart size={16} />, color: 'text-green-400' };
      default:
        return { icon: <Dice6 size={16} />, color: 'text-gray-400' };
    }
  };

  const getDiceHighlight = (die) => {
    if (die.advantage) return 'text-yellow-400'; // Gold for advantage
    if (die.disadvantage) return 'text-red-400'; // Red for disadvantage
    if (die.criticalExtra || die.isCritical) return 'text-yellow-400'; // Gold for critical dice
    return 'text-gray-300'; // Normal
  };

  const formatDieLabel = (die) => {
    if (die.advantage) {
      return `d${die.sides} Advantage`;
    }
    if (die.disadvantage) {
      return `d${die.sides} Disadvantage`;
    }
    if (die.criticalExtra) {
      return `d${die.sides} (Crit)`;
    }
    return `d${die.sides}`;
  };

  const formatDieValue = (item) => {
    if (item.type === 'die') {
      if (item.advantage && Array.isArray(item.advantage)) {
        // Show the higher roll for advantage
        return Math.max(...item.advantage);
      }
      if (item.disadvantage && Array.isArray(item.disadvantage)) {
        // Show the lower roll for disadvantage
        return Math.min(...item.disadvantage);
      }
    }
    return item.value;
  };

  const { icon, color } = getIconAndColorForRollType(roll.type);

  // Check for critical hits/misses on d20 rolls
  const hasNatural20 = showCriticals && roll.breakdown.some(item => 
    item.type === 'die' && item.sides === 20 && 
    (item.value === 20 || (item.advantage && item.advantage.includes(20)) || (item.disadvantage && item.disadvantage.includes(20)))
  );
  
  const hasNatural1 = showCriticals && roll.breakdown.some(item => 
    item.type === 'die' && item.sides === 20 && 
    (item.value === 1 || (item.advantage && item.advantage.includes(1)) || (item.disadvantage && item.disadvantage.includes(1)))
  );

  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-600 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-600">
        <div className="flex items-center space-x-2">
          <div className={color}>{icon}</div>
          <div className="flex flex-col">
            <span className="font-medium text-white text-sm">{roll.name}</span>
            {roll.timestamp && (
              <span className="text-xs text-gray-400">{formatRelativeTime(roll.timestamp)}</span>
            )}
          </div>
        </div>
        <span className="text-xl font-bold text-white">{roll.total}</span>
      </div>

      {/* Breakdown */}
      <div className="p-3 space-y-1">
        {roll.breakdown.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between">
              {item.type === 'die' ? (
                <span className={`bg-gray-700 px-1.5 py-0.5 rounded text-xs font-mono ${getDiceHighlight(item)}`}>
                  {formatDieLabel(item)}
                </span>
              ) : (
                <span className="text-sm text-gray-400">
                  {item.label}
                </span>
              )}
              {item.type === 'die' ? (
                <span className="bg-gray-700 px-1.5 py-0.5 rounded text-xs font-mono text-white">
                  {formatDieValue(item)}
                </span>
              ) : (
                <span className="text-sm text-white font-mono">
                  {item.value}
                </span>
              )}
            </div>
            
            {/* Show advantage/disadvantage breakdown */}
            {item.type === 'die' && (item.advantage || item.disadvantage) && (
              <div className="ml-4 space-y-1">
                {(item.advantage || item.disadvantage).map((roll, rollIndex) => (
                  <div key={rollIndex} className="flex items-center justify-between">
                    <span className="bg-gray-700 px-1.5 py-0.5 rounded text-xs font-mono text-gray-300">
                      d{item.sides}
                    </span>
                    <span className="text-xs text-gray-300">{roll}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Critical Hit/Miss Display */}
      {(hasNatural20 || hasNatural1) && (
        <div className="px-3 pb-3">
          {hasNatural20 && (
            <div className="text-yellow-400 font-bold text-sm text-center">
              NATURAL 20! ⭐
            </div>
          )}
          {hasNatural1 && (
            <div className="text-red-400 font-bold text-sm text-center">
              NATURAL 1! 💥
            </div>
          )}
        </div>
      )}
    </div>
  );
};

UnifiedRollDisplay.propTypes = {
  roll: PropTypes.shape({
    type: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    total: PropTypes.number.isRequired,
    breakdown: PropTypes.arrayOf(PropTypes.shape({
      type: PropTypes.oneOf(['die', 'modifier']).isRequired,
      label: PropTypes.string,
      value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      sides: PropTypes.number, // for dice
      advantage: PropTypes.oneOfType([PropTypes.bool, PropTypes.array]), // for advantage dice
      disadvantage: PropTypes.oneOfType([PropTypes.bool, PropTypes.array]) // for disadvantage dice
    })).isRequired
  }).isRequired,
  className: PropTypes.string,
  showCriticals: PropTypes.bool
};

export default UnifiedRollDisplay;