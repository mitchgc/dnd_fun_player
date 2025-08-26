import React, { useState, useEffect } from 'react'
import { Users, Plus, Eye } from 'lucide-react'
import AddEmbaToParty from './Character/AddEmbaToParty'
import PartyStatusDashboard from './PartyStatusDashboard'

/**
 * Party Management Component for Two-Player D&D Sessions
 * 
 * Provides a simple interface to:
 * 1. Add Emba as the second character
 * 2. View party status for both characters
 * 3. Manage local party state
 */
const PartyManager = ({ currentCharacter, onPartyUpdate }) => {
  const [currentParty, setCurrentParty] = useState(null)
  const [showPartyStatus, setShowPartyStatus] = useState(false)

  // Initialize party with current character
  useEffect(() => {
    if (currentCharacter && !currentParty) {
      // Set up initial party state with just the current character
      const initialParty = {
        id: `party_${Date.now()}`,
        members: [
          {
            ...currentCharacter,
            currentHP: currentCharacter.maxHP || currentCharacter.hp || 20,
            tempHP: 0,
            conditions: [],
            isOnline: true,
            lastSeen: 'now',
            playerId: 'player1'
          }
        ],
        createdAt: new Date().toISOString()
      }
      setCurrentParty(initialParty)
    }
  }, [currentCharacter, currentParty])

  const handleCharacterAdded = (newCharacter, updatedParty) => {
    console.log('Character added to party:', newCharacter.name)
    setCurrentParty(updatedParty)
    setShowPartyStatus(true) // Auto-show party status when second character is added
    
    if (onPartyUpdate) {
      onPartyUpdate(updatedParty)
    }
  }

  const handlePartyUpdate = (updatedMembers) => {
    if (currentParty) {
      const updatedParty = {
        ...currentParty,
        members: updatedMembers,
        lastModified: new Date().toISOString()
      }
      setCurrentParty(updatedParty)
      
      if (onPartyUpdate) {
        onPartyUpdate(updatedParty)
      }
    }
  }

  const isPartyFull = currentParty?.members?.length >= 2
  const hasEmba = currentParty?.members?.some(member => member.name === 'Emba')

  return (
    <div className="space-y-6">
      {/* Party Management Header */}
      <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 backdrop-blur-sm rounded-lg p-6 border border-purple-500/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-purple-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Party Management</h2>
              <p className="text-purple-300 text-sm">
                Two-player D&D session setup
              </p>
            </div>
          </div>
          
          {isPartyFull && (
            <button
              onClick={() => setShowPartyStatus(!showPartyStatus)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
              {showPartyStatus ? 'Hide Status' : 'Show Party Status'}
            </button>
          )}
        </div>

        {/* Party Members Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-white font-medium mb-2">Player 1</h3>
            <div className="text-purple-300">
              {currentCharacter ? (
                <div>
                  <div className="font-semibold">{currentCharacter.name}</div>
                  <div className="text-sm">
                    Level {currentCharacter.level} {currentCharacter.race || ''} {currentCharacter.class}
                  </div>
                  <div className="text-xs text-green-400 mt-1">✓ Ready</div>
                </div>
              ) : (
                <div className="text-gray-400">No character loaded</div>
              )}
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-white font-medium mb-2">Player 2 (Partner)</h3>
            <div className="text-purple-300">
              {hasEmba ? (
                <div>
                  <div className="font-semibold">Emba</div>
                  <div className="text-sm">Level 5 Kobold Warlock</div>
                  <div className="text-xs text-green-400 mt-1">✓ Added to party</div>
                </div>
              ) : (
                <div className="text-gray-400">
                  <div className="text-sm">Character not added yet</div>
                  <div className="text-xs">Add Emba below</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Second Character Section */}
      {!hasEmba && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Second Character
          </h3>
          <AddEmbaToParty
            onCharacterAdded={handleCharacterAdded}
            currentParty={currentParty}
            setCurrentParty={setCurrentParty}
          />
        </div>
      )}

      {/* Party Status Dashboard */}
      {showPartyStatus && currentParty && currentParty.members.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Party Status
          </h3>
          <PartyStatusDashboard
            currentCharacter={currentParty.members[0]} // First member (current player)
            partyMembers={currentParty.members}
            onUpdateParty={handlePartyUpdate}
          />
        </div>
      )}

      {/* Quick Actions when party is ready */}
      {isPartyFull && (
        <div className="bg-green-900/30 backdrop-blur-sm rounded-lg p-4 border border-green-500/20">
          <h4 className="text-green-300 font-medium mb-3">🎲 Party Ready!</h4>
          <p className="text-green-200 text-sm mb-3">
            Both characters are set up. You can now start your two-player D&D adventure!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
              🎯 Start Combat Encounter
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
              📖 Open Shared Journal
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!isPartyFull && (
        <div className="bg-gray-900/40 backdrop-blur-sm rounded-lg p-4 border border-gray-600/20">
          <h4 className="text-gray-300 font-medium mb-2">📋 Setup Instructions</h4>
          <ol className="text-gray-400 text-sm space-y-1">
            <li>1. Your character ({currentCharacter?.name || 'Current character'}) is already loaded</li>
            <li>2. Add Emba as the second character using the button above</li>
            <li>3. View party status to monitor both characters during play</li>
            <li>4. Use collaborative features for shared gameplay</li>
          </ol>
        </div>
      )}
    </div>
  )
}

export default PartyManager