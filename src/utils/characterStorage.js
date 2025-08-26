// Character storage service for handling localStorage persistence
// Manages multiple characters and current character selection

const STORAGE_KEYS = {
  CHARACTERS: 'dnd-helper-characters',
  CURRENT_CHARACTER_ID: 'dnd-helper-current-character',
  CHARACTER_GAME_STATE: 'dnd-helper-character-states' // Per-character game state
};

export class CharacterStorage {
  // Save a character to localStorage
  static saveCharacter(character) {
    try {
      const characters = this.getAllCharacters();
      characters[character.id] = {
        ...character,
        lastPlayed: new Date().toISOString()
      };
      
      localStorage.setItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(characters));
      return true;
    } catch (error) {
      console.error('Failed to save character:', error);
      return false;
    }
  }
  
  // Get a specific character by ID
  static getCharacter(characterId) {
    try {
      const characters = this.getAllCharacters();
      return characters[characterId] || null;
    } catch (error) {
      console.error('Failed to get character:', error);
      return null;
    }
  }
  
  // Get all characters
  static getAllCharacters() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CHARACTERS);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to get all characters:', error);
      return {};
    }
  }
  
  // Get array of character summaries for UI
  static getCharacterList() {
    try {
      const characters = this.getAllCharacters();
      return Object.values(characters).map(char => ({
        id: char.id,
        name: char.name,
        race: char.race,
        class: char.class,
        level: char.level,
        lastPlayed: char.lastPlayed
      })).sort((a, b) => new Date(b.lastPlayed) - new Date(a.lastPlayed));
    } catch (error) {
      console.error('Failed to get character list:', error);
      return [];
    }
  }
  
  // Delete a character
  static deleteCharacter(characterId) {
    try {
      const characters = this.getAllCharacters();
      delete characters[characterId];
      
      localStorage.setItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(characters));
      
      // If this was the current character, clear current selection
      if (this.getCurrentCharacterId() === characterId) {
        this.clearCurrentCharacter();
      }
      
      // Clear any game state for this character
      this.clearCharacterGameState(characterId);
      
      return true;
    } catch (error) {
      console.error('Failed to delete character:', error);
      return false;
    }
  }
  
  // Set the current active character
  static setCurrentCharacter(characterId) {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_CHARACTER_ID, characterId);
      return true;
    } catch (error) {
      console.error('Failed to set current character:', error);
      return false;
    }
  }
  
  // Get the current active character ID
  static getCurrentCharacterId() {
    try {
      return localStorage.getItem(STORAGE_KEYS.CURRENT_CHARACTER_ID);
    } catch (error) {
      console.error('Failed to get current character ID:', error);
      return null;
    }
  }
  
  // Clear current character selection
  static clearCurrentCharacter() {
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_CHARACTER_ID);
      return true;
    } catch (error) {
      console.error('Failed to clear current character:', error);
      return false;
    }
  }
  
  // Save character-specific game state (HP, turn state, etc.)
  static saveCharacterGameState(characterId, gameState) {
    try {
      const allStates = this.getAllCharacterGameStates();
      allStates[characterId] = {
        ...gameState,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(STORAGE_KEYS.CHARACTER_GAME_STATE, JSON.stringify(allStates));
      return true;
    } catch (error) {
      console.error('Failed to save character game state:', error);
      return false;
    }
  }
  
  // Get character-specific game state
  static getCharacterGameState(characterId) {
    try {
      const allStates = this.getAllCharacterGameStates();
      return allStates[characterId] || null;
    } catch (error) {
      console.error('Failed to get character game state:', error);
      return null;
    }
  }
  
  // Get all character game states
  static getAllCharacterGameStates() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CHARACTER_GAME_STATE);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to get all character game states:', error);
      return {};
    }
  }
  
  // Clear game state for a specific character
  static clearCharacterGameState(characterId) {
    try {
      const allStates = this.getAllCharacterGameStates();
      delete allStates[characterId];
      
      localStorage.setItem(STORAGE_KEYS.CHARACTER_GAME_STATE, JSON.stringify(allStates));
      return true;
    } catch (error) {
      console.error('Failed to clear character game state:', error);
      return false;
    }
  }
  
  // Initialize storage with default character (migration helper)
  static initializeWithDefaultCharacter(defaultCharacter) {
    try {
      // Check if we already have characters
      const existingCharacters = this.getAllCharacters();
      if (Object.keys(existingCharacters).length > 0) {
        return; // Already initialized
      }
      
      // Save the default character
      this.saveCharacter(defaultCharacter);
      this.setCurrentCharacter(defaultCharacter.id);
      
      console.log('Initialized character storage with default character');
    } catch (error) {
      console.error('Failed to initialize character storage:', error);
    }
  }
  
  // Export character data for backup/sharing
  static exportCharacter(characterId) {
    try {
      const character = this.getCharacter(characterId);
      if (!character) return null;
      
      const gameState = this.getCharacterGameState(characterId);
      
      return {
        character,
        gameState,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
    } catch (error) {
      console.error('Failed to export character:', error);
      return null;
    }
  }
  
  // Import character data from backup/sharing
  static importCharacter(exportData) {
    try {
      if (!exportData || !exportData.character) {
        throw new Error('Invalid export data');
      }
      
      const character = exportData.character;
      
      // Generate new ID to avoid conflicts
      const newId = `character-${Date.now()}`;
      const importedCharacter = {
        ...character,
        id: newId,
        name: `${character.name} (Imported)`,
        createdAt: new Date().toISOString()
      };
      
      // Save character
      this.saveCharacter(importedCharacter);
      
      // Import game state if available
      if (exportData.gameState) {
        this.saveCharacterGameState(newId, exportData.gameState);
      }
      
      return importedCharacter;
    } catch (error) {
      console.error('Failed to import character:', error);
      return null;
    }
  }
  
  // Clear all data (for debugging/reset)
  static clearAllData() {
    try {
      localStorage.removeItem(STORAGE_KEYS.CHARACTERS);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_CHARACTER_ID);
      localStorage.removeItem(STORAGE_KEYS.CHARACTER_GAME_STATE);
      return true;
    } catch (error) {
      console.error('Failed to clear all data:', error);
      return false;
    }
  }
  
  // Get storage statistics
  static getStorageStats() {
    try {
      const characters = this.getAllCharacters();
      const gameStates = this.getAllCharacterGameStates();
      
      return {
        characterCount: Object.keys(characters).length,
        currentCharacterId: this.getCurrentCharacterId(),
        gameStateCount: Object.keys(gameStates).length,
        storageSize: {
          characters: JSON.stringify(characters).length,
          gameStates: JSON.stringify(gameStates).length
        }
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return null;
    }
  }
}