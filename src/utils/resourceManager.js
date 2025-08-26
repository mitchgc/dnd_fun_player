/**
 * Resource Manager - Handles tracking and updating character resources
 */

import { supabase } from './supabase';

/**
 * Get ability with its linked resource status
 */
export const getAbilityWithResource = (ability, resources) => {
  const resourceLink = ability.ability_data?.resource_link;
  const linkedResource = resourceLink ? 
    resources?.find(r => r.resource_name === resourceLink) : null;
  
  return {
    ...ability,
    current_uses: linkedResource?.current_value ?? ability.uses_remaining ?? 999,
    max_uses: linkedResource?.max_value ?? ability.max_uses ?? 999,
    can_use: !linkedResource || linkedResource.current_value > 0,
    linked_resource: linkedResource
  };
};

/**
 * Use an ability and deduct from its resource
 */
export const useAbilityResource = async (characterId, abilityId, abilities, resources) => {
  const ability = abilities.find(a => a.id === abilityId);
  if (!ability) return { success: false, error: 'Ability not found' };
  
  const resourceLink = ability.ability_data?.resource_link;
  if (!resourceLink) {
    // No resource link - ability doesn't use resources
    return { success: true };
  }
  
  const resource = resources?.find(r => r.resource_name === resourceLink);
  if (!resource) return { success: false, error: 'Resource not found' };
  
  if (resource.current_value <= 0) {
    return { success: false, error: 'No uses remaining' };
  }
  
  // Update resource in database
  if (supabase) {
    const { error } = await supabase
      .from('dnd_character_resources')
      .update({ 
        current_value: resource.current_value - 1 
      })
      .eq('id', resource.id);
    
    if (error) {
      return { success: false, error: error.message };
    }
  }
  
  return { 
    success: true, 
    new_value: resource.current_value - 1,
    resource_name: resource.resource_name 
  };
};

/**
 * Rest and recover resources
 */
export const restAndRecover = async (characterId, restType) => {
  if (!supabase) return { success: false, error: 'Supabase not configured' };
  
  // Get all resources for the character
  const { data: resources, error: fetchError } = await supabase
    .from('dnd_character_resources')
    .select('*')
    .eq('character_id', characterId);
  
  if (fetchError) return { success: false, error: fetchError.message };
  
  const updates = [];
  
  for (const resource of resources) {
    let shouldRecover = false;
    
    // Determine if resource recovers on this rest type
    if (restType === 'long_rest') {
      // Most things recover on long rest
      shouldRecover = true;
    } else if (restType === 'short_rest') {
      // Only specific resources recover on short rest
      if (resource.resource_name.includes('Spell Slots') && 
          resource.resource_name.includes('Warlock')) {
        shouldRecover = true; // Warlock spell slots recover on short rest
      }
      // Add other short rest recovery rules here
    }
    
    if (shouldRecover && resource.current_value < resource.max_value) {
      updates.push({
        id: resource.id,
        current_value: resource.max_value
      });
    }
  }
  
  // Batch update all recovered resources
  if (updates.length > 0) {
    for (const update of updates) {
      const { error } = await supabase
        .from('dnd_character_resources')
        .update({ current_value: update.current_value })
        .eq('id', update.id);
      
      if (error) {
        console.error('Error updating resource:', error);
      }
    }
  }
  
  return { 
    success: true, 
    recovered: updates.length,
    resources: updates.map(u => resources.find(r => r.id === u.id)?.resource_name)
  };
};

/**
 * Get abilities that grant actions or bonus actions
 */
export const getActionGrantingAbilities = (abilities, resources) => {
  const actionAbilities = [];
  
  for (const ability of abilities) {
    // Skip if it doesn't grant an action (check database column ability_type)
    if (!ability.ability_type || ability.ability_type === 'passive') continue;
    
    // Get resource status
    const abilityWithResource = getAbilityWithResource(ability, resources);
    
    // Skip if no uses remaining
    if (!abilityWithResource.can_use) continue;
    
    actionAbilities.push({
      id: ability.id,
      name: ability.ability_name,
      ability_type: ability.ability_type, // Use consistent database column terminology
      description: ability.ability_data.description || ability.description,
      current_uses: abilityWithResource.current_uses,
      max_uses: abilityWithResource.max_uses,
      effect: ability.ability_data.effect,
      icon: ability.ability_data.icon || '✨'
    });
  }
  
  return actionAbilities;
};

/**
 * Get passive damage bonuses that apply to attacks
 */
export const getPassiveDamageBonuses = (abilities, weaponName, attackType) => {
  const bonuses = [];
  
  for (const ability of abilities) {
    if (!ability.ability_data?.effect_type) continue;
    
    if (ability.ability_data.effect_type === 'damage_bonus') {
      const appliesTo = ability.ability_data.applies_to;
      
      // Check if this bonus applies to the current attack
      let applies = false;
      if (appliesTo === 'any_attack') {
        applies = true;
      } else if (appliesTo === 'eldritch_blast' && 
                 (weaponName === 'Eldritch Blast' || weaponName?.toLowerCase().includes('eldritch blast'))) {
        applies = true;
      } else if (appliesTo === 'weapon_attack' && attackType === 'weapon') {
        applies = true;
      }
      
      if (applies) {
        bonuses.push({
          name: ability.ability_name,
          damage: ability.ability_data.bonus_damage,
          damage_type: ability.ability_data.damage_type,
          once_per_turn: ability.ability_data.once_per_turn
        });
      }
    }
  }
  
  return bonuses;
};

/**
 * Get conditional damage bonuses (like Sneak Attack)
 */
export const getConditionalDamageBonuses = (abilities, weaponName, attackType, gameState) => {
  const bonuses = [];
  
  for (const ability of abilities) {
    if (!ability.ability_data?.effect_type) continue;
    
    if (ability.ability_data.effect_type === 'conditional_damage') {
      const appliesTo = ability.ability_data.applies_to;
      
      // Check if this bonus applies to the current attack type
      let applies = false;
      if (appliesTo === 'any_attack') {
        applies = true;
      } else if (appliesTo === 'weapon_attack' && attackType === 'weapon') {
        applies = true;
      }
      
      if (!applies) continue;
      
      // Check if conditions are met
      const conditions = ability.ability_data.conditions;
      let conditionsMet = false;
      
      if (conditions?.any_of) {
        for (const condition of conditions.any_of) {
          if (condition.player_hidden && gameState?.isHidden) {
            conditionsMet = true;
            break;
          }
          if (condition.has_advantage && gameState?.hasAdvantage) {
            conditionsMet = true;
            break;
          }
          if (condition.ally_within_5ft && gameState?.allyNearby) {
            conditionsMet = true;
            break;
          }
        }
      }
      
      if (conditionsMet) {
        bonuses.push({
          name: ability.ability_name,
          damage_dice: ability.ability_data.damage_dice,
          damage_type: ability.ability_data.damage_type,
          frequency: ability.ability_data.frequency,
          condition_met: gameState?.isHidden ? 'Hidden' : 'Advantage'
        });
      }
    }
  }
  
  return bonuses;
};