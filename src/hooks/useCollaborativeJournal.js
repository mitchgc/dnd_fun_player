import { useState, useEffect, useRef } from 'react';
import { supabase, getJournal, getCollaborators, isSupabaseConfigured } from '../utils/supabase';

export function useCollaborativeJournal(sessionCode, journalId, user) {
  const [journal, setJournal] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  
  const subscriptionsRef = useRef([]);
  const lastKnownContentRef = useRef('');

  // Initialize journal data
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError('Collaborative features are not available. Supabase is not configured.');
      setLoading(false);
      return;
    }
    
    if (!sessionCode || !journalId || !user) return;

    const initializeJournal = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load initial journal data
        const journalData = await getJournal(sessionCode);
        if (journalData) {
          setJournal(journalData);
          lastKnownContentRef.current = journalData.content;
        }

        // Load initial collaborators
        const collaboratorsData = await getCollaborators(journalId);
        setCollaborators(collaboratorsData);

      } catch (err) {
        console.error('Error initializing journal:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeJournal();
  }, [sessionCode, journalId, user]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    if (!sessionCode || !journalId || !user) return;

    const setupSubscriptions = () => {
      // Subscribe to journal changes
      const journalChannel = supabase
        .channel(`journal-${sessionCode}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'dnd_journals',
            filter: `session_code=eq.${sessionCode}`
          },
          (payload) => {
            if (payload.new && payload.new.updated_by !== user.id) {
              // Only update if the change came from another user
              const newContent = payload.new.content;
              
              // Only update if content actually changed
              if (newContent !== lastKnownContentRef.current) {
                setJournal(prev => ({
                  ...prev,
                  ...payload.new
                }));
                lastKnownContentRef.current = newContent;
                setLastUpdateTime(new Date());
              }
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Journal subscription established');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Journal subscription error');
            setError('Real-time connection failed');
          }
        });

      // Subscribe to collaborator changes
      const collaboratorChannel = supabase
        .channel(`collaborators-${journalId}`)
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'dnd_collaborators',
            filter: `journal_id=eq.${journalId}`
          },
          async (payload) => {
            // Refresh collaborators list when changes occur
            try {
              const updatedCollaborators = await getCollaborators(journalId);
              setCollaborators(updatedCollaborators);
            } catch (err) {
              console.error('Error refreshing collaborators:', err);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Collaborators subscription established');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Collaborators subscription error');
          }
        });

      subscriptionsRef.current = [journalChannel, collaboratorChannel];
    };

    setupSubscriptions();

    // Cleanup subscriptions on unmount or dependency change
    return () => {
      if (supabase) {
        subscriptionsRef.current.forEach(subscription => {
          if (subscription) {
            supabase.removeChannel(subscription);
          }
        });
      }
      subscriptionsRef.current = [];
    };
  }, [sessionCode, journalId, user]);

  // Handle content updates from local editor
  const handleLocalContentUpdate = (newContent) => {
    lastKnownContentRef.current = newContent;
    setJournal(prev => prev ? { ...prev, content: newContent } : null);
  };

  // Manual refresh function
  const refreshJournal = async () => {
    if (!sessionCode) return;

    try {
      const journalData = await getJournal(sessionCode);
      if (journalData) {
        setJournal(journalData);
        lastKnownContentRef.current = journalData.content;
      }
    } catch (err) {
      console.error('Error refreshing journal:', err);
      setError(err.message);
    }
  };

  const refreshCollaborators = async () => {
    if (!journalId) return;

    try {
      const collaboratorsData = await getCollaborators(journalId);
      setCollaborators(collaboratorsData);
    } catch (err) {
      console.error('Error refreshing collaborators:', err);
    }
  };

  // Connection status detection
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const handleOnline = () => {
      setIsConnected(true);
      // Refresh data when coming back online
      refreshJournal();
      refreshCollaborators();
    };

    const handleOffline = () => {
      setIsConnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [sessionCode, journalId]);

  return {
    journal,
    collaborators,
    loading,
    error,
    isConnected,
    lastUpdateTime,
    handleLocalContentUpdate,
    refreshJournal,
    refreshCollaborators
  };
}