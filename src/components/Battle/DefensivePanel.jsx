import React from 'react';
import PropTypes from 'prop-types';
import { Shield, Heart, Sparkles } from 'lucide-react';
import ActionButton from './ActionButton';

const DefensivePanel = ({
  character,
  currentHP,
  hpEditing,
  hpEditValue,
  isHidden,
  defensiveCollapsed,
  onHPEdit,
  onHPChange,
  onHPEditToggle,
  onDefensiveCollapsedToggle,
  onHealClick,
  onDamageClick
}) => {
  const handleHPKeyDown = (e) => {
    if (e.key === 'Enter') {
      const newHP = Math.max(0, Math.min(character.maxHP, parseInt(hpEditValue) || 0));
      onHPChange(newHP);
      onHPEditToggle(false);
    } else if (e.key === 'Escape') {
      onHPEditToggle(false);
    }
  };

  const handleHPBlur = () => {
    const newHP = Math.max(0, Math.min(character.maxHP, parseInt(hpEditValue) || 0));
    onHPChange(newHP);
    onHPEditToggle(false);
  };

  return (
    <div className={`rounded-2xl shadow-xl border-2 ${
      isHidden 
        ? 'bg-gradient-to-r from-gray-800 to-purple-900 border-purple-600'
        : 'bg-gradient-to-r from-gray-900 to-gray-800 border-gray-600'
    }`}>
      <div 
        className="flex items-center justify-between p-6 border-b border-gray-700 cursor-pointer hover:bg-gray-800/50 transition-colors"
        onClick={onDefensiveCollapsedToggle}
      >
        <div className="flex items-center">
          <Shield className={`mr-3 transition-colors duration-1000 ${
            isHidden ? 'text-purple-400' : 'text-blue-400'
          }`} size={32} />
          <div>
            <h2 className="text-3xl font-bold text-white">
              Defensive
            </h2>
            <p className="text-gray-300 font-medium">{character.name} - {character.race} {character.class}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className={`transition-transform duration-300 ${
            defensiveCollapsed ? 'rotate-180' : ''
          }`}>
            ▼
          </div>
        </div>
      </div>
      
      <div 
        className={`grid transition-all duration-300 ease-in-out overflow-hidden ${
          defensiveCollapsed 
            ? 'grid-rows-[0fr] opacity-0' 
            : 'grid-rows-[1fr] opacity-100'
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-4 p-6">
            {/* Health Row */}
            <div className="bg-gray-800 p-4 rounded-xl border-2 border-green-500 relative overflow-hidden">
              {/* Health percentage bar background */}
              <div 
                className="absolute inset-0 bg-green-500/10 transition-all duration-500"
                style={{ width: `${(currentHP / character.maxHP) * 100}%` }}
              ></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <Heart className="text-green-400 mr-3" size={24} />
                    <span className="text-lg font-bold text-white">Health</span>
                  </div>
                  <div className="flex items-center">
                    {hpEditing ? (
                      <input
                        type="number"
                        value={hpEditValue}
                        onChange={(e) => onHPEdit(e.target.value)}
                        onBlur={handleHPBlur}
                        onKeyDown={handleHPKeyDown}
                        className="text-2xl font-bold text-green-400 bg-transparent border border-green-400 rounded px-2 py-1 w-20 text-center"
                        autoFocus
                        placeholder={currentHP.toString()}
                      />
                    ) : (
                      <span 
                        onClick={() => onHPEditToggle(true, currentHP.toString())}
                        className="text-2xl font-bold text-green-400 cursor-pointer hover:bg-gray-700 rounded px-2 py-1 transition-colors"
                        title="Click to edit HP directly"
                      >
                        {currentHP}/{character.maxHP}
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <ActionButton 
                    onClick={onHealClick}
                    variant="success"
                    icon={<Sparkles />}
                    title="Heal"
                  />
                  <ActionButton 
                    onClick={onDamageClick}
                    variant="danger"
                    icon={<Heart />}
                    title="Damage"
                  />
                </div>
              </div>
            </div>

            {/* Armor Row */}
            <div className="bg-gray-800 p-4 rounded-xl border-2 border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Shield className="text-gray-400 mr-3" size={24} />
                  <span className="text-lg font-bold text-gray-300">Armor Class</span>
                </div>
                <span className="text-2xl font-bold text-gray-300">{character.ac}</span>
              </div>
            </div>

            {/* Resistances/Defensive Abilities */}
            <div className="bg-gray-800 p-4 rounded-xl border-2 border-gray-600">
              <div className="flex items-center mb-3">
                <Shield className="text-gray-400 mr-3" size={24} />
                <span className="text-lg font-bold text-gray-300">Defensive Abilities</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(character.defensiveAbilities || {}).map(([key, ability]) => (
                  <div 
                    key={key}
                    className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                      ability.available !== false
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-gray-700 border-gray-600 text-gray-400'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="text-xl mr-3">{ability.icon}</span>
                      <div>
                        <span className="font-medium">{ability.name}</span>
                        <p className="text-sm text-gray-300">{ability.description}</p>
                      </div>
                    </div>
                    {key === 'uncanny-dodge' && ability.available !== false && (
                      <span className="text-xs bg-green-600 text-green-200 px-2 py-1 rounded">
                        Available
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

DefensivePanel.propTypes = {
  character: PropTypes.shape({
    name: PropTypes.string.isRequired,
    race: PropTypes.string.isRequired,
    class: PropTypes.string.isRequired,
    maxHP: PropTypes.number.isRequired,
    ac: PropTypes.number.isRequired,
    defensiveAbilities: PropTypes.object.isRequired
  }).isRequired,
  currentHP: PropTypes.number.isRequired,
  hpEditing: PropTypes.bool.isRequired,
  hpEditValue: PropTypes.string.isRequired,
  isHidden: PropTypes.bool.isRequired,
  defensiveCollapsed: PropTypes.bool.isRequired,
  onHPEdit: PropTypes.func.isRequired,
  onHPChange: PropTypes.func.isRequired,
  onHPEditToggle: PropTypes.func.isRequired,
  onDefensiveCollapsedToggle: PropTypes.func.isRequired,
  onHealClick: PropTypes.func.isRequired,
  onDamageClick: PropTypes.func.isRequired
};

export default DefensivePanel;