import React, { useState } from 'react'
import { User, ChevronDown } from 'lucide-react'

/**
 * Compact Character Dropdown Component
 * 
 * Simple dropdown in the top right for switching between Chels and Emba
 */
const CharacterDropdown = ({ currentCharacterId, switchCharacter, currentCharacter, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)
  
  const characters = {
    chels: {
      id: 'chels',
      name: 'Chels',
      race: 'Yuan-ti',
      class: 'Rogue (Scout)',
      level: 5,
      icon: '🐍',
      color: 'green',
      description: 'Stealthy scout'
    },
    emba: {
      id: 'emba', 
      name: 'Emba',
      race: 'Kobold',
      class: 'Warlock (Efreeti)',
      level: 5,
      icon: '🔥',
      color: 'purple',
      description: 'Fire magic warlock'
    }
  }

  const currentCharacterData = characters[currentCharacterId]

  const handleCharacterSelect = (characterId) => {
    switchCharacter(characterId)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700/80 backdrop-blur-sm border border-gray-600/50 text-white hover:bg-gray-600/80 transition-all duration-200"
      >
        <span className="text-lg">{currentCharacterData.icon}</span>
        <div className="text-left hidden sm:block">
          <div className="text-sm font-medium">{currentCharacterData.name}</div>
          <div className="text-xs text-gray-300">Level {currentCharacterData.level}</div>
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
            {Object.values(characters).map((char) => (
              <button
                key={char.id}
                onClick={() => handleCharacterSelect(char.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-700/80 transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg ${
                  char.id === currentCharacterId ? 'bg-gray-700/60' : ''
                }`}
              >
                <span className="text-2xl">{char.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-white">{char.name}</div>
                  <div className="text-sm text-gray-300">
                    Level {char.level} {char.race} {char.class}
                  </div>
                  <div className="text-xs text-gray-400">{char.description}</div>
                </div>
                {char.id === currentCharacterId && (
                  <div className="text-green-400">✓</div>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default CharacterDropdown