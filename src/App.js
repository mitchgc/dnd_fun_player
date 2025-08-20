import React, { useState, useCallback, useEffect } from 'react';
import { Sword, Shield, User, Eye, EyeOff, Dice6, Target, Package, Heart, Sparkles } from 'lucide-react';

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
  const [lastAttackResult, setLastAttackResult] = useState(null);

  // Character data - Enhanced for better gameplay
  const character = {
    name: "Rogue Scout",
    race: "Yuan-ti",
    class: "Rogue (Scout)",
    level: 5,
    maxHP: 27,
    ac: 15,
    initiative: 3,
    sneakAttackDice: 3,
    proficiencyBonus: 3,
    weapons: {
      rapier: { 
        name: "Rapier", 
        attack: 6, 
        damage: "1d8+3", 
        type: "piercing",
        properties: "finesse",
        description: "A sleek blade perfect for precise strikes"
      },
      shortbow: { 
        name: "Shortbow", 
        attack: 6, 
        damage: "1d6+3", 
        type: "piercing",
        properties: "ammunition, two-handed",
        range: "80/320",
        description: "Quick ranged attacks from the shadows"
      }
    },
    skills: {
      stealth: 9,
      insight: 9,
      perception: 6,
      investigation: 5,
      survival: 6,
      sleightOfHand: 6
    },
    backstory: {
      background: "Urban Bounty Hunter",
      description: "Born to the Durge Clan Yuan-ti of the Plates of Fydello. Left to seek fortune in the city of Abriz, joined up as a debt collecting freelancer.",
      traits: "Slow to trust, Cold and detached on the job",
      bonds: "Soft spot for animals",
      flaws: "Sneeze in bright light",
      appearance: "Half human, half snake, scales covered by a shawl. 5'7\", 160 lbs."
    }
  };

  // Utility functions
  const rollDice = useCallback((sides) => Math.floor(Math.random() * sides) + 1, []);

  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const resetTurn = useCallback(() => {
    setTurnState({
      actionUsed: false,
      bonusActionUsed: false,
      movementUsed: 0
    });
  }, []);

  const useAction = useCallback(() => {
    setTurnState(prev => ({ ...prev, actionUsed: true }));
  }, []);

  const useBonusAction = useCallback(() => {
    setTurnState(prev => ({ ...prev, bonusActionUsed: true }));
  }, []);

  // Enhanced weapon stats calculation
  const getWeaponStats = useCallback((weaponKey) => {
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
    
    // Hit range calculation
    const minHit = 1 + weapon.attack;
    const maxHit = 20 + weapon.attack;
    
    return { minDamage, maxDamage, minHit, maxHit, hasAdvantage: isHidden };
  }, [isHidden, character.sneakAttackDice, character.weapons]);

  // Enhanced attack rolling with better critical hit handling
  const rollAttack = useCallback(() => {
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
    
    // Add sneak attack only if hidden (simplified for single-player)
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
  }, [selectedWeapon, isHidden, character.weapons, character.sneakAttackDice, rollDice]);

  // Enhanced Attack Result Component with better animations
  const AttackResult = ({ result }) => (
    <div className="bg-gray-900 rounded-2xl mt-6 text-white overflow-hidden shadow-2xl border-2 border-gray-700">
      {/* Attack Roll Section */}
      <button
        onClick={() => toggleSection('attackRoll')}
        className="w-full p-6 text-left hover:bg-gray-800 transition-all duration-300 border-b border-gray-600"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Target className="text-blue-400" size={24} />
            <span className="text-xl font-bold">Attack Roll</span>
          </div>
          <div className="flex items-center space-x-2">
            {result.isCritical && <Sparkles className="text-yellow-400 animate-pulse" size={20} />}
            <span className={`text-3xl font-bold ${result.isCritical ? 'text-yellow-400' : 'text-green-400'}`}>
              {result.totalAttack}
            </span>
          </div>
        </div>
      </button>
      
      {expandedSections.attackRoll && (
        <div className="p-6 bg-gray-800 border-b border-gray-600 animate-fadeIn">
          {result.advantageRolls ? (
            <div className="text-sm space-y-2">
              <p className="text-purple-300 font-semibold flex items-center">
                <Eye size={16} className="mr-2" />
                Advantage (hidden):
              </p>
              <p className="bg-gray-700 p-3 rounded-lg">
                🎲(20) <span className="font-bold">{result.advantageRolls[0]}</span> and 🎲(20) <span className="font-bold">{result.advantageRolls[1]}</span>
              </p>
              <p>Taking higher: <span className="font-bold text-blue-300">{result.attackRoll}</span> + {character.weapons[selectedWeapon].attack} (weapon bonus) = <span className="font-bold text-green-400">{result.totalAttack}</span></p>
              {result.isCritical && (
                <p className="text-yellow-400 font-bold text-lg animate-pulse flex items-center">
                  <Sparkles size={20} className="mr-2" />
                  CRITICAL HIT! 🎯
                </p>
              )}
            </div>
          ) : (
            <div className="text-sm space-y-2">
              <p className="bg-gray-700 p-3 rounded-lg">
                🎲(20) <span className="font-bold text-blue-300">{result.attackRoll}</span> + {character.weapons[selectedWeapon].attack} (weapon bonus) = <span className="font-bold text-green-400">{result.totalAttack}</span>
              </p>
              {result.isCritical && (
                <p className="text-yellow-400 font-bold text-lg animate-pulse flex items-center">
                  <Sparkles size={20} className="mr-2" />
                  CRITICAL HIT! 🎯
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Total Damage Section */}
      <button
        onClick={() => toggleSection('totalDamage')}
        className="w-full p-6 text-left hover:bg-gray-800 transition-all duration-300"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Sword className="text-red-400" size={24} />
            <span className="text-xl font-bold">Total Damage</span>
          </div>
          <span className="text-3xl font-bold text-red-400">{result.totalDamage}</span>
        </div>
      </button>
      
      {expandedSections.totalDamage && (
        <div className="p-6 bg-gray-800 space-y-3 animate-fadeIn">
          {result.isCritical ? (
            <div className="text-sm">
              <p className="text-yellow-400 font-bold mb-2 flex items-center">
                <Sparkles size={16} className="mr-2" />
                Critical Hit - Double Dice!
              </p>
              <p className="bg-gray-700 p-3 rounded-lg">
                🎲({result.weaponDiceSize}) + 🎲({result.weaponDiceSize}) + 3 (DEX) = <span className="font-bold text-red-400">{result.baseDamageRoll}</span> base damage
              </p>
            </div>
          ) : (
            <p className="text-sm bg-gray-700 p-3 rounded-lg">
              🎲({result.weaponDiceSize}) {result.baseDamageRoll - 3} + 3 (DEX) = <span className="font-bold text-red-400">{result.baseDamageRoll}</span> base damage
            </p>
          )}
          
          {result.sneakAttackRolls.length > 0 && (
            <div className="text-sm">
              <p className="text-purple-300 font-semibold mb-2 flex items-center">
                <EyeOff size={16} className="mr-2" />
                Sneak Attack{result.isCritical ? " (Critical - Double Dice!)" : ""}:
              </p>
              <div className="bg-gray-700 p-3 rounded-lg space-y-1">
                {result.sneakAttackRolls.map((roll, index) => (
                  <p key={index} className="ml-2">🎲(6) <span className="font-bold">{roll}</span></p>
                ))}
                <p className="ml-2 font-bold text-purple-400 border-t border-gray-600 pt-2 mt-2">
                  = +{result.sneakAttackTotal} sneak attack damage
                </p>
              </div>
            </div>
          )}
          
          <div className="text-xl font-bold pt-3 border-t border-gray-600 flex items-center justify-between">
            <span>Total Damage:</span>
            <span className="text-yellow-400 text-2xl">{result.totalDamage}</span>
          </div>
        </div>
      )}
    </div>
  );

  // Action handlers
  const handleAttack = useCallback((weaponKey) => {
    if (turnState.actionUsed) return;
    
    setSelectedWeapon(weaponKey);
    const weapon = character.weapons[weaponKey];
    performRoll('attack', `Rolling Attack with ${weapon.name}`);
    useAction();
  }, [turnState.actionUsed, character.weapons]);

  const handleHide = useCallback(() => {
    if (turnState.bonusActionUsed) return;
    
    performRoll('stealth', 'Rolling Stealth Check');
    useBonusAction();
  }, [turnState.bonusActionUsed]);

  const handleBonusActionDash = useCallback(() => {
    if (turnState.bonusActionUsed) return;
    useBonusAction();
  }, [turnState.bonusActionUsed]);

  const handleDisengage = useCallback(() => {
    if (turnState.bonusActionUsed) return;
    useBonusAction();
  }, [turnState.bonusActionUsed]);

  const handleUseItem = useCallback(() => {
    if (turnState.bonusActionUsed) return;
    useBonusAction();
  }, [turnState.bonusActionUsed]);

  // Dice rolling system
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
        const stealthTotal = stealthRoll + character.skills.stealth;
        result = {
          type: 'stealth',
          roll: stealthRoll,
          modifier: character.skills.stealth,
          total: stealthTotal,
          dice: '1d20'
        };
        if (stealthTotal >= 15) {
          setIsHidden(true);
        }
        break;
      
      default:
        break;
    }
    
    // Phase 2: Show raw dice result (1.5 seconds)
    showRawResult(result);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Phase 3: Show final result with modifiers
    showFinalResult();
  };

  // Enhanced Dice Roll Modal with better animations
  const DiceRollModal = () => {
    if (!diceModal.isOpen) return null;
    
    const { type, context, phase, result } = diceModal;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl transform transition-all">
          
          {/* Phase 1: Rolling Animation */}
          {phase === 'rolling' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">{context}</h2>
              <div className="text-8xl animate-bounce">🎲</div>
              <div className="text-5xl font-bold text-gray-600 animate-pulse">
                {Math.floor(Math.random() * 20) + 1}
              </div>
              <p className="text-gray-600 text-lg">Rolling...</p>
              <div className="flex justify-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          )}
          
          {/* Phase 2: Raw Dice Result */}
          {phase === 'rawResult' && result && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">{context}</h2>
              
              <div className={`text-8xl transform transition-all duration-500 ${result.roll === 20 ? 'text-yellow-500 animate-pulse' : result.roll === 1 ? 'text-red-500' : 'text-blue-500'}`}>
                🎲
              </div>
              
              <div className={`text-6xl font-bold transition-all duration-300 ${
                result.roll === 20 ? 'text-yellow-500' : 
                result.roll === 1 ? 'text-red-500' : 
                'text-blue-600'
              }`}>
                {result.advantageRolls ? (
                  <div className="space-y-3">
                    <div className="text-lg text-purple-600 font-semibold">Advantage!</div>
                    <div className="text-3xl">{result.advantageRolls[0]} & {result.advantageRolls[1]}</div>
                    <div className="text-6xl">{result.roll}</div>
                  </div>
                ) : (
                  result.roll
                )}
              </div>
              
              {/* Special Messages for Raw Roll */}
              {result.roll === 20 && (
                <div className="text-yellow-600 font-bold text-2xl animate-pulse flex items-center justify-center">
                  <Sparkles size={24} className="mr-2" />
                  NATURAL 20! ⭐
                </div>
              )}
              {result.roll === 1 && (
                <div className="text-red-600 font-bold text-2xl animate-pulse">
                  NATURAL 1! 💥
                </div>
              )}
            </div>
          )}
          
          {/* Phase 3: Final Result with Modifiers */}
          {phase === 'finalResult' && result && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">{context}</h2>
              
              <div className={`text-8xl ${result.roll === 20 ? 'text-yellow-500' : result.roll === 1 ? 'text-red-500' : 'text-green-500'}`}>
                🎲
              </div>
              
              {/* Math Breakdown */}
              <div className="text-2xl text-gray-700 bg-gray-50 p-4 rounded-2xl">
                {result.advantageRolls && (
                  <div className="text-lg text-purple-600 mb-3 font-semibold">
                    Advantage: {result.advantageRolls[0]} & {result.advantageRolls[1]}
                  </div>
                )}
                <div className="flex items-center justify-center space-x-2">
                  <span className="font-bold text-blue-600 text-3xl">{result.roll}</span>
                  {result.modifier && result.modifier !== 0 && (
                    <>
                      <span className="text-2xl">+</span>
                      <span className="text-gray-600 text-2xl">{result.modifier}</span>
                    </>
                  )}
                  <span className="text-2xl">=</span>
                  <span className={`text-4xl font-bold ${
                    result.roll === 20 ? 'text-yellow-500' : 
                    result.roll === 1 ? 'text-red-500' : 
                    'text-green-600'
                  }`}>
                    {result.total}
                  </span>
                </div>
              </div>
              
              {/* Special Messages for Final Result */}
              {result.roll === 20 && result.type === 'attack' && (
                <div className="text-yellow-600 font-bold text-xl flex items-center justify-center">
                  <Sparkles size={24} className="mr-2" />
                  CRITICAL HIT! 🎯
                </div>
              )}
              
              {result.type === 'stealth' && result.total >= 15 && (
                <div className="text-purple-600 font-bold text-xl flex items-center justify-center">
                  <EyeOff size={24} className="mr-2" />
                  Successfully Hidden! 👤
                </div>
              )}
              
              <button
                onClick={closeDiceModal}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Continue Adventure
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Enhanced HP management
  const adjustHP = (amount) => {
    setCurrentHP(prev => Math.max(0, Math.min(character.maxHP, prev + amount)));
  };

  // Main Battle Interface
  const BattleInterface = () => (
    <div className="p-4 md:p-6 space-y-6">
      {/* Character Status Card */}
      <div className="bg-gradient-to-r from-white to-blue-50 rounded-2xl shadow-xl p-6 border-2 border-blue-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 flex items-center">
              {character.name}
              <Sparkles className="ml-2 text-yellow-500" size={24} />
            </h2>
            <p className="text-gray-600 font-medium">{character.race} {character.class}</p>
          </div>
          <div className="flex items-center space-x-3">
            {isHidden && (
              <span className="flex items-center space-x-2 px-4 py-2 rounded-xl font-bold bg-purple-600 text-white shadow-lg animate-pulse">
                <EyeOff size={20} />
                <span>Hidden</span>
              </span>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center bg-red-50 p-4 rounded-xl border-2 border-red-200">
            <div className="flex items-center justify-center mb-2">
              <Heart className="text-red-500" size={20} />
              <p className="text-sm text-red-600 ml-2 font-semibold">HEALTH</p>
            </div>
            <p className="text-3xl font-bold text-red-600">{currentHP}/{character.maxHP}</p>
            <div className="flex justify-center space-x-2 mt-3">
              <button 
                onClick={() => adjustHP(-1)}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-lg text-sm transition-colors"
              >
                -1
              </button>
              <button 
                onClick={() => adjustHP(1)}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-lg text-sm transition-colors"
              >
                +1
              </button>
            </div>
          </div>
          <div className="text-center bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
            <div className="flex items-center justify-center mb-2">
              <Shield className="text-blue-500" size={20} />
              <p className="text-sm text-blue-600 ml-2 font-semibold">ARMOR</p>
            </div>
            <p className="text-3xl font-bold text-blue-600">{character.ac}</p>
            <p className="text-xs text-blue-500 mt-1">Armor Class</p>
          </div>
          <div className="text-center bg-green-50 p-4 rounded-xl border-2 border-green-200">
            {initiative ? (
              <>
                <div className="flex items-center justify-center mb-2">
                  <Dice6 className="text-green-500" size={20} />
                  <p className="text-sm text-green-600 ml-2 font-semibold">INITIATIVE</p>
                </div>
                <p className="text-3xl font-bold text-green-600">{initiative.total}</p>
                <p className="text-xs text-green-500">🎲(20) {initiative.roll} + 3</p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 font-semibold mb-2">READY?</p>
                <button
                  onClick={() => performRoll('initiative', 'Rolling Initiative')}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  🎲 Start Battle
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Economy Interface */}
      <div className="space-y-4">
        {/* Action Section */}
        <div className="bg-gradient-to-r from-white to-red-50 rounded-2xl shadow-xl p-6 border-2 border-red-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <Sword className="mr-3 text-red-500" size={24} />
              Action (1)
            </h3>
            <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-md ${
              turnState.actionUsed 
                ? 'bg-red-500 text-white' 
                : 'bg-green-500 text-white animate-pulse'
            }`}>
              {turnState.actionUsed ? 'Used ❌' : 'Available ✅'}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(character.weapons).map(([key, weapon]) => {
              const stats = getWeaponStats(key);
              return (
                <button
                  key={key}
                  onClick={() => handleAttack(key)}
                  disabled={turnState.actionUsed}
                  className={`p-6 rounded-xl font-semibold transition-all duration-300 transform ${
                    turnState.actionUsed
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:scale-105'
                  }`}
                >
                  <div className="text-lg font-bold">{weapon.name}</div>
                  <div className="text-sm opacity-90 mt-2 space-y-1">
                    <div>
                      🎯 {stats.minHit}-{stats.maxHit} to hit
                      {isHidden && <span className="text-red-200 ml-1">(advantage!)</span>}
                    </div>
                    <div>⚔️ {stats.minDamage}-{stats.maxDamage} damage</div>
                    {isHidden && <div className="text-red-200 font-bold">💀 +sneak attack!</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bonus Action Section */}
        <div className="bg-gradient-to-r from-white to-purple-50 rounded-2xl shadow-xl p-6 border-2 border-purple-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <Sparkles className="mr-3 text-purple-500" size={24} />
              Bonus Action (1)
            </h3>
            <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-md ${
              turnState.bonusActionUsed 
                ? 'bg-red-500 text-white' 
                : 'bg-green-500 text-white animate-pulse'
            }`}>
              {turnState.bonusActionUsed ? 'Used ❌' : 'Available ✅'}
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={handleHide}
              disabled={turnState.bonusActionUsed}
              className={`p-4 rounded-xl font-semibold transition-all duration-300 flex flex-col items-center justify-center space-y-2 ${
                turnState.bonusActionUsed
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:scale-105'
              }`}
            >
              <EyeOff size={24} />
              <span className="text-sm">Hide</span>
            </button>
            
            <button
              onClick={handleBonusActionDash}
              disabled={turnState.bonusActionUsed}
              className={`p-4 rounded-xl font-semibold transition-all duration-300 flex flex-col items-center justify-center space-y-2 ${
                turnState.bonusActionUsed
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:scale-105'
              }`}
            >
              <span className="text-2xl">💨</span>
              <span className="text-sm">Dash</span>
            </button>
            
            <button
              onClick={handleDisengage}
              disabled={turnState.bonusActionUsed}
              className={`p-4 rounded-xl font-semibold transition-all duration-300 flex flex-col items-center justify-center space-y-2 ${
                turnState.bonusActionUsed
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-lg hover:scale-105'
              }`}
            >
              <span className="text-2xl">🏃</span>
              <span className="text-sm">Disengage</span>
            </button>
            
            <button
              onClick={handleUseItem}
              disabled={turnState.bonusActionUsed}
              className={`p-4 rounded-xl font-semibold transition-all duration-300 flex flex-col items-center justify-center space-y-2 ${
                turnState.bonusActionUsed
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:scale-105'
              }`}
            >
              <Package size={24} />
              <span className="text-sm">Use Item</span>
            </button>
          </div>
          
          <div className="mt-4 text-sm text-purple-700 bg-purple-100 p-4 rounded-xl border border-purple-200">
            <strong>🗡️ Cunning Action:</strong> As a rogue, you can Hide, Dash, or Disengage as a bonus action!
          </div>
        </div>

        {/* Movement Section */}
        <div className="bg-gradient-to-r from-white to-yellow-50 rounded-2xl shadow-xl p-6 border-2 border-yellow-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">🏃‍♂️ Movement</h3>
            <span className="px-4 py-2 rounded-xl text-sm font-bold bg-yellow-500 text-white shadow-md">
              {30 - turnState.movementUsed} ft. remaining
            </span>
          </div>
          
          <div className="bg-yellow-100 rounded-xl p-4 border border-yellow-200">
            <p className="text-sm text-yellow-800 font-semibold">
              <strong>Speed:</strong> 30 feet per turn
            </p>
            <p className="text-xs text-yellow-700 mt-2">
              💡 You can move before, after, or split around your actions
            </p>
          </div>
        </div>

        {/* End Turn Controls */}
        <div className="text-center space-y-3">
          <button
            onClick={resetTurn}
            className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            🔄 End Turn
          </button>
          {initiative && (
            <button
              onClick={() => {
                setInitiative(null);
                resetTurn();
              }}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 px-6 rounded-xl text-sm transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              🏁 End Combat
            </button>
          )}
        </div>
      </div>

      {/* Attack Result Display */}
      {lastAttackResult && <AttackResult result={lastAttackResult} />}
    </div>
  );

  // Enhanced Stats Page
  const StatsPage = () => (
    <div className="p-4 md:p-6 space-y-6">
      <div className="bg-gradient-to-r from-white to-blue-50 rounded-2xl shadow-xl p-6 border-2 border-blue-100">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
          <Shield className="mr-3 text-blue-500" size={32} />
          Character Stats
        </h2>
        
        {/* Ability Scores */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="text-center p-4 bg-gray-100 rounded-xl border-2 border-gray-200">
            <p className="text-sm text-gray-600 font-semibold">STR</p>
            <p className="text-2xl font-bold">10 (+0)</p>
          </div>
          <div className="text-center p-4 bg-green-100 rounded-xl border-2 border-green-200">
            <p className="text-sm text-green-600 font-semibold">DEX</p>
            <p className="text-2xl font-bold text-green-600">16 (+3)</p>
          </div>
          <div className="text-center p-4 bg-gray-100 rounded-xl border-2 border-gray-200">
            <p className="text-sm text-gray-600 font-semibold">CON</p>
            <p className="text-2xl font-bold">10 (+0)</p>
          </div>
          <div className="text-center p-4 bg-blue-100 rounded-xl border-2 border-blue-200">
            <p className="text-sm text-blue-600 font-semibold">INT</p>
            <p className="text-2xl font-bold text-blue-600">14 (+2)</p>
          </div>
          <div className="text-center p-4 bg-purple-100 rounded-xl border-2 border-purple-200">
            <p className="text-sm text-purple-600 font-semibold">WIS</p>
            <p className="text-2xl font-bold text-purple-600">17 (+3)</p>
          </div>
          <div className="text-center p-4 bg-gray-100 rounded-xl border-2 border-gray-200">
            <p className="text-sm text-gray-600 font-semibold">CHA</p>
            <p className="text-2xl font-bold">9 (-1)</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Skills */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border-2 border-purple-200">
            <h3 className="text-xl font-bold mb-4 text-purple-800 flex items-center">
              <Eye className="mr-2" size={20} />
              Key Skills
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex justify-between items-center bg-purple-200 p-3 rounded-lg">
                <span className="font-semibold">🥷 Stealth</span>
                <span className="font-bold text-purple-700">+{character.skills.stealth}</span>
              </div>
              <div className="flex justify-between items-center bg-purple-200 p-3 rounded-lg">
                <span className="font-semibold">👁️ Insight</span>
                <span className="font-bold text-purple-700">+{character.skills.insight}</span>
              </div>
              <div className="flex justify-between items-center bg-purple-200 p-3 rounded-lg">
                <span className="font-semibold">🔍 Perception</span>
                <span className="font-bold text-purple-700">+{character.skills.perception}</span>
              </div>
              <div className="flex justify-between items-center bg-purple-200 p-3 rounded-lg">
                <span className="font-semibold">🕵️ Investigation</span>
                <span className="font-bold text-purple-700">+{character.skills.investigation}</span>
              </div>
            </div>
          </div>
          
          {/* Features */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border-2 border-red-200">
            <h3 className="text-xl font-bold mb-4 text-red-800 flex items-center">
              <Sparkles className="mr-2" size={20} />
              Special Features
            </h3>
            <div className="space-y-3 text-sm">
              <div className="bg-red-200 p-3 rounded-lg">
                <span className="font-bold text-red-800">⚔️ Sneak Attack:</span>
                <span className="ml-2">+{character.sneakAttackDice}d6 damage</span>
              </div>
              <div className="bg-red-200 p-3 rounded-lg">
                <span className="font-bold text-red-800">🏃 Cunning Action:</span>
                <span className="ml-2">Hide, Dash, Disengage as bonus action</span>
              </div>
              <div className="bg-red-200 p-3 rounded-lg">
                <span className="font-bold text-red-800">🛡️ Uncanny Dodge:</span>
                <span className="ml-2">Halve damage from one attack per turn</span>
              </div>
              <div className="bg-red-200 p-3 rounded-lg">
                <span className="font-bold text-red-800">👁️ Darkvision:</span>
                <span className="ml-2">See in darkness up to 60 feet</span>
              </div>
              <div className="bg-red-200 p-3 rounded-lg">
                <span className="font-bold text-red-800">🧙‍♂️ Magic Resistance:</span>
                <span className="ml-2">Advantage on magic saving throws</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Enhanced Backstory Page
  const BackstoryPage = () => (
    <div className="p-4 md:p-6 space-y-6">
      <div className="bg-gradient-to-r from-white to-green-50 rounded-2xl shadow-xl p-6 border-2 border-green-100">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 mb-8">
          <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-2xl">
            🐍
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-4xl font-bold text-gray-800 flex items-center justify-center md:justify-start">
              {character.name}
              <Sparkles className="ml-3 text-yellow-500" size={28} />
            </h2>
            <p className="text-xl text-gray-600 font-semibold mt-2">{character.race} {character.class}</p>
            <p className="text-lg text-gray-600 italic mt-1">{character.backstory.background}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border-2 border-green-200">
            <h3 className="text-2xl font-bold text-green-800 mb-4 flex items-center">
              📜 Background Story
            </h3>
            <p className="text-gray-700 leading-relaxed text-lg">{character.backstory.description}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border-2 border-blue-200">
              <h4 className="font-bold text-blue-800 mb-3 text-xl flex items-center">
                🎭 Personality Traits
              </h4>
              <p className="text-gray-700 leading-relaxed">{character.backstory.traits}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border-2 border-purple-200">
              <h4 className="font-bold text-purple-800 mb-3 text-xl flex items-center">
                💖 Bonds
              </h4>
              <p className="text-gray-700 leading-relaxed">{character.backstory.bonds}</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border-2 border-red-200">
              <h4 className="font-bold text-red-800 mb-3 text-xl flex items-center">
                😅 Flaws
              </h4>
              <p className="text-gray-700 leading-relaxed">{character.backstory.flaws}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl border-2 border-yellow-200">
              <h4 className="font-bold text-yellow-800 mb-3 text-xl flex items-center">
                👤 Appearance
              </h4>
              <p className="text-gray-700 leading-relaxed">{character.backstory.appearance}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Add keyboard shortcuts for iPad
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === ' ' && !turnState.actionUsed && activeTab === 'battle') {
        e.preventDefault();
        handleAttack(selectedWeapon);
      }
      if (e.key === 'h' && !turnState.bonusActionUsed && activeTab === 'battle') {
        e.preventDefault();
        handleHide();
      }
      if (e.key === 'r' && activeTab === 'battle') {
        e.preventDefault();
        resetTurn();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [turnState, selectedWeapon, activeTab, handleAttack, handleHide, resetTurn]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <DiceRollModal />
      
      {/* Enhanced Navigation */}
      <nav className="bg-white shadow-2xl border-b-4 border-blue-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-center space-x-8">
            <button
              onClick={() => setActiveTab('battle')}
              className={`flex items-center space-x-3 py-6 px-8 font-bold transition-all duration-300 transform hover:scale-105 ${
                activeTab === 'battle'
                  ? 'text-blue-600 border-b-4 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-t-lg'
              }`}
            >
              <Sword size={24} />
              <span className="text-lg">Battle</span>
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center space-x-3 py-6 px-8 font-bold transition-all duration-300 transform hover:scale-105 ${
                activeTab === 'stats'
                  ? 'text-blue-600 border-b-4 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-t-lg'
              }`}
            >
              <Shield size={24} />
              <span className="text-lg">Stats</span>
            </button>
            <button
              onClick={() => setActiveTab('backstory')}
              className={`flex items-center space-x-3 py-6 px-8 font-bold transition-all duration-300 transform hover:scale-105 ${
                activeTab === 'backstory'
                  ? 'text-blue-600 border-b-4 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-t-lg'
              }`}
            >
              <User size={24} />
              <span className="text-lg">Story</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Content with improved layout */}
      <div className="max-w-6xl mx-auto">
        {activeTab === 'battle' && <BattleInterface />}
        {activeTab === 'stats' && <StatsPage />}
        {activeTab === 'backstory' && <BackstoryPage />}
      </div>
    </div>
  );
};

export default DnDCompanionApp;