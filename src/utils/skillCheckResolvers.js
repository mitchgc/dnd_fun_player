// Unified skill check system with advantage/expertise support

/**
 * D&D 5e Skills mapping to ability scores
 */
export const SKILL_ABILITY_MAP = {
  // Strength
  'athletics': 'strength',
  
  // Dexterity  
  'acrobatics': 'dexterity',
  'sleight_of_hand': 'dexterity',
  'stealth': 'dexterity',
  
  // Intelligence
  'arcana': 'intelligence',
  'history': 'intelligence', 
  'investigation': 'intelligence',
  'nature': 'intelligence',
  'religion': 'intelligence',
  
  // Wisdom
  'animal_handling': 'wisdom',
  'insight': 'wisdom',
  'medicine': 'wisdom',
  'perception': 'wisdom',
  'survival': 'wisdom',
  
  // Charisma
  'deception': 'charisma',
  'intimidation': 'charisma',
  'performance': 'charisma',
  'persuasion': 'charisma'
};

/**
 * Convert skill names to normalized format
 */
export function normalizeSkillName(skillName) {
  if (!skillName) return null;
  return skillName.toLowerCase().replace(/[^a-z]/g, '_');
}

/**
 * Get the ability score associated with a skill
 */
export function getSkillAbility(skillName) {
  const normalized = normalizeSkillName(skillName);
  return SKILL_ABILITY_MAP[normalized] || 'strength'; // Default fallback
}

/**
 * Calculate skill check modifier based on character stats
 */
export function calculateSkillModifier(character, skillName) {
  if (!character || !skillName) {
    return { total: 0, breakdown: [] };
  }
  
  const normalized = normalizeSkillName(skillName);
  const abilityName = getSkillAbility(skillName);
  
  // Get ability modifier
  const abilityScore = character.dnd_character_stats?.[abilityName] || 10;
  const abilityModifier = Math.floor((abilityScore - 10) / 2);
  
  let totalModifier = abilityModifier;
  const breakdown = [
    { source: `${abilityName} (${abilityScore})`, value: abilityModifier }
  ];
  
  // Check for proficiency
  const proficiencies = character.dnd_character_proficiencies?.skill_proficiencies || [];
  const isProficient = proficiencies.some(prof => 
    normalizeSkillName(prof) === normalized
  );
  
  if (isProficient) {
    const proficiencyBonus = character.proficiency_bonus || 
      Math.ceil((character.level || 1) / 4) + 1; // Calculate if not provided
    totalModifier += proficiencyBonus;
    breakdown.push({ source: 'Proficiency', value: proficiencyBonus });
  }
  
  // Check for expertise (double proficiency)
  const expertises = character.dnd_character_proficiencies?.expertise || [];
  const hasExpertise = expertises.some(exp => 
    normalizeSkillName(exp) === normalized
  );
  
  if (hasExpertise && isProficient) {
    const proficiencyBonus = character.proficiency_bonus || 
      Math.ceil((character.level || 1) / 4) + 1;
    totalModifier += proficiencyBonus; // Add proficiency again for expertise
    breakdown.push({ source: 'Expertise', value: proficiencyBonus });
  }
  
  // Check for other bonuses (magic items, spells, etc.)
  // This could be expanded with more complex bonus systems
  
  return { total: totalModifier, breakdown };
}

/**
 * Determine advantage/disadvantage for a skill check based on context
 */
export function determineAdvantageDisadvantage(character, skillName, context = {}) {
  const normalized = normalizeSkillName(skillName);
  let advantageSources = [];
  let disadvantageSources = [];
  
  // Stealth advantage/disadvantage conditions
  if (normalized === 'stealth') {
    if (context.isHidden) advantageSources.push('Already hidden');
    if (context.hasLightArmor) advantageSources.push('Light armor');
    if (context.hasHeavyArmor) disadvantageSources.push('Heavy armor');
    if (context.isInBrightLight && !context.hasStealthFeatures) {
      disadvantageSources.push('Bright light');
    }
  }
  
  // Perception checks
  if (normalized === 'perception') {
    if (context.hasKeenSenses) advantageSources.push('Keen senses');
    if (context.isBlinded) disadvantageSources.push('Blinded');
    if (context.isDeafened && context.requiresHearing) disadvantageSources.push('Deafened');
  }
  
  // Social skill checks
  if (['persuasion', 'deception', 'intimidation'].includes(normalized)) {
    if (context.hasCharismaticFeature) advantageSources.push('Charismatic feature');
    if (context.languageBarrier) disadvantageSources.push('Language barrier');
  }
  
  // Investigation and similar
  if (normalized === 'investigation') {
    if (context.hasInvestigatorFeature) advantageSources.push('Investigator feature');
    if (context.hasProperTools) advantageSources.push('Proper tools');
  }
  
  // Check character features for advantage/disadvantage
  const features = character.dnd_character_abilities || [];
  for (const feature of features) {
    const featureName = feature.ability_name?.toLowerCase() || '';
    
    // Reliable Talent (Rogue) - treat rolls of 9 or lower as 10
    if (featureName.includes('reliable talent') && normalized === 'stealth') {
      advantageSources.push('Reliable Talent');
    }
    
    // Add more feature checks as needed
  }
  
  // Determine final advantage state
  const hasAdvantage = advantageSources.length > 0;
  const hasDisadvantage = disadvantageSources.length > 0;
  
  if (hasAdvantage && hasDisadvantage) {
    return { 
      type: 'normal', 
      reason: 'Advantage and disadvantage cancel out',
      advantageSources,
      disadvantageSources
    };
  } else if (hasAdvantage) {
    return { 
      type: 'advantage', 
      reason: advantageSources.join(', '),
      advantageSources,
      disadvantageSources: []
    };
  } else if (hasDisadvantage) {
    return { 
      type: 'disadvantage', 
      reason: disadvantageSources.join(', '),
      advantageSources: [],
      disadvantageSources
    };
  }
  
  return { 
    type: 'normal', 
    reason: 'No advantage/disadvantage',
    advantageSources: [],
    disadvantageSources: []
  };
}

/**
 * Resolve a skill check using the unified roll system
 */
export function resolveSkillCheck(character, skillName, dc = null, context = {}) {
  if (!character || !skillName) {
    throw new Error('Character and skill name required for skill check');
  }
  
  const normalized = normalizeSkillName(skillName);
  const skillModifier = calculateSkillModifier(character, skillName);
  const advantage = determineAdvantageDisadvantage(character, skillName, context);
  
  // Build dice expression based on advantage/disadvantage
  let diceExpression = '1d20';
  if (advantage.type === 'advantage') {
    diceExpression = '2d20kh1'; // Keep highest
  } else if (advantage.type === 'disadvantage') {
    diceExpression = '2d20kl1'; // Keep lowest  
  }
  
  // Add modifier to expression
  if (skillModifier.total !== 0) {
    diceExpression += skillModifier.total >= 0 ? `+${skillModifier.total}` : `${skillModifier.total}`;
  }
  
  return {
    type: 'skill_check',
    skillName: skillName,
    normalizedSkill: normalized,
    abilityName: getSkillAbility(skillName),
    diceExpression,
    modifier: skillModifier,
    advantage: advantage,
    dc: dc,
    tags: ['skill', normalized, advantage.type]
  };
}

/**
 * Resolve an ability check (same as skill check but without proficiency)
 */
export function resolveAbilityCheck(character, abilityName, dc = null, context = {}) {
  if (!character || !abilityName) {
    throw new Error('Character and ability name required for ability check');
  }
  
  const normalizedAbility = abilityName.toLowerCase();
  
  // Get ability modifier only (no proficiency)
  const abilityScore = character.dnd_character_stats?.[normalizedAbility] || 10;
  const abilityModifier = Math.floor((abilityScore - 10) / 2);
  
  const modifier = {
    total: abilityModifier,
    breakdown: [{ source: `${abilityName} (${abilityScore})`, value: abilityModifier }]
  };
  
  // Simple advantage/disadvantage (could be expanded)
  let advantage = { type: 'normal', reason: 'No advantage/disadvantage' };
  if (context.hasAdvantage) {
    advantage = { type: 'advantage', reason: context.advantageReason || 'Context advantage' };
  } else if (context.hasDisadvantage) {
    advantage = { type: 'disadvantage', reason: context.disadvantageReason || 'Context disadvantage' };
  }
  
  // Build dice expression
  let diceExpression = '1d20';
  if (advantage.type === 'advantage') {
    diceExpression = '2d20kh1';
  } else if (advantage.type === 'disadvantage') {
    diceExpression = '2d20kl1';
  }
  
  if (modifier.total !== 0) {
    diceExpression += modifier.total >= 0 ? `+${modifier.total}` : `${modifier.total}`;
  }
  
  return {
    type: 'ability_check',
    abilityName: abilityName,
    normalizedAbility,
    diceExpression,
    modifier,
    advantage,
    dc,
    tags: ['ability', normalizedAbility, advantage.type]
  };
}

/**
 * Resolve a saving throw using the unified system
 */
export function resolveSavingThrow(character, saveName, dc = null, context = {}) {
  if (!character || !saveName) {
    throw new Error('Character and save name required for saving throw');
  }
  
  const normalizedSave = saveName.toLowerCase();
  
  // Get ability modifier
  const abilityScore = character.dnd_character_stats?.[normalizedSave] || 10;
  const abilityModifier = Math.floor((abilityScore - 10) / 2);
  
  let totalModifier = abilityModifier;
  const breakdown = [
    { source: `${saveName} (${abilityScore})`, value: abilityModifier }
  ];
  
  // Check for saving throw proficiency
  const saveProficiencies = character.dnd_character_proficiencies?.saving_throw_proficiencies || [];
  const isProficient = saveProficiencies.some(prof => 
    prof.toLowerCase() === normalizedSave
  );
  
  if (isProficient) {
    const proficiencyBonus = character.proficiency_bonus || 
      Math.ceil((character.level || 1) / 4) + 1;
    totalModifier += proficiencyBonus;
    breakdown.push({ source: 'Proficiency', value: proficiencyBonus });
  }
  
  const modifier = { total: totalModifier, breakdown };
  
  // Advantage/disadvantage for saves (could be expanded)
  let advantage = { type: 'normal', reason: 'No advantage/disadvantage' };
  if (context.hasAdvantage) {
    advantage = { type: 'advantage', reason: context.advantageReason || 'Context advantage' };
  } else if (context.hasDisadvantage) {
    advantage = { type: 'disadvantage', reason: context.disadvantageReason || 'Context disadvantage' };
  }
  
  // Build dice expression
  let diceExpression = '1d20';
  if (advantage.type === 'advantage') {
    diceExpression = '2d20kh1';
  } else if (advantage.type === 'disadvantage') {
    diceExpression = '2d20kl1';
  }
  
  if (modifier.total !== 0) {
    diceExpression += modifier.total >= 0 ? `+${modifier.total}` : `${modifier.total}`;
  }
  
  return {
    type: 'saving_throw',
    saveName: saveName,
    normalizedSave,
    diceExpression,
    modifier,
    advantage,
    dc,
    tags: ['save', normalizedSave, advantage.type]
  };
}