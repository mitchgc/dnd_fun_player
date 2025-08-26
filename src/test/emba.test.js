import { describe, it, expect } from 'vitest'
import { createEmba, createParty, addCharacterToParty } from '../../data/characterSystem.js'

describe('Emba Character Creation', () => {
  it('should create Emba with correct stats', () => {
    const emba = createEmba()
    
    // Basic character info
    expect(emba.name).toBe('Emba')
    expect(emba.race).toBe('Kobold')
    expect(emba.class).toBe('Warlock')
    expect(emba.level).toBe(5)
    
    // Ability scores
    expect(emba.abilityScores.strength).toBe(9)
    expect(emba.abilityScores.dexterity).toBe(12)
    expect(emba.abilityScores.constitution).toBe(12)
    expect(emba.abilityScores.intelligence).toBe(14)
    expect(emba.abilityScores.wisdom).toBe(12)
    expect(emba.abilityScores.charisma).toBe(18)
    
    // Combat stats
    expect(emba.maxHP).toBe(23)
    expect(emba.ac).toBe(13)
    
    // Ability modifiers should be calculated correctly
    expect(emba.abilityModifiers.charisma).toBe(4) // 18 = +4
    expect(emba.abilityModifiers.dexterity).toBe(1) // 12 = +1
    expect(emba.abilityModifiers.strength).toBe(-1) // 9 = -1
    
    // Should have proper proficiency bonus for level 5
    expect(emba.proficiencyBonus).toBe(3)
    
    // Should have warlock save proficiencies
    expect(emba.savingThrowProficiencies).toContain('wisdom')
    expect(emba.savingThrowProficiencies).toContain('charisma')
    
    // Should have skill proficiencies
    expect(emba.skillProficiencies).toContain('arcana')
    expect(emba.skillProficiencies).toContain('deception')
    
    // Should have Eldritch Blast
    expect(emba.weapons.eldritchBlast).toBeDefined()
    expect(emba.weapons.eldritchBlast.name).toBe('Eldritch Blast')
    expect(emba.weapons.eldritchBlast.damage).toBe('1d10')
    expect(emba.weapons.eldritchBlast.damageType).toBe('force')
    
    // Should have special abilities
    expect(emba.specialAbilities.darkvision).toBeDefined()
    expect(emba.specialAbilities.geniesVessel).toBeDefined()
    expect(emba.specialAbilities.pactMagic).toBeDefined()
    
    // Should have spells
    expect(emba.spells.cantrips).toContain('Eldritch Blast')
    expect(emba.spells.cantrips).toContain('Thunderclap')
    expect(emba.spells.cantrips).toContain('Minor Illusion')
    expect(emba.spells.spellsKnown).toContain('Hex')
    expect(emba.spells.spellsKnown).toContain('Armor of Agathys')
    
    // Should have required metadata
    expect(emba.id).toBeDefined()
    expect(emba.createdAt).toBeDefined()
    expect(emba.lastModified).toBeDefined()
  })
  
  it('should create a party with Emba', () => {
    const emba = createEmba()
    const party = createParty([emba])
    
    expect(party.members).toHaveLength(1)
    expect(party.members[0].name).toBe('Emba')
    expect(party.id).toBeDefined()
    expect(party.createdAt).toBeDefined()
  })
  
  it('should add Emba to an existing party', () => {
    const emba = createEmba()
    
    // Create a mock existing character
    const existingCharacter = {
      id: 'char-1',
      name: 'Existing Character',
      class: 'Rogue',
      race: 'Yuan-ti',
      level: 3,
      maxHP: 20,
      ac: 15
    }
    
    const initialParty = createParty([existingCharacter])
    const updatedParty = addCharacterToParty(initialParty, emba)
    
    expect(updatedParty.members).toHaveLength(2)
    expect(updatedParty.members[0].name).toBe('Existing Character')
    expect(updatedParty.members[1].name).toBe('Emba')
    expect(updatedParty.lastModified).toBeDefined()
  })
  
  it('should calculate Emba saving throws correctly', () => {
    const emba = createEmba()
    
    // Warlock gets proficiency in Wisdom and Charisma saves
    // Level 5 = +3 proficiency bonus
    // Wisdom: 12 (+1) + 3 prof = +4
    // Charisma: 18 (+4) + 3 prof = +7
    expect(emba.savingThrows.wisdom).toBe(4)
    expect(emba.savingThrows.charisma).toBe(7)
    
    // Non-proficient saves should just be ability modifier
    expect(emba.savingThrows.strength).toBe(-1) // 9 = -1, no proficiency
    expect(emba.savingThrows.dexterity).toBe(1)  // 12 = +1, no proficiency
  })
  
  it('should have correct equipment and languages', () => {
    const emba = createEmba()
    
    expect(emba.equipment).toContain('Flute')
    expect(emba.equipment).toContain('Crossbow bolts (20)')
    expect(emba.equipment).toContain('Component pouch')
    
    expect(emba.languages).toContain('Common')
    expect(emba.languages).toContain('Dwarvish')
    expect(emba.languages).toContain('Draconic')
  })
})