import React, { useState } from 'react';
import { supabase } from '../utils/supabase';

const SimpleAuth = ({ onAuthenticated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const signInAsPlayer = async (playerName) => {
    if (!supabase) {
      console.warn('Supabase not configured');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use consistent user IDs based on player name
      const playerUserIds = {
        'Player 1': '60ce6953-4afb-42c1-96c4-5350efde5aaf', // Chels' user
        'Player 2': 'f4cd833d-8511-4f3a-995b-da80e844950f'  // Emba's user
      };

      // Sign in anonymously first to get a session
      const { data, error } = await supabase.auth.signInAnonymously({
        options: {
          data: {
            player_name: playerName,
            display_name: playerName,
            consistent_user_id: playerUserIds[playerName]
          }
        }
      });

      if (error) {
        throw error;
      }

      console.log(`Signed in as ${playerName}`);
      
      if (data.user) {
        // Override the user ID with our consistent mapping for character queries
        const mappedUser = {
          ...data.user,
          id: playerUserIds[playerName]
        };
        onAuthenticated(mappedUser);
      }

    } catch (err) {
      console.error('Authentication error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🎲 D&D Helper</h1>
          <p className="text-gray-300">Choose your player</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={() => signInAsPlayer('Player 1')}
            disabled={loading}
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '🎯 Connecting...' : '🎯 Sign in as Player 1'}
          </button>

          <button
            onClick={() => signInAsPlayer('Player 2')}
            disabled={loading}
            className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⚔️ Connecting...' : '⚔️ Sign in as Player 2'}
          </button>
        </div>

        <div className="mt-6 text-center text-gray-400 text-sm">
          <p>Simple authentication for your D&D sessions</p>
        </div>
      </div>
    </div>
  );
};

export default SimpleAuth;