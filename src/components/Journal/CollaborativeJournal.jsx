import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import SessionManager from './SessionManager';
import CollaborativeEditor from './CollaborativeEditor';
import { useAuth } from '../../hooks/useAuth';
import { useCollaborativeJournal } from '../../hooks/useCollaborativeJournal';

export default function CollaborativeJournal() {
  const { user, loading: authLoading, error: authError } = useAuth();
  const [sessionCode, setSessionCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [journalId, setJournalId] = useState('');
  const [hasSession, setHasSession] = useState(false);
  const [localContent, setLocalContent] = useState('');

  const {
    journal,
    collaborators,
    loading: journalLoading,
    error: journalError,
    isConnected,
    lastUpdateTime,
    handleLocalContentUpdate,
    refreshJournal,
    refreshCollaborators
  } = useCollaborativeJournal(sessionCode, journalId, user);

  // Load session from localStorage on mount
  useEffect(() => {
    const savedSessionCode = localStorage.getItem('dnd-session-code');
    const savedDisplayName = localStorage.getItem('dnd-display-name');
    const savedJournalId = localStorage.getItem('dnd-journal-id');

    if (savedSessionCode && savedDisplayName && savedJournalId) {
      setSessionCode(savedSessionCode);
      setDisplayName(savedDisplayName);
      setJournalId(savedJournalId);
      setHasSession(true);
    }
  }, []);

  const handleSessionReady = (code, name, id) => {
    setSessionCode(code);
    setDisplayName(name);
    setJournalId(id);
    setHasSession(true);
  };

  const handleLeaveSession = () => {
    // Clear session data
    localStorage.removeItem('dnd-session-code');
    localStorage.removeItem('dnd-display-name');
    localStorage.removeItem('dnd-journal-id');
    
    setSessionCode('');
    setDisplayName('');
    setJournalId('');
    setHasSession(false);
  };


  const handleRefresh = async () => {
    await Promise.all([refreshJournal(), refreshCollaborators()]);
  };

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Initializing...</p>
        </div>
      </div>
    );
  }

  // Show auth error
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto p-6 bg-red-900/20 border border-red-500/20 rounded-lg">
          <div className="flex items-center space-x-3 mb-4">
            <AlertCircle className="text-red-400" size={24} />
            <h3 className="text-lg font-semibold text-white">Authentication Error</h3>
          </div>
          <p className="text-red-400 mb-4">{authError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show session manager if no active session
  if (!hasSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black">
        <div className="container mx-auto px-4 py-8">
          <SessionManager onSessionReady={handleSessionReady} user={user} />
        </div>
      </div>
    );
  }

  // Show journal loading state
  if (journalLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-300">Loading journal...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show journal error
  if (journalError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto p-6 bg-red-900/20 border border-red-500/20 rounded-lg">
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="text-red-400" size={24} />
              <h3 className="text-lg font-semibold text-white">Journal Error</h3>
            </div>
            <p className="text-red-400 mb-4">{journalError}</p>
            <div className="flex space-x-3">
              <button
                onClick={handleRefresh}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <RefreshCw size={16} />
                <span>Retry</span>
              </button>
              <button
                onClick={handleLeaveSession}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Leave Session
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black">
      <div className="container mx-auto px-4 py-8">
        
        
        {/* Connection Status Banner */}
        {!isConnected && (
          <div className="max-w-4xl mx-auto mb-4">
            <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-lg p-4 flex items-center space-x-3">
              <WifiOff className="text-yellow-400" size={20} />
              <div className="flex-1">
                <p className="text-yellow-400 font-medium">You're currently offline</p>
                <p className="text-yellow-300 text-sm">Changes will sync when you reconnect.</p>
              </div>
            </div>
          </div>
        )}

        {/* Last Update Indicator */}
        {lastUpdateTime && isConnected && (
          <div className="max-w-4xl mx-auto mb-4">
            <div className="bg-green-900/20 border border-green-500/20 rounded-lg p-3 flex items-center space-x-3">
              <Wifi className="text-green-400" size={16} />
              <p className="text-green-400 text-sm">
                Journal updated by collaborator at {lastUpdateTime.toLocaleTimeString()}
              </p>
            </div>
          </div>
        )}

        {/* Main Editor */}
        <CollaborativeEditor
          sessionCode={sessionCode}
          journalId={journalId}
          displayName={displayName}
          user={user}
          initialContent={journal?.content || ''}
          collaborators={collaborators}
          onContentChange={handleLocalContentUpdate}
        />

        {/* Leave Session Button */}
        <div className="max-w-4xl mx-auto mt-6 text-center">
          <button
            onClick={handleLeaveSession}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Leave Session
          </button>
        </div>
      </div>
    </div>
  );
}