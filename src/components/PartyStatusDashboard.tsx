import React, { useState, useEffect, useCallback } from 'react'
import { Heart, Shield, Zap, Eye, EyeOff, User, Users, Plus } from 'lucide-react'
import { features } from '@/env'
import AddSecondCharacter from './Character/AddSecondCharacter'

interface Character {
  id: string
  name: string
  class: string
  race?: string
  level: number
  maxHP: number
  ac: number
  abilityModifiers?: {
    [key: string]: number
  }
  skills?: {
    [key: string]: number
  }
  // For party status - these will be managed separately from core character data
  currentHP?: number
  tempHP?: number
  conditions?: string[]
  isOnline?: boolean
  lastSeen?: string
  playerId?: string
}

interface PartyStatusDashboardProps {
  currentCharacter: Character
  partyMembers?: Character[]
  onUpdateParty?: (members: Character[]) => void
  className?: string
}

/**
 * Party Status Dashboard for Two-Player D&D Sessions
 * 
 * Features:
 * - Real-time status sharing when Supabase is available
 * - Local-only mode with manual sync when offline
 * - Optimized for two-player parties
 * - iPad-friendly interface with large touch targets
 */
export default function PartyStatusDashboard({ 
  currentCharacter, 
  className = '' 
}: PartyStatusDashboardProps) {
  const [partyMembers, setPartyMembers] = useState<Character[]>([currentCharacter])
  const [isConnected, setIsConnected] = useState(false)
  const [partnerCharacter, setPartnerCharacter] = useState<Character | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'offline'>('offline')

  // Initialize party status based on available features
  useEffect(() => {
    if (features.collaborativeJournal && features.supabaseEnabled) {
      initializePartyConnection()
    } else {
      // Local-only mode with mock partner for development
      setConnectionStatus('offline')
      initializeLocalParty()
    }
  }, [])

  const initializePartyConnection = useCallback(async () => {
    if (!features.supabaseEnabled) return

    try {
      setConnectionStatus('connecting')
      
      // Note: This would use Supabase for real-time presence
      // but respects the constraint that only journal is collaborative
      // Character stats remain local with optional sharing
      
      const { supabase } = await import('@/utils/supabase')
      
      // Subscribe to party presence (read-only for status indication)
      const channel = supabase
        .channel('party-presence')
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState()
          updatePresenceIndicators(state)
          setConnectionStatus('connected')
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('Player joined:', key, newPresences)
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('Player left:', key, leftPresences)
        })
        .subscribe()

      // Track our presence
      await channel.track({
        character_name: currentCharacter.name,
        character_class: currentCharacter.class,
        online_at: new Date().toISOString(),
        player_id: currentCharacter.playerId
      })

      setIsConnected(true)
    } catch (error) {
      console.warn('Failed to connect to party system:', error)
      setConnectionStatus('offline')
      initializeLocalParty()
    }
  }, [currentCharacter])

  const initializeLocalParty = useCallback(() => {
    // Create a mock partner character for local development/testing
    const mockPartner: Character = {
      id: 'partner-mock',
      name: 'Partner\'s Character',
      class: 'To Be Created',
      level: 1,
      maxHP: 8,
      currentHP: 8,
      tempHP: 0,
      ac: 15,
      conditions: [],
      isOnline: false,
      lastSeen: 'Creating character...',
      playerId: 'partner'
    }
    
    setPartnerCharacter(mockPartner)
    setPartyMembers([currentCharacter, mockPartner])
  }, [currentCharacter])

  const updatePresenceIndicators = useCallback((presenceState: any) => {
    // Update online/offline status based on presence
    const activeUsers = Object.keys(presenceState).length
    setIsConnected(activeUsers > 1)
  }, [])

  const getHealthPercentage = (character: Character) => {
    const current = character.currentHP ?? character.maxHP
    return (current / character.maxHP) * 100
  }

  const getHealthColor = (percentage: number) => {
    if (percentage > 75) return 'text-green-400'
    if (percentage > 50) return 'text-yellow-400'
    if (percentage > 25) return 'text-orange-400'
    return 'text-red-400'
  }

  const getConnectionStatusDisplay = () => {
    switch (connectionStatus) {
      case 'connecting':
        return { text: 'Connecting...', color: 'text-yellow-400', icon: '🔄' }
      case 'connected':
        return { text: 'Connected', color: 'text-green-400', icon: '🟢' }
      default:
        return { text: 'Local Mode', color: 'text-gray-400', icon: '📱' }
    }
  }

  const status = getConnectionStatusDisplay()

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Party Connection Status */}
      <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 border border-white/10">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Party Status
          </h3>
          <div className={`flex items-center gap-2 ${status.color}`}>
            <span>{status.icon}</span>
            <span className="text-sm">{status.text}</span>
          </div>
        </div>
      </div>

      {/* Party Members Grid - Optimized for Two Players */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {partyMembers.map((character) => (
          <CharacterStatusCard
            key={character.id}
            character={character}
            isCurrentPlayer={character.id === currentCharacter.id}
            connectionStatus={connectionStatus}
          />
        ))}
      </div>

      {/* Party Actions - Quick Communication */}
      {connectionStatus === 'connected' && (
        <div className="bg-purple-900/30 backdrop-blur-sm rounded-lg p-4 border border-purple-500/20">
          <h4 className="text-white font-medium mb-3">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-3">
            <button className="touch-friendly bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
              📢 Signal Help
            </button>
            <button className="touch-friendly bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
              ✋ Ready
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Individual Character Status Card
 */
interface CharacterStatusCardProps {
  character: Character
  isCurrentPlayer: boolean
  connectionStatus: 'connecting' | 'connected' | 'offline'
}

function CharacterStatusCard({ 
  character, 
  isCurrentPlayer, 
  connectionStatus 
}: CharacterStatusCardProps) {
  const currentHP = character.currentHP ?? character.maxHP
  const tempHP = character.tempHP ?? 0
  const healthPercentage = (currentHP / character.maxHP) * 100
  const healthColor = healthPercentage > 75 ? 'bg-green-500' : 
                     healthPercentage > 50 ? 'bg-yellow-500' : 
                     healthPercentage > 25 ? 'bg-orange-500' : 'bg-red-500'

  return (
    <div 
      className={`
        relative p-6 rounded-xl border-2 transition-all duration-300
        ${isCurrentPlayer 
          ? 'bg-purple-900/40 border-purple-400/50 ring-2 ring-purple-400/30' 
          : 'bg-gray-900/40 border-gray-600/50'
        }
        backdrop-blur-sm hardware-accelerated
        ${character.isOnline ? 'shadow-lg shadow-green-500/20' : ''}
      `}
    >
      {/* Online Status Indicator */}
      <div className="absolute top-4 right-4">
        {character.isOnline ? (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400">Online</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span className="text-xs text-gray-400">
              {character.lastSeen || 'Offline'}
            </span>
          </div>
        )}
      </div>

      {/* Character Info */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            {character.name}
            {isCurrentPlayer && <span className="text-sm text-purple-300">(You)</span>}
          </h3>
          <p className="text-gray-300">
            Level {character.level} {character.class}
          </p>
        </div>

        {/* Health Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300 flex items-center gap-1">
              <Heart className="w-4 h-4" />
              Health
            </span>
            <span className="text-white font-medium">
              {currentHP}/{character.maxHP}
              {tempHP > 0 && (
                <span className="text-blue-400"> (+{tempHP})</span>
              )}
            </span>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${healthColor}`}
              style={{ width: `${Math.max(0, healthPercentage)}%` }}
            />
          </div>
        </div>

        {/* Armor Class */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300 flex items-center gap-1">
            <Shield className="w-4 h-4" />
            Armor Class
          </span>
          <span className="text-white font-medium">{character.ac}</span>
        </div>

        {/* Conditions */}
        {(character.conditions && character.conditions.length > 0) && (
          <div className="space-y-2">
            <span className="text-sm text-gray-300">Conditions:</span>
            <div className="flex flex-wrap gap-2">
              {character.conditions.map((condition, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-red-600/20 text-red-300 text-xs rounded-full border border-red-500/30"
                >
                  {condition}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Data Sync Indicator */}
      {!isCurrentPlayer && connectionStatus === 'offline' && (
        <div className="mt-4 text-center">
          <span className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded">
            💾 Local data - Enable collaboration for real-time sync
          </span>
        </div>
      )}
    </div>
  )
}