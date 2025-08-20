import React, { useState } from 'react';
import { Sword, Shield, User, Eye, EyeOff, Dice6, Target, Package } from 'lucide-react';

const DnDCompanionApp = () => {
  // Character state
  const [currentHP, setCurrentHP] = useState(27);
  const [isHidden, setIsHidden] = useState(false);
  const [selectedWeapon, setSelectedWeapon] = useState('rapier');
  const [activeTab, setActiveTab] = useState('battle');
  const [expandedSections, setExpandedSections] = useState({
    attackRoll: false,
    totalDamage: false
  });
  const [turnState, setTurnState] = useState({
    actionUsed: false,
    bonusActionUsed: false,
    movementUsed: 0 // out of 30
  });
  const [initiative, setInitiative] = useState(null);
  const [diceModal, setDiceModal] = useState({
    isOpen: false,
    type: '',
    context: '',
    phase: 'rolling', // 'rolling' -> 'rawResult' -> 'finalResult'
    result: null
  });

  // Character data
  const character = {
    name: "Rogue Scout",
    race: "Yuan-ti",
    class: "Rogue (Scout)",
    level: 5,
    maxHP: 27,
    ac: 15,
    initiative: 3,
    sneakAttackDice: 3,
    weapons: {
      rapier: { name: "Rapier", attack: 6, damage: "1d8+3", type: "piercing" },
      shortbow: { name: "Shortbow", attack: 6, damage: "1d6+3", type: "piercing" }
    },
    backstory: {
      background: "Urban Bounty Hunter",
      description: "Born to the Durge Clan Yuan-ti of the Plates of Fydello. Left to seek fortune in the city of Abriz, joined up as a debt collecting freelancer.",
      traits: "Slow to trust, Cold and detached on the job",
      bonds: "Soft spot for animals",
      flaws: "Sneeze in bright light"
    }
  };

  const rollDice = (sides) => Math.floor(Math.random() * sides) + 1;

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const resetTurn = () => {
    setTurnState({
      actionUsed: false,
      bonusActionUsed: false,
      movementUsed: 0
    });
  };

  const useAction = () => {
    setTurnState(prev => ({ ...prev, actionUsed: true }));
  };

  const useBonusAction = () => {
    setTurnState(prev => ({ ...prev, bonusActionUsed: true }));
  };

  const getWeaponStats = (weaponKey) => {
    const weapon = character.weapons[weaponKey];
    let minDamage, maxDamage;
    
    if (weapon.damage.includes('d8')) {
      minDamage = 1 + 3;
      maxDamage = 8 + 3;
    } else {
      minDamage = 1 + 3;
      maxDamage = 6 + 3;
    }
    
    // Add sneak attack potential when hidden
    if (isHidden) {
      minDamage += character.sneakAttackDice; // minimum sneak attack
      maxDamage += character.sneakAttackDice * 6; // maximum sneak attack
    }
    
    // Hit range is always the same regardless of stealth
    const minHit = 1 + weapon.attack;
    const maxHit = 20 + weapon.attack;
    
    return { minDamage, maxDamage, minHit, maxHit, hasAdvantage: isHidden };
  };

  const rollAttack = () => {
    const weapon = character.weapons[selectedWeapon];
    let attackRoll;
    let advantageRolls = null;
    
    // Roll with advantage if hidden
    if (isHidden) {
      const roll1 = rollDice(20);
      const roll2 = rollDice(20);
      attackRoll = Math.max(roll1, roll2);
      advantageRolls = [roll1, roll2];
    } else {
      attackRoll = rollDice(20);
    }
    
    const totalAttack = attackRoll + weapon.attack;
    const isCritical = attackRoll === 20;
    
    let baseDamageRoll;
    let sneakAttackRolls = [];
    let sneakAttackTotal = 0;
    let totalDamage;
    
    // Roll weapon damage dice
    if (weapon.damage.includes('d8')) {
      baseDamageRoll = rollDice(8) + 3;
      // Double dice on critical hit
      if (isCritical) {
        baseDamageRoll += rollDice(8);
      }
    } else {
      baseDamageRoll = rollDice(6) + 3;
      // Double dice on critical hit
      if (isCritical) {
        baseDamageRoll += rollDice(6);
      }
    }
    
    // Add sneak attack only if hidden (in a real game, also if ally within 5ft of target)
    if (isHidden) {
      for (let i = 0; i < character.sneakAttackDice; i++) {
        const roll = rollDice(6);
        sneakAttackRolls.push(roll);
        sneakAttackTotal += roll;
      }
      
      // Double sneak attack dice on critical hit
      if (isCritical) {
        for (let i = 0; i < character.sneakAttackDice; i++) {
          const roll = rollDice(6);
          sneakAttackRolls.push(roll);
          sneakAttackTotal += roll;
        }
      }
    }
    
    totalDamage = baseDamageRoll + sneakAttackTotal;
    
    return {
      attackRoll,
      advantageRolls,
      totalAttack,
      baseDamageRoll,
      sneakAttackRolls,
      sneakAttackTotal,
      totalDamage,
      weapon: weapon.name,
      weaponDiceSize: weapon.damage.includes('d8') ? 8 : 6,
      isCritical
    };
  };

  const AttackResult = ({ result }) => (
    <div className="bg-gray-800 rounded-lg mt-4 text-white overflow-hidden">
      {/* Attack Roll Section */}
      <button
        onClick={() => toggleSection('attackRoll')}
        className="w-full p-4 text-left hover:bg-gray-700 transition-colors border-b border-gray-600"
      >
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold">Attack Roll</span>
          <span className="text-2xl font-bold text-green-400">{result.totalAttack}</span>
        </div>
      </button>
      
      {expandedSections.attackRoll && (
        <div className="p-4 bg-gray-700 border-b border-gray-600">
          {result.advantageRolls ? (
            <div className="text-sm space-y-1">
              <p className="text-purple-300">Advantage (hidden):</p>
              <p>🎲(20) {result.advantageRolls[0]} and 🎲(20) {result.advantageRolls[1]}</p>
              <p>Taking higher: {result.attackRoll} + {character.weapons[selectedWeapon].attack} (weapon bonus) = <span className="font-bold text-green-400">{result.totalAttack}</span></p>
              {result.isCritical && <p className="text-yellow-400 font-bold">CRITICAL HIT! 🎯</p>}
            </div>
          ) : (
            <div className="text-sm">
              <p>🎲(20) {result.attackRoll} + {character.weapons[selectedWeapon].attack} (weapon bonus) = <span className="font-bold text-green-400">{result.totalAttack}</span></p>
              {result.isCritical && <p className="text-yellow-400 font-bold">CRITICAL HIT! 🎯</p>}
            </div>
          )}
        </div>
      )}

      {/* Total Damage Section */}
      <button
        onClick={() => toggleSection('totalDamage')}
        className="w-full p-4 text-left hover:bg-gray-700 transition-colors"
      >
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold">Total Damage</span>
          <span className="text-2xl font-bold text-red-400">{result.totalDamage}</span>
        </div>
      </button>
      
      {expandedSections.totalDamage && (
        <div className="p-4 bg-gray-700 space-y-2">
          {result.isCritical ? (
            <div className="text-sm">
              <p className="text-yellow-400 font-bold">Critical Hit - Double Dice!</p>
              <p>🎲({result.weaponDiceSize}) + 🎲({result.weaponDiceSize}) + 3 (DEX) = <span className="font-bold text-red-400">{result.baseDamageRoll}</span> base damage</p>
            </div>
          ) : (
            <p className="text-sm">
              🎲({result.weaponDiceSize}) {result.baseDamageRoll - 3} + 3 (DEX) = <span className="font-bold text-red-400">{result.baseDamageRoll}</span> base damage
            </p>
          )}
          
          {result.sneakAttackRolls.length > 0 && (
            <div className="text-sm">
              <p className="text-purple-300">Sneak Attack{result.isCritical ? " (Critical - Double Dice!)" : ""}:</p>
              {result.sneakAttackRolls.map((roll, index) => (
                <p key={index} className="ml-2">🎲(6) {roll}</p>
              ))}
              <p className="ml-2 font-bold text-purple-400">= +{result.sneakAttackTotal} sneak attack damage</p>
            </div>
          )}
          
          <p className="text-lg font-bold pt-2 border-t border-gray-600">
            Total: <span className="text-yellow-400">{result.totalDamage}</span> damage
          </p>
        </div>
      )}
    </div>
  );

  const [lastAttackResult, setLastAttackResult] = useState(null);

  const handleAttack = (weaponKey) => {
    if (turnState.actionUsed) return; // Can't attack if action already used
    
    setSelectedWeapon(weaponKey);
    const weapon = character.weapons[weaponKey];
    performRoll('attack', `Rolling Attack with ${weapon.name}`);
    useAction(); // Mark action as used
  };

  const handleHide = () => {
    if (turnState.bonusActionUsed) return; // Can't hide if bonus action already used
    
    performRoll('stealth', 'Rolling Stealth Check');
    useBonusAction(); // Mark bonus action as used
  };

  const handleBonusActionDash = () => {
    if (turnState.bonusActionUsed) return;
    useBonusAction();
  };

  const handleDisengage = () => {
    if (turnState.bonusActionUsed) return;
    useBonusAction();
  };

  const handleUseItem = () => {
    if (turnState.bonusActionUsed) return;
    useBonusAction();
  };

  const rollInitiative = () => {
    const roll = rollDice(20);
    const total = roll + character.initiative;
    setInitiative({ roll, total });
  };

  const startDiceRoll = (type, context) => {
    setDiceModal({
      isOpen: true,
      type,
      context,
      phase: 'rolling',
      result: null
    });
  };

  const showRawResult = (result) => {
    setDiceModal(prev => ({
      ...prev,
      phase: 'rawResult',
      result
    }));
  };

  const showFinalResult = () => {
    setDiceModal(prev => ({
      ...prev,
      phase: 'finalResult'
    }));
  };

  const closeDiceModal = () => {
    setDiceModal({
      isOpen: false,
      type: '',
      context: '',
      phase: 'rolling',
      result: null
    });
  };

  const performRoll = async (rollType, context) => {
    startDiceRoll(rollType, context);
    
    // Phase 1: Rolling animation (2 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    let result;
    
    switch (rollType) {
      case 'initiative':
        const initRoll = rollDice(20);
        const initTotal = initRoll + character.initiative;
        result = {
          type: 'initiative',
          roll: initRoll,
          modifier: character.initiative,
          total: initTotal,
          dice: '1d20'
        };
        setInitiative({ roll: initRoll, total: initTotal });
        break;
        
      case 'attack':
        const attackResult = rollAttack();
        result = {
          type: 'attack',
          ...attackResult
        };
        setLastAttackResult(attackResult);
        // Reset expanded sections for new attack
        setExpandedSections({
          attackRoll: false,
          totalDamage: false
        });
        if (isHidden) {
          setIsHidden(false); // Attacking breaks stealth
        }
        break;
        
      case 'stealth':
        const stealthRoll = rollDice(20);
        const stealthTotal = stealthRoll + 9; // +9 stealth bonus
        result = {
          type: 'stealth',
          roll: stealthRoll,
          modifier: 9,
          total: stealthTotal,
          dice: '1d20'
        };
        if (stealthTotal >= 15) { // Assuming DC 15 for stealth
          setIsHidden(true);
        }
        break;
    }
    
    // Phase 2: Show raw dice result (1.5 seconds)
    showRawResult(result);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Phase 3: Show final result with modifiers
    showFinalResult();
  };

  const DiceRollModal = () => {
    if (!diceModal.isOpen) return null;
    
    const { type, context, phase, result } = diceModal;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-mx-4 text-center shadow-2xl">
          
          {/* Phase 1: Rolling Animation */}
          {phase === 'rolling' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">{context}</h2>
              <div className="text-6xl animate-bounce">🎲</div>
              <div className="text-4xl font-bold text-gray-600 animate-pulse">
                {Math.floor(Math.random() * 20) + 1}
              </div>
              <p className="text-gray-600">Rolling...</p>
            </div>
          )}
          
          {/* Phase 2: Raw Dice Result */}
          {phase === 'rawResult' && result && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">{context}</h2>
              
              <div className={`text-6xl ${result.roll === 20 ? 'text-yellow-500' : result.roll === 1 ? 'text-red-500' : 'text-blue-500'}`}>
                🎲
              </div>
              
              <div className={`text-6xl font-bold ${
                result.roll === 20 ? 'text-yellow-500' : 
                result.roll === 1 ? 'text-red-500' : 
                'text-blue-600'
              }`}>
                {result.advantageRolls ? (
                  <div className="space-y-2">
                    <div className="text-lg text-purple-600">Advantage!</div>
                    <div className="text-3xl">{result.advantageRolls[0]} & {result.advantageRolls[1]}</div>
                    <div className="text-6xl">{result.roll}</div>
                  </div>
                ) : (
                  result.roll
                )}
              </div>
              
              {/* Special Messages for Raw Roll */}
              {result.roll === 20 && (
                <div className="text-yellow-600 font-bold text-xl animate-pulse">
                  NATURAL 20! ⭐
                </div>
              )}
              {result.roll === 1 && (
                <div className="text-red-600 font-bold text-xl animate-pulse">
                  NATURAL 1! 💥
                </div>
              )}
            </div>
          )}
          
          {/* Phase 3: Final Result with Modifiers */}
          {phase === 'finalResult' && result && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">{context}</h2>
              
              <div className={`text-6xl ${result.roll === 20 ? 'text-yellow-500' : result.roll === 1 ? 'text-red-500' : 'text-green-500'}`}>
                🎲
              </div>
              
              {/* Math Breakdown */}
              <div className="text-2xl text-gray-700">
                {result.advantageRolls && (
                  <div className="text-lg text-purple-600 mb-2">
                    Advantage: {result.advantageRolls[0]} & {result.advantageRolls[1]}
                  </div>
                )}
                <span className="font-bold text-blue-600">{result.roll}</span>
                {result.modifier && result.modifier !== 0 && (
                  <>
                    <span className="mx-2">+</span>
                    <span className="text-gray-600">{result.modifier}</span>
                  </>
                )}
                <span className="mx-2">=</span>
                <span className={`text-3xl font-bold ${
                  result.roll === 20 ? 'text-yellow-500' : 
                  result.roll === 1 ? 'text-red-500' : 
                  'text-green-600'
                }`}>
                  {result.total}
                </span>
              </div>
              
              {/* Special Messages for Final Result */}
              {result.roll === 20 && result.type === 'attack' && (
                <div className="text-yellow-600 font-bold text-xl">
                  CRITICAL HIT! 🎯
                </div>
              )}
              
              <button
                onClick={closeDiceModal}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const BattleInterface = () => (
    <div className="p-6 space-y-6">
      {/* Character Status */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">{character.name}</h2>
          <div className="flex items-center space-x-2">
            {isHidden && (
              <span className="flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold bg-purple-600 text-white">
                <EyeOff size={20} />
                <span>Hidden</span>
              </span>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">HP</p>
            <p className="text-2xl font-bold text-red-600">{currentHP}/{character.maxHP}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">AC</p>
            <p className="text-2xl font-bold text-blue-600">{character.ac}</p>
          </div>
          <div className="text-center">
            {initiative ? (
              <>
                <p className="text-sm text-gray-600">Initiative</p>
                <p className="text-2xl font-bold text-green-600">{initiative.total}</p>
                <p className="text-xs text-gray-500">🎲(20) {initiative.roll} + 3</p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600">Battle</p>
                <button
                  onClick={() => performRoll('initiative', 'Rolling Initiative')}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 rounded-lg text-sm transition-colors"
                >
                  Start Battle
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Economy Interface */}
      <div className="space-y-4">
        {/* Action Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Action (1)</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              turnState.actionUsed 
                ? 'bg-red-100 text-red-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {turnState.actionUsed ? 'Used' : 'Available'}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(character.weapons).map(([key, weapon]) => {
              const stats = getWeaponStats(key);
              return (
                <button
                  key={key}
                  onClick={() => handleAttack(key)}
                  disabled={turnState.actionUsed}
                  className={`p-4 rounded-lg font-semibold transition-colors ${
                    turnState.actionUsed
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  <div className="text-sm">{weapon.name}</div>
                  <div className="text-xs opacity-75">
                    <div>
                      {stats.minHit}-{stats.maxHit} hit
                      {isHidden && <span className="text-red-200"> (advantage)</span>}
                    </div>
                    <div>{stats.minDamage}-{stats.maxDamage} damage</div>
                    {isHidden && <div className="text-red-200">+sneak attack</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bonus Action Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Bonus Action (1)</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              turnState.bonusActionUsed 
                ? 'bg-red-100 text-red-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {turnState.bonusActionUsed ? 'Used' : 'Available'}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleHide}
              disabled={turnState.bonusActionUsed}
              className={`p-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 ${
                turnState.bonusActionUsed
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              <EyeOff size={20} />
              <span>Hide</span>
            </button>
            
            <button
              onClick={handleBonusActionDash}
              disabled={turnState.bonusActionUsed}
              className={`p-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 ${
                turnState.bonusActionUsed
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <span>Dash</span>
            </button>
            
            <button
              onClick={handleDisengage}
              disabled={turnState.bonusActionUsed}
              className={`p-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 ${
                turnState.bonusActionUsed
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700 text-white'
              }`}
            >
              <span>Disengage</span>
            </button>
            
            <button
              onClick={handleUseItem}
              disabled={turnState.bonusActionUsed}
              className={`p-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 ${
                turnState.bonusActionUsed
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              <Package size={20} />
              <span>Use Item</span>
            </button>
          </div>
          
          <div className="mt-3 text-xs text-purple-600 bg-purple-50 p-2 rounded">
            <strong>Cunning Action:</strong> As a rogue, you can Hide, Dash, or Disengage as a bonus action!
          </div>
        </div>

        {/* Movement Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Movement</h3>
            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
              {30 - turnState.movementUsed} ft. remaining
            </span>
          </div>
          
          <div className="space-y-3">
            <div className="bg-gray-100 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                <strong>Speed:</strong> 30 feet per turn
              </p>
              <p className="text-xs text-gray-600 mt-1">
                You can move before, after, or split around your actions
              </p>
            </div>
          </div>
        </div>

        {/* End Turn Button */}
        <div className="text-center space-y-2">
          <button
            onClick={resetTurn}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-xl transition-colors"
          >
            End Turn
          </button>
          {initiative && (
            <button
              onClick={() => {
                setInitiative(null);
                resetTurn();
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg text-sm transition-colors"
            >
              End Combat
            </button>
          )}
        </div>
      </div>

      {/* Attack Result */}
      {lastAttackResult && <AttackResult result={lastAttackResult} />}
    </div>
  );

  const StatsPage = () => (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Character Stats</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">STR</p>
            <p className="text-xl font-bold">10 (+0)</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">DEX</p>
            <p className="text-xl font-bold text-green-600">16 (+3)</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">CON</p>
            <p className="text-xl font-bold">10 (+0)</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">INT</p>
            <p className="text-xl font-bold">14 (+2)</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">WIS</p>
            <p className="text-xl font-bold text-blue-600">17 (+3)</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">CHA</p>
            <p className="text-xl font-bold">9 (-1)</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Key Skills</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p>Stealth: +9</p>
              <p>Insight: +9</p>
              <p>Perception: +6</p>
              <p>Investigation: +5</p>
              <p>Survival: +6</p>
              <p>Sleight of Hand: +6</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Features</h3>
            <div className="text-sm space-y-1">
              <p>• Sneak Attack: +3d6</p>
              <p>• Cunning Action</p>
              <p>• Uncanny Dodge</p>
              <p>• Expertise (Insight, Stealth)</p>
              <p>• Darkvision (60 ft)</p>
              <p>• Magic Resistance</p>
              <p>• Poison Resilience</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const BackstoryPage = () => (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            YT
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{character.name}</h2>
            <p className="text-gray-600">{character.race} {character.class}</p>
            <p className="text-gray-600">{character.backstory.background}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Background</h3>
            <p className="text-gray-700">{character.backstory.description}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">Personality Traits</h4>
              <p className="text-sm text-gray-600">{character.backstory.traits}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">Bonds</h4>
              <p className="text-sm text-gray-600">{character.backstory.bonds}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">Flaws</h4>
              <p className="text-sm text-gray-600">{character.backstory.flaws}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">Appearance</h4>
              <p className="text-sm text-gray-600">Half human, half snake, scales covered by a shawl. 5'7", 160 lbs.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <DiceRollModal />
      
      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-center space-x-8">
            <button
              onClick={() => setActiveTab('battle')}
              className={`flex items-center space-x-2 py-4 px-6 font-semibold transition-colors ${
                activeTab === 'battle'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <Sword size={20} />
              <span>Battle</span>
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center space-x-2 py-4 px-6 font-semibold transition-colors ${
                activeTab === 'stats'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <Shield size={20} />
              <span>Stats</span>
            </button>
            <button
              onClick={() => setActiveTab('backstory')}
              className={`flex items-center space-x-2 py-4 px-6 font-semibold transition-colors ${
                activeTab === 'backstory'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <User size={20} />
              <span>Backstory</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto">
        {activeTab === 'battle' && <BattleInterface />}
        {activeTab === 'stats' && <StatsPage />}
        {activeTab === 'backstory' && <BackstoryPage />}
      </div>
    </div>
  );
};

export default DnDCompanionApp;