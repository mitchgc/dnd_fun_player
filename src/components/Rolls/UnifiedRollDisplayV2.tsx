import React, { JSX } from 'react';
import { Target, Eye, Sword, Shield, Heart, Sparkles, Dice6, Clock, Zap } from 'lucide-react';
import { RollResult, PreRollInfo, RollBreakdown } from '../../types/rolls';

interface UnifiedRollDisplayV2Props {
  rollResult?: RollResult;
  preRollInfo?: PreRollInfo;
  className?: string;
  showTimestamp?: boolean;
}

/**
 * Modern roll display component for the unified roll system
 * Can show either completed roll results or pre-roll analysis
 * Both preview and executed rolls use the exact same formatting
 */
export const UnifiedRollDisplayV2: React.FC<UnifiedRollDisplayV2Props> = ({ 
  rollResult, 
  preRollInfo, 
  className = '',
  showTimestamp = true 
}) => {
  // Determine if we're showing a completed roll or pre-roll info
  const isPreRoll = !rollResult && preRollInfo;
  const displayData = rollResult || preRollInfo;

  if (!displayData) {
    return null;
  }

  const getIconAndColorForRollType = (type: string) => {
    switch (type) {
      case 'attack':
      case 'spell_attack':
        return { icon: <Target size={16} />, color: 'text-red-400' };
      case 'damage':
        return { icon: <Sword size={16} />, color: 'text-orange-400' };
      case 'spell_save':
        return { icon: <Sparkles size={16} />, color: 'text-purple-400' };
      case 'skill':
        return { icon: <Eye size={16} />, color: 'text-blue-400' };
      case 'ability':
        return { icon: <Shield size={16} />, color: 'text-cyan-400' };
      case 'save':
        return { icon: <Heart size={16} />, color: 'text-yellow-400' };
      case 'healing':
        return { icon: <Heart size={16} />, color: 'text-green-400' };
      case 'initiative':
        return { icon: <Zap size={16} />, color: 'text-yellow-300' };
      case 'death_save':
        return { icon: <Heart size={16} />, color: 'text-red-300' };
      default:
        return { icon: <Dice6 size={16} />, color: 'text-gray-400' };
    }
  };

  const getCriticalStatus = (roll: RollResult) => {
    if (roll.criticalSuccess) {
      return { 
        text: '🎯 CRITICAL HIT!', 
        color: 'text-yellow-300 bg-yellow-600/20', 
        border: 'border-yellow-500/50' 
      };
    }
    if (roll.criticalFailure) {
      return { 
        text: '💀 CRITICAL FAILURE!', 
        color: 'text-red-300 bg-red-600/20', 
        border: 'border-red-500/50' 
      };
    }
    return null;
  };

  // Convert PreRollInfo to RollBreakdown format so we can use the same rendering
  const convertPreRollToBreakdown = (preRoll: PreRollInfo): RollBreakdown[] => {
    const breakdown: RollBreakdown[] = [];
    
    // Convert dice previews to breakdown items
    preRoll.dice.forEach((dice, index) => {
      // Parse dice expression to get details - handle both standard dice and flat numbers
      const diceMatch = dice.expression.match(/(\d+)d(\d+)/i);
      const flatNumberMatch = dice.expression.match(/^(\d+)$/); // Handle pure numbers like "20"
      
      // Also handle 1d1+modifier pattern for flat numbers
      const flatWithModifierMatch = dice.expression.match(/^1d1([+-]\d+)$/i);
      
      if (diceMatch) {
        const count = parseInt(diceMatch[1]);
        const sides = parseInt(diceMatch[2]);
        
        // Detect advantage/disadvantage patterns
        const hasAdvantage = dice.expression.includes('kh1') || dice.expression.includes('d20kh1');
        const hasDisadvantage = dice.expression.includes('kl1') || dice.expression.includes('d20kl1');
        
        // Create label based on advantage/disadvantage
        let displayLabel = dice.label;
        if (hasAdvantage) {
          displayLabel = 'Advantage';
        } else if (hasDisadvantage) {
          displayLabel = 'Disadvantage';
        }
        
        // Clean up the label
        displayLabel = displayLabel
          .replace(/^.*?:\s*/, '') // Remove prefix like "Sneak_Bonus: "
          .replace(/\s*Dice\s*/i, '') // Remove "Dice" word
          .replace(/_/g, ' ') // Replace underscores with spaces
          .replace(/\b\w/g, c => c.toUpperCase()) // Capitalize each word
          .trim();
        
        // Create fake rolls for preview (use average values)
        const avgRoll = Math.ceil(sides / 2);
        const rolls = Array(count).fill(avgRoll);
        
        // Check if this is a flat number (1d1 case) 
        const isFlatNumber = sides === 1 && count === 1;
        let finalValue = avgRoll * count;
        
        // Check for modifiers in the dice expression and split them into separate items for transparency
        const modifierMatch = dice.expression.match(/\d+d\d+([+-]\d+)/i);
        
        if (isFlatNumber) {
          // For flat numbers, handle the modifier as part of the die value (special case)
          const flatModifierMatch = dice.expression.match(/[+-](\d+)/);
          if (flatModifierMatch) {
            const modifierValue = parseInt(flatModifierMatch[1], 10);
            const sign = dice.expression.includes('+') ? 1 : -1;
            finalValue = 1 + (sign * modifierValue); // 1d1 + modifier
          }
          
          breakdown.push({
            type: 'die',
            label: displayLabel,
            value: finalValue,
            details: {
              rolls: [finalValue],
              sides: sides,
              source: dice.source,
              rerolled: false,
              isFlatNumber: true
            }
          });
        } else {
          // For regular dice, add the dice roll first
          breakdown.push({
            type: 'die',
            label: displayLabel,
            value: finalValue,
            details: {
              rolls: rolls,
              sides: sides,
              source: dice.source,
              rerolled: false,
              isFlatNumber: false
            }
          });
          
          // Then add the modifier as a separate item if it exists
          if (modifierMatch) {
            const modifierValue = parseInt(modifierMatch[1], 10);
            breakdown.push({
              type: 'modifier',
              label: 'Expression Modifier',
              value: modifierValue,
              details: {
                source: dice.source
              }
            });
          }
        }
      } else if (flatNumberMatch) {
        // Handle flat numbers like "20"
        const value = parseInt(flatNumberMatch[1]);
        
        // Clean up the label
        const displayLabel = dice.label
          .replace(/^.*?:\s*/, '') // Remove prefix like "Stealth: "
          .replace(/\s*Dice\s*/i, '') // Remove "Dice" word
          .replace(/_/g, ' ') // Replace underscores with spaces
          .replace(/\b\w/g, c => c.toUpperCase()) // Capitalize each word
          .trim();
        
        breakdown.push({
          type: 'die',
          label: displayLabel,
          value: value,
          details: {
            rolls: [value],
            sides: 1,
            source: dice.source,
            rerolled: false,
            isFlatNumber: true
          }
        });
      } else if (flatWithModifierMatch) {
        // Handle 1d1+modifier pattern for flat numbers like "1d1+19" (which represents "20")
        const modifierStr = flatWithModifierMatch[1];
        const modifier = parseInt(modifierStr);
        const totalValue = 1 + modifier; // 1d1 always rolls 1, plus the modifier
        
        // Clean up the label
        const displayLabel = dice.label
          .replace(/^.*?:\s*/, '') // Remove prefix like "Stealth: "
          .replace(/\s*Dice\s*/i, '') // Remove "Dice" word
          .replace(/_/g, ' ') // Replace underscores with spaces
          .replace(/\b\w/g, c => c.toUpperCase()) // Capitalize each word
          .trim();
        
        breakdown.push({
          type: 'die',
          label: displayLabel,
          value: totalValue,
          details: {
            rolls: [totalValue],
            sides: 1,
            source: dice.source,
            rerolled: false,
            isFlatNumber: true
          }
        });
      }
    });
    
    // Convert modifier previews to breakdown items
    // Skip modifiers that are already included in flat number dice
    preRoll.modifiers.forEach((mod) => {
      const value = typeof mod.value === 'string' ? 
        parseInt(mod.value.replace(/[^-\d]/g, '')) || 0 : 0;
      
      // Check if this modifier is from the same source as a flat number die
      // Also check if this is from a dice expression that already includes the modifier (like "1d1+19")
      const matchingFlatDie = breakdown.find(item => 
        item.type === 'die' && 
        item.details?.isFlatNumber && 
        (item.label.toLowerCase().includes(mod.label.toLowerCase().split(':')[0]) ||
         mod.label.toLowerCase().includes('expression'))
      );
      
      if (value !== 0 && !matchingFlatDie) {
        breakdown.push({
          type: 'modifier',
          label: mod.label,
          value: value,
          details: {
            source: mod.source
          }
        });
      }
    });
    
    return breakdown;
  };

  const renderTransparentPreview = (preRoll: PreRollInfo) => {
    const breakdownItems: React.JSX.Element[] = [];

    // Process each breakdown item for preview with individual dice display
    preRoll.breakdown.forEach((item, index) => {
      if (item.type === 'die') {
        // For preview, we need to simulate individual dice based on the breakdown
        if (item.details?.rolls && item.details.rolls.length > 1) {
          // Multi-dice - show each die individually
          const cleanLabel = item.label
            .replace(/^.*?:\s*/, '')
            .replace(/\s*Dice\s*/i, '')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())
            .trim();
            
          item.details.rolls.forEach((dieValue, dieIndex) => {
            const displayType = `[d${item.details?.sides || 20}]`;
            const showIndex = item.details.rolls.length > 1;
            
            breakdownItems.push(
              <div key={`${index}-${dieIndex}`} className="flex items-center justify-between py-1 px-2 bg-blue-700/20 rounded">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400">
                    {cleanLabel} <span className="text-blue-300">{displayType}</span> {showIndex && `#${dieIndex + 1}`} <span className="text-blue-400">(preview)</span>
                  </span>
                </div>
                <span className="font-mono text-white text-lg">{dieValue}</span>
              </div>
            );
          });
        } else {
          // Single die or flat number
          const cleanLabel = item.label
            .replace(/^.*?:\s*/, '')
            .replace(/\s*Dice\s*/i, '')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())
            .trim();
          
          const isFlatNumber = item.details?.isFlatNumber || (item.details?.sides === 1);
          const displayType = isFlatNumber ? `[${item.value}]` : `[d${item.details?.sides || 20}]`;
          
          breakdownItems.push(
            <div key={index} className="flex items-center justify-between py-1 px-2 bg-blue-700/20 rounded">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">
                  {cleanLabel} <span className="text-blue-300">{displayType}</span> <span className="text-blue-400">(preview)</span>
                </span>
              </div>
              <span className="font-mono text-white text-lg">{item.value}</span>
            </div>
          );
        }
      } else {
        // Modifier
        const cleanLabel = item.label
          .replace(/^.*?:\s*/, '')
          .replace(/_/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase())
          .trim();
        
        const isPositive = item.value > 0;
        const isNegative = item.value < 0;
        
        breakdownItems.push(
          <div key={index} className={`flex items-center justify-between py-1 px-2 rounded ${
            isPositive ? 'bg-green-700/20' : isNegative ? 'bg-red-700/20' : 'bg-gray-700/20'
          }`}>
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-medium ${
                isPositive ? 'text-green-300' : isNegative ? 'text-red-300' : 'text-gray-300'
              }`}>
                {cleanLabel} <span className="text-blue-300">[{isPositive ? '+' : ''}{item.value}]</span> <span className="text-blue-400">(preview)</span>
              </span>
            </div>
            <span className={`font-mono text-lg ${
              isPositive ? 'text-green-300' : isNegative ? 'text-red-300' : 'text-white'
            }`}>
              {isPositive ? '+' : ''}{item.value}
            </span>
          </div>
        );
      }
    });

    return breakdownItems;
  };

  const renderSharedBreakdown = (breakdown: RollBreakdown[], isPreview: boolean = false) => {
    // First, merge flat numbers (1d1 + modifier) for consistency
    const processedBreakdown = [];
    for (let i = 0; i < breakdown.length; i++) {
      const item = breakdown[i];
      
      if (item.type === 'die' && item.details?.sides === 1 && item.details?.rolls?.length === 1) {
        const nextItem = breakdown[i + 1];
        if (nextItem && nextItem.type === 'modifier') {
          // Merge flat number
          processedBreakdown.push({
            ...item,
            value: item.value + nextItem.value,
            details: { ...item.details, isFlatNumber: true }
          });
          i++; // Skip next item
          continue;
        }
      }
      processedBreakdown.push(item);
    }

    return processedBreakdown.map((item, index) => {
      // Clean up label consistently
      const cleanLabel = item.label
        .replace(/^.*?:\s*/, '')
        .replace(/\s*Dice\s*/i, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        .trim();

      if (item.type === 'die') {
        const isFlatNumber = item.details?.isFlatNumber || (item.details?.sides === 1);
        const displayType = isFlatNumber ? `[${item.value}]` : `[d${item.details?.sides || 20}]`;
        
        return (
          <div key={`die-${index}`} className="flex items-center justify-between py-1 px-2 bg-blue-700/20 rounded">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">
                  {cleanLabel} <span className="text-blue-300">{displayType}</span>
                  {isPreview ? ' (preview)' : ''}
                </span>
              </div>
              {item.details?.source && (
                <div className="text-xs text-gray-500 mt-1 ml-0">{item.details.source}</div>
              )}
            </div>
            <span className="font-mono text-white text-lg">{item.value}</span>
          </div>
        );
      } else {
        const isPositive = item.value > 0;
        const isNegative = item.value < 0;
        
        return (
          <div key={`mod-${index}`} className={`flex items-center justify-between py-1 px-2 rounded ${
            isPositive ? 'bg-green-700/20' : isNegative ? 'bg-red-700/20' : 'bg-gray-700/20'
          }`}>
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-medium ${
                isPositive ? 'text-green-300' : isNegative ? 'text-red-300' : 'text-gray-300'
              }`}>
                {cleanLabel} <span className="text-blue-300">[{isPositive ? '+' : ''}{item.value}]</span>
                {isPreview ? ' (preview)' : ''}
              </span>
            </div>
            <span className={`font-mono text-lg ${
              isPositive ? 'text-green-300' : isNegative ? 'text-red-300' : 'text-white'
            }`}>
              {isPositive ? '+' : ''}{item.value}
            </span>
          </div>
        );
      }
    });
  };

  const renderTransparentBreakdown = (roll: RollResult) => {
    const breakdownItems: React.JSX.Element[] = [];

    // First, check for flat number combinations (1d1 + modifier) and merge them
    const processedBreakdown = [];
    for (let i = 0; i < roll.breakdown.length; i++) {
      const item = roll.breakdown[i];
      
      // Check if this is a 1d1 die followed by a modifier from the same source
      if (item.type === 'die' && item.details?.sides === 1 && item.details?.rolls?.length === 1) {
        const nextItem = roll.breakdown[i + 1];
        
        // If the next item is a modifier and they likely belong together (flat number case)
        if (nextItem && nextItem.type === 'modifier') {
          // Merge them into a single flat number display
          processedBreakdown.push({
            ...item,
            value: item.value + nextItem.value, // Total value
            label: item.label, // Keep the die label
            details: {
              ...item.details,
              isFlatNumber: true // Mark as flat number for display
            }
          });
          i++; // Skip the next item since we merged it
          continue;
        }
      }
      
      processedBreakdown.push(item);
    }

    // Process each breakdown item with extreme transparency
    processedBreakdown.forEach((item, index) => {
      if (item.type === 'die') {
        // Handle any multi-dice rolls transparently (advantage/disadvantage or regular multi-dice)
        if (item.details?.rolls && item.details.rolls.length > 1) {
          // Determine advantage/disadvantage from the expression or label
          // Only detect advantage/disadvantage if explicitly labeled OR if we have exactly 2 dice and the total equals max/min (keep operations)
          const hasKeepOperation = item.details?.source && (
            item.details.source.includes('kh1') || 
            item.details.source.includes('kl1') ||
            item.details.source.includes('Kept 1 highest') ||
            item.details.source.includes('Kept 1 lowest')
          );
          
          const isAdvantage = item.label.toLowerCase().includes('advantage') || 
                             (hasKeepOperation && item.details?.rolls && item.details.rolls.length >= 2 && 
                              item.value === Math.max(...item.details.rolls));
          const isDisadvantage = item.label.toLowerCase().includes('disadvantage') || 
                               (hasKeepOperation && item.details?.rolls && item.details.rolls.length >= 2 && 
                                item.value === Math.min(...item.details.rolls));
          
          // For advantage/disadvantage, show which die was kept/dropped
          if (isAdvantage || isDisadvantage) {
            // Show individual dice for advantage/disadvantage with kept/dropped indicators
            item.details.rolls.forEach((dieValue, dieIndex) => {
              const isKept = (isAdvantage && dieValue === Math.max(...item.details!.rolls!)) ||
                           (isDisadvantage && dieValue === Math.min(...item.details!.rolls!));
              
              breakdownItems.push(
                <div key={`${index}-${dieIndex}`} className={`flex items-center justify-between py-1 px-2 rounded ${
                  isKept ? 'bg-blue-700/30 border border-blue-500' : 'bg-gray-700/30'
                }`}>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">
                      {isAdvantage ? 'Advantage' : 'Disadvantage'} <span className="text-blue-300">[d{item.details?.sides || 20}]</span> #{dieIndex + 1}
                      {isKept ? ' (kept)' : ' (dropped)'}
                    </span>
                  </div>
                  <span className={`font-mono text-lg ${
                    isKept ? 'text-white font-bold' : 'text-gray-500 line-through'
                  }`}>
                    {dieValue}
                  </span>
                </div>
              );
            });
          } else {
            // Multiple dice but not advantage/disadvantage
            // Clean up the label
            const cleanLabel = item.label
              .replace(/^.*?:\s*/, '') // Remove prefix like "Sneak_Bonus: "
              .replace(/\s*Dice\s*/i, '') // Remove "Dice" word
              .replace(/_/g, ' ') // Replace underscores with spaces
              .replace(/\b\w/g, c => c.toUpperCase()) // Capitalize each word
              .trim();
            
            item.details.rolls.forEach((dieValue, dieIndex) => {
              // Check if this is a flat number (1d1 case) - display as [value] instead of [d1]
              const isFlatNumber = item.details?.sides === 1;
              const displayType = isFlatNumber ? `[${dieValue}]` : `[d${item.details?.sides || 20}]`;
              const showIndex = !isFlatNumber && item.details.rolls.length > 1;
              
              breakdownItems.push(
                <div key={`${index}-${dieIndex}`} className="flex items-center justify-between py-1 px-2 bg-blue-700/20 rounded">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">
                      {cleanLabel} <span className="text-blue-300">{displayType}</span> {showIndex && `#${dieIndex + 1}`}
                    </span>
                  </div>
                  <span className="font-mono text-white text-lg">{dieValue}</span>
                </div>
              );
            });
          }
        } else {
          // Single die roll  
          // Clean up the label
          const cleanLabel = item.label
            .replace(/^.*?:\s*/, '') // Remove prefix like "Sneak_Bonus: "
            .replace(/\s*Dice\s*/i, '') // Remove "Dice" word
            .replace(/_/g, ' ') // Replace underscores with spaces
            .replace(/\b\w/g, c => c.toUpperCase()) // Capitalize each word
            .trim();
          
          // Check if this is a flat number (merged 1d1 + modifier case) - display as [value] instead of [d1]
          const isFlatNumber = item.details?.isFlatNumber || (item.details?.sides === 1 && item.details?.rolls?.length === 1);
          const displayType = isFlatNumber ? `[${item.value}]` : `[d${item.details?.sides || 20}]`;
          
          breakdownItems.push(
            <div key={index} className="flex items-center justify-between py-1 px-2 bg-blue-700/20 rounded">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400">
                    {cleanLabel} <span className="text-blue-300">{displayType}</span>
                  </span>
                  {item.details?.rerolled && (
                    <span className="text-xs text-yellow-400 bg-yellow-400/20 px-1 rounded">(rerolled)</span>
                  )}
                </div>
                {item.details?.source && (
                  <div className="text-xs text-gray-500 mt-1 ml-8">{item.details.source}</div>
                )}
              </div>
              <span className="font-mono text-white text-lg">{item.value}</span>
            </div>
          );
        }
      } else {
        // Modifier breakdown
        const isPositive = item.value > 0;
        const isNegative = item.value < 0;
        
        breakdownItems.push(
          <div key={index} className={`flex items-center justify-between py-1 px-2 rounded ${
            isPositive ? 'bg-green-700/20' : isNegative ? 'bg-red-700/20' : 'bg-gray-700/20'
          }`}>
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-medium ${
                isPositive ? 'text-green-300' : isNegative ? 'text-red-300' : 'text-gray-300'
              }`}>
                {item.label}:
              </span>
              {item.details?.source && (
                <span className="text-xs text-gray-500">{item.details.source}</span>
              )}
            </div>
            <span className={`font-mono text-lg ${
              isPositive ? 'text-green-300' : isNegative ? 'text-red-300' : 'text-white'
            }`}>
              {isPositive ? '+' : ''}{item.value}
            </span>
          </div>
        );
      }
    });

    return breakdownItems;
  };

  const renderPreviewRoll = (preRoll: PreRollInfo) => {
    const { icon, color } = getIconAndColorForRollType('raw'); // Default type for preview

    return (
      <>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-600">
          <div className="flex items-center space-x-2">
            <div className={color}>{icon}</div>
            <div className="flex flex-col">
              <span className="font-medium text-white text-sm">Roll Preview</span>
              <span className="text-xs text-gray-400 flex items-center">
                <Clock size={12} className="mr-1" />
                Ready to roll
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-300">Expected Range</div>
            <div className="text-lg font-bold text-white">
              {`${preRoll.estimatedRange.min}-${preRoll.estimatedRange.max}`}
            </div>
          </div>
        </div>

        {/* Transparent breakdown for preview */}
        <div className="p-4 space-y-2">
          {renderTransparentPreview(preRoll)}
        </div>

        {/* Show conditions and notes */}
        {preRoll.conditions.length > 0 && (
          <div className="px-4 pb-2">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Active Conditions</h4>
            <div className="flex flex-wrap gap-2">
              {preRoll.conditions.map((condition, index) => (
                <div key={index} className={`text-xs px-2 py-1 rounded ${
                  condition.type === 'advantage' ? 'bg-green-600/20 text-green-300' :
                  condition.type === 'disadvantage' ? 'bg-red-600/20 text-red-300' :
                  'bg-blue-600/20 text-blue-300'
                }`}>
                  {condition.icon && <span className="mr-1">{condition.icon}</span>}
                  {condition.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {preRoll.notes.length > 0 && (
          <div className="px-4 pb-4">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Notes</h4>
            <div className="text-xs text-gray-400 space-y-1">
              {preRoll.notes.map((note, index) => (
                <div key={index}>{note}</div>
              ))}
            </div>
          </div>
        )}
      </>
    );
  };

  const renderExecutedRoll = (roll: RollResult) => {
    const { icon, color } = getIconAndColorForRollType(roll.metadata.type);
    const critStatus = getCriticalStatus(roll);

    return (
      <>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-600">
          <div className="flex items-center space-x-2">
            <div className={color}>{icon}</div>
            <div className="flex flex-col">
              <span className="font-medium text-white text-sm">
                {roll.metadata.definition?.name || 'Roll Result'}
              </span>
              <span className="text-xs text-gray-400 flex items-center">
                {showTimestamp && `${new Date(roll.metadata.timestamp).toLocaleTimeString()}`}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-300">Total</div>
            <div className="text-lg font-bold text-white">{roll.total}</div>
          </div>
        </div>

        {/* Critical Status */}
        {critStatus && (
          <div className={`p-2 text-center border-b border-gray-600 ${critStatus.color} ${critStatus.border}`}>
            <div className="font-bold text-sm">
              {critStatus.text}
            </div>
          </div>
        )}

        {/* Transparent breakdown for executed roll */}
        <div className="p-4 space-y-2">
          {renderTransparentBreakdown(roll)}
        </div>

        {/* Success/Failure against target */}
        {roll.targetNumber && (
          <div className="p-3 bg-gray-700 border-t border-gray-600">
            <div className="text-center">
              <div className="text-xs text-gray-400">vs DC {roll.targetNumber}</div>
              <div className={`font-bold ${roll.success ? 'text-green-400' : 'text-red-400'}`}>
                {roll.success ? '✓ SUCCESS' : '✗ FAILURE'}
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-600 overflow-hidden ${className} ${
      isPreRoll ? 'border-blue-500 shadow-blue-500/20 shadow-lg' : ''
    }`}>
      {isPreRoll && preRollInfo ? renderPreviewRoll(preRollInfo) : renderExecutedRoll(rollResult!)}
    </div>
  );
};

export default UnifiedRollDisplayV2;