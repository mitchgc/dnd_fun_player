#!/usr/bin/env node

// Simple test script to verify Emba character creation works
// This bypasses the build system and just tests the character logic

console.log('🎲 Testing Emba Character Creation...\n')

try {
  // Import the character system
  const { createEmba } = await import('./src/data/characterSystem.js')
  
  // Create Emba
  const emba = createEmba()
  
  console.log('✅ Emba created successfully!')
  console.log(`📋 Character: ${emba.name} - Level ${emba.level} ${emba.race} ${emba.class}`)
  console.log(`⚔️  Combat: AC ${emba.ac}, HP ${emba.maxHP}`)
  console.log(`🧠 Ability Scores:`)
  console.log(`   STR: ${emba.abilityScores.strength} (${emba.abilityModifiers.strength >= 0 ? '+' : ''}${emba.abilityModifiers.strength})`)
  console.log(`   DEX: ${emba.abilityScores.dexterity} (${emba.abilityModifiers.dexterity >= 0 ? '+' : ''}${emba.abilityModifiers.dexterity})`)
  console.log(`   CON: ${emba.abilityScores.constitution} (${emba.abilityModifiers.constitution >= 0 ? '+' : ''}${emba.abilityModifiers.constitution})`)
  console.log(`   INT: ${emba.abilityScores.intelligence} (${emba.abilityModifiers.intelligence >= 0 ? '+' : ''}${emba.abilityModifiers.intelligence})`)
  console.log(`   WIS: ${emba.abilityScores.wisdom} (${emba.abilityModifiers.wisdom >= 0 ? '+' : ''}${emba.abilityModifiers.wisdom})`)
  console.log(`   CHA: ${emba.abilityScores.charisma} (${emba.abilityModifiers.charisma >= 0 ? '+' : ''}${emba.abilityModifiers.charisma})`)
  console.log(`🎯 Proficiency Bonus: +${emba.proficiencyBonus}`)
  console.log(`🔥 Weapons:`)
  Object.values(emba.weapons).forEach(weapon => {
    console.log(`   ${weapon.name}: ${weapon.damage} ${weapon.damageType}`)
  })
  console.log(`✨ Special Abilities:`)
  Object.values(emba.specialAbilities).forEach(ability => {
    console.log(`   ${ability.name}: ${ability.description}`)
  })
  console.log(`📚 Spells:`)
  console.log(`   Cantrips: ${emba.spells.cantrips.join(', ')}`)
  console.log(`   Known: ${emba.spells.spellsKnown.join(', ')}`)
  
  console.log('\n🎉 Emba is ready for adventure!')
  console.log('✅ Character creation system is working correctly!')
  
} catch (error) {
  console.error('❌ Error creating Emba:', error.message)
  console.error('📋 Stack trace:', error.stack)
  process.exit(1)
}