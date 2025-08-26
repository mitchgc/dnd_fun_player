import React from 'react';
import PropTypes from 'prop-types';
import { Dice6, Target, Eye } from 'lucide-react';
import RollSearch from './RollSearch';
import RollResult from './RollResult';
import RollHistory from './RollHistory';
import DamageInput from './DamageInput';
import CompactDiceAnimation from './CompactDiceAnimation';

const RollPopup = ({
  rollActions,
  rollPopup,
  isKeyboardOpen,
  viewportHeight,
  isHidden,
  character,
  currentHP,
  damageInput,
  rollLogs,
  onClose,
  onSearchTermChange,
  onActionSelect,
  onDamageInputChange,
  onApplyDamage,
  onClearHistory,
  onPhaseChange
}) => {
  if (!rollPopup.isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex p-4 transition-all duration-300 ${
        isKeyboardOpen
          ? 'items-start justify-center pt-8' // Center modal when keyboard is open
          : 'items-end justify-end p-6' // Bottom-right when keyboard closed
      }`}
      onClick={onClose}
      style={{ 
        height: isKeyboardOpen ? `${viewportHeight}px` : '100vh' 
      }}
    >
      <div 
        className={`${
          isKeyboardOpen 
            ? 'w-full max-w-sm max-h-full' // Full width but constrained when keyboard open
            : 'w-80' // Fixed width when keyboard closed
        } rounded-2xl p-6 shadow-2xl border-2 transition-all duration-300 ${
          isHidden 
            ? 'bg-gradient-to-br from-gray-800 to-purple-900 border-purple-600'
            : 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-600'
        } ${
          isKeyboardOpen ? 'overflow-y-auto' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {rollPopup.phase === 'search' && (
          <RollSearch
            rollActions={rollActions}
            searchTerm={rollPopup.searchTerm}
            isKeyboardOpen={isKeyboardOpen}
            isHidden={isHidden}
            onSearchTermChange={onSearchTermChange}
            onActionSelect={onActionSelect}
            onShowHistory={() => onPhaseChange('logs')}
          />
        )}

        {rollPopup.phase === 'damage-input' && (
          <DamageInput
            damageInput={damageInput}
            character={character}
            currentHP={currentHP}
            isKeyboardOpen={isKeyboardOpen}
            onClose={onClose}
            onDamageInputChange={onDamageInputChange}
            onApplyDamage={onApplyDamage}
          />
        )}

        {rollPopup.phase === 'rolling' && rollPopup.selectedAction && (
          <div className="space-y-4 text-center">
            <h2 className="text-lg font-bold text-white">
              Rolling {rollPopup.selectedAction.name}
            </h2>
            
            <div className="flex justify-center">
              <CompactDiceAnimation
                diceType={rollPopup.selectedAction.diceType || 'd20'}
                isRolling={true}
                rollResult={rollPopup.result?.roll}
                modalSize={{ width: 320, height: 200 }}
                isHidden={isHidden}
                reducedMotion={window.matchMedia('(prefers-reduced-motion: reduce)').matches}
                className="dice-container"
              />
            </div>
            
            <p className="text-sm text-gray-300">
              Rolling...
            </p>
          </div>
        )}

        {rollPopup.phase === 'result' && rollPopup.result && (
          <RollResult
            result={rollPopup.result}
            selectedAction={rollPopup.selectedAction}
            character={character}
            isHidden={isHidden}
            onClose={onClose}
            onReroll={() => {
              if (rollPopup.selectedAction) {
                onActionSelect(rollPopup.selectedAction);
              }
            }}
          />
        )}

        {rollPopup.phase === 'logs' && (
          <RollHistory
            rollLogs={rollLogs}
            isHidden={isHidden}
            onBack={() => onPhaseChange('search')}
            onClearHistory={onClearHistory}
          />
        )}
      </div>
    </div>
  );
};

RollPopup.propTypes = {
  rollActions: PropTypes.object.isRequired,
  rollPopup: PropTypes.shape({
    isOpen: PropTypes.bool.isRequired,
    phase: PropTypes.oneOf(['search', 'rolling', 'result', 'logs', 'damage-input']).isRequired,
    searchTerm: PropTypes.string,
    selectedAction: PropTypes.object,
    result: PropTypes.object
  }).isRequired,
  isKeyboardOpen: PropTypes.bool.isRequired,
  viewportHeight: PropTypes.number.isRequired,
  isHidden: PropTypes.bool.isRequired,
  character: PropTypes.object.isRequired,
  currentHP: PropTypes.number.isRequired,
  damageInput: PropTypes.object,
  rollLogs: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
  onSearchTermChange: PropTypes.func.isRequired,
  onActionSelect: PropTypes.func.isRequired,
  onDamageInputChange: PropTypes.func,
  onApplyDamage: PropTypes.func,
  onClearHistory: PropTypes.func.isRequired,
  onPhaseChange: PropTypes.func.isRequired
};

export default RollPopup;