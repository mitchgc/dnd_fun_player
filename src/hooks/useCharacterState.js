import { useState, useCallback, useEffect } from 'react';
import { getSelectedCharacter, setSelectedCharacter, getCurrentCharacterId, CHARACTERS } from '../data/rollActions';

export const useCharacterState = () => {
  // Character switching state
  const [currentCharacterId, setCurrentCharacterIdState] = useState(getCurrentCharacterId());
  const [character, setCharacter] = useState(getSelectedCharacter());
  
  // Separate state for each character
  const [characterStates, setCharacterStates] = useState({
    chels: {
      currentHP: CHARACTERS.chels.maxHP,
      isHidden: false,
      initiative: null,
      turnState: {
        actionUsed: false,
        bonusActionUsed: false,
        movementUsed: 0
      }
    },
    emba: {
      currentHP: CHARACTERS.emba.maxHP,
      isHidden: false,
      initiative: null,
      turnState: {
        actionUsed: false,
        bonusActionUsed: false,
        movementUsed: 0
      }
    }
  });
  
  // Get current character's state
  const currentState = characterStates[currentCharacterId];
  
  // Character switching function
  const switchCharacter = useCallback((newCharacterId) => {
    if (CHARACTERS[newCharacterId]) {
      setSelectedCharacter(newCharacterId);
      setCurrentCharacterIdState(newCharacterId);
      setCharacter(CHARACTERS[newCharacterId]);
      return true;
    }
    return false;
  }, []);
  
  // Helper to update current character's state
  const updateCurrentCharacterState = useCallback((updates) => {
    setCharacterStates(prev => ({
      ...prev,
      [currentCharacterId]: {
        ...prev[currentCharacterId],
        ...updates
      }
    }));
  }, [currentCharacterId]);

  // Action handlers
  const useAction = useCallback(() => {
    updateCurrentCharacterState({
      turnState: {
        ...currentState.turnState,
        actionUsed: true
      }
    });
  }, [updateCurrentCharacterState, currentState]);

  const useBonusAction = useCallback(() => {
    updateCurrentCharacterState({
      turnState: {
        ...currentState.turnState,
        bonusActionUsed: true
      }
    });
  }, [updateCurrentCharacterState, currentState]);

  const resetTurn = useCallback(() => {
    updateCurrentCharacterState({
      turnState: {
        actionUsed: false,
        bonusActionUsed: false,
        movementUsed: 0
      }
    });
  }, [updateCurrentCharacterState]);

  // HP management
  const adjustHP = useCallback((amount) => {
    const newHP = Math.max(0, Math.min(character.maxHP, currentState.currentHP + amount));
    updateCurrentCharacterState({ currentHP: newHP });
  }, [updateCurrentCharacterState, character.maxHP, currentState.currentHP]);

  const setHP = useCallback((newHP) => {
    const clampedHP = Math.max(0, Math.min(character.maxHP, newHP));
    updateCurrentCharacterState({ currentHP: clampedHP });
  }, [updateCurrentCharacterState, character.maxHP]);

  // Stealth management
  const toggleHidden = useCallback(() => {
    updateCurrentCharacterState({ isHidden: !currentState.isHidden });
  }, [updateCurrentCharacterState, currentState.isHidden]);

  const setHidden = useCallback((hidden) => {
    updateCurrentCharacterState({ isHidden: hidden });
  }, [updateCurrentCharacterState]);

  // Initiative management
  const setInitiativeRoll = useCallback((initiativeData) => {
    updateCurrentCharacterState({ initiative: initiativeData });
  }, [updateCurrentCharacterState]);

  // Apply damage with defensive abilities
  const applyDamage = useCallback((damageData) => {
    const finalDamage = damageData.finalDamage;
    const newHP = Math.max(0, currentState.currentHP - finalDamage);
    updateCurrentCharacterState({ currentHP: newHP });
    
    // Handle defensive ability usage
    if (damageData.selectedDefenses.includes('uncanny-dodge')) {
      // In a full implementation, would track per-turn usage
      // For now, we'll just apply the damage reduction
    }
    
    return newHP;
  }, [currentState.currentHP, updateCurrentCharacterState]);

  // Apply healing
  const applyHealing = useCallback((healingAmount, healType = 'normal') => {
    let newHP;
    if (healType === 'long-rest') {
      newHP = character.maxHP;
    } else {
      newHP = Math.min(character.maxHP, currentState.currentHP + healingAmount);
    }
    updateCurrentCharacterState({ currentHP: newHP });
    return newHP;
  }, [currentState.currentHP, character.maxHP, updateCurrentCharacterState]);

  return {
    // Character switching
    currentCharacterId,
    switchCharacter,
    
    // Current character state
    currentHP: currentState.currentHP,
    isHidden: currentState.isHidden,
    initiative: currentState.initiative,
    turnState: currentState.turnState,
    
    // Actions
    useAction,
    useBonusAction,
    resetTurn,
    
    // HP Management
    adjustHP,
    setHP,
    applyDamage,
    applyHealing,
    
    // Stealth
    toggleHidden,
    setHidden,
    
    // Initiative
    setInitiativeRoll,
    
    // Character data
    character
  };
};