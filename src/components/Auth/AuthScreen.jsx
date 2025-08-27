import React from 'react';
import { Sword, Shield, User } from 'lucide-react';

const AuthScreen = ({ onGoogleSignIn, loading, error }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black flex items-center justify-center p-4">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-8 border-2 border-blue-600 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center space-x-2 mb-4">
            <Sword className="text-blue-400" size={32} />
            <h1 className="text-3xl font-bold text-white">DnD Helper</h1>
            <Shield className="text-blue-400" size={32} />
          </div>
          <p className="text-gray-300">Your Revolutionary D&D Companion</p>
        </div>

        {/* Authentication Options */}
        <div className="space-y-4">
          {/* Google Sign In */}
          <button
            onClick={onGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-3 bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
          </button>

        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-900 border border-red-600 rounded-lg">
            <p className="text-red-200 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Info */}
        <div className="mt-6 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-white font-semibold mb-2">Features</h3>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• Sync characters across devices</li>
            <li>• Collaborative journals</li>
            <li>• Cloud save backup</li>
            <li>• Access from anywhere</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;