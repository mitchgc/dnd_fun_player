import React, { useState, useCallback } from 'react';
import { Dice6, Play, X, Settings, History } from 'lucide-react';
import { useUnifiedRolls } from '../../hooks/useUnifiedRolls';
import { RollContext, RollType } from '../../types/rolls';
import { parseAnyDiceExpression } from '../../utils/diceParser';
import UnifiedRollDisplayV2 from './UnifiedRollDisplayV2';

interface ModernRollInterfaceProps {
  character: {
    id: string;
    level: number;
    ability_scores: Record<string, number>;
    proficiencyBonus: number;
    [key: string]: any;
  };
  className?: string;
}

/**
 * Modern roll interface showcasing the unified roll system
 * Demonstrates pre-roll analysis and execution
 */
export const ModernRollInterface: React.FC<ModernRollInterfaceProps> = ({ 
  character, 
  className = '' 
}) => {
  const [selectedRollType, setSelectedRollType] = useState<RollType>('attack');
  const [customExpression, setCustomExpression] = useState('1d20');
  const [rollName, setRollName] = useState('Attack');
  const [showHistory, setShowHistory] = useState(false);

  const {
    analyzeRoll,
    executeRoll,
    rollHistory,
    lastPreRollInfo,
    isAnalyzing,
    isRolling,
    clearHistory,
    stats
  } = useUnifiedRolls({
    criticalRules: {
      range: [20],
      damageStrategy: 'double_dice',
      affectedDice: 'weapon_only'
    }
  });

  // Create a basic roll context
  const createRollContext = useCallback((): RollContext => ({
    character: {
      id: character.id,
      level: character.level,
      ability_scores: character.ability_scores,
      proficiencyBonus: character.proficiencyBonus
    },
    source: {
      type: selectedRollType === 'attack' ? 'weapon' : 
           selectedRollType === 'skill' ? 'skill' : 
           selectedRollType === 'save' ? 'save' : 'ability',
      name: rollName,
      tags: [selectedRollType]
    },
    environment: {
      advantage: false,
      disadvantage: false,
      hidden: false,
      blessed: false,
      inspired: false,
      conditions: []
    }
  }), [character, selectedRollType, rollName]);

  const handleAnalyzeRoll = useCallback(async () => {
    const context = createRollContext();
    const definition = {
      id: `preview_${Date.now()}`,
      type: selectedRollType,
      name: rollName,
      baseExpression: parseAnyDiceExpression(customExpression),
      context,
      modifiers: []
    };

    await analyzeRoll(definition);
  }, [createRollContext, selectedRollType, rollName, customExpression, analyzeRoll]);

  const handleExecuteRoll = useCallback(async () => {
    if (!lastPreRollInfo) {
      await handleAnalyzeRoll();
    }
    
    const context = createRollContext();
    const definition = {
      id: `roll_${Date.now()}`,
      type: selectedRollType,
      name: rollName,
      baseExpression: parseAnyDiceExpression(customExpression),
      context,
      modifiers: []
    };

    await executeRoll(definition);
  }, [lastPreRollInfo, handleAnalyzeRoll, createRollContext, selectedRollType, rollName, customExpression, executeRoll]);

  const rollTypeOptions: { value: RollType; label: string; expression: string; id: string }[] = [
    { value: 'attack', label: 'Attack Roll', expression: '1d20', id: 'attack' },
    { value: 'damage', label: 'Damage Roll', expression: '1d8', id: 'damage' },
    { value: 'skill', label: 'Skill Check', expression: '1d20', id: 'skill' },
    { value: 'save', label: 'Saving Throw', expression: '1d20', id: 'save' },
    { value: 'initiative', label: 'Initiative', expression: '1d20', id: 'initiative' },
    { value: 'death_save', label: 'Death Save', expression: '1d20', id: 'death_save' },
    { value: 'healing', label: 'Healing', expression: '2d4+2', id: 'healing' },
    { value: 'raw', label: 'Custom Roll', expression: '1d20', id: 'raw' },
    { value: 'raw', label: 'Multi: Attack & Damage', expression: '1d20,1d8', id: 'multi1' },
    { value: 'raw', label: 'Multi: Labeled', expression: 'attack:1d20+5,damage:1d8+3', id: 'multi2' },
    { value: 'raw', label: 'Multi: Complex', expression: 'advantage:2d20kh1,damage:2d6+3,crit:2d6', id: 'multi3' },
    { value: 'raw', label: 'Flat Numbers: Simple', expression: '1d20,3', id: 'flat1' },
    { value: 'raw', label: 'Flat Numbers: Labeled', expression: 'attack:1d20+5,bonus:3', id: 'flat2' },
    { value: 'raw', label: 'Flat Numbers: Mixed', expression: 'roll:1d8,fixed:7,magic:2d4', id: 'flat3' }
  ];

  const handleRollTypeChange = (type: RollType) => {
    setSelectedRollType(type);
    const option = rollTypeOptions.find(opt => opt.value === type);
    if (option) {
      setCustomExpression(option.expression);
      setRollName(option.label);
    }
  };

  return (
    <div className={`bg-gray-900 rounded-xl p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Dice6 className="text-blue-400" size={24} />
          <h2 className="text-xl font-bold text-white">Unified Roll System</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            title="Roll History"
          >
            <History size={16} className="text-gray-300" />
          </button>
          <button
            onClick={clearHistory}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            title="Clear History"
          >
            <X size={16} className="text-gray-300" />
          </button>
        </div>
      </div>

      {/* Roll Configuration */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Roll Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Roll Type
            </label>
            <select
              value={selectedRollType}
              onChange={(e) => handleRollTypeChange(e.target.value as RollType)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
            >
              {rollTypeOptions.map(option => (
                <option key={option.id} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Roll Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Roll Name
            </label>
            <input
              type="text"
              value={rollName}
              onChange={(e) => setRollName(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
              placeholder="Enter roll name..."
            />
          </div>
        </div>

        {/* Dice Expression */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Dice Expression
          </label>
          <input
            type="text"
            value={customExpression}
            onChange={(e) => setCustomExpression(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 font-mono"
            placeholder="1d20+5, 2d6kh1, 4d6dl1..."
          />
          <div className="text-xs text-gray-400 mt-1">
            Supports advanced notation: kh/kl (keep highest/lowest), dh/dl (drop), r (reroll), x (exploding), m (minimum)<br/>
            Multi-expressions: "1d20,1d8" or labeled "attack:1d20+5,damage:1d8+3"<br/>
            Flat numbers: "3" (fixed value), "bonus:7" (labeled fixed value)
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleAnalyzeRoll}
            disabled={isAnalyzing}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <Settings size={16} />
            <span>{isAnalyzing ? 'Analyzing...' : 'Preview Roll'}</span>
          </button>
          <button
            onClick={handleExecuteRoll}
            disabled={isRolling}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <Play size={16} />
            <span>{isRolling ? 'Rolling...' : 'Execute Roll'}</span>
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{stats.totalRolls}</div>
          <div className="text-xs text-gray-400">Total Rolls</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">{stats.criticalHits}</div>
          <div className="text-xs text-gray-400">Critical Hits</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">{stats.criticalFailures}</div>
          <div className="text-xs text-gray-400">Critical Fails</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.averageRoll.toFixed(1)}</div>
          <div className="text-xs text-gray-400">Average</div>
        </div>
      </div>

      {/* Pre-Roll Display */}
      {lastPreRollInfo && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">Roll Preview</h3>
          <UnifiedRollDisplayV2 preRollInfo={lastPreRollInfo} />
        </div>
      )}

      {/* Roll History */}
      {showHistory && rollHistory.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">Recent Rolls</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {rollHistory.slice(0, 5).map((roll) => (
              <UnifiedRollDisplayV2 key={roll.metadata.rollId} rollResult={roll} />
            ))}
          </div>
        </div>
      )}

      {/* Latest Roll */}
      {rollHistory.length > 0 && !showHistory && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">Latest Roll</h3>
          <UnifiedRollDisplayV2 rollResult={rollHistory[0]} />
        </div>
      )}
    </div>
  );
};

export default ModernRollInterface;