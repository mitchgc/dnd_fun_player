import React, { useState } from 'react'
import { createEmba, createParty, addCharacterToParty } from '../../data/characterSystem.js'

/**
 * Simple component to add Emba as the second character
 * No complex character builder - just adds the predefined Emba character
 */
const AddEmbaToParty = ({ onCharacterAdded, currentParty, setCurrentParty }) => {
  const [isAdding, setIsAdding] = useState(false)
  const [embaAdded, setEmbaAdded] = useState(false)

  const handleAddEmba = async () => {
    setIsAdding(true)
    
    try {
      // Create Emba character
      const emba = createEmba()
      
      // If no party exists, create one with just Emba
      // If party exists, add Emba to it
      let updatedParty
      if (!currentParty || !currentParty.members) {
        updatedParty = createParty([emba])
      } else {
        updatedParty = addCharacterToParty(currentParty, emba)
      }
      
      // Update the party state
      setCurrentParty(updatedParty)
      setEmbaAdded(true)
      
      // Notify parent component
      if (onCharacterAdded) {
        onCharacterAdded(emba, updatedParty)
      }
      
      console.log('Emba added to party:', emba)
      
    } catch (error) {
      console.error('Error adding Emba to party:', error)
      alert('Failed to add Emba to the party. Please try again.')
    } finally {
      setIsAdding(false)
    }
  }

  // Check if Emba is already in the party
  const embaInParty = currentParty?.members?.some(member => member.name === 'Emba')

  if (embaAdded || embaInParty) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-green-600 text-lg font-semibold mb-2">
          🎉 Emba has joined the party!
        </div>
        <div className="text-green-700 text-sm">
          Kobold Warlock • Level 5 • AC 13 • HP 23
        </div>
        <div className="text-green-600 text-xs mt-2">
          Ready for adventure with fire magic and cunning tactics
        </div>
      </div>
    )
  }

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-purple-800 mb-2">
          Add Second Character
        </h3>
        <p className="text-purple-600 text-sm mb-4">
          Add Emba, the Kobold Warlock, to your party for two-player adventures
        </p>
      </div>

      {/* Character Preview */}
      <div className="bg-white rounded-lg p-4 mb-4 border border-purple-100">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-semibold text-purple-800">Emba</div>
            <div className="text-purple-600">Kobold Warlock</div>
            <div className="text-purple-500 text-xs">The Genie (Efreeti)</div>
          </div>
          <div className="text-right">
            <div className="text-purple-800 font-semibold">Level 5</div>
            <div className="text-purple-600">AC 13 • HP 23</div>
            <div className="text-purple-500 text-xs">CHA 18 (+4)</div>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-purple-100">
          <div className="text-xs text-purple-600 mb-1">Key Abilities:</div>
          <div className="flex flex-wrap gap-1">
            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">
              Eldritch Blast
            </span>
            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">
              Darkvision
            </span>
            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">
              Fire Magic
            </span>
            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">
              Genie's Vessel
            </span>
          </div>
        </div>
      </div>

      {/* Add Button */}
      <button
        onClick={handleAddEmba}
        disabled={isAdding}
        className={`
          w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200
          ${isAdding 
            ? 'bg-purple-300 text-purple-600 cursor-not-allowed' 
            : 'bg-purple-600 hover:bg-purple-700 text-white hover:shadow-lg transform hover:-translate-y-0.5'
          }
        `}
      >
        {isAdding ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
            Adding Emba...
          </div>
        ) : (
          'Add Emba to Party'
        )}
      </button>

      <div className="text-xs text-purple-500 text-center mt-3">
        This will add Emba as your second character for collaborative play
      </div>
    </div>
  )
}

export default AddEmbaToParty