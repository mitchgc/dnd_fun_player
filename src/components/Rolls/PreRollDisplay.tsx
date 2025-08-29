import React from 'react';
import { PreRollInfo, DicePreview, ModifierPreview, ConditionPreview } from '../../types/rolls';

interface PreRollDisplayProps {
  preRollInfo: PreRollInfo;
  onConfirmRoll: () => void;
  onCancel: () => void;
}

/**
 * Pre-Roll Display Component
 * 
 * Shows what will happen BEFORE the roll is executed
 * Gives players full transparency about dice, bonuses, and conditions
 */
export const PreRollDisplay: React.FC<PreRollDisplayProps> = ({ 
  preRollInfo, 
  onConfirmRoll, 
  onCancel 
}) => {
  const { dice, modifiers, conditions, estimatedRange, criticalRange, notes } = preRollInfo;

  const hasAdvantage = conditions.some(c => c.type === 'advantage' && c.active);
  const hasDisadvantage = conditions.some(c => c.type === 'disadvantage' && c.active);
  const critRange = criticalRange;

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-700 max-w-md">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white mb-2">
          Roll Preview
        </h3>
        {notes.length > 0 && (
          <div className="text-sm text-yellow-300">
            {notes.join(', ')}
          </div>
        )}
      </div>

      {/* Dice Section */}
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-blue-300 mb-2">🎲 Dice</h4>
        <div className="space-y-2">
          {dice.map((die, index) => (
            <DiceDisplay key={`${die.label}-${index}`} dice={die} />
          ))}
        </div>
      </div>

      {/* Modifiers Section */}
      {modifiers.length > 0 && (
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-green-300 mb-2">➕ Modifiers</h4>
          <div className="space-y-1">
            {modifiers.map((modifier, index) => (
              <ModifierDisplay key={`${modifier.label}-${index}`} modifier={modifier} />
            ))}
          </div>
        </div>
      )}

      {/* Conditions Section */}
      {conditions.length > 0 && (
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-purple-300 mb-2">⚡ Special Conditions</h4>
          <div className="space-y-1">
            {conditions.map((condition, index) => (
              <ConditionDisplay key={`${condition.type}-${index}`} condition={condition} />
            ))}
          </div>
        </div>
      )}

      {/* Summary Section */}
      <div className="mb-4 p-3 bg-gray-800 rounded-lg border border-gray-600">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-400">Estimated Range:</span>
            <div className="text-white font-mono">
              {estimatedRange.min} - {estimatedRange.max}
            </div>
          </div>
          <div>
            <span className="text-gray-400">Critical Range:</span>
            <div className="text-white font-mono">
              {critRange.join(', ')}
            </div>
          </div>
        </div>
        
        {/* Special Conditions Summary */}
        {(hasAdvantage || hasDisadvantage) && (
          <div className="mt-2 pt-2 border-t border-gray-700">
            <span className="text-sm font-medium">
              {hasAdvantage && hasDisadvantage ? (
                <span className="text-yellow-400">🟡 Normal (Advantage/Disadvantage cancel)</span>
              ) : hasAdvantage ? (
                <span className="text-green-400">🟢 Advantage (roll twice, take higher)</span>
              ) : (
                <span className="text-red-400">🔴 Disadvantage (roll twice, take lower)</span>
              )}
            </span>
          </div>
        )}

        {/* Notes */}
        {notes.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-700">
            <div className="text-sm text-gray-400">
              Notes: {notes.join(', ')}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onConfirmRoll}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          🎲 Roll!
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

const DiceDisplay: React.FC<{ dice: DicePreview }> = ({ dice }) => {
  const getDiceColor = (category: string) => {
    switch (category) {
      case 'base': return 'text-red-400';
      case 'bonus': return 'text-green-400';
      case 'critical': return 'text-yellow-400';
      case 'conditional': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
      <div className="flex items-center">
        <span className={`font-mono text-lg font-bold mr-3 ${getDiceColor(dice.category)}`}>
          {dice.expression}
        </span>
        <span className="text-sm text-gray-300">
          {dice.label}
        </span>
      </div>
      <div className="text-xs text-gray-500">
        {dice.source}
      </div>
    </div>
  );
};

const ModifierDisplay: React.FC<{ modifier: ModifierPreview }> = ({ modifier }) => {
  const getModifierColor = (value: string) => {
    return value.startsWith('+') ? 'text-green-400' : value.startsWith('-') ? 'text-red-400' : 'text-blue-400';
  };

  return (
    <div className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
      <div className="flex items-center">
        <span className={`font-mono text-lg font-bold mr-3 ${getModifierColor(modifier.value)}`}>
          {modifier.value}
        </span>
        <span className="text-sm text-gray-300">
          {modifier.label}
        </span>
      </div>
      {modifier.condition && (
        <div className="text-xs text-gray-500">
          {modifier.condition}
        </div>
      )}
    </div>
  );
};

const ConditionDisplay: React.FC<{ condition: ConditionPreview }> = ({ condition }) => {
  const getConditionIcon = (type: string) => {
    switch (type) {
      case 'advantage': return '⬆️';
      case 'disadvantage': return '⬇️';
      case 'bonus': return '💥';
      case 'penalty': return '🔄';
      case 'special': return '🔥';
      default: return '⚡';
    }
  };

  const getConditionColor = (type: string) => {
    switch (type) {
      case 'advantage': return 'text-green-400';
      case 'disadvantage': return 'text-red-400';
      case 'bonus': return 'text-yellow-400';
      case 'penalty': return 'text-red-400';
      case 'special': return 'text-purple-400';
      default: return 'text-purple-400';
    }
  };

  if (!condition.active) return null;

  return (
    <div className="bg-gray-800 rounded-lg px-3 py-2">
      <div className="flex items-center">
        <span className="text-lg mr-2">{condition.icon || getConditionIcon(condition.type)}</span>
        <span className={`font-medium ${getConditionColor(condition.type)}`}>
          {condition.label}
        </span>
      </div>
      <div className="text-xs text-gray-400 ml-7">
        {condition.description}
      </div>
    </div>
  );
};