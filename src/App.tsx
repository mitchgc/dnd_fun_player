import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Sword, Shield, User, BookOpen, Sparkles, Menu } from 'lucide-react';

// Import new components
import DefensivePanel from './components/Battle/DefensivePanel';
import TurnManager from './components/Battle/TurnManager';
import RollPopup from './components/Rolls/RollPopup';
import CharacterToggle from './components/Character/CharacterToggle';
import AuthScreen from './components/Auth/AuthScreen';

import CollaborativeJournal from './components/Journal/CollaborativeJournal';
import MobileNav from './components/Navigation/MobileNav';
import ProfilePictureUpload from './components/Story/ProfilePictureUpload';
import EditableField from './components/Story/EditableField';

// Import Character Context
import { CharacterProvider, useCharacter } from './contexts/CharacterContext';

// Import custom hooks
import { useCharacterState } from './hooks/useCharacterState';
import { useDiceRolls } from './hooks/useDiceRolls';
import { useAuth } from './hooks/useAuth';
import { rollDice } from './utils/diceUtils';

// Helper function to calculate ability modifier
const calcModifier = (score) => Math.floor((score - 10) / 2);

// Helper function to calculate proficiency bonus
const calcProficiencyBonus = (level) => Math.ceil(level / 4) + 1;


const DnDCompanionApp = () => {
  // Initialize authentication
  const { user, loading: authLoading, error: authError, signInWithGoogle, signOut } = useAuth();
  
  // Use CharacterContext for all character data (must be called before any early returns)
  const { activeCharacter, isLoading, error, switchCharacter, updateCharacterState } = useCharacter();
  
  // Handle page visibility for battery optimization
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        document.body.classList.add('page-hidden');
      } else {
        document.body.classList.remove('page-hidden');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
  
  // Local state for UI management - MUST be declared before any early returns
  const [isHidden, setIsHidden] = useState(false);
  const [initiative, setInitiative] = useState(0);
  const [turnState, setTurnState] = useState({ actionUsed: false, bonusActionUsed: false, movementUsed: false });
  
  // UI state
  const [activeTab, setActiveTab] = useState('battle');
  const [lastAttackResult, setLastAttackResult] = useState(null);
  const [buttonStates, setButtonStates] = useState({});
  const [selectedWeapon, setSelectedWeapon] = useState('');
  
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
  
  // Memoize auth status to prevent reference changes causing re-renders
  const authStatus = React.useMemo(() => ({
    user: user ? 'authenticated' : 'not authenticated', 
    authLoading
  }), [user, authLoading]);
  
  // Memoize auth status logging to prevent excessive re-renders
  React.useEffect(() => {
    console.log('🔐 Auth status:', authStatus);
  }, [authStatus]);
  
  // Memoize loading component to prevent re-creation
  const LoadingScreen = React.useMemo(() => (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-white text-lg">Initializing...</p>
      </div>
    </div>
  ), []);
  
  // Initialize dice roll hooks
  const {
    rollLogs,
    performAttackRoll,
    performSpellAttack,
    performStandardRoll,
    performHealingRoll,
    logRoll,
    clearLogs
  } = useDiceRolls();
  
  // Generate roll actions for the character from Supabase data - move before early return
  const rollActions = useMemo(() => {
    if (!activeCharacter) return { attacks: [], combat: [], saves: [], skills: [], abilities: [], healing: [], utility: [] };
    
    
    const attacks = (activeCharacter.dnd_character_weapons || []).map(weapon => ({
      id: `${weapon.name.toLowerCase().replace(/\s+/g, '-')}-attack`,
      name: `${weapon.name} Attack`,
      modifier: weapon.attack_bonus || 0,
      type: 'attack',
      weapon: weapon.name,
      damage: weapon.damage_dice,
      damageBonus: weapon.damage_bonus || 0,
      damageType: weapon.damage_type,
      description: weapon.description || `Attack with ${weapon.name}`,
      diceType: 'd20'
    }));
    
    const abilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']
      .map(ability => ({
        id: ability,
        name: `${ability.charAt(0).toUpperCase() + ability.slice(1)} Check`,
        modifier: calcModifier(activeCharacter.ability_scores[ability] || 10),
        type: 'ability',
        ability,
        description: `Raw ${ability} ability check`,
        diceType: 'd20'
      }));
    
    const saves = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']
      .map(ability => {
        const abilityMod = calcModifier(activeCharacter.ability_scores[ability] || 10);
        const profBonus = calcProficiencyBonus(activeCharacter.level || 1);
        // TODO: Add saving throw proficiencies from character data
        return {
          id: `${ability}-save`,
          name: `${ability.charAt(0).toUpperCase() + ability.slice(1)} Save`,
          modifier: abilityMod, // + profBonus if proficient
          type: 'save',
          ability,
          description: `${ability.charAt(0).toUpperCase() + ability.slice(1)} saving throw`,
          diceType: 'd20'
        };
      });
    
    // Add all D&D skills
    const skills = [
      { id: 'acrobatics', name: 'Acrobatics', ability: 'dexterity', icon: '🤸' },
      { id: 'animalHandling', name: 'Animal Handling', ability: 'wisdom', icon: '🐕' },
      { id: 'arcana', name: 'Arcana', ability: 'intelligence', icon: '🔮' },
      { id: 'athletics', name: 'Athletics', ability: 'strength', icon: '💪' },
      { id: 'deception', name: 'Deception', ability: 'charisma', icon: '🎭' },
      { id: 'history', name: 'History', ability: 'intelligence', icon: '📜' },
      { id: 'insight', name: 'Insight', ability: 'wisdom', icon: '👁️' },
      { id: 'intimidation', name: 'Intimidation', ability: 'charisma', icon: '😠' },
      { id: 'investigation', name: 'Investigation', ability: 'intelligence', icon: '🔍' },
      { id: 'medicine', name: 'Medicine', ability: 'wisdom', icon: '⚕️' },
      { id: 'nature', name: 'Nature', ability: 'intelligence', icon: '🌿' },
      { id: 'perception', name: 'Perception', ability: 'wisdom', icon: '👂' },
      { id: 'performance', name: 'Performance', ability: 'charisma', icon: '🎪' },
      { id: 'persuasion', name: 'Persuasion', ability: 'charisma', icon: '🤝' },
      { id: 'religion', name: 'Religion', ability: 'intelligence', icon: '⛪' },
      { id: 'sleightOfHand', name: 'Sleight of Hand', ability: 'dexterity', icon: '🎩' },
      { id: 'stealth', name: 'Stealth', ability: 'dexterity', icon: '👤' },
      { id: 'survival', name: 'Survival', ability: 'wisdom', icon: '🏕️' }
    ].map(skill => {
      const abilityMod = calcModifier(activeCharacter.ability_scores[skill.ability] || 10);
      const profBonus = calcProficiencyBonus(activeCharacter.level || 1);
      
      // Check for skill proficiency/expertise in character abilities
      const skillAbilities = activeCharacter.dnd_character_abilities || [];
      const skillProficiency = skillAbilities.find(ability => 
        ability.ability_data?.skill === skill.id && 
        (ability.ability_data?.proficiency_type === 'proficiency' || ability.ability_data?.proficiency_type === 'expertise')
      );
      
      let totalModifier = abilityMod;
      let proficient = false;
      let expertise = false;
      
      if (skillProficiency) {
        proficient = true;
        if (skillProficiency.ability_data?.proficiency_type === 'expertise') {
          expertise = true;
          totalModifier = abilityMod + (profBonus * 2); // Double proficiency for expertise
        } else {
          totalModifier = abilityMod + profBonus; // Single proficiency
        }
      }
      
      return {
        id: skill.id,
        name: `${skill.name} Check`,
        modifier: totalModifier,
        type: 'skill',
        ability: skill.ability,
        description: `${skill.name} skill check`,
        diceType: 'd20',
        icon: skill.icon,
        proficient,
        expertise
      };
    });
    
    const combat = [
      {
        id: 'initiative',
        name: 'Initiative',
        modifier: (activeCharacter.initiative_bonus || 0),
        type: 'initiative',
        description: 'Roll for turn order in combat',
        diceType: 'd20'
      },
      {
        id: 'death-save',
        name: 'Death Saving Throw',
        modifier: 0,
        type: 'death-save',
        description: 'Stabilize when dying (DC 10)',
        diceType: 'd20'
      }
    ];
    
    const healing = [
      {
        id: 'short-rest',
        name: 'Short Rest Healing',
        modifier: calcModifier(activeCharacter.ability_scores?.constitution || 10),
        type: 'healing',
        healType: 'short-rest',
        description: 'Spend hit dice to recover HP during a short rest',
        diceType: 'd8'
      },
      {
        id: 'long-rest',
        name: 'Long Rest Healing',
        modifier: 0,
        type: 'healing',
        healType: 'long-rest',
        description: 'Recover all HP and abilities during a long rest',
        diceType: 'full-heal'
      },
      {
        id: 'basic-potion',
        name: 'Basic Healing Potion',
        modifier: 2,
        type: 'healing',
        healType: 'potion',
        dice: '2d4+2',
        description: 'Roll 2d4+2 healing from a healing potion',
        diceType: 'd4'
      },
      {
        id: 'custom-healing',
        name: 'Custom Healing',
        modifier: 0,
        type: 'healing',
        healType: 'custom',
        description: 'Enter a custom healing amount'
      }
    ];
    
    const utility = [
      { id: 'd20', name: 'Raw d20', modifier: 0, type: 'raw', dice: 20, diceType: 'd20' },
      { id: 'd12', name: 'Raw d12', modifier: 0, type: 'raw', dice: 12, diceType: 'd12' },
      { id: 'd10', name: 'Raw d10', modifier: 0, type: 'raw', dice: 10, diceType: 'd10' },
      { id: 'd8', name: 'Raw d8', modifier: 0, type: 'raw', dice: 8, diceType: 'd8' },
      { id: 'd6', name: 'Raw d6', modifier: 0, type: 'raw', dice: 6, diceType: 'd6' },
      { id: 'd4', name: 'Raw d4', modifier: 0, type: 'raw', dice: 4, diceType: 'd4' }
    ];
    
    return {
      attacks: attacks.sort((a, b) => b.modifier - a.modifier),
      combat: combat.sort((a, b) => b.modifier - a.modifier),
      saves: saves.sort((a, b) => b.modifier - a.modifier),
      skills: skills.sort((a, b) => b.modifier - a.modifier),
      abilities: abilities.sort((a, b) => b.modifier - a.modifier),
      healing,
      utility
    };
  }, [activeCharacter]);

  // Dynamic weapon selection based on character
  const getDefaultWeapon = (character) => {
    if (!character?.dnd_character_weapons) return null;
    const weapons = character.dnd_character_weapons;
    if (character.name === 'Emba') {
      const eldritchBlast = weapons.find(w => w.name === 'Eldritch Blast');
      return eldritchBlast ? eldritchBlast.name : weapons[0]?.name;
    } else {
      const rapier = weapons.find(w => w.name.toLowerCase().includes('rapier'));
      return rapier ? rapier.name : weapons[0]?.name;
    }
  };
  
  // Update selected weapon when character changes
  useEffect(() => {
    if (activeCharacter) {
      setSelectedWeapon(getDefaultWeapon(activeCharacter) || '');
    }
  }, [activeCharacter]);
  
  // Helper functions for character updates
  const toggleHidden = () => setIsHidden(!isHidden);
  const setHidden = (hidden) => setIsHidden(hidden);
  const setInitiativeRoll = (init) => setInitiative(init);
  const resetTurn = () => setTurnState({ actionUsed: false, bonusActionUsed: false, movementUsed: false });
  const useAction = () => setTurnState(prev => ({ ...prev, actionUsed: true }));
  const useBonusAction = () => setTurnState(prev => ({ ...prev, bonusActionUsed: true }));
  
  // HP management functions
  const adjustHP = (amount) => {
    if (activeCharacter) {
      const newHP = Math.max(0, Math.min(activeCharacter.max_hp, activeCharacter.current_hp + amount));
      updateCharacterState(activeCharacter.id, { current_hp: newHP });
    }
  };
  
  const setHP = (newHP) => {
    if (activeCharacter) {
      const clampedHP = Math.max(0, Math.min(activeCharacter.max_hp, newHP));
      updateCharacterState(activeCharacter.id, { current_hp: clampedHP });
    }
  };
  
  const applyDamage = (damage) => adjustHP(-damage);
  const applyHealing = (healing) => adjustHP(healing);

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
    
    // Handle healing actions that shouldn't roll
    if (action.type === 'healing') {
      if (action.healType === 'custom') {
        // Show custom healing input dialog
        setRollPopup({
          isOpen: true,
          searchTerm: '',
          selectedAction: action,
          phase: 'healing-input',
          result: null
        });
        return;
      } else if (action.healType === 'long-rest') {
        // Long rest - no rolling, just heal to full
        const maxHP = activeCharacter?.max_hp || 100;
        const currentHP = activeCharacter?.current_hp || 0;
        const healAmount = maxHP - currentHP;
        
        applyHealing(healAmount);
        
        const result = {
          type: 'healing',
          name: action.name,
          healingAmount: healAmount,
          healType: 'long-rest',
          description: 'Fully restored HP and reset all abilities',
          finalHP: maxHP,
          total: healAmount
        };
        
        // Log the long rest healing
        logRoll({
          type: 'healing',
          name: action.name,
          dice: [{
            name: 'Long Rest',
            dice: [`Full HP restored`],
            bonus: 0,
            total: healAmount
          }],
          details: {
            healType: 'long-rest',
            finalHP: maxHP
          }
        });
        
        // Skip rolling animation and go straight to result
        setRollPopup({
          isOpen: true,
          searchTerm: '',
          selectedAction: action,
          phase: 'result',
          result
        });
        return;
      }
    }
    
    setRollPopup(prev => ({
      ...prev,
      isOpen: true,
      selectedAction: action,
      phase: 'rolling'
    }));
    
    // Start the rolling sequence
    setTimeout(() => {
      let result;
      
      if (action.type === 'attack') {
        const weaponName = action.weapon || action.name?.replace(' Attack', '');
        result = performAttackRoll(weaponName, isHidden, activeCharacter);
        useAction();
        setLastAttackResult(result);
        
        if (isHidden) {
          setHidden(false); // Attacking breaks stealth
        }
      } else if (action.type === 'spell_attack') {
        // Handle Eldritch Blast and other spell attacks
        const ability = activeCharacter.dnd_character_abilities?.find(a => a.id === action.id);
        if (ability) {
          const spellAttackResult = performSpellAttack(ability, isHidden, activeCharacter);
          result = spellAttackResult;
          useAction();
          setLastAttackResult(result);
          
          if (isHidden) {
            setHidden(false); // Attacking breaks stealth
          }
        }
      } else if (action.type === 'spell_save') {
        // Handle save-based spells
        const ability = activeCharacter.dnd_character_abilities?.find(a => a.id === action.id);
        if (ability) {
          // Check if this spell actually has damage
          const damageDice = action.damage || ability.damage_dice || ability.ability_data?.damage;
          const damageType = action.damageType || ability.damage_type || ability.ability_data?.damage_type;
          const spellDC = ability.ability_data?.spell_dc || 10;
          const saveType = ability.ability_data?.save_type || 'wisdom';
          
          // If spell has no damage (like Suggestion), don't roll damage
          if (!damageDice || damageDice === '' || damageDice === '0') {
            result = {
              type: 'spell_save',
              name: ability.ability_name,
              spellDC,
              saveType,
              hasNoDamage: true,
              description: ability.description || `Target must make a DC ${spellDC} ${saveType.charAt(0).toUpperCase() + saveType.slice(1)} saving throw`
            };
            
            // Log the spell save roll without damage
            logRoll({
              type: 'spell_save',
              name: ability.ability_name,
              dice: [],
              details: {
                spellDC,
                saveType,
                hasNoDamage: true,
                description: `DC ${spellDC} ${saveType.charAt(0).toUpperCase() + saveType.slice(1)} save`
              }
            });
          } else {
            // Parse damage dice string for spells with damage (e.g., "1d12", "2d6", "3d4+2")
            const parseDamageRoll = (diceString) => {
              const match = diceString.match(/(\d+)d(\d+)(?:\+(\d+))?/);
              if (!match) return { total: 0, rolls: [], bonus: 0 };
              
              const numDice = parseInt(match[1]);
              const diceSize = parseInt(match[2]);
              const bonus = parseInt(match[3] || 0);
              
              const rolls = [];
              let total = bonus;
              
              for (let i = 0; i < numDice; i++) {
                const roll = rollDice(diceSize);
                rolls.push(roll);
                total += roll;
              }
              
              return { total, rolls, bonus, diceSize, numDice };
            };
            
            const damageResult = parseDamageRoll(damageDice);
            
            result = {
              type: 'spell_save',
              name: ability.ability_name,
              damageRoll: damageResult.total,
              damage: damageResult.total,
              total: damageResult.total,
              roll: damageResult.total,
              spellDC,
              saveType,
              damageType: damageType,
              rolls: damageResult.rolls,
              bonus: damageResult.bonus
            };
            
            // Format dice string for logging
            const diceStrings = damageResult.rolls.map((roll, i) => 
              `d${damageResult.diceSize}: ${roll}`
            );
            
            // Log the spell save roll with damage
            logRoll({
              type: 'spell_save',
              name: ability.ability_name,
              dice: [{
                name: 'Damage Roll',
                dice: diceStrings,
                bonus: damageResult.bonus,
                total: damageResult.total
              }],
              details: {
                spellDC,
                saveType,
                damageType: damageType,
                damageDice: damageDice
              }
            });
          }
          
          useAction();
          setLastAttackResult(result);
          
          if (isHidden) {
            setHidden(false); // Casting spells breaks stealth
          }
        }
      } else if (action.type === 'healing') {
        // Only short rest and basic potion reach here (custom and long-rest handled earlier)
        result = performHealingRoll(action, activeCharacter?.current_hp || 0, activeCharacter);
        if (result.healingAmount !== undefined) {
          applyHealing(result.healingAmount);
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
          useBonusAction(); // Mark bonus action as used for stealth
        }
      }
      
      setRollPopup(prev => ({
        ...prev,
        phase: 'result',
        result
      }));
    }, 2000);
  }, [performAttackRoll, performSpellAttack, performStandardRoll, performHealingRoll, isHidden, activeCharacter?.current_hp, useAction, setHidden, applyHealing, setInitiativeRoll, toggleHidden, closeRollPopup]);

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
      applyDamage(damageData.finalDamage);
      const finalHP = Math.max(0, activeCharacter.current_hp - damageData.finalDamage);
      
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

  const handleApplyHealing = useCallback((healingAmount) => {
    if (healingAmount && healingAmount > 0) {
      applyHealing(healingAmount);
      
      // Log the custom healing
      logRoll({
        type: 'healing',
        name: 'Custom Healing',
        dice: [{
          name: 'Custom Heal',
          dice: [`${healingAmount} HP`],
          bonus: 0,
          total: healingAmount
        }],
        details: {
          healType: 'custom',
          finalHP: Math.min(activeCharacter?.max_hp || 100, (activeCharacter?.current_hp || 0) + healingAmount)
        }
      });
      
      closeRollPopup();
    }
  }, [applyHealing, logRoll, closeRollPopup, activeCharacter]);

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

  // Auth handlers
  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
  };


  // Show loading screen while authentication is in progress
  if (authLoading) {
    return LoadingScreen;
  }

  // Show auth screen if not authenticated
  if (!user) {
    return (
      <AuthScreen
        onGoogleSignIn={handleGoogleSignIn}
        loading={authLoading}
        error={authError}
      />
    );
  }

  // Main Battle Interface
  const BattleInterface = () => (
    <div className="p-4 md:p-6 space-y-6">
      <DefensivePanel
        character={activeCharacter}
        currentHP={activeCharacter?.current_hp || 0}
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
        character={activeCharacter}
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
        onActionSelect={handleActionSelect}
      />
    </div>
  );

  // Enhanced Stats Page using Supabase data
  const StatsPage = () => {
    const { activeCharacter, isLoading, error } = useCharacter();
    
    if (isLoading) {
      return (
        <div className="p-4 md:p-6 space-y-6">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl shadow-xl p-6 border-2 border-blue-600">
            <div className="animate-pulse text-white text-center">
              Loading character data...
            </div>
          </div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="p-4 md:p-6 space-y-6">
          <div className="bg-gradient-to-r from-red-900 to-red-800 rounded-2xl shadow-xl p-6 border-2 border-red-600">
            <div className="text-white text-center">
              Error loading character: {error}
            </div>
          </div>
        </div>
      );
    }
    
    if (!activeCharacter) {
      return (
        <div className="p-4 md:p-6 space-y-6">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl shadow-xl p-6 border-2 border-gray-600">
            <div className="text-white text-center">
              No character selected
            </div>
          </div>
        </div>
      );
    }
    
    // Helper function to calculate ability modifier
    const calcModifier = (score) => Math.floor((score - 10) / 2);
    
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl shadow-xl p-6 border-2 border-blue-600">
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
            <Shield className="mr-3 text-blue-400" size={32} />
            {activeCharacter.name} - {activeCharacter.race} {activeCharacter.character_class} (Level {activeCharacter.level})
          </h2>
          
          {/* Basic Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="text-center p-4 bg-red-900 rounded-xl border-2 border-red-600">
              <p className="text-sm text-red-300 font-semibold">HP</p>
              <p className="text-2xl font-bold text-white">{activeCharacter.current_hp}/{activeCharacter.max_hp}</p>
            </div>
            <div className="text-center p-4 bg-gray-800 rounded-xl border-2 border-gray-600">
              <p className="text-sm text-gray-300 font-semibold">AC</p>
              <p className="text-2xl font-bold text-white">{activeCharacter.armor_class}</p>
            </div>
            <div className="text-center p-4 bg-green-900 rounded-xl border-2 border-green-600">
              <p className="text-sm text-green-300 font-semibold">Initiative</p>
              <p className="text-2xl font-bold text-white">+{activeCharacter.initiative_bonus}</p>
            </div>
            <div className="text-center p-4 bg-blue-900 rounded-xl border-2 border-blue-600">
              <p className="text-sm text-blue-300 font-semibold">Speed</p>
              <p className="text-2xl font-bold text-white">{activeCharacter.speed} ft</p>
            </div>
          </div>
          
          {/* Ability Scores */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-4">Ability Scores</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-800 rounded-xl border-2 border-gray-600">
                <p className="text-sm text-gray-300 font-semibold">STR</p>
                <p className="text-2xl font-bold text-white">{activeCharacter.ability_scores.strength} ({calcModifier(activeCharacter.ability_scores.strength) >= 0 ? '+' : ''}{calcModifier(activeCharacter.ability_scores.strength)})</p>
              </div>
              <div className="text-center p-4 bg-gray-800 rounded-xl border-2 border-green-500">
                <p className="text-sm text-green-400 font-semibold">DEX</p>
                <p className="text-2xl font-bold text-green-400">{activeCharacter.ability_scores.dexterity} ({calcModifier(activeCharacter.ability_scores.dexterity) >= 0 ? '+' : ''}{calcModifier(activeCharacter.ability_scores.dexterity)})</p>
              </div>
              <div className="text-center p-4 bg-gray-800 rounded-xl border-2 border-gray-600">
                <p className="text-sm text-gray-300 font-semibold">CON</p>
                <p className="text-2xl font-bold text-white">{activeCharacter.ability_scores.constitution} ({calcModifier(activeCharacter.ability_scores.constitution) >= 0 ? '+' : ''}{calcModifier(activeCharacter.ability_scores.constitution)})</p>
              </div>
              <div className="text-center p-4 bg-gray-800 rounded-xl border-2 border-blue-500">
                <p className="text-sm text-blue-400 font-semibold">INT</p>
                <p className="text-2xl font-bold text-blue-400">{activeCharacter.ability_scores.intelligence} ({calcModifier(activeCharacter.ability_scores.intelligence) >= 0 ? '+' : ''}{calcModifier(activeCharacter.ability_scores.intelligence)})</p>
              </div>
              <div className="text-center p-4 bg-gray-800 rounded-xl border-2 border-purple-500">
                <p className="text-sm text-purple-400 font-semibold">WIS</p>
                <p className="text-2xl font-bold text-purple-400">{activeCharacter.ability_scores.wisdom} ({calcModifier(activeCharacter.ability_scores.wisdom) >= 0 ? '+' : ''}{calcModifier(activeCharacter.ability_scores.wisdom)})</p>
              </div>
              <div className="text-center p-4 bg-gray-800 rounded-xl border-2 border-yellow-500">
                <p className="text-sm text-yellow-400 font-semibold">CHA</p>
                <p className="text-2xl font-bold text-yellow-400">{activeCharacter.ability_scores.charisma} ({calcModifier(activeCharacter.ability_scores.charisma) >= 0 ? '+' : ''}{calcModifier(activeCharacter.ability_scores.charisma)})</p>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-4">Skills</h3>
            <div className="space-y-2">
              {[
                { id: 'acrobatics', name: 'Acrobatics', ability: 'dexterity' },
                { id: 'animalHandling', name: 'Animal Handling', ability: 'wisdom' },
                { id: 'arcana', name: 'Arcana', ability: 'intelligence' },
                { id: 'athletics', name: 'Athletics', ability: 'strength' },
                { id: 'deception', name: 'Deception', ability: 'charisma' },
                { id: 'history', name: 'History', ability: 'intelligence' },
                { id: 'insight', name: 'Insight', ability: 'wisdom' },
                { id: 'intimidation', name: 'Intimidation', ability: 'charisma' },
                { id: 'investigation', name: 'Investigation', ability: 'intelligence' },
                { id: 'medicine', name: 'Medicine', ability: 'wisdom' },
                { id: 'nature', name: 'Nature', ability: 'intelligence' },
                { id: 'perception', name: 'Perception', ability: 'wisdom' },
                { id: 'performance', name: 'Performance', ability: 'charisma' },
                { id: 'persuasion', name: 'Persuasion', ability: 'charisma' },
                { id: 'religion', name: 'Religion', ability: 'intelligence' },
                { id: 'sleightOfHand', name: 'Sleight of Hand', ability: 'dexterity' },
                { id: 'stealth', name: 'Stealth', ability: 'dexterity' },
                { id: 'survival', name: 'Survival', ability: 'wisdom' }
              ]
              .map((skill) => {
                const abilityMod = calcModifier(activeCharacter.ability_scores[skill.ability] || 10);
                const profBonus = calcProficiencyBonus(activeCharacter.level || 1);
                
                // Check for skill proficiency/expertise in character abilities
                const skillAbilities = activeCharacter.dnd_character_abilities || [];
                const skillProficiency = skillAbilities.find(ability => 
                  ability.ability_data?.skill === skill.id && 
                  (ability.ability_data?.proficiency_type === 'proficiency' || ability.ability_data?.proficiency_type === 'expertise')
                );
                
                let totalModifier = abilityMod;
                let isProficient = false;
                let hasExpertise = false;
                
                if (skillProficiency) {
                  isProficient = true;
                  if (skillProficiency.ability_data?.proficiency_type === 'expertise') {
                    hasExpertise = true;
                    totalModifier = abilityMod + (profBonus * 2); // Double proficiency for expertise
                  } else {
                    totalModifier = abilityMod + profBonus; // Single proficiency
                  }
                }
                
                return {
                  ...skill,
                  modifier: totalModifier,
                  isProficient,
                  hasExpertise
                };
              })
              .sort((a, b) => b.modifier - a.modifier)
              .map((skill) => (
                <div key={skill.id} className="bg-gray-800 p-3 rounded-lg border border-gray-600 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{skill.name}</span>
                    {skill.hasExpertise && (
                      <span className="text-xs bg-yellow-600 text-yellow-200 px-1 rounded font-bold">
                        EXP
                      </span>
                    )}
                    {skill.isProficient && !skill.hasExpertise && (
                      <span className="text-xs bg-green-600 text-green-200 px-1 rounded">
                        PROF
                      </span>
                    )}
                  </div>
                  <span className="text-lg font-bold text-blue-400">
                    {skill.modifier >= 0 ? '+' : ''}{skill.modifier}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Weapons */}
          {activeCharacter.dnd_character_weapons && activeCharacter.dnd_character_weapons.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Sword className="mr-2" size={20} />
                Weapons & Attacks
              </h3>
              <div className="grid gap-4">
                {activeCharacter.dnd_character_weapons.map((weapon, index) => (
                  <div key={index} className="bg-gray-800 p-4 rounded-xl border-2 border-red-600">
                    <h4 className="font-bold text-red-400 text-lg mb-2">{weapon.name}</h4>
                    <div className="grid md:grid-cols-2 gap-2 text-sm">
                      <p><strong className="text-gray-300">Attack Bonus:</strong> <span className="text-white">+{weapon.attack_bonus}</span></p>
                      <p><strong className="text-gray-300">Damage:</strong> <span className="text-white">{weapon.damage_dice}+{weapon.damage_bonus} {weapon.damage_type}</span></p>
                      {weapon.range_normal && (
                        <p><strong className="text-gray-300">Range:</strong> <span className="text-white">{weapon.range_normal} ft</span></p>
                      )}
                      {weapon.properties && (
                        <p><strong className="text-gray-300">Properties:</strong> <span className="text-white">{weapon.properties}</span></p>
                      )}
                    </div>
                    {weapon.description && (
                      <p className="text-gray-300 text-sm mt-2">{weapon.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Special Abilities */}
          {activeCharacter.dnd_character_abilities && activeCharacter.dnd_character_abilities.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Sparkles className="mr-2" size={20} />
                Special Abilities
              </h3>
              <div className="grid gap-4">
                {activeCharacter.dnd_character_abilities
                  .filter(ability => !ability.ability_data?.skill) // Exclude skill proficiencies
                  .map((ability, index) => {
                  // Color coding by ability type
                  const getAbilityColor = (featureType) => {
                    switch(featureType) {
                      case 'racial': return 'border-green-500 text-green-400';
                      case 'class': return 'border-blue-500 text-blue-400';
                      case 'patron': return 'border-purple-500 text-purple-400';
                      case 'invocation': return 'border-yellow-500 text-yellow-400';
                      case 'pact': return 'border-pink-500 text-pink-400';
                      case 'feat': return 'border-orange-500 text-orange-400';
                      case 'background': return 'border-cyan-500 text-cyan-400';
                      default: return 'border-gray-500 text-gray-400';
                    }
                  };
                  
                  const featureType = ability.ability_data?.feature_type || 'unknown';
                  const colorClass = getAbilityColor(featureType);
                  
                  // Find linked resource if it exists
                  const resourceLink = ability.ability_data?.resource_link;
                  const linkedResource = resourceLink ? 
                    activeCharacter.dnd_character_resources?.find(r => r.resource_name === resourceLink) : null;
                  
                  const hasUses = linkedResource || (ability.max_uses && ability.max_uses < 999);
                  const currentUses = linkedResource?.current_value || ability.uses_remaining;
                  const maxUses = linkedResource?.max_value || ability.max_uses;
                  
                  return (
                    <div key={ability.id} className={`bg-gray-800 p-4 rounded-xl border-2 ${colorClass}`}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className={`font-bold text-lg ${colorClass.split(' ')[1]}`}>{ability.ability_name}</h4>
                        {hasUses && (
                          <span className="text-sm bg-gray-700 px-2 py-1 rounded">
                            {currentUses}/{maxUses} uses
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mb-2 uppercase tracking-wide">
                        {ability.ability_type?.replace('_', ' ')}
                        {ability.recharge_type && ability.recharge_type !== 'encounter' && ` • ${ability.recharge_type.replace('_', ' ')}`}
                      </div>
                      <p className="text-gray-300 text-sm">{ability.ability_data?.description || 'No description available'}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Resources */}
          {activeCharacter.dnd_character_resources && activeCharacter.dnd_character_resources.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <BookOpen className="mr-2" size={20} />
                Resources
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {activeCharacter.dnd_character_resources.map((resource) => {
                  // Determine resource color based on type
                  const getResourceColor = (type) => {
                    switch(type) {
                      case 'spell_slot': return 'border-purple-600 text-purple-400';
                      case 'hit_dice': return 'border-red-600 text-red-400';
                      default: return 'border-indigo-600 text-indigo-400';
                    }
                  };
                  
                  const colorClass = getResourceColor(resource.resource_type);
                  
                  return (
                    <div key={resource.id} className={`bg-gray-800 p-4 rounded-xl border-2 ${colorClass.split(' ')[0]}`}>
                      <h4 className={`font-bold text-lg mb-2 ${colorClass.split(' ')[1]}`}>
                        {resource.resource_name}
                      </h4>
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-white">
                          {resource.current_value}/{resource.max_value}
                        </span>
                        {resource.level && (
                          <span className="text-xs text-gray-400 uppercase tracking-wide">
                            Level {resource.level}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const StoryPage = () => {
    const { activeCharacter, isLoading, error } = useCharacter();
    
    if (isLoading) {
      return (
        <div className="p-4 md:p-6 space-y-6">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl shadow-xl p-6 border-2 border-green-600">
            <div className="animate-pulse text-white text-center">
              Loading character story...
            </div>
          </div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="p-4 md:p-6 space-y-6">
          <div className="bg-gradient-to-r from-red-900 to-red-800 rounded-2xl shadow-xl p-6 border-2 border-red-600">
            <div className="text-white text-center">
              Error loading character: {error}
            </div>
          </div>
        </div>
      );
    }
    
    if (!activeCharacter) {
      return (
        <div className="p-4 md:p-6 space-y-6">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl shadow-xl p-6 border-2 border-gray-600">
            <div className="text-white text-center">
              No character selected
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl shadow-xl p-6 border-2 border-green-600">
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
            <User className="mr-3 text-green-400" size={32} />
            Character Story
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Profile Picture Section */}
            <div className="md:col-span-1">
              <div className="bg-gray-800 rounded-xl p-6 border-2 border-green-500">
                <div className="flex flex-col items-center text-center">
                  <ProfilePictureUpload
                    currentImage={activeCharacter.profile_image}
                    onImageChange={async (imageUrl) => {
                      await updateCharacterState(activeCharacter.id, { profile_image: imageUrl });
                    }}
                    characterName={activeCharacter.name}
                  />
                  <h3 className="text-2xl font-bold text-white mb-2 mt-4">{activeCharacter.name}</h3>
                  <p className="text-green-400 font-medium">{activeCharacter.race} {activeCharacter.character_class}</p>
                  <p className="text-gray-300">Level {activeCharacter.level}</p>
                </div>
              </div>
            </div>
            
            {/* Character Details Section */}
            <div className="md:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-800 rounded-xl p-6 border-2 border-blue-500">
                <h4 className="text-xl font-bold text-blue-400 mb-4 flex items-center">
                  <BookOpen className="mr-2" size={20} />
                  Character Basics
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm font-semibold mb-1">Race</p>
                    <p className="text-white text-lg">{activeCharacter.race}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm font-semibold mb-1">Class</p>
                    <p className="text-white text-lg">{activeCharacter.character_class}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm font-semibold mb-1">Level</p>
                    <p className="text-white text-lg">{activeCharacter.level}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm font-semibold mb-1">Background</p>
                    <EditableField
                      value={activeCharacter.background}
                      onSave={async (value) => {
                        await updateCharacterState(activeCharacter.id, { background: value });
                      }}
                      placeholder="Choose a background (e.g., Acolyte, Criminal, Folk Hero)"
                      className="text-white text-lg -m-3 -mb-1"
                    />
                  </div>
                </div>
              </div>
              
              {/* Backstory Section */}
              <div className="bg-gray-800 rounded-xl p-6 border-2 border-purple-500">
                <h4 className="text-xl font-bold text-purple-400 mb-4 flex items-center">
                  <BookOpen className="mr-2" size={20} />
                  Backstory
                </h4>
                <EditableField
                  value={activeCharacter.backstory}
                  onSave={async (value) => {
                    await updateCharacterState(activeCharacter.id, { backstory: value });
                  }}
                  placeholder="Tell the story of your character's past. Where did they come from? What shaped them into who they are today?"
                  multiline={true}
                  className="text-gray-300 leading-relaxed"
                />
              </div>
              
              {/* Motives & Goals Section */}
              <div className="bg-gray-800 rounded-xl p-6 border-2 border-yellow-500">
                <h4 className="text-xl font-bold text-yellow-400 mb-4 flex items-center">
                  <Sparkles className="mr-2" size={20} />
                  Motives & Goals
                </h4>
                <EditableField
                  value={activeCharacter.motives}
                  onSave={async (value) => {
                    await updateCharacterState(activeCharacter.id, { motives: value });
                  }}
                  placeholder="What drives this character? What are their goals and aspirations? What do they hope to achieve?"
                  multiline={true}
                  className="text-gray-300 leading-relaxed"
                />
              </div>
              
              {/* Personality Traits */}
              <div className="bg-gray-800 rounded-xl p-6 border-2 border-pink-500">
                <h4 className="text-xl font-bold text-pink-400 mb-4 flex items-center">
                  <User className="mr-2" size={20} />
                  Personality
                </h4>
                <div className="grid md:grid-cols-2 gap-4 text-gray-300">
                  <div>
                    <p className="text-pink-300 font-semibold mb-2">Personality Traits</p>
                    <EditableField
                      value={activeCharacter.personality_traits}
                      onSave={async (value) => {
                        await updateCharacterState(activeCharacter.id, { personality_traits: value });
                      }}
                      placeholder="How does your character act? What are their mannerisms and quirks?"
                      multiline={true}
                      className="text-sm leading-relaxed"
                    />
                  </div>
                  <div>
                    <p className="text-pink-300 font-semibold mb-2">Ideals</p>
                    <EditableField
                      value={activeCharacter.ideals}
                      onSave={async (value) => {
                        await updateCharacterState(activeCharacter.id, { ideals: value });
                      }}
                      placeholder="What principles drive your character? What do they believe in?"
                      multiline={true}
                      className="text-sm leading-relaxed"
                    />
                  </div>
                  <div>
                    <p className="text-pink-300 font-semibold mb-2">Bonds</p>
                    <EditableField
                      value={activeCharacter.bonds}
                      onSave={async (value) => {
                        await updateCharacterState(activeCharacter.id, { bonds: value });
                      }}
                      placeholder="Who or what is important to your character? What connections do they have?"
                      multiline={true}
                      className="text-sm leading-relaxed"
                    />
                  </div>
                  <div>
                    <p className="text-pink-300 font-semibold mb-2">Flaws</p>
                    <EditableField
                      value={activeCharacter.flaws}
                      onSave={async (value) => {
                        await updateCharacterState(activeCharacter.id, { flaws: value });
                      }}
                      placeholder="What are your character's weaknesses or vices? What gets them in trouble?"
                      multiline={true}
                      className="text-sm leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen transition-all duration-1000 ${
      isHidden 
        ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-black'
        : 'bg-gradient-to-br from-gray-800 via-gray-900 to-black'
    }`}>
      
      {/* Responsive Navigation */}
      <nav className={`shadow-2xl border-b-4 transition-all duration-1000 ${
        isHidden 
          ? 'bg-gray-900 border-purple-600'
          : 'bg-gray-800 border-gray-600'
      }`}>
        {/* Desktop Navigation (hidden on mobile) */}
        <div className="hidden md:block max-w-6xl mx-auto px-4">
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
                    ? 'text-gray-300 active:text-purple-400 active:bg-gray-800 rounded-t-lg'
                    : 'text-gray-300 active:text-blue-400 active:bg-gray-700 rounded-t-lg'
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
                    ? 'text-gray-300 active:text-purple-400 active:bg-gray-800 rounded-t-lg'
                    : 'text-gray-300 active:text-blue-400 active:bg-gray-700 rounded-t-lg'
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
                    ? 'text-gray-300 active:text-purple-400 active:bg-gray-800 rounded-t-lg'
                    : 'text-gray-300 active:text-blue-400 active:bg-gray-700 rounded-t-lg'
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
                    ? 'text-gray-300 active:text-purple-400 active:bg-gray-800 rounded-t-lg'
                    : 'text-gray-300 active:text-green-400 active:bg-gray-700 rounded-t-lg'
              }`}
            >
              <BookOpen size={24} />
              <span className="text-lg">Journal</span>
            </button>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Character Toggle in Navigation */}
              <CharacterToggle
                currentCharacterId={activeCharacter?.id || ''}
                switchCharacter={switchCharacter}
                currentCharacter={activeCharacter}
                className="py-2"
              />
              
              {/* Sign Out Button */}
              {user && (
                <button
                  onClick={signOut}
                  className="text-gray-400 active:text-red-400 transition-colors duration-200 px-3 py-2 rounded-lg active:bg-gray-800"
                  title="Sign Out"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16,17V14H9V10H16V7L21,12L16,17M14,2A2,2 0 0,1 16,4V6H14V4H5V20H14V18H16V20A2,2 0 0,1 14,22H5A2,2 0 0,1 3,20V4A2,2 0 0,1 5,2H14Z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation (visible only on mobile) */}
        <div className="md:hidden">
          <MobileNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isHidden={isHidden}
            activeCharacter={activeCharacter}
            switchCharacter={switchCharacter}
            user={user}
            signOut={signOut}
          />
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
        character={activeCharacter}
        currentHP={activeCharacter?.current_hp || 0}
        damageInput={damageInput}
        rollLogs={rollLogs}
        onClose={closeRollPopup}
        onSearchTermChange={handleSearchTermChange}
        onActionSelect={handleActionSelect}
        onDamageInputChange={handleDamageInputChange}
        onApplyDamage={handleApplyDamage}
        onApplyHealing={handleApplyHealing}
        onClearHistory={clearLogs}
        onPhaseChange={handlePhaseChange}
      />
    </div>
  );
};

// Wrap the app with CharacterProvider
const App = () => (
  <CharacterProvider>
    <DnDCompanionApp />
  </CharacterProvider>
);

export default App;