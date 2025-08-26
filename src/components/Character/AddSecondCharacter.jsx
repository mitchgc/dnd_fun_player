import React, { useState } from 'react'
import { Plus, User, X, Save } from 'lucide-react'
import { createSecondCharacter } from '@/data/characterSystem'

/**
 * Simple Second Character Addition Component
 * 
 * Allows adding a partner's character with basic info
 * without a complex character builder interface
 */
export default function AddSecondCharacter({ onAddCharacter, onClose, className = '' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [characterData, setCharacterData] = useState({
    name: '',
    race: 'Human',
    characterClass: 'Fighter',
    level: 1
  })

  const commonRaces = [
    'Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn',
    'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling'
  ]

  const commonClasses = [
    'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter',
    'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer',
    'Warlock', 'Wizard'
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!characterData.name.trim()) {
      alert('Please enter a character name')
      return
    }

    // Create the character using the system
    const newCharacter = createSecondCharacter(characterData)
    
    // Add to party
    onAddCharacter(newCharacter)
    
    // Reset and close
    setCharacterData({
      name: '',
      race: 'Human', 
      characterClass: 'Fighter',
      level: 1
    })
    setIsOpen(false)
    onClose?.()
  }

  const handleCancel = () => {
    setIsOpen(false)
    onClose?.()
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`
          touch-friendly flex items-center gap-2 px-6 py-3
          bg-purple-600 hover:bg-purple-700 text-white
          rounded-lg transition-colors duration-200
          shadow-lg hover:shadow-xl
          ${className}
        `}
      >
        <Plus className="w-5 h-5" />
        Add Partner's Character
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <User className="w-6 h-6" />
            Add Second Character
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Character Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Character Name *
            </label>
            <input
              type="text"
              value={characterData.name}
              onChange={(e) => setCharacterData(prev => ({ ...prev, name: e.target.value }))}
              className="
                w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg
                text-white placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                touch-friendly
              "
              placeholder="Enter character name..."
              required
            />
          </div>

          {/* Race Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Race
            </label>
            <select
              value={characterData.race}
              onChange={(e) => setCharacterData(prev => ({ ...prev, race: e.target.value }))}
              className="
                w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg
                text-white touch-friendly
                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
              "
            >
              {commonRaces.map(race => (
                <option key={race} value={race}>{race}</option>
              ))}
            </select>
          </div>

          {/* Class Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Class
            </label>
            <select
              value={characterData.characterClass}
              onChange={(e) => setCharacterData(prev => ({ ...prev, characterClass: e.target.value }))}
              className="
                w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg
                text-white touch-friendly
                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
              "
            >
              {commonClasses.map(charClass => (
                <option key={charClass} value={charClass}>{charClass}</option>
              ))}
            </select>
          </div>

          {/* Level */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Level
            </label>
            <select
              value={characterData.level}
              onChange={(e) => setCharacterData(prev => ({ ...prev, level: parseInt(e.target.value) }))}
              className="
                w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg
                text-white touch-friendly
                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
              "
            >
              {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].map(level => (
                <option key={level} value={level}>Level {level}</option>
              ))}
            </select>
          </div>

          {/* Info Note */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <p className="text-sm text-blue-300">
              💡 This creates a character with standard stats. You can customize ability scores, 
              equipment, and other details later by editing the character data.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="
                flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white
                rounded-lg transition-colors touch-friendly
              "
            >
              Cancel
            </button>
            <button
              type="submit"
              className="
                flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white
                rounded-lg transition-colors touch-friendly
                flex items-center justify-center gap-2
              "
            >
              <Save className="w-4 h-4" />
              Add Character
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}