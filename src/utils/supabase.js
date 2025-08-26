import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if we have valid Supabase credentials
const hasValidCredentials = supabaseUrl && supabaseAnonKey && 
  supabaseUrl.startsWith('https://') && 
  supabaseAnonKey.startsWith('eyJ')

if (!hasValidCredentials) {
  console.warn('Supabase not configured properly. Collaborative features will be disabled.');
  console.warn('To enable collaborative features, set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in your .env file');
}

// Create supabase client only if we have valid credentials
export const supabase = hasValidCredentials ? createClient(supabaseUrl, supabaseAnonKey) : null
export const isSupabaseConfigured = hasValidCredentials

// Authentication helpers
export const signInAnonymously = async () => {
  if (!supabase) {
    console.warn('Supabase not configured. Anonymous sign-in not available.');
    return null;
  }
  
  try {
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) {
      console.error('Error signing in anonymously:', error)
      return null
    }
    return data.user
  } catch (error) {
    console.error('Anonymous auth error:', error)
    return null
  }
}

export const getCurrentUser = async () => {
  if (!supabase) {
    console.warn('Supabase not configured. User info not available.');
    return null;
  }
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Journal database operations
export const createJournal = async (sessionCode, initialContent = '') => {
  if (!supabase) {
    console.warn('Supabase not configured. Journal creation not available.');
    return null;
  }
  
  try {
    const { data, error } = await supabase
      .from('dnd_journals')
      .insert([
        {
          session_code: sessionCode,
          content: initialContent,
          updated_by: (await getCurrentUser())?.id
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating journal:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Create journal error:', error)
    return null
  }
}

export const getJournal = async (sessionCode) => {
  if (!supabase) {
    console.warn('Supabase not configured. Journal fetching not available.');
    return null;
  }
  
  try {
    const { data, error } = await supabase
      .from('dnd_journals')
      .select('*')
      .eq('session_code', sessionCode)
      .single()

    if (error) {
      console.error('Error fetching journal:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Get journal error:', error)
    return null
  }
}

export const updateJournal = async (sessionCode, content) => {
  if (!supabase) {
    console.warn('Supabase not configured. Journal updates not available.');
    return null;
  }
  
  try {
    const user = await getCurrentUser()
    const { data, error } = await supabase
      .from('dnd_journals')
      .update({
        content: content,
        updated_at: new Date().toISOString(),
        updated_by: user?.id
      })
      .eq('session_code', sessionCode)
      .select()
      .single()

    if (error) {
      console.error('Error updating journal:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Update journal error:', error)
    return null
  }
}

// Collaborator operations
export const addCollaborator = async (journalId, displayName, color) => {
  if (!supabase) {
    console.warn('Supabase not configured. Collaborator features not available.');
    return null;
  }
  
  try {
    const user = await getCurrentUser()
    const { data, error } = await supabase
      .from('dnd_collaborators')
      .upsert([
        {
          journal_id: journalId,
          user_id: user?.id,
          display_name: displayName,
          color: color,
          last_seen: new Date().toISOString(),
          is_active: true
        }
      ], {
        onConflict: 'journal_id,user_id'
      })
      .select()

    if (error) {
      console.error('Error adding collaborator:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Add collaborator error:', error)
    return null
  }
}

export const updatePresence = async (journalId) => {
  if (!supabase) {
    return null;
  }
  
  try {
    const user = await getCurrentUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('dnd_collaborators')
      .update({
        last_seen: new Date().toISOString(),
        is_active: true
      })
      .eq('journal_id', journalId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error updating presence:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Update presence error:', error)
    return null
  }
}

export const getCollaborators = async (journalId) => {
  if (!supabase) {
    return [];
  }
  
  try {
    const { data, error } = await supabase
      .from('dnd_collaborators')
      .select('*')
      .eq('journal_id', journalId)
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching collaborators:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Get collaborators error:', error)
    return []
  }
}

// Utility functions
export const generateUserColor = (userId) => {
  const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', 
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
  ]
  
  // Use hash of userId to consistently assign color
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) & 0xffffffff
  }
  
  return colors[Math.abs(hash) % colors.length]
}

export const generateSessionCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}