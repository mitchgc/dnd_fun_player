import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { supabase, getCurrentUser } from '../utils/supabase';

// Type definitions
interface Character {
  id: string;
  user_id: string;
  name: string;
  race: string;
  character_class: string;
  level: number;
  ability_scores: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  current_hp: number;
  max_hp: number;
  temp_hp: number;
  armor_class: number;
  initiative_bonus: number;
  speed: number;
  is_hidden: boolean;
  conditions: string[];
  last_accessed: string;
  created_at: string;
  updated_at: string;
  dnd_character_weapons?: any[];
  dnd_character_abilities?: any[];
  dnd_character_resources?: any[];
  resources?: { [key: string]: number };
}

interface CharacterContextType {
  characters: Character[];
  activeCharacter: Character | null;
  isLoading: boolean;
  error: string | null;
  switchCharacter: (characterId: string) => Promise<void>;
  updateCharacterState: (characterId: string, updates: Partial<Character>) => Promise<void>;
  performAction: (characterId: string, actionType: string, actionData: any) => Promise<void>;
  createCharacter: (characterData: Partial<Character>) => Promise<Character | null>;
  deleteCharacter: (characterId: string) => Promise<boolean>;
  refreshCharacters: () => Promise<void>;
}

// Context creation with proper types
const CharacterContext = createContext<CharacterContextType>({
  characters: [],
  activeCharacter: null,
  isLoading: false,
  error: null,
  switchCharacter: async (characterId: string) => {},
  updateCharacterState: async (characterId: string, updates: Partial<Character>) => {},
  performAction: async (characterId: string, actionType: string, actionData: any) => {},
  createCharacter: async (characterData: Partial<Character>) => null,
  deleteCharacter: async (characterId: string) => false,
  refreshCharacters: async () => {}
});

// Action types
const ActionTypes = {
  SET_CHARACTERS: 'SET_CHARACTERS',
  SET_ACTIVE_CHARACTER: 'SET_ACTIVE_CHARACTER',
  UPDATE_CHARACTER: 'UPDATE_CHARACTER',
  ADD_CHARACTER: 'ADD_CHARACTER',
  REMOVE_CHARACTER: 'REMOVE_CHARACTER',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_CHARACTER_RESOURCE: 'UPDATE_CHARACTER_RESOURCE'
} as const;

// Action interfaces
type CharacterAction =
  | { type: 'SET_CHARACTERS'; payload: Character[] }
  | { type: 'SET_ACTIVE_CHARACTER'; payload: Character | null }
  | { type: 'UPDATE_CHARACTER'; payload: { id: string; updates: Partial<Character> } }
  | { type: 'ADD_CHARACTER'; payload: Character }
  | { type: 'REMOVE_CHARACTER'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_CHARACTER_RESOURCE'; payload: { characterId: string; resourceName: string; value: number } };

// Reducer
const characterReducer = (state: CharacterState, action: CharacterAction): CharacterState => {
  switch (action.type) {
    case ActionTypes.SET_CHARACTERS:
      return {
        ...state,
        characters: action.payload,
        isLoading: false,
        error: null
      };
      
    case ActionTypes.SET_ACTIVE_CHARACTER:
      return {
        ...state,
        activeCharacter: action.payload,
        error: null
      };
      
    case ActionTypes.UPDATE_CHARACTER:
      return {
        ...state,
        characters: state.characters.map(char =>
          char.id === action.payload.id 
            ? { ...char, ...action.payload.updates }
            : char
        ),
        activeCharacter: state.activeCharacter?.id === action.payload.id
          ? { ...state.activeCharacter, ...action.payload.updates }
          : state.activeCharacter
      };
      
    case ActionTypes.ADD_CHARACTER:
      return {
        ...state,
        characters: [...state.characters, action.payload]
      };
      
    case ActionTypes.REMOVE_CHARACTER:
      return {
        ...state,
        characters: state.characters.filter(char => char.id !== action.payload),
        activeCharacter: state.activeCharacter?.id === action.payload 
          ? null 
          : state.activeCharacter
      };
      
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
      
    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
      
    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
      
    case ActionTypes.UPDATE_CHARACTER_RESOURCE:
      const { characterId, resourceName, value } = action.payload;
      return {
        ...state,
        characters: state.characters.map(char => {
          if (char.id === characterId) {
            return {
              ...char,
              resources: {
                ...char.resources,
                [resourceName]: value
              }
            };
          }
          return char;
        }),
        activeCharacter: state.activeCharacter?.id === characterId
          ? {
              ...state.activeCharacter,
              resources: {
                ...state.activeCharacter.resources,
                [resourceName]: value
              }
            }
          : state.activeCharacter
      };
      
    default:
      return state;
  }
};

// State interface
interface CharacterState {
  characters: Character[];
  activeCharacter: Character | null;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: CharacterState = {
  characters: [],
  activeCharacter: null,
  isLoading: true,
  error: null
};

// Provider component
interface CharacterProviderProps {
  children: ReactNode;
}

export const CharacterProvider: React.FC<CharacterProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(characterReducer, initialState);

  // Fetch user's characters from Supabase
  const fetchCharacters = useCallback(async (retryCount = 0) => {
    if (!supabase) {
      console.warn('📦 Supabase not configured for character loading');
      dispatch({ type: ActionTypes.SET_ERROR, payload: 'Supabase not configured' });
      return;
    }

    console.log('🔍 Fetching characters...');
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    
    try {
      const user = await getCurrentUser();
      console.log('👤 Character loading - User check:', user ? 'authenticated' : 'not authenticated');
      
      if (!user) {
        console.error('❌ User not authenticated for character loading');
        
        // Only retry once to prevent infinite loops
        if (retryCount === 0) {
          dispatch({ type: ActionTypes.SET_ERROR, payload: 'User not authenticated - will retry in 2 seconds' });
          setTimeout(() => {
            console.log('🔄 Retrying character loading after auth delay...');
            fetchCharacters(1);
          }, 2000);
        } else {
          dispatch({ type: ActionTypes.SET_ERROR, payload: 'User authentication failed after retry' });
        }
        return;
      }

      // Fetch all characters (no user filter for personal D&D app)
      // Fetch all characters (no user filter for personal D&D app)
      const { data: characters, error } = await supabase
        .from('dnd_characters')
        .select('*')
        .order('last_accessed', { ascending: false });

      if (error) throw error;

      // Fetch related data for each character
      if (characters && characters.length > 0) {
        for (const character of characters) {
          // Fetch abilities
          const { data: abilities } = await supabase
            .from('dnd_character_abilities')
            .select('*')
            .eq('character_id', character.id);
          
          // Fetch weapons
          const { data: weapons } = await supabase
            .from('dnd_character_weapons')
            .select('*')
            .eq('character_id', character.id);
            
          // Fetch resources
          const { data: resources } = await supabase
            .from('dnd_character_resources')
            .select('*')
            .eq('character_id', character.id);
            
          // Transform and attach to character object
          character.dnd_character_abilities = abilities || [];
          character.dnd_character_weapons = (weapons || []).map(weapon => ({
            ...weapon,
            // Flatten weapon_data fields to match expected structure
            damage_dice: weapon.weapon_data?.damage || '1d6',
            damage_bonus: weapon.weapon_data?.damageBonus || 0,
            attack_bonus: weapon.weapon_data?.attackBonus || 0,
            damage_type: weapon.weapon_data?.damageType || 'piercing',
            properties: weapon.weapon_data?.properties?.join(', ') || '',
            range_normal: weapon.weapon_data?.range?.[0] || null,
            range_long: weapon.weapon_data?.range?.[1] || null,
            description: weapon.weapon_data?.description || ''
          }));
          character.dnd_character_resources = resources || [];
        }
      }

      dispatch({ type: ActionTypes.SET_CHARACTERS, payload: characters || [] });


      // Set the most recently accessed character as active
      if (characters && characters.length > 0) {
        dispatch({ type: ActionTypes.SET_ACTIVE_CHARACTER, payload: characters[0] });
      }
    } catch (error: any) {
      console.error('Error fetching characters:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
    }
  }, []);

  // Switch active character
  const switchCharacter = useCallback(async (characterId: string) => {
    const character = state.characters.find(c => c.id === characterId);
    if (!character) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: 'Character not found' });
      return;
    }

    dispatch({ type: ActionTypes.SET_ACTIVE_CHARACTER, payload: character });

    // Update last_accessed in database
    if (supabase) {
      try {
        await supabase
          .from('dnd_characters')
          .update({ last_accessed: new Date().toISOString() })
          .eq('id', characterId);
      } catch (error) {
        console.error('Error updating character last_accessed:', error);
      }
    }
  }, [state.characters]);

  // Update character state
  const updateCharacterState = useCallback(async (characterId: string, updates: Partial<Character>) => {
    console.log('updateCharacterState called with:', { characterId, updates });
    
    dispatch({ 
      type: ActionTypes.UPDATE_CHARACTER, 
      payload: { id: characterId, updates } 
    });

    // Persist to database
    if (supabase) {
      try {
        // Filter out null/undefined/NaN values to prevent database constraint violations
        const sanitizedUpdates = Object.fromEntries(
          Object.entries(updates).filter(([key, value]) => {
            const isValid = value !== null && value !== undefined && !Number.isNaN(value);
            if (!isValid) {
              console.warn(`Filtering out ${key}: ${value} (null/undefined/NaN)`);
            }
            return isValid;
          })
        );

        console.log('Sanitized updates being sent to DB:', sanitizedUpdates);

        // Only update if there are valid fields to update
        if (Object.keys(sanitizedUpdates).length > 0) {
          const { error } = await supabase
            .from('dnd_characters')
            .update(sanitizedUpdates)
            .eq('id', characterId);

          if (error) throw error;
        } else {
          console.warn('No valid updates to send to database after sanitization');
        }
      } catch (error: any) {
        console.error('Error updating character:', error);
        console.error('Original updates object:', updates);
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      }
    }
  }, []);

  // Perform character action
  const performAction = useCallback(async (characterId: string, actionType: string, actionData: any) => {
    const character = state.characters.find(c => c.id === characterId);
    if (!character) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: 'Character not found' });
      return;
    }

    // This will be expanded with CharacterActionManager integration
    console.log('Performing action:', { characterId, actionType, actionData });

    // Example: Update HP after damage
    if (actionType === 'takeDamage') {
      const currentHp = character.current_hp || 0;
      const damage = actionData.damage || 0;
      const newHp = Math.max(0, currentHp - damage);
      
      // Ensure newHp is a valid number
      if (typeof newHp === 'number' && !isNaN(newHp)) {
        await updateCharacterState(characterId, { current_hp: newHp });
      }
    }

    // Example: Use ability
    if (actionType === 'useAbility') {
      if (supabase && actionData.abilityId) {
        try {
          const { data: ability } = await supabase
            .from('dnd_character_abilities')
            .select('*')
            .eq('id', actionData.abilityId)
            .single();

          if (ability && ability.uses_remaining > 0) {
            await supabase
              .from('dnd_character_abilities')
              .update({ uses_remaining: ability.uses_remaining - 1 })
              .eq('id', actionData.abilityId);
          }
        } catch (error: any) {
          console.error('Error using ability:', error);
        }
      }
    }
  }, [state.characters, updateCharacterState]);

  // Create new character
  const createCharacter = useCallback(async (characterData: Partial<Character>) => {
    if (!supabase) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: 'Supabase not configured' });
      return null;
    }

    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('dnd_characters')
        .insert([{
          ...characterData,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      dispatch({ type: ActionTypes.ADD_CHARACTER, payload: data });
      return data;
    } catch (error: any) {
      console.error('Error creating character:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      return null;
    }
  }, []);

  // Delete character
  const deleteCharacter = useCallback(async (characterId: string) => {
    if (!supabase) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: 'Supabase not configured' });
      return false;
    }

    try {
      const { error } = await supabase
        .from('dnd_characters')
        .delete()
        .eq('id', characterId);

      if (error) throw error;

      dispatch({ type: ActionTypes.REMOVE_CHARACTER, payload: characterId });
      return true;
    } catch (error: any) {
      console.error('Error deleting character:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      return false;
    }
  }, []);

  // Load characters on mount, but only after a short delay to allow auth
  useEffect(() => {
    console.log('⏳ Delaying character loading to allow auth initialization...');
    const timer = setTimeout(() => {
      console.log('🚀 Loading characters after auth delay...');
      fetchCharacters();
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []); // Remove fetchCharacters dependency to prevent infinite loop

  // Subscribe to character changes
  useEffect(() => {
    if (!supabase) return;

    const setupSubscription = async () => {
      const subscription = supabase
        .channel('character-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'dnd_characters'
          },
          (payload) => {
            console.log('Character change:', payload);
            if (payload.eventType === 'UPDATE') {
              dispatch({
                type: ActionTypes.UPDATE_CHARACTER,
                payload: { id: payload.new.id, updates: payload.new }
              });
            }
          }
        )
        .subscribe();

      return subscription;
    };

    let subscription: any;
    setupSubscription().then(sub => subscription = sub);

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const value = {
    ...state,
    switchCharacter,
    updateCharacterState,
    performAction,
    createCharacter,
    deleteCharacter,
    refreshCharacters: fetchCharacters
  };

  return (
    <CharacterContext.Provider value={value}>
      {children}
    </CharacterContext.Provider>
  );
};

// Custom hook to use character context
export const useCharacter = () => {
  const context = useContext(CharacterContext);
  if (!context) {
    throw new Error('useCharacter must be used within a CharacterProvider');
  }
  return context;
};

export default CharacterContext;