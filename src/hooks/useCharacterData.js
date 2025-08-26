import { useState, useEffect, useCallback } from 'react';
import { supabase, getCurrentUser } from '../utils/supabase';

// Default character template
export const DEFAULT_CHARACTER_TEMPLATE = {
  name: 'New Character',
  race: 'Human',
  character_class: 'Fighter',
  level: 1,
  ability_scores: {
    strength: 15,
    dexterity: 14,
    constitution: 13,
    intelligence: 12,
    wisdom: 10,
    charisma: 8
  },
  max_hp: 10,
  current_hp: 10,
  temp_hp: 0,
  armor_class: 16,
  initiative_bonus: 2,
  speed: 30,
  is_hidden: false,
  conditions: []
};

// Hook for managing character operations
export const useCharacterOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => setError(null), []);

  // Create a new character
  const createCharacter = useCallback(async (characterData) => {
    setLoading(true);
    setError(null);

    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error: supabaseError } = await supabase
        .from('dnd_characters')
        .insert([{
          ...DEFAULT_CHARACTER_TEMPLATE,
          ...characterData,
          user_id: user.id
        }])
        .select(`
          *,
          dnd_character_weapons(*),
          dnd_character_abilities(*),
          dnd_character_resources(*)
        `)
        .single();

      if (supabaseError) throw supabaseError;

      setLoading(false);
      return data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return null;
    }
  }, []);

  // Update character
  const updateCharacter = useCallback(async (characterId, updates) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('dnd_characters')
        .update(updates)
        .eq('id', characterId)
        .select(`
          *,
          dnd_character_weapons(*),
          dnd_character_abilities(*),
          dnd_character_resources(*)
        `)
        .single();

      if (supabaseError) throw supabaseError;

      setLoading(false);
      return data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return null;
    }
  }, []);

  // Delete character
  const deleteCharacter = useCallback(async (characterId) => {
    setLoading(true);
    setError(null);

    try {
      const { error: supabaseError } = await supabase
        .from('dnd_characters')
        .delete()
        .eq('id', characterId);

      if (supabaseError) throw supabaseError;

      setLoading(false);
      return true;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return false;
    }
  }, []);

  // Clone character
  const cloneCharacter = useCallback(async (sourceCharacterId, newName) => {
    setLoading(true);
    setError(null);

    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get source character with all related data
      const { data: sourceCharacter, error: fetchError } = await supabase
        .from('dnd_characters')
        .select(`
          *,
          dnd_character_weapons(*),
          dnd_character_abilities(*),
          dnd_character_resources(*)
        `)
        .eq('id', sourceCharacterId)
        .single();

      if (fetchError) throw fetchError;

      // Create new character
      const { data: newCharacter, error: createError } = await supabase
        .from('dnd_characters')
        .insert([{
          ...sourceCharacter,
          id: undefined, // Let database generate new ID
          name: newName || `${sourceCharacter.name} (Copy)`,
          created_at: undefined,
          updated_at: undefined,
          last_accessed: undefined
        }])
        .select()
        .single();

      if (createError) throw createError;

      // Clone weapons
      if (sourceCharacter.character_weapons?.length > 0) {
        const weaponsToClone = sourceCharacter.character_weapons.map(weapon => ({
          ...weapon,
          id: undefined,
          character_id: newCharacter.id,
          created_at: undefined
        }));

        const { error: weaponsError } = await supabase
          .from('dnd_character_weapons')
          .insert(weaponsToClone);

        if (weaponsError) throw weaponsError;
      }

      // Clone abilities
      if (sourceCharacter.character_abilities?.length > 0) {
        const abilitiesToClone = sourceCharacter.character_abilities.map(ability => ({
          ...ability,
          id: undefined,
          character_id: newCharacter.id,
          created_at: undefined
        }));

        const { error: abilitiesError } = await supabase
          .from('dnd_character_abilities')
          .insert(abilitiesToClone);

        if (abilitiesError) throw abilitiesError;
      }

      // Clone resources
      if (sourceCharacter.character_resources?.length > 0) {
        const resourcesToClone = sourceCharacter.character_resources.map(resource => ({
          ...resource,
          id: undefined,
          character_id: newCharacter.id,
          created_at: undefined
        }));

        const { error: resourcesError } = await supabase
          .from('dnd_character_resources')
          .insert(resourcesToClone);

        if (resourcesError) throw resourcesError;
      }

      // Fetch complete cloned character
      const { data: completeCharacter } = await supabase
        .from('dnd_characters')
        .select(`
          *,
          dnd_character_weapons(*),
          dnd_character_abilities(*),
          dnd_character_resources(*)
        `)
        .eq('id', newCharacter.id)
        .single();

      setLoading(false);
      return completeCharacter;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return null;
    }
  }, []);

  return {
    createCharacter,
    updateCharacter,
    deleteCharacter,
    cloneCharacter,
    loading,
    error,
    clearError
  };
};

// Hook for character weapons management
export const useCharacterWeapons = (characterId) => {
  const [weapons, setWeapons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch weapons
  const fetchWeapons = useCallback(async () => {
    if (!characterId) return;

    setLoading(true);
    try {
      const { data, error: supabaseError } = await supabase
        .from('dnd_character_weapons')
        .select('*')
        .eq('character_id', characterId)
        .order('created_at', { ascending: true });

      if (supabaseError) throw supabaseError;
      setWeapons(data || []);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, [characterId]);

  // Add weapon
  const addWeapon = useCallback(async (weaponData) => {
    if (!characterId) return null;

    try {
      const { data, error: supabaseError } = await supabase
        .from('dnd_character_weapons')
        .insert([{
          ...weaponData,
          character_id: characterId
        }])
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      setWeapons(prev => [...prev, data]);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, [characterId]);

  // Update weapon
  const updateWeapon = useCallback(async (weaponId, updates) => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('dnd_character_weapons')
        .update(updates)
        .eq('id', weaponId)
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      setWeapons(prev => prev.map(w => w.id === weaponId ? data : w));
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  // Remove weapon
  const removeWeapon = useCallback(async (weaponId) => {
    try {
      const { error: supabaseError } = await supabase
        .from('dnd_character_weapons')
        .delete()
        .eq('id', weaponId);

      if (supabaseError) throw supabaseError;

      setWeapons(prev => prev.filter(w => w.id !== weaponId));
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  useEffect(() => {
    fetchWeapons();
  }, [fetchWeapons]);

  return {
    weapons,
    addWeapon,
    updateWeapon,
    removeWeapon,
    loading,
    error,
    refresh: fetchWeapons
  };
};

// Hook for character abilities management
export const useCharacterAbilities = (characterId) => {
  const [abilities, setAbilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch abilities
  const fetchAbilities = useCallback(async () => {
    if (!characterId) return;

    setLoading(true);
    try {
      const { data, error: supabaseError } = await supabase
        .from('dnd_character_abilities')
        .select('*')
        .eq('character_id', characterId)
        .order('ability_type', { ascending: true });

      if (supabaseError) throw supabaseError;
      setAbilities(data || []);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, [characterId]);

  // Add ability
  const addAbility = useCallback(async (abilityData) => {
    if (!characterId) return null;

    try {
      const { data, error: supabaseError } = await supabase
        .from('dnd_character_abilities')
        .insert([{
          ...abilityData,
          character_id: characterId
        }])
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      setAbilities(prev => [...prev, data]);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, [characterId]);

  // Update ability uses
  const updateAbilityUses = useCallback(async (abilityId, usesRemaining) => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('dnd_character_abilities')
        .update({ uses_remaining: usesRemaining })
        .eq('id', abilityId)
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      setAbilities(prev => prev.map(a => a.id === abilityId ? data : a));
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  // Reset abilities on rest
  const resetAbilitiesOnRest = useCallback(async (restType = 'short_rest') => {
    if (!characterId) return;

    try {
      const { data, error: supabaseError } = await supabase
        .from('dnd_character_abilities')
        .update({ uses_remaining: supabase.raw('max_uses') })
        .eq('character_id', characterId)
        .in('recharge_type', restType === 'short_rest' ? ['short_rest', 'long_rest'] : ['long_rest'])
        .select();

      if (supabaseError) throw supabaseError;

      // Update local state
      setAbilities(prev => prev.map(ability => {
        const shouldReset = restType === 'short_rest' 
          ? ['short_rest', 'long_rest'].includes(ability.recharge_type)
          : ability.recharge_type === 'long_rest';
        
        return shouldReset 
          ? { ...ability, uses_remaining: ability.max_uses }
          : ability;
      }));

      return data;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, [characterId]);

  useEffect(() => {
    fetchAbilities();
  }, [fetchAbilities]);

  return {
    abilities,
    addAbility,
    updateAbilityUses,
    resetAbilitiesOnRest,
    loading,
    error,
    refresh: fetchAbilities
  };
};

// Character utility functions
export const getAbilityModifier = (abilityScore) => {
  return Math.floor((abilityScore - 10) / 2);
};

export const getProficiencyBonus = (level) => {
  return Math.ceil(level / 4) + 1;
};

export const calculateArmorClass = (character) => {
  // Basic AC calculation - can be extended for different armor types
  const dexMod = getAbilityModifier(character.ability_scores?.dexterity || 10);
  return (character.armor_class || 10) + dexMod;
};

export const calculateInitiativeBonus = (character) => {
  const dexMod = getAbilityModifier(character.ability_scores?.dexterity || 10);
  return dexMod + (character.initiative_bonus || 0);
};

export const isCharacterConscious = (character) => {
  return character.current_hp > 0;
};

export const getCharacterConditions = (character) => {
  return character.conditions || [];
};

export const hasCondition = (character, condition) => {
  const conditions = getCharacterConditions(character);
  return conditions.includes(condition);
};