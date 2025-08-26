# Multi-Character Action System Redesign

## Overview

This document outlines the redesign of the D&D Helper application to support multiple characters with dynamic, character-specific action systems, backed by Supabase for persistence and scalability.

## Current Problem

The application was initially built around a single hardcoded character (`YUAN_TI_ROGUE`), which creates several limitations:

### Technical Issues
- **Static Character Reference**: Components directly import a single character object
- **Mixed Action Types**: No clear separation between actions, bonus actions, and reactions
- **Property Inconsistencies**: Bug where `weapon.attack` vs `weapon.attackBonus` caused NaN in attack rolls
- **Non-scalable Architecture**: Adding new characters requires code changes

### User Experience Issues
- Cannot manage multiple party members
- No character persistence between sessions
- Limited to a single character type
- Actions don't reflect character-specific abilities

## Solution: Dynamic Multi-Character System

### 1. Character-Centric Action Management

Replace static action generation with dynamic, character-aware action systems:

```javascript
class CharacterActionManager {
  constructor(character) {
    this.character = character;
    this.availableActions = this.generateAvailableActions();
    this.availableBonusActions = this.generateAvailableBonusActions();
    this.availableReactions = this.generateAvailableReactions();
  }
  
  generateAvailableActions() {
    // Dynamic action generation based on:
    // - Character class and level
    // - Equipment and weapons
    // - Current HP/status conditions
    // - Available resources (spell slots, etc.)
  }
}
```

### 2. Modular Action System

#### Action Categories
- **Universal Actions**: Available to all characters (Attack, Dash, Dodge, Help, Hide, Ready, Search, Use Object)
- **Class-Specific Actions**: 
  - Rogues: Cunning Action (bonus action)
  - Fighters: Action Surge, Second Wind
  - Spellcasters: Cast Spell
- **Race-Specific Actions**:
  - Yuan-ti: Magic Resistance (passive)
  - Dragonborn: Breath Weapon (action)
- **Equipment Actions**: Weapon attacks, magic item usage

#### Context-Aware Availability
Actions check availability based on:
- Character state (HP, conditions, resources)
- Combat context (in combat vs. exploration)
- Turn economy (action/bonus action already used)
- Prerequisites (weapon equipped, spell slot available)

### 3. Supabase Integration

#### Database Schema
```sql
-- Core character data
characters (
  id uuid primary key,
  user_id uuid references auth.users,
  name text,
  race text,
  character_class text,
  level integer,
  ability_scores jsonb,
  current_hp integer,
  max_hp integer,
  is_hidden boolean,
  created_at timestamp
)

-- Dynamic equipment/weapons
character_weapons (
  id uuid primary key,
  character_id uuid references characters,
  weapon_data jsonb,
  is_equipped boolean
)

-- Class features and abilities
character_abilities (
  id uuid primary key,
  character_id uuid references characters,
  ability_type text,
  ability_data jsonb,
  uses_remaining integer,
  max_uses integer
)

-- Session management
sessions (
  id uuid primary key,
  user_id uuid references auth.users,
  active_character_id uuid references characters,
  party_members uuid[] -- array of character IDs
)
```

#### Benefits
- **Persistence**: Characters survive browser sessions
- **Scalability**: Support unlimited characters per user
- **Real-time**: Live updates for multi-user scenarios
- **Validation**: Server-side action validation
- **Backup**: Character data protection

### 4. State Management Architecture

#### Character Context Provider
```javascript
const CharacterContext = createContext({
  characters: [],
  activeCharacter: null,
  switchCharacter: (characterId) => {},
  updateCharacterState: (characterId, updates) => {},
  performAction: (characterId, actionType, actionData) => {}
});
```

#### Action Dispatch System
- Centralized action handling
- State validation before execution
- Automatic UI updates
- Database synchronization

## Implementation Phases

### Phase 1: Foundation
1. ✅ Fix existing property inconsistencies (`weapon.attack` → `weapon.attackBonus`)
2. Create character action manager class
3. Implement dynamic action generation
4. Set up Supabase integration

### Phase 2: Multi-Character Support
1. Create character CRUD operations
2. Implement character switching UI
3. Update existing components to use active character context
4. Add character creation/import flows

### Phase 3: Advanced Features
1. Party management interface
2. Real-time synchronization
3. Advanced action validation
4. Character progression tracking

### Phase 4: Polish & Optimization
1. Performance optimization for large character lists
2. Offline support with sync
3. Character templates and sharing
4. Advanced combat features

## Technical Benefits

### For Developers
- **Maintainable**: Clear separation of concerns
- **Extensible**: Easy to add new character types/abilities
- **Testable**: Isolated action logic
- **Type Safe**: Better TypeScript integration opportunities

### For Users
- **Flexible**: Support any character build
- **Persistent**: Never lose character data
- **Collaborative**: Potential for shared sessions
- **Accurate**: Character-specific action availability

## Why This Redesign Matters

1. **Scalability**: Transform from single-use tool to full party management system
2. **Accuracy**: Ensure D&D rules are correctly implemented per character
3. **User Experience**: Intuitive character switching and management
4. **Technical Debt**: Fix architectural issues before they compound
5. **Future-Proofing**: Enable advanced features like multiplayer support

## Success Metrics

- Support for 10+ characters per user
- Sub-100ms character switching
- 100% accurate action availability
- Zero data loss with persistent storage
- Seamless migration from current single-character system

---

*This redesign transforms the D&D Helper from a single-character utility into a comprehensive character management system while maintaining the simplicity and speed that makes it valuable.*