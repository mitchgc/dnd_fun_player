import React from 'react';
import PropTypes from 'prop-types';
import { Sword, Sparkles, Eye, EyeOff, Package } from 'lucide-react';
import ActionButton from './ActionButton';
import { getWeaponStats } from '../../utils/diceUtils';

const TurnManager = ({
  character,
  turnState,
  isHidden,
  turnCollapsed,
  buttonStates,
  onTurnCollapsedToggle,
  onAttack,
  onToggleHidden,
  onBonusActionDash,
  onDisengage,
  onUseItem,
  onResetTurn,
  onUseBonusAction
}) => {
  const handleHideClick = () => {
    if (isHidden) {
      // If already hidden, just reveal without rolling
      onToggleHidden();
    } else {
      // If not hidden, trigger stealth roll and use bonus action
      const stealthAction = { id: 'stealth', name: 'Stealth', type: 'skill' };
      // This would need to be connected to the roll system
      onUseBonusAction(); // Mark bonus action as used
    }
  };

  return (
    <div className={`rounded-2xl shadow-xl border-2 ${
      isHidden 
        ? 'bg-gradient-to-r from-gray-800 to-purple-900 border-purple-600'
        : 'bg-gradient-to-r from-gray-900 to-gray-800 border-gray-600'
    }`}>
      <div 
        className="flex items-center justify-between p-6 border-b border-gray-700 cursor-pointer hover:bg-gray-800/50 transition-colors"
        onClick={onTurnCollapsedToggle}
      >
        <div className="flex items-center">
          <Sword className={`mr-3 transition-colors duration-1000 ${
            isHidden ? 'text-purple-400' : 'text-red-400'
          }`} size={32} />
          <div>
            <h2 className="text-3xl font-bold text-white">
              Your Turn
            </h2>
            <p className="text-gray-300 font-medium">Actions, Bonus Actions & Movement</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className={`transition-transform duration-300 ${
            turnCollapsed ? 'rotate-180' : ''
          }`}>
            ▼
          </div>
        </div>
      </div>

      <div 
        className={`grid transition-all duration-300 ease-in-out overflow-hidden ${
          turnCollapsed 
            ? 'grid-rows-[0fr] opacity-0' 
            : 'grid-rows-[1fr] opacity-100'
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-6 p-6">
          {/* Action Section */}
          <div className="bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-red-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center">
                <Sword className="mr-3 text-red-400" size={24} />
                Action
              </h3>
              <div className={`px-3 py-1 rounded-lg text-sm font-medium border ${
                turnState.actionUsed 
                  ? 'bg-red-900/30 border-red-600 text-red-300' 
                  : 'bg-green-900/30 border-green-600 text-green-300'
              }`}>
                {turnState.actionUsed ? 'Used' : '1 Available'}
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              {Object.entries(character.weapons).map(([key, weapon]) => {
                const stats = getWeaponStats(key, isHidden, character);
                return (
                  <ActionButton
                    key={key}
                    onClick={() => onAttack(key)}
                    disabled={turnState.actionUsed}
                    variant="danger"
                    loading={buttonStates[`attack-${key}`]}
                    icon={key === 'shortbow' ? <span>🏹</span> : <Sword />}
                    title={isHidden ? `${weapon.name} (Sneak Attack)` : weapon.name}
                    subtitle={`${stats.minDamage}-${stats.maxDamage} dmg`}
                  />
                );
              })}
            </div>
            
            <div className={`mt-4 text-sm bg-gray-800 p-4 rounded-xl border ${isHidden ? 'text-purple-300 border-purple-600' : 'text-red-300 border-red-600'}`}>
              {isHidden ? (
                <>🥷 <strong>You are hidden</strong> - doing {character.sneakAttackDice}d6 extra sneak attack damage</>
              ) : (
                <>💡 <strong>Tip:</strong> As a rogue, you do bonus damage if you're hidden first</>
              )}
            </div>
          </div>

          {/* Bonus Action Section */}
          <div className="bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-300 flex items-center">
                <Sparkles className="mr-3 text-gray-400" size={24} />
                Bonus Action
              </h3>
              <div className={`px-3 py-1 rounded-lg text-sm font-medium border ${
                turnState.bonusActionUsed 
                  ? 'bg-red-900/30 border-red-600 text-red-300' 
                  : 'bg-green-900/30 border-green-600 text-green-300'
              }`}>
                {turnState.bonusActionUsed ? 'Used' : '1 Available'}
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              <ActionButton
                onClick={handleHideClick}
                disabled={!isHidden && turnState.bonusActionUsed}
                variant="purple"
                icon={isHidden ? <Eye /> : <EyeOff />}
                title={isHidden ? 'Reveal' : 'Hide'}
              />
              
              <ActionButton
                onClick={onBonusActionDash}
                disabled={turnState.bonusActionUsed}
                variant="secondary"
                icon={<span>💨</span>}
                title="Dash"
              />
              
              <ActionButton
                onClick={onDisengage}
                disabled={turnState.bonusActionUsed}
                variant="secondary"
                icon={<span>🏃</span>}
                title="Disengage"
              />
              
              <ActionButton
                onClick={onUseItem}
                disabled={turnState.bonusActionUsed}
                variant="secondary"
                icon={<Package />}
                title="Use Item"
              />
            </div>
            
            <div className="mt-4 text-sm text-purple-300 bg-gray-800 p-4 rounded-xl border border-purple-600">
              💡 <strong>Tip:</strong> You can use a bonus action before or after your action
            </div>
          </div>

          {/* Movement Section */}
          <div className="bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-300">🏃‍♂️ Movement</h3>
              <div className="px-3 py-1 rounded-lg text-sm font-medium border bg-gray-700 border-gray-600 text-gray-300">
                {30 - turnState.movementUsed} ft remaining
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-600">
              <p className="text-sm text-gray-300">
                💡 <strong>Tip:</strong> You can move before and/or after your action or bonus actions
              </p>
            </div>
          </div>

          {/* End Turn Controls */}
          <div className="grid grid-cols-4 gap-3 pt-4">
            <ActionButton
              onClick={onResetTurn}
              variant="primary"
              icon={<span>🔄</span>}
              title="End Turn"
              className="!bg-gradient-to-r !from-indigo-600 !to-indigo-700 !hover:from-indigo-700 !hover:to-indigo-800 !border-indigo-500"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

TurnManager.propTypes = {
  character: PropTypes.shape({
    weapons: PropTypes.object.isRequired,
    sneakAttackDice: PropTypes.number.isRequired
  }).isRequired,
  turnState: PropTypes.shape({
    actionUsed: PropTypes.bool.isRequired,
    bonusActionUsed: PropTypes.bool.isRequired,
    movementUsed: PropTypes.number.isRequired
  }).isRequired,
  isHidden: PropTypes.bool.isRequired,
  turnCollapsed: PropTypes.bool.isRequired,
  buttonStates: PropTypes.object.isRequired,
  onTurnCollapsedToggle: PropTypes.func.isRequired,
  onAttack: PropTypes.func.isRequired,
  onToggleHidden: PropTypes.func.isRequired,
  onBonusActionDash: PropTypes.func.isRequired,
  onDisengage: PropTypes.func.isRequired,
  onUseItem: PropTypes.func.isRequired,
  onResetTurn: PropTypes.func.isRequired,
  onUseBonusAction: PropTypes.func.isRequired
};

export default TurnManager;