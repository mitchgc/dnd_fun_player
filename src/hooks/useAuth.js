import { useState, useEffect } from 'react';
import { supabase, signInAnonymously, getCurrentUser, isSupabaseConfigured } from '../utils/supabase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLocalMode, setIsLocalMode] = useState(false);

  useEffect(() => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Switching to local mode.');
      // Create a local user for local mode
      const localUser = {
        id: `local-user-${Date.now()}`,
        email: 'local@example.com',
        user_metadata: { display_name: 'Local User' },
        isLocal: true
      };
      console.log('🏠 Created local user:', localUser);
      setUser(localUser);
      setIsLocalMode(true);
      setLoading(false);
      return;
    }

    console.log('🔐 Supabase is configured, initializing auth...');

    // Check for existing session
    const initializeAuth = async () => {
      try {
        setLoading(true);
        const currentUser = await getCurrentUser();
        
        if (currentUser) {
          console.log('👤 Found existing user:', currentUser);
          setUser(currentUser);
          setIsLocalMode(false);
        } else {
          console.log('❌ No existing user, creating anonymous user automatically...');
          // Auto-create anonymous user for seamless experience
          const newUser = await signInAnonymously();
          if (newUser) {
            console.log('✅ Auto-created anonymous user:', newUser);
            setUser(newUser);
            setIsLocalMode(false);
          } else {
            console.warn('Failed to auto-create user, will need manual authentication');
            setUser(null);
            setIsLocalMode(false);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        console.warn('Authentication failed. Switching to local mode.');
        // Fall back to local mode on any auth error
        const localUser = {
          id: `local-user-${Date.now()}`,
          email: 'local@example.com',
          user_metadata: { display_name: 'Local User' },
          isLocal: true
        };
        setUser(localUser);
        setIsLocalMode(true);
        setError(null); // Clear error since we're in local mode
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes only if Supabase is available
    let subscription;
    if (supabase && !isLocalMode) {
      const { data } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            setUser(session.user);
            setIsLocalMode(false);
            setError(null);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setIsLocalMode(false);
          }
        }
      );
      subscription = data.subscription;
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, [isLocalMode]);

  const ensureAuthenticated = async () => {
    if (isLocalMode) {
      console.log('🏠 Using local mode user for authentication');
      return user; // In local mode, always return the local user
    }
    
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured and not in local mode');
    }
    
    if (!user) {
      console.log('🔐 No user found, creating anonymous user...');
      const newUser = await signInAnonymously();
      if (newUser) {
        console.log('✅ Anonymous user created:', newUser);
        setUser(newUser);
        setIsLocalMode(false);
        return newUser;
      } else {
        console.error('❌ Failed to create anonymous user');
        throw new Error('Failed to authenticate');
      }
    }
    console.log('👤 Using existing authenticated user');
    return user;
  };

  return {
    user,
    loading,
    error,
    isLocalMode,
    ensureAuthenticated
  };
}