import React, { useState, useRef, useEffect } from 'react';
import { Edit3, Check, X } from 'lucide-react';

interface EditableFieldProps {
  value?: string;
  onSave: (value: string) => Promise<void>;
  placeholder: string;
  multiline?: boolean;
  title?: string;
  className?: string;
  disabled?: boolean;
}

const EditableField: React.FC<EditableFieldProps> = ({ 
  value, 
  onSave, 
  placeholder, 
  multiline = false, 
  title,
  className = "",
  disabled = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (multiline) {
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
      }
    }
  }, [isEditing, multiline]);

  const handleEdit = () => {
    if (disabled) return;
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (editValue.trim() === (value || '').trim()) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving field:', error);
      // Reset to original value on error
      setEditValue(value || '');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!multiline && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleTextareaResize = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    target.style.height = target.scrollHeight + 'px';
  };

  if (isEditing) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-start gap-2">
          {multiline ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={handleTextareaResize}
              placeholder={placeholder}
              className="flex-1 bg-gray-700 text-white border-2 border-blue-500 rounded-lg p-3 text-sm leading-relaxed resize-none focus:outline-none focus:border-blue-400 transition-colors min-h-[80px]"
              disabled={isSaving}
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="flex-1 bg-gray-700 text-white border-2 border-blue-500 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-400 transition-colors"
              disabled={isSaving}
            />
          )}
          
          <div className="flex items-center gap-1">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="p-2 text-green-400 hover:text-green-300 hover:bg-green-900/30 rounded transition-colors disabled:opacity-50"
              title="Save changes"
            >
              <Check size={16} />
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition-colors disabled:opacity-50"
              title="Cancel editing"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        
        {multiline && (
          <p className="text-xs text-gray-500 mt-1">
            Press Escape to cancel • Click ✓ to save
          </p>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`group cursor-pointer hover:bg-gray-700/50 rounded-lg p-3 transition-colors relative ${className} ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      onClick={handleEdit}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {value ? (
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
              {value}
            </p>
          ) : (
            <p className="text-gray-500 italic leading-relaxed">
              {placeholder}
            </p>
          )}
        </div>
        
        {!disabled && (
          <Edit3 
            size={14} 
            className="text-gray-500 group-hover:text-gray-400 transition-colors ml-2 mt-1 opacity-0 group-hover:opacity-100" 
          />
        )}
      </div>
      
      {title && (
        <div className="absolute -top-2 left-2 bg-gray-800 px-1 text-xs text-gray-400">
          {title}
        </div>
      )}
    </div>
  );
};

export default EditableField;