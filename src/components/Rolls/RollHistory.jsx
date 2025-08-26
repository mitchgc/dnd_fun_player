import React from 'react';
import PropTypes from 'prop-types';
import { Dice6, Target, Eye, Shield, Heart, Sparkles } from 'lucide-react';

const RollHistory = ({
  rollLogs,
  isHidden,
  onBack,
  onClearHistory
}) => {
  const getIconForRollType = (type) => {
    switch (type) {
      case 'attack': return <Target className="text-red-400" size={16} />;
      case 'spell_attack': return <Sparkles className="text-purple-400" size={16} />;
      case 'spell_save': return <Sparkles className="text-orange-400" size={16} />;
      case 'skill': return <Eye className="text-green-400" size={16} />;
      case 'ability': return <Shield className="text-blue-400" size={16} />;
      case 'save': return <Heart className="text-yellow-400" size={16} />;
      case 'raw': return <Dice6 className="text-gray-400" size={16} />;
      case 'death-save': return <Heart className="text-red-400" size={16} />;
      case 'healing': return <Heart className="text-green-400" size={16} />;
      case 'damage': return <Heart className="text-red-400" size={16} />;
      default: return <Dice6 className="text-gray-400" size={16} />;
    }
  };

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
      
      {rollLogs.length === 0 ? (
        <div className="text-center py-8">
          <Dice6 className="mx-auto text-gray-400 mb-3" size={32} />
          <p className="text-gray-400">No rolls yet!</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {rollLogs.slice(0, 10).map((log) => (
            <div key={log.id} className={`rounded-lg border overflow-hidden ${
              isHidden 
                ? 'bg-gray-800 border-purple-700'
                : 'bg-gray-800 border-gray-600'
            }`}>
              <div className={`p-3 border-b ${isHidden ? 'border-purple-700' : 'border-gray-600'}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    {getIconForRollType(log.type)}
                    <div className="flex flex-col">
                      <span className="font-medium text-white text-sm">{log.name}</span>
                      <span className="text-xs text-gray-400">
                        {(log.type === 'attack' || log.type === 'spell_attack' || log.type === 'spell_save') ? (
                          log.dice.length >= 2 ? (
                            `Attack = ${log.dice[0]?.total || 0} [${log.dice[0]?.dice?.join(', ') || ''}], Damage = ${log.dice[1]?.total || 0} [${log.dice[1]?.dice?.join(', ') || ''}]`
                          ) : (
                            `${log.dice[0]?.name || 'Roll'} = ${log.dice[0]?.total || 0} [${log.dice[0]?.dice?.join(', ') || ''}]`
                          )
                        ) : (
                          `= ${log.dice[0]?.total || 0} [${log.dice[0]?.dice?.join(', ') || ''}]`
                        )}
                      </span>
                    </div>
                    {log.isCritical && <Sparkles className="text-yellow-400" size={12} />}
                  </div>
                  <span className="text-xs text-gray-400">{log.timestamp}</span>
                </div>
              </div>
              
              <div className="p-3">
                {log.dice.map((diceGroup, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-300">{diceGroup.name}</span>
                      <div className="flex items-center space-x-1">
                        {diceGroup.dice.map((die, dieIndex) => (
                          <span key={dieIndex} className="bg-gray-700 px-1.5 py-0.5 rounded text-xs font-mono">
                            {die}
                          </span>
                        ))}
                        {diceGroup.bonus > 0 && <span className="text-xs text-gray-400">+{diceGroup.bonus}</span>}
                        <span className="text-xs font-bold text-white">= {diceGroup.total}</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {log.details && (
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <div className="text-xs text-gray-400 space-x-3">
                      {log.details.advantage && <span>✨ Advantage</span>}
                      {log.details.sneakAttack && <span>🗡️ Sneak</span>}
                      {log.details.success !== undefined && (
                        <span className={log.details.success ? 'text-green-400' : 'text-red-400'}>
                          {log.details.success ? '✅' : '❌'}
                        </span>
                      )}
                      {log.details.critSuccess && <span className="text-yellow-400">🎯 Crit!</span>}
                      {log.details.critFail && <span className="text-red-400">💥 Fail!</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {rollLogs.length > 0 && (
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