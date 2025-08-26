// Character Manager - Centralized character management and business logic
// Coordinates between CharacterStorage and the application state

import { CharacterStorage } from './characterStorage.js';
import { createCharacter } from '../data/characterSystem.js';
import { getAllSkillsData, getSkillData, SKILLS } from '../data/skillsSystem.js';

export class CharacterManager {
  // Initialize the character system
  static async initialize() {
    try {
      // Check if we have any characters stored
      const characters = CharacterStorage.getAllCharacters();
      
      if (Object.keys(characters).length === 0) {
        // No characters exist, create default character from current data
        const defaultCharacter = this.createCharacterFromTemplate('rogueScout');
        CharacterStorage.saveCharacter(defaultCharacter);
        CharacterStorage.setCurrentCharacter(defaultCharacter.id);
        
        console.log('Character system initialized with default character');
        return defaultCharacter;
      }
      
      // Characters exist, load current character
      const currentCharacterId = CharacterStorage.getCurrentCharacterId();
      if (currentCharacterId) {
        const currentCharacter = CharacterStorage.getCharacter(currentCharacterId);
        if (currentCharacter) {
          return currentCharacter;
        }
      }
      
      // Fallback: use the most recently played character
      const characterList = CharacterStorage.getCharacterList();
      if (characterList.length > 0) {
        const mostRecent = characterList[0];
        CharacterStorage.setCurrentCharacter(mostRecent.id);
        return CharacterStorage.getCharacter(mostRecent.id);
      }
      
      // Should not reach here, but create default as fallback
      const defaultCharacter = this.createCharacterFromTemplate('rogueScout');
      CharacterStorage.saveCharacter(defaultCharacter);
      CharacterStorage.setCurrentCharacter(defaultCharacter.id);
      return defaultCharacter;
      
    } catch (error) {
      console.error('Failed to initialize character system:', error);
      // Return a basic character to prevent app crashes
      return this.createCharacterFromTemplate('rogueScout');
    }
  }
  
  // Create a character from a template
  static createCharacterFromTemplate(templateName, customizations = {}) {
    // Templates removed - create basic character structure
    console.warn('Character templates have been removed from the codebase');
    
    return {
      name: 'New Character',
      race: 'Human',
      characterClass: 'Fighter',
      level: 1,
      abilityScores: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
      },
      maxHP: 10,
      ac: 10,
      ...customizations,
      id: `character-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }
  
  // Create a custom character
  static createCustomCharacter(characterData) {
    try {
      // Validate required fields
      if (!characterData.name || !characterData.race || !characterData.characterClass) {
        throw new Error('Missing required character fields: name, race, or class');
      }
      
      const character = createCharacter({
        ...characterData,
        id: `character-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      });
      
      // Validate the created character
      this.validateCharacter(character);
      
      return character;
    } catch (error) {
      console.error('Failed to create custom character:', error);
      throw error;
    }
  }
  
  // Switch to a different character
  static async switchCharacter(characterId) {
    try {
      // Get the target character
      const targetCharacter = CharacterStorage.getCharacter(characterId);
      if (!targetCharacter) {
        throw new Error(`Character not found: ${characterId}`);
      }
      
      // Save current character's game state if there is one
      const currentCharacterId = CharacterStorage.getCurrentCharacterId();
      if (currentCharacterId && currentCharacterId !== characterId) {
        // This would be called by the component using CharacterManager
        // We'll define the interface here but the component handles saving state
        console.log('Character switch requested, component should save current state');
      }
      
      // Set new current character
      CharacterStorage.setCurrentCharacter(characterId);
      
      // Update last played timestamp
      const updatedCharacter = {
        ...targetCharacter,
        lastPlayed: new Date().toISOString()
      };
      CharacterStorage.saveCharacter(updatedCharacter);
      
      return updatedCharacter;
    } catch (error) {
      console.error('Failed to switch character:', error);
      throw error;
    }
  }
  
  // Get current character with calculated skills
  static getCurrentCharacter() {
    try {
      const currentCharacterId = CharacterStorage.getCurrentCharacterId();
      if (!currentCharacterId) return null;
      
      const character = CharacterStorage.getCharacter(currentCharacterId);
      if (!character) return null;
      
      // Add calculated skills for backward compatibility and skills system integration
      return this.enhanceCharacterWithSkills(character);
    } catch (error) {
      console.error('Failed to get current character:', error);
      return null;
    }
  }
  
  // Enhance character with calculated skills for backward compatibility
  static enhanceCharacterWithSkills(character) {
    try {
      // Get all skills data using the new unified system
      const allSkillsData = getAllSkillsData(character);
      
      // Create legacy skills format for existing components
      const legacySkills = {};
      Object.keys(SKILLS).forEach(skillKey => {
        legacySkills[skillKey] = character.skills[skillKey] || 0;
      });
      
      return {
        ...character,
        skills: legacySkills, // For backward compatibility
        calculatedSkills: allSkillsData, // For skills system
        abilityMods: character.abilityModifiers // For backward compatibility
      };
    } catch (error) {
      console.error('Failed to enhance character with skills:', error);
      return character;
    }
  }
  
  // Get all available characters
  static getCharacterList() {
    return CharacterStorage.getCharacterList();
  }
  
  // Save character data
  static saveCharacter(character) {
    try {
      this.validateCharacter(character);
      return CharacterStorage.saveCharacter(character);
    } catch (error) {
      console.error('Failed to save character:', error);
      return false;
    }
  }
  
  // Delete a character
  static deleteCharacter(characterId) {
    try {
      // Don't allow deleting the last character
      const characterList = CharacterStorage.getCharacterList();
      if (characterList.length <= 1) {
        throw new Error('Cannot delete the last character');
      }
      
      const currentCharacterId = CharacterStorage.getCurrentCharacterId();
      const success = CharacterStorage.deleteCharacter(characterId);
      
      // If we deleted the current character, switch to another one
      if (success && currentCharacterId === characterId) {
        const remainingCharacters = CharacterStorage.getCharacterList();
        if (remainingCharacters.length > 0) {
          CharacterStorage.setCurrentCharacter(remainingCharacters[0].id);
        }
      }
      
      return success;
    } catch (error) {
      console.error('Failed to delete character:', error);
      throw error;
    }
  }
  
  // Validate character data
  static validateCharacter(character) {
    const requiredFields = ['id', 'name', 'race', 'class', 'level', 'abilityScores'];
    
    for (const field of requiredFields) {
      if (!character[field]) {
        throw new Error(`Character missing required field: ${field}`);
      }
    }
    
    // Validate ability scores
    const requiredAbilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    for (const ability of requiredAbilities) {
      if (typeof character.abilityScores[ability] !== 'number') {
        throw new Error(`Invalid ability score for ${ability}`);
      }
    }
    
    // Validate level
    if (character.level < 1 || character.level > 20) {
      throw new Error('Character level must be between 1 and 20');
    }
    
    return true;
  }
  
  // Character game state management
  static saveCharacterGameState(characterId, gameState) {
    return CharacterStorage.saveCharacterGameState(characterId, gameState);
  }
  
  static getCharacterGameState(characterId) {
    return CharacterStorage.getCharacterGameState(characterId);
  }
  
  static getCurrentCharacterGameState() {
    const currentCharacterId = CharacterStorage.getCurrentCharacterId();
    if (!currentCharacterId) return null;
    
    return CharacterStorage.getCharacterGameState(currentCharacterId);
  }
  
  // Export/Import functionality
  static exportCharacter(characterId) {
    return CharacterStorage.exportCharacter(characterId);
  }
  
  static importCharacter(exportData) {
    const character = CharacterStorage.importCharacter(exportData);
    if (character) {
      // Validate the imported character
      this.validateCharacter(character);
    }
    return character;
  }
  
  // Helper methods for character creation UI
  static getAvailableTemplates() {
    return [{
      id: 'rogueScout',
      name: 'Rogue Scout',
      race: 'Yuan-ti',
      characterClass: 'Rogue (Scout)',
      level: 5,
      weapons: ['rapier', 'shortbow'],
      defensiveAbilities: ['uncanny-dodge', 'cunning-action', 'magic-resistance', 'poison-immunity']
    }];
  }
  
  // Calculate character statistics for display
  static getCharacterStats(character) {
    try {
      const enhancedCharacter = this.enhanceCharacterWithSkills(character);
      
      return {
        basicInfo: {
          name: character.name,
          race: character.race,
          class: character.class,
          level: character.level
        },
        combat: {
          hp: character.maxHP,
          ac: character.ac,
          initiative: character.initiative,
          proficiencyBonus: character.proficiencyBonus
        },
        abilities: character.abilityScores,
        abilityModifiers: character.abilityModifiers,
        skills: enhancedCharacter.calculatedSkills,
        equipment: {
          weapons: Object.keys(character.weapons || {}),
          defensiveAbilities: Object.keys(character.defensiveAbilities || {})
        }
      };
    } catch (error) {
      console.error('Failed to get character stats:', error);
      return null;
    }
  }
  
  // Debug and maintenance methods
  static getStorageStats() {
    return CharacterStorage.getStorageStats();
  }
  
  static clearAllData() {
    return CharacterStorage.clearAllData();
  }
}