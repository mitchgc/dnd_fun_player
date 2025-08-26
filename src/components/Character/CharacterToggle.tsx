import React, { useState } from 'react'
import { User, ChevronDown } from 'lucide-react'

import { useCharacter } from '../../contexts/CharacterContext';

/**
 * Compact Character Dropdown Component
 * 
 * Uses Supabase character data and CharacterContext
 */
const CharacterDropdown = ({ currentCharacterId, switchCharacter, currentCharacter, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const { characters } = useCharacter(); // Get all available characters
  
  const handleCharacterSelect = (characterId) => {
    switchCharacter(characterId)
    setIsOpen(false)
  }
  
  // If no character is loaded, show placeholder
  if (!currentCharacter) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700/80 text-white">
          <User className="w-5 h-5" />
          <div className="text-sm text-gray-300">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700/80 backdrop-blur-sm border border-gray-600/50 text-white hover:bg-gray-600/80 transition-all duration-200"
      >
        <User className="w-5 h-5" />
        <div className="text-left hidden sm:block">
          <div className="text-sm font-medium">{currentCharacter.name}</div>
          <div className="text-xs text-gray-300">Level {currentCharacter.level}</div>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 w-64 bg-gray-800/95 backdrop-blur-sm border border-gray-600/50 rounded-lg shadow-xl z-20">
            {characters && characters.length > 0 ? (
              characters.map((char) => (
                <button
                  key={char.id}
                  onClick={() => handleCharacterSelect(char.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-700/80 transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg ${
                    char.id === currentCharacterId ? 'bg-gray-700/60' : ''
                  }`}
                >
                  <User className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <div className="font-medium text-white">{char.name}</div>
                    <div className="text-sm text-gray-300">
                      Level {char.level} {char.race} {char.character_class}
                    </div>
                    <div className="text-xs text-gray-400">
                      HP: {char.current_hp}/{char.max_hp} • AC: {char.armor_class}
                    </div>
                  </div>
                  {char.id === currentCharacterId && (
                    <div className="text-green-400">✓</div>
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-400">
                No characters available
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

const CharacterToggle = CharacterDropdown;
export default CharacterToggle;