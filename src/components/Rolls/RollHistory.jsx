import React from 'react';
import PropTypes from 'prop-types';
import { Dice6 } from 'lucide-react';
import UnifiedRollDisplay from './UnifiedRollDisplay';
import { transformRollLogToUnified } from '../../utils/rollDataTransforms';

const RollHistory = ({
  rollLogs,
  isHidden,
  onBack,
  onClearHistory
}) => {
  // Transform legacy roll logs to unified format and flatten
  const unifiedRolls = rollLogs.flatMap(log => transformRollLogToUnified(log));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Roll History</h2>
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ← Back
        </button>
      </div>
      
      {unifiedRolls.length === 0 ? (
        <div className="text-center py-8">
          <Dice6 className="mx-auto text-gray-400 mb-3" size={32} />
          <p className="text-gray-400">No rolls yet!</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {unifiedRolls.slice(0, 20).map((roll, index) => (
            <UnifiedRollDisplay 
              key={`${roll.id}-${index}`} 
              roll={roll} 
            />
          ))}
        </div>
      )}
      
      {unifiedRolls.length > 0 && (
        <div className="flex space-x-2">
          <button 
            onClick={onClearHistory}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-3 rounded-lg text-sm transition-colors"
          >
            Clear History
          </button>
        </div>
      )}
    </div>
  );
};

RollHistory.propTypes = {
  rollLogs: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    timestamp: PropTypes.string.isRequired,
    dice: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string.isRequired,
      dice: PropTypes.arrayOf(PropTypes.string).isRequired,
      bonus: PropTypes.number,
      total: PropTypes.number.isRequired
    })).isRequired,
    isCritical: PropTypes.bool,
    details: PropTypes.object
  })).isRequired,
  isHidden: PropTypes.bool.isRequired,
  onBack: PropTypes.func.isRequired,
  onClearHistory: PropTypes.func.isRequired
};

export default RollHistory;