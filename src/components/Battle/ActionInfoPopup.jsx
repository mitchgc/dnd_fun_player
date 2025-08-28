import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { X, Sword, Sparkles, Info } from 'lucide-react';
import { getPassiveDamageBonuses } from '../../utils/resourceManager';

const ActionInfoPopup = ({ 
  isVisible, 
  position, 
  actionData, 
  character,
  onClose,
  isHidden = false
}) => {
  const popupRef = useRef(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position || { x: 0, y: 0 });

  useEffect(() => {
    if (isVisible && position && popupRef.current) {
      const popup = popupRef.current;
      const rect = popup.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Adjust position to keep popup within viewport
      let newPosition = { ...position };
      
      // Horizontal positioning
      if (position.x + rect.width > viewportWidth - 20) {
        newPosition.x = position.x - rect.width - 10; // Show to the left
      } else {
        newPosition.x = position.x + 10; // Show to the right with padding
      }
      
      // Vertical positioning 
      if (position.y + rect.height > viewportHeight - 20) {
        newPosition.y = position.y - rect.height - 10; // Show above
      } else {
        newPosition.y = position.y + 10; // Show below with padding
      }
      
      // Ensure minimum distance from edges
      newPosition.x = Math.max(10, Math.min(newPosition.x, viewportWidth - rect.width - 10));
      newPosition.y = Math.max(10, Math.min(newPosition.y, viewportHeight - rect.height - 10));
      
      setAdjustedPosition(newPosition);
    } else if (position) {
      // Set initial position even if popup isn't visible yet
      setAdjustedPosition(position);
    }
  }, [isVisible, position]);

  if (!isVisible || !actionData) return null;

  const renderWeaponInfo = () => {
    const weapon = actionData.weapon;
    if (!weapon) return null;

    // Calculate sneak attack bonus for rogues when hidden
    let bonusDamageInfo = null;
    if (isHidden && character?.character_class?.toLowerCase().includes('rogue')) {
      const sneakAttackDice = Math.ceil((character.level || 1) / 2);
      bonusDamageInfo = {
        dice: `+${sneakAttackDice}d6`,
        type: 'sneak attack',
        description: 'Additional damage while hidden or flanking'
      };
    }

    return (
      <div className="space-y-3">
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-400 block">Attack Bonus</span>
            <span className="text-white font-bold">+{weapon.attack_bonus || 0}</span>
          </div>
          <div>
            <span className="text-gray-400 block">Damage</span>
            <span className="text-white font-bold">
              {weapon.damage_dice}
              {weapon.damage_bonus > 0 && `+${weapon.damage_bonus}`} 
              <span className="text-gray-300"> {weapon.damage_type}</span>
            </span>
          </div>
          
          {weapon.range_normal && (
            <div>
              <span className="text-gray-400 block">Range</span>
              <span className="text-white font-bold">{weapon.range_normal} ft</span>
            </div>
          )}
          
          {weapon.properties && (
            <div className="col-span-2">
              <span className="text-gray-400 block">Properties</span>
              <span className="text-white">{weapon.properties}</span>
            </div>
          )}
        </div>

        {bonusDamageInfo && (
          <div className="bg-purple-900/30 border border-purple-600 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-purple-400 font-bold">Hidden Advantage</span>
            </div>
            <div className="text-sm">
              <span className="text-white font-bold">{bonusDamageInfo.dice} {bonusDamageInfo.type}</span>
              <p className="text-gray-300 text-xs mt-1">{bonusDamageInfo.description}</p>
            </div>
          </div>
        )}

        {weapon.description && (
          <div className="text-gray-300 text-sm italic border-t border-gray-600 pt-3">
            {weapon.description}
          </div>
        )}
      </div>
    );
  };

  const renderAbilityInfo = () => {
    const ability = actionData.ability;
    if (!ability) return null;

    // Check if this is Eldritch Blast - special handling needed
    const isEldritchBlast = ability.ability_name?.toLowerCase().includes('eldritch blast') || 
                           ability.name?.toLowerCase().includes('eldritch blast');
    
    // Calculate beam count for Eldritch Blast based on character level
    let beamCount = 1;
    if (isEldritchBlast && character?.level) {
      if (character.level >= 17) beamCount = 4;
      else if (character.level >= 11) beamCount = 3;
      else if (character.level >= 5) beamCount = 2;
    }

    // Get passive damage bonuses that apply to this ability
    let passiveBonuses = [];
    if (character?.dnd_character_abilities && isEldritchBlast) {
      passiveBonuses = getPassiveDamageBonuses(
        character.dnd_character_abilities, 
        'Eldritch Blast', 
        'spell_attack'
      );
    }

    // Determine ability color based on type
    const getAbilityColor = (featureType) => {
      switch(featureType) {
        case 'racial': return 'text-green-400 border-green-600 bg-green-900/30';
        case 'class': return 'text-blue-400 border-blue-600 bg-blue-900/30';
        case 'patron': return 'text-purple-400 border-purple-600 bg-purple-900/30';
        case 'invocation': return 'text-yellow-400 border-yellow-600 bg-yellow-900/30';
        case 'pact': return 'text-pink-400 border-pink-600 bg-pink-900/30';
        case 'feat': return 'text-orange-400 border-orange-600 bg-orange-900/30';
        case 'background': return 'text-cyan-400 border-cyan-600 bg-cyan-900/30';
        case 'spell': return 'text-purple-400 border-purple-600 bg-purple-900/30';
        default: return 'text-gray-400 border-gray-600 bg-gray-900/30';
      }
    };

    const featureType = ability.ability_data?.feature_type || 'unknown';
    const colorClass = getAbilityColor(featureType);
    const isSpell = ability.ability_data?.spell_level !== undefined;

    return (
      <div className="space-y-3">

        {/* Spell Level and School */}
        {isSpell && (
          <div className="text-xs text-purple-300 bg-purple-900/20 px-2 py-1 rounded inline-block">
            {ability.ability_data.spell_level === 0 ? 'Cantrip' : `Level ${ability.ability_data.spell_level} Spell`}
          </div>
        )}

        {/* Main spell/ability stats grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {/* Range */}
          {ability.ability_data?.range && (
            <div>
              <span className="text-gray-400 block">Range</span>
              <span className="text-white font-bold">{ability.ability_data.range}</span>
            </div>
          )}

          {/* Duration */}
          {ability.ability_data?.duration && (
            <div>
              <span className="text-gray-400 block">Duration</span>
              <span className="text-white font-bold">{ability.ability_data.duration}</span>
            </div>
          )}

          {/* Damage */}
          {ability.ability_data?.damage && (
            <div>
              <span className="text-gray-400 block">Damage</span>
              <span className="text-white font-bold">
                {isEldritchBlast ? (
                  <>
                    {ability.ability_data.damage}
                    {passiveBonuses.length > 0 && (
                      <>
                        +{passiveBonuses.reduce((total, bonus) => {
                          // Agonizing Blast adds Charisma modifier
                          const bonusStr = String(bonus.damage || '0');
                          const bonusValue = bonusStr.replace(/[^\d]/g, '') || '0';
                          return total + parseInt(bonusValue);
                        }, 0)}
                      </>
                    )}
                    <span className="text-gray-300"> {ability.ability_data.damage_type}</span>
                    {beamCount > 1 && (
                      <span className="text-purple-300"> ({beamCount} beams)</span>
                    )}
                  </>
                ) : (
                  <>
                    {ability.ability_data.damage}
                    {ability.ability_data?.damage_type && (
                      <span className="text-gray-300"> {ability.ability_data.damage_type}</span>
                    )}
                  </>
                )}
              </span>
            </div>
          )}
          
          {/* Save DC and Save Type - using standardized field names */}
          {(ability.ability_data?.saving_throw_dc || ability.ability_data?.spell_dc) && (
            <div>
              <span className="text-gray-400 block">
                {(ability.ability_data?.saving_throw_stat || ability.ability_data?.save_type) ? 
                  `${(ability.ability_data.saving_throw_stat || ability.ability_data.save_type).charAt(0).toUpperCase() + 
                     (ability.ability_data.saving_throw_stat || ability.ability_data.save_type).slice(1)} Save DC` : 
                  'Save DC'
                }
              </span>
              <span className="text-white font-bold">
                {ability.ability_data.saving_throw_dc || ability.ability_data.spell_dc}
              </span>
            </div>
          )}

          {/* Spellcasting Ability */}
          {ability.ability_data?.spellcasting_ability && (
            <div>
              <span className="text-gray-400 block">Casting Stat</span>
              <span className="text-white font-bold">
                {ability.ability_data.spellcasting_ability.charAt(0).toUpperCase() + 
                 ability.ability_data.spellcasting_ability.slice(1)}
              </span>
            </div>
          )}

          {/* Components */}
          {ability.ability_data?.components && (
            <div>
              <span className="text-gray-400 block">Components</span>
              <span className="text-white font-bold">{ability.ability_data.components}</span>
            </div>
          )}
        </div>

        {/* Usage tracking */}
        {(ability.uses_remaining < 999 && ability.max_uses) && (
          <div className={`border rounded-lg p-3 ${colorClass.split(' ')[1]} ${colorClass.split(' ')[2]}`}>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">
                Uses Remaining
                {ability.recharge_type && ability.recharge_type !== 'encounter' && (
                  <span className="text-xs text-gray-400 block">
                    Recharges on {ability.recharge_type.replace('_', ' ')}
                  </span>
                )}
              </span>
              <span className="text-white font-bold">
                {ability.uses_remaining}/{ability.max_uses}
              </span>
            </div>
          </div>
        )}

        {/* Eldritch Blast Invocation Bonuses */}
        {isEldritchBlast && passiveBonuses.length > 0 && (
          <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-yellow-400 font-bold">Invocation Bonuses</span>
            </div>
            <div className="space-y-1">
              {passiveBonuses.map((bonus, index) => (
                <div key={index} className="text-sm">
                  <span className="text-white font-bold">{bonus.name}</span>
                  {bonus.damage && (
                    <span className="text-gray-300"> - +{bonus.damage} damage per beam</span>
                  )}
                  {bonus.effect && (
                    <span className="text-gray-300"> - {bonus.effect}</span>
                  )}
                  {!bonus.damage && !bonus.effect && bonus.name.toLowerCase().includes('repelling') && (
                    <span className="text-gray-300"> - Push target 10 feet on hit</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ability type and action economy */}
        <div className="text-xs text-gray-400 uppercase tracking-wide flex justify-between items-center">
          <span>
            {ability.ability_type?.replace('_', ' ')}
            {isSpell && ' • Spell'}
          </span>
          {ability.ability_data?.concentration && (
            <span className="text-yellow-400 bg-yellow-900/30 px-1 rounded text-xs">
              Concentration
            </span>
          )}
        </div>

        {/* Spell scaling */}
        {ability.ability_data?.scaling && (
          <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-2">
            <div className="text-xs text-blue-300 font-semibold mb-1">At Higher Levels</div>
            <div className="text-xs text-gray-300">
              {typeof ability.ability_data.scaling === 'string' ? 
                ability.ability_data.scaling : 
                Object.entries(ability.ability_data.scaling).map(([level, data]) => (
                  <div key={level} className="mb-1">
                    <span className="font-semibold">{level.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span>{' '}
                    {typeof data === 'string' ? data : 
                     typeof data === 'object' && data.num_beams ? 
                       `${data.num_beams} beams` : 
                       JSON.stringify(data)
                    }
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* Description */}
        {ability.ability_data?.description && (
          <div className="text-gray-300 text-sm border-t border-gray-600 pt-3">
            {ability.ability_data.description}
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (actionData.type === 'weapon') {
      return renderWeaponInfo();
    } else if (actionData.type === 'ability') {
      return renderAbilityInfo();
    }
    
    // Fallback for other action types
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Info className="text-blue-400" size={20} />
          <h3 className="font-bold text-lg text-blue-400">{actionData.name}</h3>
        </div>
        
        {actionData.description && (
          <div className="text-gray-300 text-sm">
            {actionData.description}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
      
      {/* Popup */}
      <div
        ref={popupRef}
        className={`fixed z-50 max-w-xs w-80 rounded-2xl shadow-2xl border-2 transform transition-all duration-200 ${
          isHidden 
            ? 'bg-gradient-to-br from-gray-900 to-purple-900 border-purple-600'
            : 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-600'
        }`}
        style={{
          left: adjustedPosition?.x || 0,
          top: adjustedPosition?.y || 0,
          opacity: isVisible ? 1 : 0,
          scale: isVisible ? 1 : 0.95
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <span className="text-white text-base font-medium">{actionData?.name || 'Action'}</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors rounded-lg p-1 hover:bg-gray-700"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {renderContent()}
        </div>
      </div>
    </>
  );
};

ActionInfoPopup.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  position: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired
  }),
  actionData: PropTypes.shape({
    type: PropTypes.oneOf(['weapon', 'ability', 'skill', 'other']).isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    weapon: PropTypes.object,
    ability: PropTypes.object
  }),
  character: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  isHidden: PropTypes.bool
};

export default ActionInfoPopup;