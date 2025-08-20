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
  const [lastAttackResult, setLastAttackResult] = useState(null);
  const [buttonStates, setButtonStates] = useState({}); // For loading states
  const [rollPopup, setRollPopup] = useState({
    isOpen: false,
    searchTerm: '',
    selectedAction: null,
    phase: 'search' // 'search' -> 'rolling' -> 'result' -> 'logs' -> 'damage-input' -> 'healing-input'
  });
  const [rollLogs, setRollLogs] = useState([]);
  const [damageInput, setDamageInput] = useState({
    amount: '',
    selectedDefenses: [],
    finalDamage: 0
  });
  const [healingInput, setHealingInput] = useState({
    customAmount: '',
    selectedHealing: null
  });
  const [hpEditing, setHpEditing] = useState(false);
  const [hpEditValue, setHpEditValue] = useState('');
  const [defensiveCollapsed, setDefensiveCollapsed] = useState(false);
  const [turnCollapsed, setTurnCollapsed] = useState(false);

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
      sleightOfHand: 6,
      nature: 5,
      intimidation: 2
    },
    backstory: {
      background: "Urban Bounty Hunter",
      description: "Born to the Durge Clan Yuan-ti of the Plates of Fydello. Left to seek fortune in the city of Abriz, joined up as a debt collecting freelancer.",
      traits: "Slow to trust, Cold and detached on the job",
      bonds: "Soft spot for animals",
      flaws: "Sneeze in bright light",
      appearance: "Half human, half snake, scales covered by a shawl. 5'7\", 160 lbs."
    },
    defensiveAbilities: {
      'uncanny-dodge': { 
        name: 'Uncanny Dodge', 
        description: 'Halve damage from one attack per turn', 
        icon: '🛡️', 
        usesPerTurn: 1, 
        available: true,
        effect: 'halve'
      },
      'magic-resistance': { 
        name: 'Magic Resistance', 
        description: 'Advantage on saving throws vs magic', 
        icon: '🧙‍♂️', 
        passive: true,
        effect: 'advantage'
      },
      'poison-resistance': { 
        name: 'Poison Resistance', 
        description: 'Halve poison damage', 
        icon: '☠️', 
        passive: true,
        effect: 'resist-poison'
      }
    }
  };

  // Utility functions
  const rollDice = useCallback((sides) => Math.floor(Math.random() * sides) + 1, []);

  // Log roll function
  const logRoll = useCallback((logEntry) => {
    const timestamp = new Date().toLocaleTimeString();
    const entry = { ...logEntry, timestamp, id: Date.now() };
    setRollLogs(prev => [entry, ...prev]); // Add to beginning for newest first
  }, []);

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
    
    const result = {
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

    // Log the attack roll details
    logRoll({
      type: 'attack',
      name: `${weapon.name} Attack`,
      dice: [
        { 
          name: 'Attack Roll', 
          dice: advantageRolls ? [`d20: ${advantageRolls[0]}`, `d20: ${advantageRolls[1]}`] : [`d20: ${attackRoll}`],
          bonus: weapon.attack,
          total: totalAttack,
          advantage: !!advantageRolls
        },
        {
          name: 'Damage Roll',
          dice: [
            `d${weapon.damage.includes('d8') ? 8 : 6}: ${baseDamageRoll - 3}${isCritical ? ' (doubled for crit)' : ''}`
          ].concat(
            sneakAttackRolls.length > 0 ? 
              sneakAttackRolls.map((roll, i) => `d6: ${roll} (sneak attack${i >= character.sneakAttackDice && isCritical ? ' crit' : ''})`) 
              : []
          ),
          bonus: 3, // DEX modifier
          total: totalDamage
        }
      ],
      isCritical,
      details: {
        advantage: !!advantageRolls,
        sneakAttack: sneakAttackRolls.length > 0,
        weapon: weapon.name
      }
    });

    return result;
  }, [selectedWeapon, isHidden, character.weapons, character.sneakAttackDice, rollDice, logRoll]);

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

  // Button loading state helper
  const setButtonLoading = (buttonId, loading) => {
    setButtonStates(prev => ({
      ...prev,
      [buttonId]: loading
    }));
  };

  // Action handlers
  const handleAttack = useCallback((weaponKey) => {
    if (turnState.actionUsed) return;
    
    setSelectedWeapon(weaponKey);
    const weapon = character.weapons[weaponKey];
    const actionId = `${weaponKey}-attack`;
    const action = rollActions.attacks.find(a => a.id === actionId);
    
    if (action) {
      handleActionSelect(action);
    }
  }, [turnState.actionUsed, character.weapons]);

  const handleToggleHidden = useCallback(() => {
    setIsHidden(prev => !prev);
  }, []);

  // Calculate ability modifiers
  const abilityMods = {
    str: 0, // STR 10
    dex: 3, // DEX 16
    con: 0, // CON 10
    int: 2, // INT 14
    wis: 3, // WIS 17
    cha: -1 // CHA 9
  };

  // Roll system data - comprehensive D&D rolls (sorted by modifier descending)
  const rollActions = {
    attacks: [
      { id: 'rapier-attack', name: 'Rapier Attack', modifier: character.weapons.rapier.attack, type: 'attack', weapon: 'rapier' },
      { id: 'shortbow-attack', name: 'Shortbow Attack', modifier: character.weapons.shortbow.attack, type: 'attack', weapon: 'shortbow' }
    ].sort((a, b) => b.modifier - a.modifier),
    skills: [
      { id: 'stealth', name: 'Stealth', modifier: character.skills.stealth, type: 'skill', proficient: true, expertise: true },
      { id: 'insight', name: 'Insight', modifier: character.skills.insight, type: 'skill', proficient: true, expertise: true },
      { id: 'sleight-of-hand', name: 'Sleight of Hand', modifier: character.skills.sleightOfHand, type: 'skill', proficient: true },
      { id: 'perception', name: 'Perception', modifier: character.skills.perception, type: 'skill', proficient: true },
      { id: 'survival', name: 'Survival', modifier: character.skills.survival, type: 'skill', proficient: true },
      { id: 'investigation', name: 'Investigation', modifier: character.skills.investigation, type: 'skill', proficient: true },
      { id: 'acrobatics', name: 'Acrobatics', modifier: abilityMods.dex, type: 'skill' },
      { id: 'animal-handling', name: 'Animal Handling', modifier: abilityMods.wis, type: 'skill' },
      { id: 'medicine', name: 'Medicine', modifier: abilityMods.wis, type: 'skill' },
      { id: 'arcana', name: 'Arcana', modifier: abilityMods.int, type: 'skill' },
      { id: 'history', name: 'History', modifier: abilityMods.int, type: 'skill' },
      { id: 'nature', name: 'Nature', modifier: character.skills.nature, type: 'skill', proficient: true },
      { id: 'religion', name: 'Religion', modifier: abilityMods.int, type: 'skill' },
      { id: 'athletics', name: 'Athletics', modifier: abilityMods.str, type: 'skill' },
      { id: 'deception', name: 'Deception', modifier: abilityMods.cha, type: 'skill' },
      { id: 'intimidation', name: 'Intimidation', modifier: character.skills.intimidation, type: 'skill', proficient: true },
      { id: 'performance', name: 'Performance', modifier: abilityMods.cha, type: 'skill' },
      { id: 'persuasion', name: 'Persuasion', modifier: abilityMods.cha, type: 'skill' }
    ].sort((a, b) => b.modifier - a.modifier),
    abilities: [
      { id: 'wisdom', name: 'Wisdom Check', modifier: abilityMods.wis, type: 'ability' },
      { id: 'dexterity', name: 'Dexterity Check', modifier: abilityMods.dex, type: 'ability' },
      { id: 'intelligence', name: 'Intelligence Check', modifier: abilityMods.int, type: 'ability' },
      { id: 'strength', name: 'Strength Check', modifier: abilityMods.str, type: 'ability' },
      { id: 'constitution', name: 'Constitution Check', modifier: abilityMods.con, type: 'ability' },
      { id: 'charisma', name: 'Charisma Check', modifier: abilityMods.cha, type: 'ability' }
    ].sort((a, b) => b.modifier - a.modifier),
    saves: [
      { id: 'dex-save', name: 'Dexterity Save', modifier: abilityMods.dex + character.proficiencyBonus, type: 'save', proficient: true },
      { id: 'int-save', name: 'Intelligence Save', modifier: abilityMods.int + character.proficiencyBonus, type: 'save', proficient: true },
      { id: 'wis-save', name: 'Wisdom Save', modifier: abilityMods.wis, type: 'save' },
      { id: 'str-save', name: 'Strength Save', modifier: abilityMods.str, type: 'save' },
      { id: 'con-save', name: 'Constitution Save', modifier: abilityMods.con, type: 'save' },
      { id: 'cha-save', name: 'Charisma Save', modifier: abilityMods.cha, type: 'save' }
    ].sort((a, b) => b.modifier - a.modifier),
    combat: [
      { id: 'initiative', name: 'Initiative', modifier: abilityMods.dex, type: 'initiative' },
      { id: 'death-save', name: 'Death Saving Throw', modifier: 0, type: 'death-save' },
      { id: 'concentration', name: 'Concentration Save', modifier: abilityMods.con, type: 'concentration' }
    ].sort((a, b) => b.modifier - a.modifier),
    healing: [
      { id: 'short-rest', name: 'Short Rest Healing (1 hour)', modifier: 0, type: 'healing', healType: 'short-rest', dice: '3d8', description: 'Roll Hit Dice to recover HP' },
      { id: 'long-rest', name: 'Long Rest Healing (8 hours)', modifier: 0, type: 'healing', healType: 'long-rest', description: 'Recover all HP and reset abilities' },
      { id: 'superior-potion', name: 'Superior Healing Potion', modifier: 0, type: 'healing', healType: 'potion', dice: '8d4+8', description: 'Roll 8d4+8 healing' },
      { id: 'basic-potion', name: 'Basic Healing Potion', modifier: 0, type: 'healing', healType: 'potion', dice: '2d4+2', description: 'Roll 2d4+2 healing' },
      { id: 'custom-healing', name: 'Custom Healing', modifier: 0, type: 'healing', healType: 'custom', description: 'Enter custom healing amount' }
    ],
    utility: [
      { id: 'd100', name: 'Percentile (d100)', modifier: 0, type: 'raw', dice: 100 },
      { id: 'd20', name: 'Raw d20', modifier: 0, type: 'raw' },
      { id: 'd12', name: 'Raw d12', modifier: 0, type: 'raw', dice: 12 },
      { id: 'd10', name: 'Raw d10', modifier: 0, type: 'raw', dice: 10 },
      { id: 'd8', name: 'Raw d8', modifier: 0, type: 'raw', dice: 8 },
      { id: 'd6', name: 'Raw d6', modifier: 0, type: 'raw', dice: 6 },
      { id: 'd4', name: 'Raw d4', modifier: 0, type: 'raw', dice: 4 },
      { id: 'hide-toggle', name: 'Hide/Reveal', modifier: 0, type: 'toggle' }
    ]
  };

  // Filter actions based on search term (maintain descending order)
  const getFilteredActions = () => {
    const term = rollPopup.searchTerm.toLowerCase();
    const filtered = {};
    
    Object.keys(rollActions).forEach(category => {
      filtered[category] = rollActions[category]
        .filter(action => action.name.toLowerCase().includes(term))
        .sort((a, b) => b.modifier - a.modifier); // Ensure sorting is maintained after filtering
    });
    
    return filtered;
  };

  // Open roll popup
  const openRollPopup = (searchTerm = '', selectedAction = null) => {
    if (selectedAction && selectedAction.type === 'damage-input') {
      setRollPopup({
        isOpen: true,
        searchTerm: '',
        selectedAction,
        phase: 'damage-input'
      });
      setDamageInput({ amount: '', selectedDefenses: [], finalDamage: 0 });
    } else if (searchTerm === 'heal') {
      setRollPopup({
        isOpen: true,
        searchTerm: 'heal',
        selectedAction: null,
        phase: 'search'
      });
    } else {
      setRollPopup({
        isOpen: true,
        searchTerm,
        selectedAction,
        phase: selectedAction ? 'rolling' : 'search'
      });
    }
  };

  // Close roll popup
  const closeRollPopup = () => {
    setRollPopup({
      isOpen: false,
      searchTerm: '',
      selectedAction: null,
      phase: 'search'
    });
  };

  // Handle action selection from popup
  const handleActionSelect = (action) => {
    if (action.type === 'toggle' && action.id === 'hide-toggle') {
      handleToggleHidden();
      closeRollPopup();
      return;
    }
    
    setRollPopup(prev => ({
      ...prev,
      isOpen: true,
      selectedAction: action,
      phase: 'rolling'
    }));
    
    // Start the rolling sequence
    performPopupRoll(action);
  };

  // Perform roll within popup
  const performPopupRoll = async (action) => {
    try {
      // Rolling phase (2 seconds)
      setTimeout(() => {
        try {
          let result;
          const diceSize = action.dice || 20;
          const roll = rollDice(diceSize);
        
          if (action.type === 'attack') {
            // Handle weapon attacks
            const weaponKey = action.id.includes('rapier') ? 'rapier' : 'shortbow';
            const attackResult = rollAttack();
            result = {
              ...attackResult,
              type: 'attack',
              name: action.name
            };
            
            // Use action if it's an attack
            useAction();
            setLastAttackResult(attackResult);
            setExpandedSections({ attackRoll: false, totalDamage: false });
            
            if (isHidden) {
              setIsHidden(false); // Attacking breaks stealth
            }
          } else if (action.type === 'raw') {
            // Raw dice rolls (no modifiers)
            result = {
              type: action.type,
              name: action.name,
              roll,
              modifier: 0,
              total: roll,
              dice: `1d${diceSize}`
            };

            // Log the raw dice roll
            logRoll({
              type: 'raw',
              name: action.name,
              dice: [{
                name: 'Raw Roll',
                dice: [`d${diceSize}: ${roll}`],
                bonus: 0,
                total: roll
              }],
              details: {
                diceSize,
                critSuccess: roll === diceSize,
                critFail: roll === 1
              }
            });
          } else if (action.type === 'death-save') {
            // Death saves (special handling)
            const total = roll;
            result = {
              type: action.type,
              name: action.name,
              roll,
              modifier: 0,
              total,
              dice: '1d20',
              success: roll >= 10,
              critSuccess: roll === 20,
              critFail: roll === 1
            };

            // Log the death save
            logRoll({
              type: 'death-save',
              name: action.name,
              dice: [{
                name: 'Death Save',
                dice: [`d20: ${roll}`],
                bonus: 0,
                total: roll
              }],
              details: {
                success: roll >= 10,
                critSuccess: roll === 20,
                critFail: roll === 1
              }
            });
          } else if (action.type === 'healing') {
            // Handle healing rolls
            let healingAmount = 0;
            
            if (action.healType === 'long-rest') {
              // Long rest - full heal and reset abilities
              healingAmount = character.maxHP - currentHP;
              result = {
                type: 'healing',
                name: action.name,
                healingAmount,
                healType: 'long-rest',
                description: 'Fully restored HP and reset all abilities'
              };
              
              // Apply healing
              setCurrentHP(character.maxHP);
              
              // Reset turn abilities (if needed)
              // Reset Uncanny Dodge availability
              // This would be handled in a real implementation
              
            } else if (action.healType === 'short-rest') {
              // Short rest - roll hit dice (3d8 for level 5 rogue)
              let hitDiceRolls = [];
              for (let i = 0; i < 3; i++) {
                const roll = rollDice(8);
                hitDiceRolls.push(roll);
                healingAmount += roll;
              }
              
              result = {
                type: 'healing',
                name: action.name,
                healingAmount,
                healType: 'short-rest',
                hitDiceRolls,
                description: `Rolled ${hitDiceRolls.join(', ')} on 3d8`
              };
              
              // Apply healing
              setCurrentHP(prev => Math.min(character.maxHP, prev + healingAmount));
              
            } else if (action.healType === 'potion') {
              // Roll potion dice
              let potionRolls = [];
              
              if (action.id === 'superior-potion') {
                // 8d4+8
                for (let i = 0; i < 8; i++) {
                  const roll = rollDice(4);
                  potionRolls.push(roll);
                  healingAmount += roll;
                }
                healingAmount += 8; // +8 bonus
              } else if (action.id === 'basic-potion') {
                // 2d4+2
                for (let i = 0; i < 2; i++) {
                  const roll = rollDice(4);
                  potionRolls.push(roll);
                  healingAmount += roll;
                }
                healingAmount += 2; // +2 bonus
              }
              
              result = {
                type: 'healing',
                name: action.name,
                healingAmount,
                healType: 'potion',
                potionRolls,
                description: `Rolled ${potionRolls.join(', ')} ${action.id === 'superior-potion' ? '+8' : '+2'}`
              };
              
              // Apply healing
              setCurrentHP(prev => Math.min(character.maxHP, prev + healingAmount));
              
            } else if (action.healType === 'custom') {
              // Custom healing - this will be handled differently
              // For now, just show the custom input
              result = {
                type: 'healing',
                name: action.name,
                healType: 'custom',
                needsInput: true,
                description: 'Enter healing amount'
              };
            }

            // Log the healing
            if (action.healType !== 'custom') {
              logRoll({
                type: 'healing',
                name: action.name,
                dice: [{
                  name: 'Healing',
                  dice: result.hitDiceRolls ? result.hitDiceRolls.map((r, i) => `d8: ${r}`) : 
                        result.potionRolls ? result.potionRolls.map((r, i) => `d4: ${r}`) : 
                        ['Full Rest'],
                  bonus: action.id === 'superior-potion' ? 8 : action.id === 'basic-potion' ? 2 : 0,
                  total: healingAmount
                }],
                details: {
                  healType: action.healType,
                  finalHP: action.healType === 'long-rest' ? character.maxHP : Math.min(character.maxHP, currentHP + healingAmount)
                }
              });
            }
          } else {
            // Handle skill checks, ability checks, saves, etc.
            const total = roll + action.modifier;
            result = {
              type: action.type,
              name: action.name,
              roll,
              modifier: action.modifier,
              total,
              dice: diceSize === 20 ? '1d20' : `1d${diceSize}`,
              proficient: action.proficient,
              expertise: action.expertise
            };

            // Log the skill/ability check details
            logRoll({
              type: action.type,
              name: action.name,
              dice: [{
                name: action.name,
                dice: [`d${diceSize}: ${roll}`],
                bonus: action.modifier,
                total,
                proficient: action.proficient,
                expertise: action.expertise
              }],
              details: {
                proficient: action.proficient,
                expertise: action.expertise,
                diceSize
              }
            });
            
            // Special handling for initiative
            if (action.id === 'initiative') {
              setInitiative({ roll, total });
            }
            
            // Special handling for stealth
            if (action.id === 'stealth' && total >= 15) {
              setIsHidden(true);
            }
          }
          
          // Show result
          setRollPopup(prev => ({
            ...prev,
            phase: 'result',
            result
          }));
        } catch (error) {
          console.error('Error in performPopupRoll:', error);
          // Fallback to close popup on error
          closeRollPopup();
        }
      }, 2000);
    } catch (error) {
      console.error('Error in performPopupRoll setup:', error);
      closeRollPopup();
    }
  };

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



  // Enhanced HP management
  const adjustHP = (amount) => {
    setCurrentHP(prev => Math.max(0, Math.min(character.maxHP, prev + amount)));
  };

  // Standardized Button Component - All buttons use vertical layout with ICON/TITLE/Subtext structure
  const ActionButton = ({ 
    onClick, 
    disabled = false, 
    variant = 'primary', 
    icon,
    title,
    subtitle,
    children, 
    className = '',
    loading = false 
  }) => {
    const baseClasses = "font-semibold transition-all duration-300 rounded-xl border p-4";
    
    const variantClasses = {
      primary: disabled 
        ? 'bg-gray-700 text-gray-400 cursor-not-allowed border-gray-600'
        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:scale-105 border-blue-500',
      secondary: disabled
        ? 'bg-gray-700 text-gray-400 cursor-not-allowed border-gray-600' 
        : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white shadow-lg hover:scale-105 border-gray-500',
      danger: disabled
        ? 'bg-gray-700 text-gray-400 cursor-not-allowed border-gray-600'
        : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:scale-105 border-red-500',
      success: disabled
        ? 'bg-gray-700 text-gray-400 cursor-not-allowed border-gray-600'
        : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:scale-105 border-green-500',
      purple: disabled
        ? 'bg-gray-700 text-gray-400 cursor-not-allowed border-gray-600'
        : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:scale-105 border-purple-500',
      teal: disabled
        ? 'bg-gray-700 text-gray-400 cursor-not-allowed border-gray-600'
        : 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg hover:scale-105 border-teal-500'
    };

    const renderContent = () => {
      if (loading) return <span className="text-sm font-semibold">...</span>;
      
      if (children) return children;

      // Standard vertical layout: ICON / TITLE / Subtext
      return (
        <div className="flex flex-col items-center justify-center gap-2">
          {icon && <span className="flex-shrink-0 text-xl">{icon}</span>}
          {title && <span className="text-sm font-semibold text-center leading-tight">{title}</span>}
          {subtitle && <span className="text-xs font-medium opacity-80 text-center">{subtitle}</span>}
        </div>
      );
    };

    return (
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className={`${baseClasses} ${variantClasses[variant]} flex flex-col items-center justify-center ${className}`}
      >
        {renderContent()}
      </button>
    );
  };

  // Main Battle Interface
  const BattleInterface = () => (
    <div className="p-4 md:p-6 space-y-6">
      {/* Defensive Area */}
      <div className={`rounded-2xl shadow-xl border-2 transition-all duration-1000 ${
        isHidden 
          ? 'bg-gradient-to-r from-gray-800 to-purple-900 border-purple-600'
          : 'bg-gradient-to-r from-gray-900 to-gray-800 border-gray-600'
      }`}>
        <div 
          className="flex items-center justify-between p-6 border-b border-gray-700 cursor-pointer hover:bg-gray-800/50 transition-colors"
          onClick={() => setDefensiveCollapsed(!defensiveCollapsed)}
        >
          <div className="flex items-center">
            <Shield className={`mr-3 transition-colors duration-1000 ${
              isHidden ? 'text-purple-400' : 'text-blue-400'
            }`} size={32} />
            <div>
              <h2 className="text-3xl font-bold text-white">
                Defensive
              </h2>
              <p className="text-gray-300 font-medium">{character.name} - {character.race} {character.class}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`transform transition-transform duration-300 ${
              defensiveCollapsed ? 'rotate-180' : ''
            }`}>
              ▼
            </div>
          </div>
        </div>
        
{!defensiveCollapsed && (
          <div className="space-y-4 p-6">
            {/* Defensive Stats in Rows */}
            <div className="space-y-4">
              {/* Health Row */}
              <div className="bg-gray-800 p-4 rounded-xl border-2 border-green-500 relative overflow-hidden">
                {/* Health percentage bar background */}
                <div 
                  className="absolute inset-0 bg-green-500/10 transition-all duration-500"
                  style={{ width: `${(currentHP / character.maxHP) * 100}%` }}
                ></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Heart className="text-green-400 mr-3" size={24} />
                      <span className="text-lg font-bold text-white">Health</span>
                    </div>
                    <div className="flex items-center">
                      {hpEditing ? (
                        <input
                          type="number"
                          value={hpEditValue}
                          onChange={(e) => setHpEditValue(e.target.value)}
                          onBlur={() => {
                            const newHP = Math.max(0, Math.min(character.maxHP, parseInt(hpEditValue) || 0));
                            setCurrentHP(newHP);
                            setHpEditing(false);
                            setHpEditValue('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const newHP = Math.max(0, Math.min(character.maxHP, parseInt(hpEditValue) || 0));
                              setCurrentHP(newHP);
                              setHpEditing(false);
                              setHpEditValue('');
                            } else if (e.key === 'Escape') {
                              setHpEditing(false);
                              setHpEditValue('');
                            }
                          }}
                          className="text-2xl font-bold text-green-400 bg-transparent border border-green-400 rounded px-2 py-1 w-20 text-center"
                          autoFocus
                          placeholder={currentHP.toString()}
                        />
                      ) : (
                        <span 
                          onClick={() => {
                            setHpEditing(true);
                            setHpEditValue(currentHP.toString());
                          }}
                          className="text-2xl font-bold text-green-400 cursor-pointer hover:bg-gray-700 rounded px-2 py-1 transition-colors"
                          title="Click to edit HP directly"
                        >
                          {currentHP}/{character.maxHP}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <ActionButton 
                      onClick={() => openRollPopup('heal')}
                      variant="success"
                      icon={<Sparkles />}
                      title="Heal"
                    />
                    <ActionButton 
                      onClick={() => openRollPopup('', { type: 'damage-input' })}
                      variant="danger"
                      icon={<Heart />}
                      title="Damage"
                    />
                  </div>
                </div>
              </div>

              {/* Armor Row */}
              <div className="bg-gray-800 p-4 rounded-xl border-2 border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="text-gray-400 mr-3" size={24} />
                    <span className="text-lg font-bold text-gray-300">Armor Class</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-300">{character.ac}</span>
                </div>
              </div>

              {/* Resistances/Defensive Abilities */}
              <div className="bg-gray-800 p-4 rounded-xl border-2 border-gray-600">
                <div className="flex items-center mb-3">
                  <Shield className="text-gray-400 mr-3" size={24} />
                  <span className="text-lg font-bold text-gray-300">Defensive Abilities</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(character.defensiveAbilities).map(([key, ability]) => (
                    <div 
                      key={key}
                      className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                        ability.available !== false
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-gray-700 border-gray-600 text-gray-400'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="text-xl mr-3">{ability.icon}</span>
                        <div>
                          <span className="font-medium">{ability.name}</span>
                          <p className="text-sm text-gray-300">{ability.description}</p>
                        </div>
                      </div>
                      {key === 'uncanny-dodge' && ability.available !== false && (
                        <span className="text-xs bg-green-600 text-green-200 px-2 py-1 rounded">
                          Available
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Action Economy Interface - Your Turn */}
      <div className={`rounded-2xl shadow-xl border-2 transition-all duration-1000 ${
        isHidden 
          ? 'bg-gradient-to-r from-gray-800 to-purple-900 border-purple-600'
          : 'bg-gradient-to-r from-gray-900 to-gray-800 border-gray-600'
      }`}>
        <div 
          className="flex items-center justify-between p-6 border-b border-gray-700 cursor-pointer hover:bg-gray-800/50 transition-colors"
          onClick={() => setTurnCollapsed(!turnCollapsed)}
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
            <div className={`transform transition-transform duration-300 ${
              turnCollapsed ? 'rotate-180' : ''
            }`}>
              ▼
            </div>
          </div>
        </div>

        {!turnCollapsed && (
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
              const stats = getWeaponStats(key);
              return (
                <ActionButton
                  key={key}
                  onClick={() => handleAttack(key)}
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
              onClick={() => {
                if (isHidden) {
                  // If already hidden, just reveal without rolling
                  handleToggleHidden();
                } else {
                  // If not hidden, trigger stealth roll and use bonus action
                  const stealthAction = rollActions.skills.find(a => a.id === 'stealth');
                  if (stealthAction) {
                    handleActionSelect(stealthAction);
                    useBonusAction(); // Mark bonus action as used
                  }
                }
              }}
              disabled={!isHidden && turnState.bonusActionUsed}
              variant="purple"
              icon={isHidden ? <Eye /> : <EyeOff />}
              title={isHidden ? 'Reveal' : 'Hide'}
            />
            
            <ActionButton
              onClick={handleBonusActionDash}
              disabled={turnState.bonusActionUsed}
              variant="secondary"
              icon={<span>💨</span>}
              title="Dash"
            />
            
            <ActionButton
              onClick={handleDisengage}
              disabled={turnState.bonusActionUsed}
              variant="secondary"
              icon={<span>🏃</span>}
              title="Disengage"
            />
            
            <ActionButton
              onClick={handleUseItem}
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
                onClick={resetTurn}
                variant="primary"
                icon={<span>🔄</span>}
                title="End Turn"
                className="!bg-gradient-to-r !from-indigo-600 !to-indigo-700 !hover:from-indigo-700 !hover:to-indigo-800 !border-indigo-500"
              />
            </div>
          </div>
        )}
      </div>

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
            <p className="text-2xl font-bold text-white">10 (+0)</p>
          </div>
          <div className="text-center p-4 bg-gray-800 rounded-xl border-2 border-green-500">
            <p className="text-sm text-green-400 font-semibold">DEX</p>
            <p className="text-2xl font-bold text-green-400">16 (+3)</p>
          </div>
          <div className="text-center p-4 bg-gray-800 rounded-xl border-2 border-gray-600">
            <p className="text-sm text-gray-300 font-semibold">CON</p>
            <p className="text-2xl font-bold text-white">10 (+0)</p>
          </div>
          <div className="text-center p-4 bg-gray-800 rounded-xl border-2 border-blue-500">
            <p className="text-sm text-blue-400 font-semibold">INT</p>
            <p className="text-2xl font-bold text-blue-400">14 (+2)</p>
          </div>
          <div className="text-center p-4 bg-gray-800 rounded-xl border-2 border-purple-500">
            <p className="text-sm text-purple-400 font-semibold">WIS</p>
            <p className="text-2xl font-bold text-purple-400">17 (+3)</p>
          </div>
          <div className="text-center p-4 bg-gray-800 rounded-xl border-2 border-gray-600">
            <p className="text-sm text-gray-300 font-semibold">CHA</p>
            <p className="text-2xl font-bold text-white">9 (-1)</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Skills */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-xl border-2 border-gray-600">
            <h3 className="text-xl font-bold mb-4 text-gray-300 flex items-center">
              <Eye className="mr-2" size={20} />
              All Skills
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {rollActions.skills.map((skill) => {
                const skillEmojis = {
                  'stealth': '🥷',
                  'insight': '👁️',
                  'perception': '🔍',
                  'investigation': '🕵️',
                  'sleight-of-hand': '🤹',
                  'survival': '🏕️',
                  'acrobatics': '🤸',
                  'animal-handling': '🐴',
                  'medicine': '⚕️',
                  'arcana': '🔮',
                  'history': '📚',
                  'nature': '🌿',
                  'religion': '⛪',
                  'athletics': '💪',
                  'deception': '🎭',
                  'intimidation': '😤',
                  'performance': '🎪',
                  'persuasion': '🗣️'
                };
                
                const borderClass = skill.modifier > 5 
                  ? (skill.expertise ? 'border-yellow-500' : 'border-purple-500') 
                  : 'border-gray-600';
                const textClass = skill.modifier > 5 
                  ? (skill.expertise ? 'text-yellow-400' : 'text-purple-400') 
                  : 'text-gray-400';
                
                return (
                  <div key={skill.id} className={`flex justify-between items-center bg-gray-700 p-2 rounded-lg border ${borderClass}`}>
                    <span className="font-semibold text-white text-sm">
                      {skillEmojis[skill.id] || '🎯'} {skill.name}
                      {skill.expertise && <span className="ml-1 text-yellow-400">★</span>}
                      {skill.proficient && !skill.expertise && <span className="ml-1 text-purple-400">●</span>}
                    </span>
                    <span className={`font-bold ${textClass}`}>
                      {skill.modifier > 0 ? `+${skill.modifier}` : skill.modifier}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          
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

  // Enhanced Backstory Page
  const BackstoryPage = () => (
    <div className="p-4 md:p-6 space-y-6">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl shadow-xl p-6 border-2 border-green-600">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 mb-8">
          <div className="w-32 h-32 bg-gradient-to-br from-green-600 to-green-800 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-2xl border-2 border-green-500">
            🐍
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-4xl font-bold text-white flex items-center justify-center md:justify-start">
              {character.name}
              <Sparkles className="ml-3 text-yellow-400" size={28} />
            </h2>
            <p className="text-xl text-gray-300 font-semibold mt-2">{character.race} {character.class}</p>
            <p className="text-lg text-gray-300 italic mt-1">{character.backstory.background}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-xl border-2 border-green-600">
            <h3 className="text-2xl font-bold text-green-400 mb-4 flex items-center">
              📜 Background Story
            </h3>
            <p className="text-gray-200 leading-relaxed text-lg">{character.backstory.description}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-xl border-2 border-blue-600">
              <h4 className="font-bold text-blue-400 mb-3 text-xl flex items-center">
                🎭 Personality Traits
              </h4>
              <p className="text-gray-200 leading-relaxed">{character.backstory.traits}</p>
            </div>
            <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-xl border-2 border-purple-600">
              <h4 className="font-bold text-purple-400 mb-3 text-xl flex items-center">
                💖 Bonds
              </h4>
              <p className="text-gray-200 leading-relaxed">{character.backstory.bonds}</p>
            </div>
            <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-xl border-2 border-red-600">
              <h4 className="font-bold text-red-400 mb-3 text-xl flex items-center">
                😅 Flaws
              </h4>
              <p className="text-gray-200 leading-relaxed">{character.backstory.flaws}</p>
            </div>
            <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-xl border-2 border-yellow-600">
              <h4 className="font-bold text-yellow-400 mb-3 text-xl flex items-center">
                👤 Appearance
              </h4>
              <p className="text-gray-200 leading-relaxed">{character.backstory.appearance}</p>
            </div>
          </div>
        </div>
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
          <div className="flex justify-center space-x-8">
            <button
              onClick={() => setActiveTab('battle')}
              className={`flex items-center space-x-3 py-6 px-8 font-bold transition-all duration-300 transform hover:scale-105 ${
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
              className={`flex items-center space-x-3 py-6 px-8 font-bold transition-all duration-300 transform hover:scale-105 ${
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
              className={`flex items-center space-x-3 py-6 px-8 font-bold transition-all duration-300 transform hover:scale-105 ${
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
          </div>
        </div>
      </nav>

      {/* Content with improved layout */}
      <div className="max-w-6xl mx-auto">
        {activeTab === 'battle' && <BattleInterface />}
        {activeTab === 'stats' && <StatsPage />}
        {activeTab === 'backstory' && <BackstoryPage />}
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
          className="transition-colors duration-300"
        />
        <text 
          x="12" 
          y="12" 
          textAnchor="middle" 
          dominantBaseline="middle"
          className="font-bold fill-white transition-colors duration-300"
          style={{ fontSize: '4.5px' }}
        >
          ROLL
        </text>
      </svg>

      {/* Roll Popup - Floating Box with Overlay */}
      {rollPopup.isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-end justify-end p-6"
          onClick={closeRollPopup}
        >
          <div 
            className={`w-80 rounded-2xl p-6 shadow-2xl border-2 transition-all duration-300 ${
              isHidden 
                ? 'bg-gradient-to-br from-gray-800 to-purple-900 border-purple-600'
                : 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-600'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            
            {rollPopup.phase === 'search' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-white">Quick Search</h2>
                
                <input
                  type="text"
                  placeholder="Search actions..."
                  value={rollPopup.searchTerm}
                  onChange={(e) => setRollPopup(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  autoFocus
                />
                
                {(() => {
                  const filtered = getFilteredActions();
                  const categoryLabels = {
                    attacks: 'Attacks',
                    skills: 'Skills', 
                    abilities: 'Ability Checks',
                    saves: 'Saving Throws',
                    combat: 'Combat',
                    healing: 'Healing',
                    utility: 'Utility'
                  };
                  const categoryColors = {
                    attacks: 'bg-red-600 text-red-200',
                    skills: 'bg-blue-600 text-blue-200',
                    abilities: 'bg-green-600 text-green-200',
                    saves: 'bg-purple-600 text-purple-200',
                    combat: 'bg-yellow-600 text-yellow-200',
                    healing: 'bg-green-600 text-green-200',
                    utility: 'bg-gray-600 text-gray-200'
                  };
                  
                  const hasResults = Object.values(filtered).some(arr => arr.length > 0);
                  
                  return (
                    <div className="space-y-4 max-h-64 overflow-y-auto">
                      {Object.entries(filtered).map(([category, actions]) => {
                        if (actions.length === 0) return null;
                        return (
                          <div key={category}>
                            <h3 className="text-sm font-semibold text-gray-300 mb-2">{categoryLabels[category]}</h3>
                            <div className="space-y-1">
                              {actions.map(action => (
                                <button
                                  key={action.id}
                                  onClick={() => handleActionSelect(action)}
                                  className="w-full text-left p-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex justify-between items-center transition-colors text-sm border border-gray-600 hover:border-gray-500"
                                >
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium text-white">{action.name}</span>
                                    {action.proficient && (
                                      <span className="text-xs bg-green-600 text-green-200 px-1 rounded">
                                        {action.expertise ? 'EXP' : 'PROF'}
                                      </span>
                                    )}
                                  </div>
                                  {action.type !== 'toggle' && action.type !== 'raw' && (
                                    <span className={`text-xs px-2 py-1 rounded ${categoryColors[category]}`}>
                                      {action.modifier >= 0 ? '+' : ''}{action.modifier}
                                    </span>
                                  )}
                                  {action.type === 'raw' && (
                                    <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded">
                                      d{action.dice || 20}
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      
                      {!hasResults && rollPopup.searchTerm && (
                        <div className="text-center text-gray-400 py-4">
                          No actions found for "{rollPopup.searchTerm}"
                        </div>
                      )}
                    </div>
                  );
                })()}
                
                <div className="flex">
                  <button
                    onClick={() => setRollPopup(prev => ({ ...prev, phase: 'logs' }))}
                    className={`w-full p-3 rounded-lg font-medium transition-colors border ${isHidden 
                      ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-500'
                      : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500'
                    }`}
                  >
                    Previous Rolls
                  </button>
                </div>
              </div>
            )}

            {rollPopup.phase === 'damage-input' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">Take Damage</h2>
                  <button
                    onClick={closeRollPopup}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      DM announces damage:
                    </label>
                    <input
                      type="number"
                      placeholder="Enter damage amount..."
                      value={damageInput.amount}
                      onChange={(e) => {
                        const amount = parseInt(e.target.value) || 0;
                        let finalDamage = amount;
                        
                        // Apply defensive abilities
                        if (damageInput.selectedDefenses.includes('uncanny-dodge')) {
                          finalDamage = Math.floor(finalDamage / 2);
                        }
                        if (damageInput.selectedDefenses.includes('poison-resistance') && amount > 0) {
                          // Assume poison damage for demo - in real app would need damage type
                          finalDamage = Math.floor(finalDamage / 2);
                        }
                        
                        setDamageInput(prev => ({
                          ...prev,
                          amount: e.target.value,
                          finalDamage
                        }));
                      }}
                      className="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:border-red-500 focus:outline-none text-lg"
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Defensive Abilities:
                    </label>
                    <div className="space-y-2">
                      {Object.entries(character.defensiveAbilities).map(([key, ability]) => {
                        const isSelected = damageInput.selectedDefenses.includes(key);
                        const isAvailable = ability.available !== false;
                        
                        return (
                          <button
                            key={key}
                            disabled={!isAvailable}
                            onClick={() => {
                              let newDefenses;
                              if (isSelected) {
                                newDefenses = damageInput.selectedDefenses.filter(d => d !== key);
                              } else {
                                newDefenses = [...damageInput.selectedDefenses, key];
                              }
                              
                              let finalDamage = parseInt(damageInput.amount) || 0;
                              
                              // Apply defensive abilities
                              if (newDefenses.includes('uncanny-dodge')) {
                                finalDamage = Math.floor(finalDamage / 2);
                              }
                              if (newDefenses.includes('poison-resistance')) {
                                finalDamage = Math.floor(finalDamage / 2);
                              }
                              
                              setDamageInput(prev => ({
                                ...prev,
                                selectedDefenses: newDefenses,
                                finalDamage
                              }));
                            }}
                            className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                              !isAvailable 
                                ? 'bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed'
                                : isSelected
                                  ? 'bg-blue-600 border-blue-500 text-white'
                                  : 'bg-gray-700 border-gray-600 text-white hover:border-blue-500 hover:bg-gray-600'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{ability.icon}</span>
                              <div>
                                <div className="font-semibold">{ability.name}</div>
                                <div className="text-sm text-gray-300">{ability.description}</div>
                                {key === 'uncanny-dodge' && !isAvailable && (
                                  <div className="text-xs text-red-400">Already used this turn</div>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {damageInput.amount && (
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Original damage:</span>
                        <span className="text-red-400 font-bold">{damageInput.amount}</span>
                      </div>
                      {damageInput.selectedDefenses.length > 0 && (
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-gray-300">After defenses:</span>
                          <span className="text-orange-400 font-bold">{damageInput.finalDamage}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-600">
                        <span className="text-white font-semibold">Final HP:</span>
                        <span className={`font-bold text-lg ${
                          currentHP - damageInput.finalDamage <= 0 ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {Math.max(0, currentHP - damageInput.finalDamage)}/{character.maxHP}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={() => {
                      if (damageInput.amount) {
                        // Apply damage
                        const finalDamage = damageInput.finalDamage;
                        setCurrentHP(prev => Math.max(0, prev - finalDamage));
                        
                        // Use up Uncanny Dodge if selected
                        if (damageInput.selectedDefenses.includes('uncanny-dodge')) {
                          // In a full implementation, would track per-turn usage
                        }
                        
                        // Log the damage taken
                        logRoll({
                          type: 'damage',
                          name: 'Damage Taken',
                          dice: [{
                            name: 'Damage',
                            dice: [`${damageInput.amount} damage`],
                            bonus: 0,
                            total: finalDamage
                          }],
                          details: {
                            originalDamage: parseInt(damageInput.amount),
                            finalDamage: finalDamage,
                            defenses: damageInput.selectedDefenses,
                            finalHP: Math.max(0, currentHP - finalDamage)
                          }
                        });
                        
                        closeRollPopup();
                      }
                    }}
                    disabled={!damageInput.amount}
                    className={`w-full p-3 rounded-lg font-bold transition-colors ${
                      damageInput.amount
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Apply Damage
                  </button>
                </div>
              </div>
            )}
            
            {rollPopup.phase === 'rolling' && rollPopup.selectedAction && (
              <div className="space-y-6 text-center">
                <h2 className="text-xl font-bold text-white">
                  Rolling {rollPopup.selectedAction.name}
                </h2>
                
                <div className="text-6xl animate-bounce">🎲</div>
                
                <p className="text-gray-300">Rolling...</p>
                
                <div className="flex justify-center space-x-1">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    isHidden ? 'bg-purple-400' : 'bg-blue-400'
                  }`}></div>
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    isHidden ? 'bg-purple-400' : 'bg-blue-400'
                  }`} style={{animationDelay: '0.2s'}}></div>
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    isHidden ? 'bg-purple-400' : 'bg-blue-400'
                  }`} style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
            )}
            
            {rollPopup.phase === 'result' && rollPopup.result && (
              <div className="space-y-4 text-center">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">
                    {rollPopup.selectedAction?.name || 'Roll Result'}
                  </h2>
                  
                  <button 
                    onClick={() => {
                      // Re-roll the entire action with animation
                      if (rollPopup.selectedAction) {
                        setRollPopup(prev => ({
                          ...prev,
                          phase: 'rolling',
                          result: null
                        }));
                        performPopupRoll(rollPopup.selectedAction);
                      }
                    }}
                    className="text-4xl hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                    title="Click to roll again"
                  >
                    {rollPopup.result.roll === 20 ? '⭐' : rollPopup.result.roll === 1 ? '💥' : '🎲'}
                  </button>
                </div>
                
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                  <div className="text-2xl font-bold text-white mb-2">
                    {rollPopup.result.type === 'attack' ? (
                      <div className="space-y-3">
                        {/* Attack Roll Section - Simple with Hover Details */}
                        <div className="group cursor-help relative">
                          <div className="bg-gray-700 p-3 rounded-lg border border-gray-600">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Target className="text-green-400" size={16} />
                                <span className="text-white font-medium">Attack Roll</span>
                              </div>
                              <span className="text-2xl font-bold text-green-400">{rollPopup.result.totalAttack}</span>
                            </div>
                          </div>
                          {/* Hover Details */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 bg-gray-800 border border-gray-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 min-w-max">
                            <div className="flex items-center space-x-2 mb-2">
                              <Target className="text-green-400" size={14} />
                              <span className="text-white text-sm font-medium">Attack Roll Breakdown</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="bg-gray-700 px-2 py-1 rounded text-sm font-mono text-white">{rollPopup.result.attackRoll}</span>
                              <span className="text-sm text-gray-400">+{rollPopup.selectedAction?.modifier || 0}</span>
                              <span className="text-sm text-gray-400">=</span>
                              <span className="text-sm font-bold text-white">{rollPopup.result.totalAttack}</span>
                            </div>
                          </div>
                        </div>

                        {/* Damage Section - Simple with Hover Details */}
                        <div className="group cursor-help relative">
                          <div className="bg-gray-700 p-3 rounded-lg border border-gray-600">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Sword className="text-red-400" size={16} />
                                <span className="text-white font-medium">Damage</span>
                              </div>
                              <span className="text-2xl font-bold text-red-400">{rollPopup.result.totalDamage}</span>
                            </div>
                          </div>
                          {/* Hover Details */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 bg-gray-800 border border-gray-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 min-w-max">
                            <div className="flex items-center space-x-2 mb-2">
                              <Sword className="text-red-400" size={14} />
                              <span className="text-white text-sm font-medium">Damage Breakdown</span>
                            </div>
                            <div className="flex items-center space-x-2 flex-wrap">
                              {rollPopup.result.weaponDiceSize && (
                                <span className="bg-gray-700 px-2 py-1 rounded text-sm font-mono text-white">{rollPopup.result.baseDamageRoll - 3}</span>
                              )}
                              <span className="text-sm text-gray-400">+3</span>
                              {rollPopup.result.sneakAttackTotal > 0 && (
                                <>
                                  <span className="text-sm text-gray-400">+{rollPopup.result.sneakAttackTotal}</span>
                                  <span className="text-sm text-purple-300">(Sneak)</span>
                                </>
                              )}
                              <span className="text-sm text-gray-400">=</span>
                              <span className="text-sm font-bold text-white">{rollPopup.result.totalDamage}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : rollPopup.result.type === 'healing' ? (
                      <div className="space-y-3">
                        <div className="bg-gray-700 p-3 rounded-lg border border-gray-600">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Heart className="text-green-400" size={16} />
                              <span className="text-white font-medium">Healing</span>
                            </div>
                            <span className="text-2xl font-bold text-green-400">
                              +{rollPopup.result.healingAmount || 'Full'}
                            </span>
                          </div>
                        </div>
                        
                        {rollPopup.result.description && (
                          <div className="text-sm text-gray-300 bg-gray-800 p-2 rounded">
                            {rollPopup.result.description}
                          </div>
                        )}
                        
                        <div className="bg-gray-700 p-3 rounded-lg border border-gray-600">
                          <div className="flex items-center justify-between">
                            <span className="text-white font-medium">New HP:</span>
                            <span className="text-2xl font-bold text-green-400">
                              {rollPopup.result.healType === 'long-rest' ? character.maxHP : 
                               Math.min(character.maxHP, currentHP + (rollPopup.result.healingAmount || 0))}/{character.maxHP}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="group cursor-help relative"
                      >
                        <div className="text-lg text-gray-300">
                          {rollPopup.selectedAction?.name || 'Roll'} = 
                          <span className={`text-3xl ml-2 ${
                            rollPopup.result.roll === 20 ? 'text-yellow-400' : 
                            rollPopup.result.roll === 1 ? 'text-red-400' : 
                            'text-green-400'
                          }`}>
                            {rollPopup.result.total}
                          </span>
                        </div>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 bg-gray-800 border border-gray-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 min-w-max">
                          <div className="flex items-center space-x-2">
                            <Eye className="text-green-400" size={14} />
                            <span className="text-white text-sm font-medium">{rollPopup.selectedAction?.name || 'Roll'}</span>
                          </div>
                          <div className="flex items-center space-x-1 mt-1">
                            <span className="bg-gray-700 px-2 py-0.5 rounded text-xs font-mono text-white">{rollPopup.result.roll}</span>
                            <span className="text-xs text-gray-400">+{rollPopup.result.modifier}</span>
                            <span className="text-xs font-bold text-white">= {rollPopup.result.total}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {rollPopup.result.roll === 20 && (
                    <div className="text-yellow-400 font-bold text-lg">NATURAL 20! ⭐</div>
                  )}
                  
                  {rollPopup.result.roll === 1 && (
                    <div className="text-red-400 font-bold text-lg">NATURAL 1! 💥</div>
                  )}
                  
                  {rollPopup.selectedAction?.id === 'stealth' && rollPopup.result.total >= 15 && (
                    <div className="text-purple-400 font-bold text-lg mt-2">Successfully Hidden! 👤</div>
                  )}
                </div>
                
                <button
                  onClick={closeRollPopup}
                  className={`w-full p-3 rounded-lg font-bold transition-colors ${
                    isHidden 
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  Continue
                </button>
              </div>
            )}
            
            {rollPopup.phase === 'logs' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">Roll History</h2>
                  <button
                    onClick={() => setRollPopup(prev => ({ ...prev, phase: 'search' }))}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ← Back
                  </button>
                </div>
                
                {rollLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <Dice6 className="mx-auto text-gray-400 mb-3" size={32} />
                    <p className="text-gray-400">No rolls yet!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {rollLogs.slice(0, 10).map((log) => (
                      <div key={log.id} className={`rounded-lg border overflow-hidden ${
                        isHidden 
                          ? 'bg-gray-800 border-purple-700'
                          : 'bg-gray-800 border-gray-600'
                      }`}>
                        <div className={`p-3 border-b ${isHidden ? 'border-purple-700' : 'border-gray-600'}`}>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              {log.type === 'attack' && <Target className="text-red-400" size={16} />}
                              {log.type === 'skill' && <Eye className="text-green-400" size={16} />}
                              {log.type === 'ability' && <Shield className="text-blue-400" size={16} />}
                              {log.type === 'save' && <Heart className="text-yellow-400" size={16} />}
                              {log.type === 'raw' && <Dice6 className="text-gray-400" size={16} />}
                              {log.type === 'death-save' && <Heart className="text-red-400" size={16} />}
                              {log.type === 'healing' && <Heart className="text-green-400" size={16} />}
                              {log.type === 'damage' && <Heart className="text-red-400" size={16} />}
                              <div className="flex flex-col">
                                <span className="font-medium text-white text-sm">{log.name}</span>
                                <span className="text-xs text-gray-400">
                                  {log.type === 'attack' ? (
                                    `Attack = ${log.dice[0]?.total || 0}, Damage = ${log.dice[1]?.total || 0}`
                                  ) : (
                                    `= ${log.dice[0]?.total || 0}`
                                  )}
                                </span>
                              </div>
                              {log.isCritical && <Sparkles className="text-yellow-400" size={12} />}
                            </div>
                            <span className="text-xs text-gray-400">{log.timestamp}</span>
                          </div>
                        </div>
                        
                        <div className="p-3">
                          {log.dice.map((diceGroup, index) => (
                            <div key={index} className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-300">{diceGroup.name}</span>
                                <div className="flex items-center space-x-1">
                                  {diceGroup.dice.map((die, dieIndex) => (
                                    <span key={dieIndex} className="bg-gray-700 px-1.5 py-0.5 rounded text-xs font-mono">
                                      {die.replace('d20: ', '').replace('d6: ', '').replace('d8: ', '')}
                                    </span>
                                  ))}
                                  {diceGroup.bonus > 0 && <span className="text-xs text-gray-400">+{diceGroup.bonus}</span>}
                                  <span className="text-xs font-bold text-white">= {diceGroup.total}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {log.details && (
                            <div className="mt-2 pt-2 border-t border-gray-700">
                              <div className="text-xs text-gray-400 space-x-3">
                                {log.details.advantage && <span>✨ Advantage</span>}
                                {log.details.sneakAttack && <span>🗡️ Sneak</span>}
                                {log.details.success !== undefined && (
                                  <span className={log.details.success ? 'text-green-400' : 'text-red-400'}>
                                    {log.details.success ? '✅' : '❌'}
                                  </span>
                                )}
                                {log.details.critSuccess && <span className="text-yellow-400">🎯 Crit!</span>}
                                {log.details.critFail && <span className="text-red-400">💥 Fail!</span>}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {rollLogs.length > 0 && (
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setRollLogs([])}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-3 rounded-lg text-sm transition-colors"
                    >
                      Clear History
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DnDCompanionApp;