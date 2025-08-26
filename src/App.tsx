import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Sword, Shield, User, BookOpen, Sparkles } from 'lucide-react';

// Import new components
import DefensivePanel from './components/Battle/DefensivePanel';
import TurnManager from './components/Battle/TurnManager';
import RollPopup from './components/Rolls/RollPopup';
import CharacterToggle from './components/Character/CharacterToggle';

import CollaborativeJournal from './components/Journal/CollaborativeJournal';

// Import custom hooks
import { useCharacterState } from './hooks/useCharacterState';
import { useDiceRolls } from './hooks/useDiceRolls';

// Import data
import { generateRollActions } from './data/rollActionsGenerator';

const DnDCompanionApp = () => {
  // Use custom hooks for state management
  const {
    currentCharacterId,
    switchCharacter,
    currentHP,
    isHidden,
    initiative,
    turnState,
    useAction,
    useBonusAction,
    resetTurn,
    adjustHP,
    setHP,
    applyDamage,
    applyHealing,
    toggleHidden,
    setHidden,
    setInitiativeRoll,
    character
  } = useCharacterState();

  // Generate roll actions for the character
  const rollActions = useMemo(() => generateRollActions(character), [character]);

  const {
    rollLogs,
    performAttackRoll,
    performStandardRoll,
    performHealingRoll,
    logRoll,
    clearLogs
  } = useDiceRolls();

  // UI state
  const [activeTab, setActiveTab] = useState('battle');
  const [lastAttackResult, setLastAttackResult] = useState(null);
  const [buttonStates, setButtonStates] = useState({});
  
  // Dynamic weapon selection based on character
  const getDefaultWeapon = (character) => {
    const weaponKeys = Object.keys(character.weapons);
    if (character.name === 'Emba') {
      return weaponKeys.includes('eldritchBlast') ? 'eldritchBlast' : weaponKeys[0];
    } else {
      return weaponKeys.includes('rapier') ? 'rapier' : weaponKeys[0];
    }
  };
  
  const [selectedWeapon, setSelectedWeapon] = useState(() => getDefaultWeapon(character));
  
  // Update selected weapon when character changes
  useEffect(() => {
    setSelectedWeapon(getDefaultWeapon(character));
  }, [character.name]);

  // Roll popup state
  const [rollPopup, setRollPopup] = useState({
    isOpen: false,
    searchTerm: '',
    selectedAction: null,
    phase: 'search',
    result: null
  });
  
  const [damageInput, setDamageInput] = useState({
    amount: '',
    selectedDefenses: [],
    finalDamage: 0
  });
  
  // Mobile keyboard detection state
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  
  // UI state for panels and editing
  const [hpEditing, setHpEditing] = useState(false);
  const [hpEditValue, setHpEditValue] = useState('');
  const [defensiveCollapsed, setDefensiveCollapsed] = useState(false);
  const [turnCollapsed, setTurnCollapsed] = useState(false);

  // Mobile keyboard detection
  useEffect(() => {
    const initialHeight = window.innerHeight;
    const threshold = 150;
    
    const handleResize = () => {
      const currentHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      const heightDifference = initialHeight - currentHeight;
      
      setViewportHeight(currentHeight);
      setIsKeyboardOpen(heightDifference > threshold);
    };

    window.addEventListener('resize', handleResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  // HP editing handlers
  const handleHPEditToggle = useCallback((editing, value = '') => {
    setHpEditing(editing);
    if (editing) {
      setHpEditValue(value);
    } else {
      setHpEditValue('');
    }
  }, []);

  // Roll popup handlers
  const openRollPopup = useCallback((searchTerm = '', selectedAction = null) => {
    if (selectedAction && selectedAction.type === 'damage-input') {
      setRollPopup({
        isOpen: true,
        searchTerm: '',
        selectedAction,
        phase: 'damage-input',
        result: null
      });
      setDamageInput({ amount: '', selectedDefenses: [], finalDamage: 0 });
    } else {
      setRollPopup({
        isOpen: true,
        searchTerm,
        selectedAction,
        phase: selectedAction ? 'rolling' : 'search',
        result: null
      });
    }
  }, []);

  const closeRollPopup = useCallback(() => {
    setRollPopup({
      isOpen: false,
      searchTerm: '',
      selectedAction: null,
      phase: 'search',
      result: null
    });
  }, []);

  const handlePhaseChange = useCallback((newPhase) => {
    setRollPopup(prev => ({ ...prev, phase: newPhase }));
  }, []);

  const handleSearchTermChange = useCallback((term) => {
    setRollPopup(prev => ({ ...prev, searchTerm: term }));
  }, []);

  // Action handlers
  const handleActionSelect = useCallback((action) => {
    if (action.type === 'toggle' && action.id === 'hide-toggle') {
      toggleHidden();
      closeRollPopup();
      return;
    }
    
    setRollPopup(prev => ({
      ...prev,
      selectedAction: action,
      phase: 'rolling'
    }));
    
    // Start the rolling sequence
    setTimeout(() => {
      let result;
      
      if (action.type === 'attack') {
        const weaponKey = action.id.includes('rapier') ? 'rapier' : 'shortbow';
        result = performAttackRoll(weaponKey, isHidden);
        useAction();
        setLastAttackResult(result);
        
        if (isHidden) {
          setHidden(false); // Attacking breaks stealth
        }
      } else if (action.type === 'healing') {
        result = performHealingRoll(action, currentHP);
        if (result.healingAmount !== undefined) {
          applyHealing(result.healingAmount, result.healType);
        }
      } else {
        result = performStandardRoll(action);
        
        // Special handling for initiative
        if (action.id === 'initiative') {
          setInitiativeRoll({ roll: result.roll, total: result.total });
        }
        
        // Special handling for stealth
        if (action.id === 'stealth' && result.total >= 15) {
          setHidden(true);
        }
      }
      
      setRollPopup(prev => ({
        ...prev,
        phase: 'result',
        result
      }));
    }, 2000);
  }, [performAttackRoll, performStandardRoll, performHealingRoll, isHidden, currentHP, useAction, setHidden, applyHealing, setInitiativeRoll, toggleHidden, closeRollPopup]);

  const handleAttack = useCallback((weaponKey) => {
    if (turnState.actionUsed) return;
    
    setSelectedWeapon(weaponKey);
    const actionId = `${weaponKey}-attack`;
    const action = rollActions.attacks.find(a => a.id === actionId);
    
    if (action) {
      handleActionSelect(action);
    }
  }, [turnState.actionUsed, handleActionSelect]);

  const handleDamageInputChange = useCallback((newDamageInput) => {
    setDamageInput(newDamageInput);
  }, []);

  const handleApplyDamage = useCallback((damageData) => {
    if (damageData.amount) {
      const finalHP = applyDamage(damageData);
      
      // Log the damage taken
      logRoll({
        type: 'damage',
        name: 'Damage Taken',
        dice: [{
          name: 'Damage',
          dice: [`${damageData.amount} damage`],
          bonus: 0,
          total: damageData.finalDamage
        }],
        details: {
          originalDamage: parseInt(damageData.amount),
          finalDamage: damageData.finalDamage,
          defenses: damageData.selectedDefenses,
          finalHP
        }
      });
      
      closeRollPopup();
    }
  }, [applyDamage, logRoll, closeRollPopup]);

  // Panel handlers
  const handleDefensiveCollapsedToggle = useCallback(() => {
    setDefensiveCollapsed(!defensiveCollapsed);
  }, [defensiveCollapsed]);

  const handleTurnCollapsedToggle = useCallback(() => {
    setTurnCollapsed(!turnCollapsed);
  }, [turnCollapsed]);

  // Bonus action handlers
  const handleBonusActionDash = useCallback(() => {
    if (turnState.bonusActionUsed) return;
    useBonusAction();
  }, [turnState.bonusActionUsed, useBonusAction]);

  const handleDisengage = useCallback(() => {
    if (turnState.bonusActionUsed) return;
    useBonusAction();
  }, [turnState.bonusActionUsed, useBonusAction]);

  const handleUseItem = useCallback(() => {
    if (turnState.bonusActionUsed) return;
    useBonusAction();
  }, [turnState.bonusActionUsed, useBonusAction]);

  // Main Battle Interface
  const BattleInterface = () => (
    <div className="p-4 md:p-6 space-y-6">
      <DefensivePanel
        character={character}
        currentHP={currentHP}
        hpEditing={hpEditing}
        hpEditValue={hpEditValue}
        isHidden={isHidden}
        defensiveCollapsed={defensiveCollapsed}
        onHPEdit={setHpEditValue}
        onHPChange={setHP}
        onHPEditToggle={handleHPEditToggle}
        onDefensiveCollapsedToggle={handleDefensiveCollapsedToggle}
        onHealClick={() => openRollPopup('heal')}
        onDamageClick={() => openRollPopup('', { type: 'damage-input' })}
      />

      <TurnManager
        character={character}
        turnState={turnState}
        isHidden={isHidden}
        turnCollapsed={turnCollapsed}
        buttonStates={buttonStates}
        onTurnCollapsedToggle={handleTurnCollapsedToggle}
        onAttack={handleAttack}
        onToggleHidden={toggleHidden}
        onBonusActionDash={handleBonusActionDash}
        onDisengage={handleDisengage}
        onUseItem={handleUseItem}
        onResetTurn={resetTurn}
        onUseBonusAction={useBonusAction}
      />
    </div>
  );

  // Enhanced Stats Page
  const StatsPage = () => (
    <div className="p-4 md:p-6 space-y-6">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl shadow-xl p-6 border-2 border-blue-600">
        <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
          <Shield className="mr-3 text-blue-400" size={32} />
          Character Stats
        </h2>
        
        {/* Ability Scores */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="text-center p-4 bg-gray-800 rounded-xl border-2 border-gray-600">
            <p className="text-sm text-gray-300 font-semibold">STR</p>
            <p className="text-2xl font-bold text-white">{character.abilityScores.strength} ({character.abilityModifiers.strength >= 0 ? '+' : ''}{character.abilityModifiers.strength})</p>
          </div>
          <div className="text-center p-4 bg-gray-800 rounded-xl border-2 border-green-500">
            <p className="text-sm text-green-400 font-semibold">DEX</p>
            <p className="text-2xl font-bold text-green-400">{character.abilityScores.dexterity} ({character.abilityModifiers.dexterity >= 0 ? '+' : ''}{character.abilityModifiers.dexterity})</p>
          </div>
          <div className="text-center p-4 bg-gray-800 rounded-xl border-2 border-gray-600">
            <p className="text-sm text-gray-300 font-semibold">CON</p>
            <p className="text-2xl font-bold text-white">{character.abilityScores.constitution} ({character.abilityModifiers.constitution >= 0 ? '+' : ''}{character.abilityModifiers.constitution})</p>
          </div>
          <div className="text-center p-4 bg-gray-800 rounded-xl border-2 border-blue-500">
            <p className="text-sm text-blue-400 font-semibold">INT</p>
            <p className="text-2xl font-bold text-blue-400">{character.abilityScores.intelligence} ({character.abilityModifiers.intelligence >= 0 ? '+' : ''}{character.abilityModifiers.intelligence})</p>
          </div>
          <div className="text-center p-4 bg-gray-800 rounded-xl border-2 border-purple-500">
            <p className="text-sm text-purple-400 font-semibold">WIS</p>
            <p className="text-2xl font-bold text-purple-400">{character.abilityScores.wisdom} ({character.abilityModifiers.wisdom >= 0 ? '+' : ''}{character.abilityModifiers.wisdom})</p>
          </div>
          <div className="text-center p-4 bg-gray-800 rounded-xl border-2 border-gray-600">
            <p className="text-sm text-gray-300 font-semibold">CHA</p>
            <p className="text-2xl font-bold text-white">{character.abilityScores.charisma} ({character.abilityModifiers.charisma >= 0 ? '+' : ''}{character.abilityModifiers.charisma})</p>
          </div>
        </div>

        <div className="grid md:grid-cols-1 gap-6">
          {/* Special Features */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-xl border-2 border-gray-600">
            <h3 className="text-xl font-bold mb-4 text-gray-300 flex items-center">
              <Sparkles className="mr-2" size={20} />
              Special Features
            </h3>
            <div className="space-y-4">
              {/* Combat Section */}
              <div>
                <h4 className="text-lg font-semibold text-red-300 mb-3">Combat</h4>
                <div className="space-y-3 text-sm">
                  <div className="bg-gray-700 p-3 rounded-lg border border-red-500">
                    <span className="font-bold text-red-400">⚔️ Sneak Attack:</span>
                    <span className="ml-2 text-white">+{character.sneakAttackDice}d6 damage when conditions met</span>
                  </div>
                  <div className="bg-gray-700 p-3 rounded-lg border border-red-500">
                    <span className="font-bold text-red-400">🏃 Cunning Action:</span>
                    <span className="ml-2 text-white">Hide, Dash, or Disengage as bonus action</span>
                  </div>
                  <div className="bg-gray-700 p-3 rounded-lg border border-red-500">
                    <span className="font-bold text-red-400">🛡️ Uncanny Dodge:</span>
                    <span className="ml-2 text-white">Use reaction to halve damage from one attack per turn</span>
                  </div>
                  <div className="bg-gray-700 p-3 rounded-lg border border-red-500">
                    <span className="font-bold text-red-400">⚡ Skirmisher:</span>
                    <span className="ml-2 text-white">Move after attacking without provoking opportunity attacks</span>
                  </div>
                  <div className="bg-gray-700 p-3 rounded-lg border border-red-500">
                    <span className="font-bold text-red-400">🐍 Poison Spray:</span>
                    <span className="ml-2 text-white">At-will cantrip: Con save or 1d12 poison damage (10 ft range)</span>
                  </div>
                </div>
              </div>

              {/* Story Section */}
              <div>
                <h4 className="text-lg font-semibold text-blue-300 mb-3">Story</h4>
                <div className="space-y-3 text-sm">
                  <div className="bg-gray-700 p-3 rounded-lg border border-blue-500">
                    <span className="font-bold text-blue-400">🐍 Suggestion:</span>
                    <span className="ml-2 text-white">1/long rest: Convince a creature to follow a brief, reasonable command you give them</span>
                  </div>
                  <div className="bg-gray-700 p-3 rounded-lg border border-blue-500">
                    <span className="font-bold text-blue-400">🐴 Animal Friendship:</span>
                    <span className="ml-2 text-white">At-will: Convince a beast to be friendly toward you and your allies instead of attacking</span>
                  </div>
                  <div className="bg-gray-700 p-3 rounded-lg border border-blue-500">
                    <span className="font-bold text-blue-400">👂 Ear to the Ground:</span>
                    <span className="ml-2 text-white">Advantage on Investigation to gather information in settlements</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const StoryPage = () => (
    <div className="p-4 md:p-6">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl shadow-xl p-6 border-2 border-green-600">
        <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
          <User className="mr-3 text-green-400" size={32} />
          Character Story
        </h2>
        <p className="text-gray-300">Story page content - to be implemented</p>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-all duration-1000 ${
      isHidden 
        ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-black'
        : 'bg-gradient-to-br from-gray-800 via-gray-900 to-black'
    }`}>
      
      {/* Enhanced Navigation */}
      <nav className={`shadow-2xl border-b-4 transition-all duration-1000 ${
        isHidden 
          ? 'bg-gray-900 border-purple-600'
          : 'bg-gray-800 border-gray-600'
      }`}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex space-x-8">
              <button
              onClick={() => setActiveTab('battle')}
              className={`flex items-center space-x-3 py-6 px-8 font-bold transition-all duration-300 ${
                activeTab === 'battle'
                  ? isHidden 
                    ? 'text-purple-400 border-b-4 border-purple-400 bg-gray-800'
                    : 'text-blue-400 border-b-4 border-blue-400 bg-gray-700'
                  : isHidden
                    ? 'text-gray-300 hover:text-purple-400 hover:bg-gray-800 rounded-t-lg'
                    : 'text-gray-300 hover:text-blue-400 hover:bg-gray-700 rounded-t-lg'
              }`}
            >
              <Sword size={24} />
              <span className="text-lg">Battle</span>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center space-x-3 py-6 px-8 font-bold transition-all duration-300 ${
                activeTab === 'stats'
                  ? isHidden 
                    ? 'text-purple-400 border-b-4 border-purple-400 bg-gray-800'
                    : 'text-blue-400 border-b-4 border-blue-400 bg-gray-700'
                  : isHidden
                    ? 'text-gray-300 hover:text-purple-400 hover:bg-gray-800 rounded-t-lg'
                    : 'text-gray-300 hover:text-blue-400 hover:bg-gray-700 rounded-t-lg'
              }`}
            >
              <Shield size={24} />
              <span className="text-lg">Stats</span>
            </button>
            <button
              onClick={() => setActiveTab('backstory')}
              className={`flex items-center space-x-3 py-6 px-8 font-bold transition-all duration-300 ${
                activeTab === 'backstory'
                  ? isHidden 
                    ? 'text-purple-400 border-b-4 border-purple-400 bg-gray-800'
                    : 'text-blue-400 border-b-4 border-blue-400 bg-gray-700'
                  : isHidden
                    ? 'text-gray-300 hover:text-purple-400 hover:bg-gray-800 rounded-t-lg'
                    : 'text-gray-300 hover:text-blue-400 hover:bg-gray-700 rounded-t-lg'
              }`}
            >
              <User size={24} />
              <span className="text-lg">Story</span>
            </button>
            <button
              onClick={() => setActiveTab('journal')}
              className={`flex items-center space-x-3 py-6 px-8 font-bold transition-all duration-300 ${
                activeTab === 'journal'
                  ? isHidden 
                    ? 'text-purple-400 border-b-4 border-purple-400 bg-gray-800'
                    : 'text-green-400 border-b-4 border-green-400 bg-gray-700'
                  : isHidden
                    ? 'text-gray-300 hover:text-purple-400 hover:bg-gray-800 rounded-t-lg'
                    : 'text-gray-300 hover:text-green-400 hover:bg-gray-700 rounded-t-lg'
              }`}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
              <span className="text-lg">Journal</span>
            </button>
            </div>
            
            {/* Character Toggle in Navigation */}
            <CharacterToggle
              currentCharacterId={currentCharacterId}
              switchCharacter={switchCharacter}
              currentCharacter={character}
              className="py-2"
            />
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-6xl mx-auto">
        {activeTab === 'battle' && <BattleInterface />}

        {activeTab === 'stats' && <StatsPage />}
        {activeTab === 'backstory' && <StoryPage />}
        {activeTab === 'journal' && <CollaborativeJournal />}
      </div>

      {/* Floating Roll Button */}
      <svg 
        onClick={() => openRollPopup()}
        width="96" 
        height="96" 
        viewBox="0 0 24 24" 
        className={`fixed bottom-6 right-6 cursor-pointer transition-all duration-300 transform hover:scale-110 active:scale-95 ${
          isHidden 
            ? 'drop-shadow-xl drop-shadow-purple-500/50 hover:drop-shadow-purple-500/70'
            : 'drop-shadow-xl drop-shadow-blue-400/40 hover:drop-shadow-blue-400/60'
        }`}
        style={{ zIndex: 40 }}
      >
        <defs>
          <linearGradient id="hexGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isHidden ? '#8b5cf6' : '#3b82f6'} />
            <stop offset="100%" stopColor={isHidden ? '#7c3aed' : '#2563eb'} />
          </linearGradient>
        </defs>
        <path 
          d="M10.75,2.56687 C11.5235,2.12029 12.4765,2.12029 13.25,2.56687 L19.5443,6.20084 C20.3178,6.64743 20.7943,7.47274 20.7943,8.36591 L20.7943,15.6339 C20.7943,16.527 20.3178,17.3523 19.5443,17.7989 L13.25,21.4329 C12.4765,21.8795 11.5235,21.8795 10.75,21.4329 L4.45581,17.7989 C3.68231,17.3523 3.20581,16.527 3.20581,15.6339 L3.20581,8.36591 C3.20581,7.47274 3.68231,6.64743 4.45581,6.20084 L10.75,2.56687 Z" 
          fill="url(#hexGradient)"
        />
        <text 
          x="12" 
          y="12" 
          textAnchor="middle" 
          dominantBaseline="middle"
          className="font-bold fill-white"
          style={{ fontSize: '4.5px' }}
        >
          ROLL
        </text>
      </svg>

      {/* Roll Popup */}
      <RollPopup
        rollActions={rollActions}
        rollPopup={rollPopup}
        isKeyboardOpen={isKeyboardOpen}
        viewportHeight={viewportHeight}
        isHidden={isHidden}
        character={character}
        currentHP={currentHP}
        damageInput={damageInput}
        rollLogs={rollLogs}
        onClose={closeRollPopup}
        onSearchTermChange={handleSearchTermChange}
        onActionSelect={handleActionSelect}
        onDamageInputChange={handleDamageInputChange}
        onApplyDamage={handleApplyDamage}
        onClearHistory={clearLogs}
        onPhaseChange={handlePhaseChange}
      />
    </div>
  );
};

export default DnDCompanionApp;