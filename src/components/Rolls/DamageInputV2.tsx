import React, { useState, useCallback, useMemo } from 'react';
import { Shield, Heart, Calculator } from 'lucide-react';
import { useUnifiedRolls } from '../../hooks/useUnifiedRolls';
import { RollContext, ModifierType } from '../../types/rolls';
import { parseAnyDiceExpression } from '../../utils/diceParser';

interface DamageInputV2Props {
  character: {
    id: string;
    level: number;
    ability_scores: Record<string, number>;
    proficiencyBonus: number;
    max_hp: number;
    dnd_character_abilities?: any[];
    [key: string]: any;
  };
  currentHP: number;
  isKeyboardOpen: boolean;
  onClose: () => void;
  onApplyDamage: (damageData: any) => void;
}

/**
 * Modern damage input component using the unified roll system
 * Replaces hardcoded damage resistance calculations
 */
export const DamageInputV2: React.FC<DamageInputV2Props> = ({
  character,
  currentHP,
  isKeyboardOpen,
  onClose,
  onApplyDamage
}) => {
  const [damageAmount, setDamageAmount] = useState('');
  const [damageType, setDamageType] = useState('bludgeoning');
  const [selectedDefenses, setSelectedDefenses] = useState<string[]>([]);

  const { rollDirect, analyzeRoll, lastPreRollInfo } = useUnifiedRolls();

  // Get available defensive abilities
  const defensiveAbilities = useMemo(() => {
    return (character?.dnd_character_abilities || [])
      .filter(ability => 
        ability?.name && 
        (ability.ability_type === 'reaction' || 
         ability.name.toLowerCase().includes('resistance') || 
         ability.name.toLowerCase().includes('dodge') ||
         ability.name.toLowerCase().includes('immunity'))
      )
      .map(ability => ({
        id: ability.id,
        name: ability.name,
        description: ability.description,
        key: ability.name.toLowerCase().replace(/\s+/g, '-'),
        available: ability.uses_remaining > 0 || ability.uses_per_rest === null,
        damageTypes: ability.damage_types || [],
        effect: ability.name.toLowerCase().includes('resistance') ? 'resistance' :
                ability.name.toLowerCase().includes('immunity') ? 'immunity' :
                ability.name.toLowerCase().includes('dodge') ? 'half_damage' : 'special'
      }));
  }, [character]);

  // Calculate damage modifiers based on selected defenses and damage type
  const damageModifiers = useMemo(() => {
    const modifiers = [];
    
    for (const defenseKey of selectedDefenses) {
      const ability = defensiveAbilities.find(a => a.key === defenseKey);
      if (!ability) continue;

      switch (ability.effect) {
        case 'resistance':
          modifiers.push({
            id: `resistance_${ability.id}`,
            name: ability.name,
            description: 'Halves damage of this type',
            source: { type: 'class_feature', name: ability.name, tags: ['defensive'] },
            type: ModifierType.DIVIDER,
            value: 2,
            application: 'on_damage' as const,
            stacks: false,
            priority: 10
          });
          break;
        case 'immunity':
          modifiers.push({
            id: `immunity_${ability.id}`,
            name: ability.name,
            description: 'Negates all damage of this type',
            source: { type: 'class_feature', name: ability.name, tags: ['defensive'] },
            type: ModifierType.MULTIPLIER,
            value: 0,
            application: 'on_damage' as const,
            stacks: false,
            priority: 5
          });
          break;
        case 'half_damage':
          modifiers.push({
            id: `dodge_${ability.id}`,
            name: ability.name,
            description: 'Halves incoming damage (reaction)',
            source: { type: 'class_feature', name: ability.name, tags: ['defensive'] },
            type: ModifierType.DIVIDER,
            value: 2,
            application: 'on_damage' as const,
            stacks: false,
            priority: 15
          });
          break;
      }
    }

    return modifiers;
  }, [selectedDefenses, defensiveAbilities]);

  // Create roll context for damage calculation
  const createDamageContext = useCallback((): RollContext => ({
    character: {
      id: character.id,
      level: character.level,
      ability_scores: character.ability_scores,
      proficiencyBonus: character.proficiencyBonus
    },
    source: {
      type: 'custom',
      name: 'Incoming Damage',
      tags: ['damage', damageType],
      properties: { damageType }
    },
    environment: {
      advantage: false,
      disadvantage: false,
      hidden: false,
      blessed: false,
      inspired: false,
      conditions: []
    }
  }), [character, damageType]);

  // Calculate final damage using unified roll system
  const calculateFinalDamage = useCallback(async () => {
    if (!damageAmount) return 0;

    const context = createDamageContext();
    const definition = {
      id: `damage_${Date.now()}`,
      type: 'damage' as const,
      name: `${damageType} damage`,
      baseExpression: parseAnyDiceExpression(damageAmount.toString()),
      context,
      modifiers: damageModifiers
    };

    try {
      const result = await rollDirect(definition);
      return result.total;
    } catch (error) {
      console.error('Damage calculation failed:', error);
      return parseInt(damageAmount) || 0;
    }
  }, [damageAmount, damageType, damageModifiers, createDamageContext, rollDirect]);

  // Preview damage calculation
  const previewDamage = useCallback(async () => {
    if (!damageAmount) return;

    const context = createDamageContext();
    const definition = {
      id: `damage_preview_${Date.now()}`,
      type: 'damage' as const,
      name: `${damageType} damage preview`,
      baseExpression: parseAnyDiceExpression(damageAmount.toString()),
      context,
      modifiers: damageModifiers
    };

    await analyzeRoll(definition);
  }, [damageAmount, damageType, damageModifiers, createDamageContext, analyzeRoll]);

  const handleDefenseToggle = useCallback((key: string) => {
    setSelectedDefenses(prev => {
      const newDefenses = prev.includes(key) 
        ? prev.filter(d => d !== key)
        : [...prev, key];
      
      // Trigger preview update
      setTimeout(previewDamage, 100);
      return newDefenses;
    });
  }, [previewDamage]);

  const handleAmountChange = useCallback((value: string) => {
    setDamageAmount(value);
    // Trigger preview update with debounce
    setTimeout(previewDamage, 300);
  }, [previewDamage]);

  const handleApplyDamage = useCallback(async () => {
    const finalDamage = await calculateFinalDamage();
    
    onApplyDamage({
      originalAmount: parseInt(damageAmount) || 0,
      damageType,
      finalDamage,
      selectedDefenses,
      resistances: damageModifiers,
      finalHP: Math.max(0, currentHP - finalDamage)
    });
  }, [calculateFinalDamage, damageAmount, damageType, selectedDefenses, damageModifiers, currentHP, onApplyDamage]);

  const damageTypes = [
    'acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 
    'necrotic', 'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <Heart className="text-red-400" size={20} />
          <span>Take Damage</span>
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Damage Input */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Damage Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Damage Amount
            </label>
            <input
              type="number"
              placeholder="Enter damage..."
              value={damageAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className={`w-full border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:border-red-500 focus:outline-none ${
                isKeyboardOpen 
                  ? 'p-4 text-xl' 
                  : 'p-3 text-lg'
              }`}
              autoFocus
            />
          </div>

          {/* Damage Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Damage Type
            </label>
            <select
              value={damageType}
              onChange={(e) => setDamageType(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
            >
              {damageTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Preview Calculation */}
        {lastPreRollInfo && damageAmount && (
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
            <h4 className="text-blue-300 font-medium mb-3 flex items-center space-x-2">
              <Calculator size={16} />
              <span>Damage Calculation Preview</span>
            </h4>
            <div className="space-y-2">
              {lastPreRollInfo.modifiers.map((modifier, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-300">{modifier.label}:</span>
                  <span className="text-white font-mono">{modifier.value}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-gray-600">
                <div className="flex justify-between font-bold">
                  <span className="text-white">Final Damage:</span>
                  <span className="text-red-400">{lastPreRollInfo.estimatedRange.average.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Defensive Abilities */}
        {defensiveAbilities.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center space-x-2">
              <Shield size={16} />
              <span>Defensive Abilities</span>
            </label>
            <div className="space-y-2">
              {defensiveAbilities.map((ability) => {
                const isSelected = selectedDefenses.includes(ability.key);
                const isRelevant = ability.damageTypes.length === 0 || 
                                 ability.damageTypes.includes(damageType);
                
                return (
                  <button
                    key={ability.id}
                    disabled={!ability.available}
                    onClick={() => handleDefenseToggle(ability.key)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      !ability.available 
                        ? 'bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed'
                        : isSelected
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : isRelevant
                            ? 'bg-gray-700 border-gray-600 text-white hover:border-blue-500 hover:bg-gray-600'
                            : 'bg-gray-800 border-gray-700 text-gray-400'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {ability.effect === 'immunity' ? '🛡️' : 
                         ability.effect === 'resistance' ? '🔰' : '⚡'}
                      </span>
                      <div className="flex-1">
                        <div className="font-semibold">{ability.name}</div>
                        <div className="text-sm text-gray-300">{ability.description}</div>
                        {!ability.available && (
                          <div className="text-xs text-red-400">No uses remaining</div>
                        )}
                        {!isRelevant && ability.damageTypes.length > 0 && (
                          <div className="text-xs text-yellow-400">
                            Only applies to: {ability.damageTypes.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Final Summary */}
        {damageAmount && (
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Original {damageType} damage:</span>
                <span className="text-red-400 font-bold">{damageAmount}</span>
              </div>
              {lastPreRollInfo && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">After resistances:</span>
                  <span className="text-orange-400 font-bold">
                    {lastPreRollInfo.estimatedRange.average.toFixed(0)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-gray-600">
                <span className="text-white font-semibold">Final HP:</span>
                <span className={`font-bold text-lg ${
                  currentHP - (lastPreRollInfo?.estimatedRange.average || parseInt(damageAmount) || 0) <= 0 
                    ? 'text-red-400' 
                    : 'text-green-400'
                }`}>
                  {Math.max(0, currentHP - (lastPreRollInfo?.estimatedRange.average || parseInt(damageAmount) || 0))}/{character.max_hp}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Apply Button */}
        <button
          onClick={handleApplyDamage}
          disabled={!damageAmount}
          className={`w-full p-3 rounded-lg font-bold transition-colors ${
            damageAmount
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          Apply Damage
        </button>
      </div>
    </div>
  );
};

export default DamageInputV2;