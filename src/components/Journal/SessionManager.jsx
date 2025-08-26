import React, { useState } from 'react';
import { Users, Plus, LogIn, Share2 } from 'lucide-react';
import { createJournal, getJournal, generateSessionCode, addCollaborator, generateUserColor } from '../../utils/supabase';

export default function SessionManager({ onSessionReady, user }) {
  const [mode, setMode] = useState('choose'); // 'choose', 'create', 'join'
  const [sessionCode, setSessionCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateSession = async () => {
    if (!displayName.trim()) {
      setError('Please enter your display name');
      return;
    }

    if (!user || !user.id) {
      console.error('User not authenticated:', user);
      setError('Authentication required. Please refresh the page and try again.');
      return;
    }

    console.log('🎯 Creating session with user:', user);
    setLoading(true);
    setError('');

    try {
      const newSessionCode = generateSessionCode();
      const journal = await createJournal(newSessionCode, '# Session Journal\n\nWelcome to your collaborative D&D session notes! Share the code **' + newSessionCode + '** with your party to start collaborating.\n\n## Session Notes\n\n');
      
      if (journal) {
        const userColor = generateUserColor(user.id);
        await addCollaborator(journal.id, displayName.trim(), userColor);
        
        // Store session info in localStorage
        localStorage.setItem('dnd-session-code', newSessionCode);
        localStorage.setItem('dnd-display-name', displayName.trim());
        localStorage.setItem('dnd-journal-id', journal.id);
        
        onSessionReady(newSessionCode, displayName.trim(), journal.id);
      } else {
        setError('Failed to create session. Please try again.');
      }
    } catch (err) {
      console.error('Create session error:', err);
      setError('Failed to create session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async () => {
    if (!sessionCode.trim()) {
      setError('Please enter a session code');
      return;
    }
    
    if (!displayName.trim()) {
      setError('Please enter your display name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const journal = await getJournal(sessionCode.trim().toUpperCase());
      
      if (journal) {
        const userColor = generateUserColor(user.id);
        await addCollaborator(journal.id, displayName.trim(), userColor);
        
        // Store session info in localStorage
        localStorage.setItem('dnd-session-code', sessionCode.trim().toUpperCase());
        localStorage.setItem('dnd-display-name', displayName.trim());
        localStorage.setItem('dnd-journal-id', journal.id);
        
        onSessionReady(sessionCode.trim().toUpperCase(), displayName.trim(), journal.id);
      } else {
        setError('Session not found. Please check the code and try again.');
      }
    } catch (err) {
      console.error('Join session error:', err);
      setError('Failed to join session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatSessionCode = (value) => {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  };

  if (mode === 'choose') {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl shadow-xl p-8 border-2 border-purple-600">
          <div className="text-center mb-8">
            <Users className="mx-auto text-purple-400 mb-4" size={48} />
            <h2 className="text-2xl font-bold text-white mb-2">Collaborative Journal</h2>
            <p className="text-gray-300">Share session notes with your D&D party in real-time</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setMode('create')}
              className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              <Plus size={20} />
              <span>Create New Session</span>
            </button>

            <button
              onClick={() => setMode('join')}
              className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              <LogIn size={20} />
              <span>Join Existing Session</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl shadow-xl p-8 border-2 border-purple-600">
          <div className="text-center mb-6">
            <Plus className="mx-auto text-purple-400 mb-4" size={48} />
            <h2 className="text-2xl font-bold text-white mb-2">Create Session</h2>
            <p className="text-gray-300">Start a new collaborative journal</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                maxLength={50}
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-900/20 border border-red-500/20 rounded-lg p-3">
                {error}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => setMode('choose')}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200"
                disabled={loading}
              >
                Back
              </button>
              <button
                onClick={handleCreateSession}
                disabled={loading || !displayName.trim()}
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Session'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'join') {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl shadow-xl p-8 border-2 border-blue-600">
          <div className="text-center mb-6">
            <LogIn className="mx-auto text-blue-400 mb-4" size={48} />
            <h2 className="text-2xl font-bold text-white mb-2">Join Session</h2>
            <p className="text-gray-300">Enter the session code to collaborate</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Session Code
              </label>
              <input
                type="text"
                value={sessionCode}
                onChange={(e) => setSessionCode(formatSessionCode(e.target.value))}
                placeholder="Enter 6-character code..."
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg font-mono tracking-wider"
                maxLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={50}
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-900/20 border border-red-500/20 rounded-lg p-3">
                {error}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => setMode('choose')}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200"
                disabled={loading}
              >
                Back
              </button>
              <button
                onClick={handleJoinSession}
                disabled={loading || !sessionCode.trim() || !displayName.trim()}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
              >
                {loading ? 'Joining...' : 'Join Session'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}