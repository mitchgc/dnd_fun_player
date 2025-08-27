import { useState, useEffect } from 'react';
import { supabase, signInAnonymously, signInWithGoogle, signOut, getCurrentUser, isSupabaseConfigured } from '../utils/supabase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured) {
      console.error('Supabase not configured.');
      setError('Authentication service not configured');
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
        } else {
          console.log('❌ No existing user, waiting for authentication...');
          setUser(null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    let subscription;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            setUser(session.user);
            setError(null);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
          }
        }
      );
      subscription = data.subscription;
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signInWithGoogleAuth = async () => {
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
    if (!isSupabaseConfigured) {
      throw new Error('Authentication service not configured');
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
    ensureAuthenticated,
    signInWithGoogle: signInWithGoogleAuth,
    signOut: signOutUser
  };
}