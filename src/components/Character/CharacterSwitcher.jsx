import React, { useState, useEffect, useRef } from 'react';
import { useCharacter } from '../../contexts/CharacterContext.tsx';
import { useCharacterOperations } from '../../hooks/useCharacterData';

const CharacterSwitcher = ({ className = "" }) => {
  const {
    characters,
    activeCharacter,
    switchCharacter,
    isLoading,
    error
  } = useCharacter();

  const { createCharacter } = useCharacterOperations();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCharacterName, setNewCharacterName] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowCreateForm(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSwitchCharacter = async (characterId) => {
    await switchCharacter(characterId);
    setIsOpen(false);
  };

  const handleCreateCharacter = async (e) => {
    e.preventDefault();
    if (!newCharacterName.trim()) return;

    const newCharacter = await createCharacter({
      name: newCharacterName.trim()
    });

    if (newCharacter) {
      setNewCharacterName('');
      setShowCreateForm(false);
      setIsOpen(false);
      // Switch to the new character
      await switchCharacter(newCharacter.id);
    }
  };

  const getCharacterStatusColor = (character) => {
    if (character.current_hp <= 0) return 'text-red-500';
    if (character.current_hp < character.max_hp * 0.25) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getCharacterStatusIcon = (character) => {
    if (character.current_hp <= 0) return '💀';
    if (character.current_hp < character.max_hp * 0.5) return '🤕';
    if (character.conditions?.length > 0) return '😵‍💫';
    return '😊';
  };

  if (isLoading) {
    return (
      <div className={`character-switcher ${className}`}>
        <div className="animate-pulse bg-gray-200 rounded-lg p-3">
          <div className="h-4 bg-gray-300 rounded w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`character-switcher relative ${className}`} ref={dropdownRef}>
      {/* Current Character Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-300 focus:border-blue-500 focus:outline-none transition-colors duration-200 shadow-sm"
      >
        {activeCharacter ? (
          <div className="flex items-center space-x-3">
            <span className="text-lg">
              {getCharacterStatusIcon(activeCharacter)}
            </span>
            <div className="text-left">
              <div className="font-semibold text-gray-900">
                {activeCharacter.name}
              </div>
              <div className="text-sm text-gray-500">
                Level {activeCharacter.level} {activeCharacter.race} {activeCharacter.character_class}
              </div>
              <div className={`text-xs ${getCharacterStatusColor(activeCharacter)}`}>
                HP: {activeCharacter.current_hp}/{activeCharacter.max_hp}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">No character selected</div>
        )}
        
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border-b border-red-200">
              {error}
            </div>
          )}

          {/* Character List */}
          {characters.length > 0 && (
            <div className="py-1">
              {characters.map((character) => (
                <button
                  key={character.id}
                  onClick={() => handleSwitchCharacter(character.id)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors duration-150 ${
                    activeCharacter?.id === character.id
                      ? 'bg-blue-50 border-r-4 border-blue-500'
                      : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-sm">
                      {getCharacterStatusIcon(character)}
                    </span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {character.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        Level {character.level} {character.race} {character.character_class}
                      </div>
                      <div className={`text-xs ${getCharacterStatusColor(character)}`}>
                        HP: {character.current_hp}/{character.max_hp}
                        {character.conditions?.length > 0 && (
                          <span className="ml-2 text-orange-500">
                            ({character.conditions.join(', ')})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Create Character Section */}
          <div className="border-t border-gray-200">
            {showCreateForm ? (
              <form onSubmit={handleCreateCharacter} className="p-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newCharacterName}
                    onChange={(e) => setNewCharacterName(e.target.value)}
                    placeholder="Character name..."
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                    autoFocus
                    maxLength={50}
                  />
                  <button
                    type="submit"
                    disabled={!newCharacterName.trim()}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewCharacterName('');
                    }}
                    className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors duration-150"
              >
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span>Create New Character</span>
                </div>
              </button>
            )}
          </div>

          {characters.length === 0 && !showCreateForm && (
            <div className="p-4 text-center text-gray-500">
              <div className="mb-2">No characters yet</div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Create your first character
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CharacterSwitcher;