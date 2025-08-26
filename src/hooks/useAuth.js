import { useState, useEffect } from 'react';
import { supabase, signInAnonymously, signInWithGoogle, signOut, getCurrentUser, isSupabaseConfigured } from '../utils/supabase';

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
          console.log('❌ No existing user, waiting for authentication...');
          setUser(null);
          setIsLocalMode(false);
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

  const signInWithGoogleAuth = async () => {
    if (isLocalMode) {
      console.warn('Cannot use Google auth in local mode');
      return false;
    }
    
    if (!isSupabaseConfigured) {
      console.error('Supabase not configured');
      return false;
    }
    
    try {
      setLoading(true);
      const result = await signInWithGoogle();
      return result !== null;
    } catch (error) {
      console.error('Google sign-in failed:', error);
      setError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    if (isLocalMode) {
      console.log('Switching from local mode to unauthenticated');
      setUser(null);
      setIsLocalMode(false);
      return true;
    }
    
    if (!isSupabaseConfigured) {
      return false;
    }
    
    try {
      const success = await signOut();
      if (success) {
        setUser(null);
        setError(null);
      }
      return success;
    } catch (error) {
      console.error('Sign out failed:', error);
      return false;
    }
  };

  const ensureAuthenticated = async () => {
    if (isLocalMode) {
      console.log('🏠 Using local mode user for authentication');
      return user; // In local mode, always return the local user
    }
    
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured and not in local mode');
    }
    
    if (!user) {
      throw new Error('User not authenticated - please sign in');
    }
    
    console.log('👤 Using existing authenticated user');
    return user;
  };

  return {
    user,
    loading,
    error,
    isLocalMode,
    ensureAuthenticated,
    signInWithGoogle: signInWithGoogleAuth,
    signOut: signOutUser
  };
}