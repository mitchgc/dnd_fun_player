import React from 'react';
import PropTypes from 'prop-types';

const RollSearch = ({
  rollActions,
  searchTerm,
  isKeyboardOpen,
  isHidden,
  onSearchTermChange,
  onActionSelect,
  onShowHistory
}) => {
  // Filter actions based on search term (maintain descending order)
  const getFilteredActions = () => {
    const term = searchTerm.toLowerCase();
    const filtered = {};
    
    Object.keys(rollActions).forEach(category => {
      filtered[category] = rollActions[category]
        .filter(action => action.name.toLowerCase().includes(term))
        .sort((a, b) => b.modifier - a.modifier); // Ensure sorting is maintained after filtering
    });
    
    return filtered;
  };

  const filtered = getFilteredActions();
  
  const categoryLabels = {
    attacks: 'Attacks',
    skills: 'Skills', 
    abilities: 'Ability Checks',
    saves: 'Saving Throws',
    combat: 'Combat',
    healing: 'Healing',
    utility: 'Utility'
  };
  
  const categoryColors = {
    attacks: 'bg-red-600 text-red-200',
    skills: 'bg-blue-600 text-blue-200',
    abilities: 'bg-green-600 text-green-200',
    saves: 'bg-purple-600 text-purple-200',
    combat: 'bg-yellow-600 text-yellow-200',
    healing: 'bg-green-600 text-green-200',
    utility: 'bg-gray-600 text-gray-200'
  };

  const hasResults = Object.values(filtered).some(arr => arr.length > 0);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Quick Search</h2>
      
      
      <input
        type="text"
        placeholder="Search actions..."
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        className={`w-full border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none ${
          isKeyboardOpen 
            ? 'p-4 text-lg' // Larger padding and text for mobile keyboards
            : 'p-3' // Normal size for desktop
        }`}
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck="false"
      />
      
      <div className={`space-y-4 overflow-y-auto ${
        isKeyboardOpen 
          ? 'max-h-48' // Smaller height when keyboard is open
          : 'max-h-64' // Normal height when keyboard closed
      }`}>
        {Object.entries(filtered).map(([category, actions]) => {
          if (actions.length === 0) return null;
          return (
            <div key={category}>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">{categoryLabels[category]}</h3>
              <div className="space-y-1">
                {actions.map(action => (
                  <button
                    key={action.id}
                    onClick={() => onActionSelect(action)}
                    className={`w-full text-left bg-gray-700 hover:bg-gray-600 active:bg-gray-500 rounded-lg flex justify-between items-center transition-colors text-sm border border-gray-600 hover:border-gray-500 ${
                      isKeyboardOpen 
                        ? 'p-3' // Larger touch targets when keyboard is open
                        : 'p-2' // Normal size when keyboard closed
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-white">{action.name}</span>
                      {action.proficient && (
                        <span className="text-xs bg-green-600 text-green-200 px-1 rounded">
                          {action.expertise ? 'EXP' : 'PROF'}
                        </span>
                      )}
                    </div>
                    {action.type !== 'toggle' && action.type !== 'raw' && (
                      <span className={`text-xs px-2 py-1 rounded ${categoryColors[category]}`}>
                        {action.modifier >= 0 ? '+' : ''}{action.modifier}
                      </span>
                    )}
                    {action.type === 'raw' && (
                      <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded">
                        d{action.dice || 20}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        
        {!hasResults && searchTerm && (
          <div className="text-center text-gray-400 py-4">
            No actions found for "{searchTerm}"
          </div>
        )}
      </div>
      
      <div className="flex">
        <button
          onClick={onShowHistory}
          className={`w-full p-3 rounded-lg font-medium transition-colors border ${isHidden 
            ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-500'
            : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500'
          }`}
        >
          Previous Rolls
        </button>
      </div>
    </div>
  );
};

RollSearch.propTypes = {
  rollActions: PropTypes.object.isRequired,
  searchTerm: PropTypes.string.isRequired,
  isKeyboardOpen: PropTypes.bool.isRequired,
  isHidden: PropTypes.bool.isRequired,
  onSearchTermChange: PropTypes.func.isRequired,
  onActionSelect: PropTypes.func.isRequired,
  onShowHistory: PropTypes.func.isRequired
};

export default RollSearch;