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
      setUser(localUser);
      setIsLocalMode(true);
      setLoading(false);
      return;
    }

    // Check for existing session
    const initializeAuth = async () => {
      try {
        setLoading(true);
        const currentUser = await getCurrentUser();
        
        if (currentUser) {
          setUser(currentUser);
          setIsLocalMode(false);
        } else {
          // Sign in anonymously if no user
          const newUser = await signInAnonymously();
          if (newUser) {
            setUser(newUser);
            setIsLocalMode(false);
          } else {
            console.warn('Failed to authenticate with Supabase. Switching to local mode.');
            // Fall back to local mode
            const localUser = {
              id: `local-user-${Date.now()}`,
              email: 'local@example.com',
              user_metadata: { display_name: 'Local User' },
              isLocal: true
            };
            setUser(localUser);
            setIsLocalMode(true);
            setError(null); // Clear error since we're in local mode
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
            // Try to re-authenticate, fall back to local mode if it fails
            try {
              const newUser = await signInAnonymously();
              if (newUser) {
                setUser(newUser);
                setIsLocalMode(false);
              } else {
                console.warn('Failed to re-authenticate. Switching to local mode.');
                const localUser = {
                  id: `local-user-${Date.now()}`,
                  email: 'local@example.com',
                  user_metadata: { display_name: 'Local User' },
                  isLocal: true
                };
                setUser(localUser);
                setIsLocalMode(true);
              }
            } catch (err) {
              console.warn('Re-authentication failed. Switching to local mode.');
              const localUser = {
                id: `local-user-${Date.now()}`,
                email: 'local@example.com',
                user_metadata: { display_name: 'Local User' },
                isLocal: true
              };
              setUser(localUser);
              setIsLocalMode(true);
            }
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
      return user; // In local mode, always return the local user
    }
    
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured and not in local mode');
    }
    
    if (!user) {
      const newUser = await signInAnonymously();
      if (newUser) {
        setUser(newUser);
        setIsLocalMode(false);
        return newUser;
      } else {
        throw new Error('Failed to authenticate');
      }
    }
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