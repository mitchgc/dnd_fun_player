import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Share2, Users, Save, AlertCircle, Check } from 'lucide-react';
import { updateJournal, updatePresence } from '../../utils/supabase';

export default function CollaborativeEditor({ 
  sessionCode, 
  journalId, 
  displayName, 
  user, 
  initialContent = '',
  collaborators = [],
  onContentChange,
  onCollaboratorsChange,
  isLocalMode = false
}) {
  const [content, setContent] = useState(initialContent);
  const [lastSavedContent, setLastSavedContent] = useState(initialContent);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'error', 'unsaved'
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const editorRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const presenceTimeoutRef = useRef(null);

  // Initialize content
  useEffect(() => {
    setContent(initialContent);
    setLastSavedContent(initialContent);
  }, [initialContent]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update presence periodically
  useEffect(() => {
    // Skip presence updates in local mode
    if (isLocalMode) {
      return;
    }

    const updateUserPresence = async () => {
      if (journalId && user && isOnline) {
        await updatePresence(journalId);
      }
    };

    // Update presence immediately
    updateUserPresence();

    // Update presence every 30 seconds
    const interval = setInterval(updateUserPresence, 30000);

    return () => clearInterval(interval);
  }, [journalId, user, isOnline, isLocalMode]);

  // Debounced save function
  const debouncedSave = useCallback(async (newContent) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveStatus('unsaved');

    saveTimeoutRef.current = setTimeout(async () => {
      // In local mode, just call the content change handler immediately
      if (isLocalMode) {
        onContentChange && onContentChange(newContent);
        setSaveStatus('saved');
        return;
      }

      if (!isOnline) {
        setSaveStatus('error');
        return;
      }

      setSaveStatus('saving');
      
      try {
        const result = await updateJournal(sessionCode, newContent);
        
        if (result) {
          setLastSavedContent(newContent);
          setSaveStatus('saved');
          onContentChange && onContentChange(newContent);
        } else {
          setSaveStatus('error');
        }
      } catch (error) {
        console.error('Save error:', error);
        setSaveStatus('error');
      }
    }, 1000); // Save after 1 second of inactivity
  }, [sessionCode, isOnline, onContentChange, isLocalMode]);

  // Handle content changes
  const handleContentChange = useCallback((event) => {
    const newContent = event.target.value;
    setContent(newContent);
    debouncedSave(newContent);
  }, [debouncedSave]);

  // Copy session code to clipboard
  const copySessionCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(sessionCode);
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy session code:', error);
    }
  }, [sessionCode]);

  // Get save status icon and color
  const getSaveStatusInfo = () => {
    switch (saveStatus) {
      case 'saved':
        return { icon: Check, color: 'text-green-400', text: 'Saved' };
      case 'saving':
        return { icon: Save, color: 'text-blue-400', text: 'Saving...' };
      case 'unsaved':
        return { icon: AlertCircle, color: 'text-yellow-400', text: 'Unsaved changes' };
      case 'error':
        return { icon: AlertCircle, color: 'text-red-400', text: 'Save failed' };
      default:
        return { icon: Check, color: 'text-gray-400', text: 'Unknown' };
    }
  };

  const statusInfo = getSaveStatusInfo();
  const StatusIcon = statusInfo.icon;

  // Format collaborator count
  const activeCollaborators = collaborators.filter(c => c.is_active);
  const collaboratorCount = activeCollaborators.length;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl shadow-xl border-2 border-purple-600">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold text-white flex items-center">
                📝 {isLocalMode ? 'Personal Journal' : 'Collaborative Journal'}
              </h2>
              {!isOnline && !isLocalMode && (
                <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                  Offline
                </span>
              )}
              {isLocalMode && (
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  Local
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Save Status */}
              {!isLocalMode && (
                <div className="flex items-center space-x-2">
                  <StatusIcon size={16} className={statusInfo.color} />
                  <span className={`text-sm ${statusInfo.color}`}>
                    {statusInfo.text}
                  </span>
                </div>
              )}
              
              {/* Collaborator Count */}
              {!isLocalMode && (
                <div className="flex items-center space-x-2 text-gray-300">
                  <Users size={16} />
                  <span className="text-sm">
                    {collaboratorCount} {collaboratorCount === 1 ? 'user' : 'users'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Session Code and Collaborators */}
          {!isLocalMode && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-gray-300">Session Code:</span>
                <button
                  onClick={copySessionCode}
                  className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-lg transition-colors"
                >
                  <span className="font-mono text-lg text-white">{sessionCode}</span>
                  <Share2 size={16} className="text-gray-400" />
                </button>
              </div>

              {/* Active Collaborators */}
              {activeCollaborators.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-300 text-sm">Active:</span>
                  <div className="flex -space-x-2">
                    {activeCollaborators.slice(0, 5).map((collaborator) => (
                      <div
                        key={collaborator.id}
                        className="w-8 h-8 rounded-full border-2 border-gray-700 flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: collaborator.color }}
                        title={collaborator.display_name}
                      >
                        {collaborator.display_name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {activeCollaborators.length > 5 && (
                      <div className="w-8 h-8 rounded-full border-2 border-gray-700 bg-gray-600 flex items-center justify-center text-white text-xs">
                        +{activeCollaborators.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Local Mode Info */}
          {isLocalMode && (
            <div className="text-gray-300">
              <p className="text-sm">Your journal is saved locally on this device.</p>
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="p-6">
          <textarea
            ref={editorRef}
            value={content}
            onChange={handleContentChange}
            placeholder={isLocalMode ? 
              "Start writing your personal notes here... \n\nUse markdown formatting:\n# Headings\n**Bold text**\n*Italic text*\n- Bullet points" :
              "Start writing your session notes here... \n\nUse markdown formatting:\n# Headings\n**Bold text**\n*Italic text*\n- Bullet points\n\nShare the session code with your party to collaborate in real-time!"
            }
            className="w-full h-96 bg-gray-800 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            style={{ 
              minHeight: '400px',
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
            }}
            disabled={!isOnline && !isLocalMode}
          />
          
          {!isOnline && !isLocalMode && (
            <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-400 text-sm">
                You're currently offline. Changes will be saved when you reconnect to the internet.
              </p>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="px-6 py-4 border-t border-gray-700 bg-gray-800/50 rounded-b-2xl">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div>
              Editing as <span className="text-white font-medium">{displayName}</span>
            </div>
            <div>
              {content.length} characters • {content.split('\n').length} lines
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}