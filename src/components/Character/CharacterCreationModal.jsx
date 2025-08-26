import React, { useState } from 'react';
import { X, User, Shield, Sword } from 'lucide-react';
import { CharacterManager } from '../../utils/characterManager.js';

const CharacterCreationModal = ({ isOpen, onClose, onCharacterCreated, isHidden = false }) => {
  const [selectedTemplate, setSelectedTemplate] = useState('rogueScout');
  const [customName, setCustomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const templates = {
    rogueScout: {
      id: 'rogueScout',
      name: 'Rogue Scout',
      race: 'Yuan-ti',
      class: 'Rogue (Scout)',
      level: 5,
      description: 'Stealthy and perceptive. Expert in stealth and survival.',
      icon: '🐍',
      abilities: ['Stealth Expertise', 'Sneak Attack', 'Cunning Action'],
      primaryStats: 'Dexterity & Wisdom'
    },
    fighterKnight: {
      id: 'fighterKnight',
      name: 'Fighter Knight',
      race: 'Human',
      class: 'Fighter (Knight)',
      level: 5,
      description: 'Heavy armor warrior with sword and shield.',
      icon: '⚔️',
      abilities: ['Second Wind', 'Action Surge', 'Heavy Armor'],
      primaryStats: 'Strength & Constitution'
    },
    wizardScholar: {
      id: 'wizardScholar',
      name: 'Wizard Scholar',
      race: 'Elf',
      class: 'Wizard (Divination)',
      level: 5,
      description: 'Spellcaster focused on knowledge and magic.',
      icon: '🧙‍♂️',
      abilities: ['Spellcasting', 'Arcane Knowledge', 'Portent'],
      primaryStats: 'Intelligence & Wisdom'
    }
  };
  
  const handleCreateCharacter = async () => {
    if (isCreating) return;
    
    setIsCreating(true);
    try {
      const template = templates[selectedTemplate];
      const characterData = {
        name: customName.trim() || template.name,
        race: template.race,
        characterClass: template.class,
        level: template.level
      };
      
      const newCharacter = CharacterManager.createCharacterFromTemplate(selectedTemplate, characterData);
      const success = CharacterManager.saveCharacter(newCharacter);
      
      if (success) {
        // Switch to the new character
        await CharacterManager.switchCharacter(newCharacter.id);
        const enhancedCharacter = CharacterManager.getCurrentCharacter();
        
        onCharacterCreated(enhancedCharacter);
        onClose();
        
        // Reset form
        setCustomName('');
        setSelectedTemplate('rogueScout');
      } else {
        throw new Error('Failed to save character');
      }
    } catch (error) {
      console.error('Failed to create character:', error);
      alert('Failed to create character: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleClose = () => {
    if (isCreating) return;
    setCustomName('');
    setSelectedTemplate('rogueScout');
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border-2 ${
        isHidden
          ? 'bg-gradient-to-br from-gray-800 to-purple-900 border-purple-600'
          : 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-600'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <h2 className="text-2xl font-bold text-white">Create New Character</h2>
          <button
            onClick={handleClose}
            disabled={isCreating}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Character Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Character Name (optional)
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Leave blank to use template name"
              className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              disabled={isCreating}
            />
          </div>
          
          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Choose Character Template
            </label>
            
            <div className="grid gap-4">
              {Object.values(templates).map((template) => (
                <div
                  key={template.id}
                  onClick={() => !isCreating && setSelectedTemplate(template.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedTemplate === template.id
                      ? isHidden
                        ? 'border-purple-500 bg-purple-600 bg-opacity-20'
                        : 'border-blue-500 bg-blue-600 bg-opacity-20'
                      : 'border-gray-600 hover:border-gray-500 bg-gray-800 bg-opacity-50'
                  } ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-start space-x-4">
                    {/* Template Icon */}
                    <div className="text-3xl">
                      {template.icon}
                    </div>
                    
                    {/* Template Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-bold text-white">
                          {template.name}
                        </h3>
                        <span className="text-sm bg-gray-700 text-gray-300 px-2 py-1 rounded">
                          Level {template.level}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-300 mb-3">
                        {template.race} {template.class}
                      </p>
                      
                      <p className="text-sm text-gray-400 mb-3">
                        {template.description}
                      </p>
                      
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs font-medium text-gray-400">Key Abilities:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {template.abilities.map((ability, index) => (
                              <span key={index} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                                {ability}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-xs font-medium text-gray-400">Primary Stats:</span>
                          <span className="text-xs text-gray-300 ml-2">{template.primaryStats}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Selection Indicator */}
                    {selectedTemplate === template.id && (
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        isHidden ? 'bg-purple-500' : 'bg-blue-500'
                      }`}>
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Preview */}
          <div className="p-4 bg-gray-800 bg-opacity-50 rounded-lg border border-gray-600">
            <h4 className="font-medium text-white mb-2">Character Preview:</h4>
            <div className="text-sm text-gray-300">
              <p><strong>Name:</strong> {customName.trim() || templates[selectedTemplate].name}</p>
              <p><strong>Race:</strong> {templates[selectedTemplate].race}</p>
              <p><strong>Class:</strong> {templates[selectedTemplate].class}</p>
              <p><strong>Level:</strong> {templates[selectedTemplate].level}</p>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-600">
          <button
            onClick={handleClose}
            disabled={isCreating}
            className="px-6 py-2 rounded-lg border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateCharacter}
            disabled={isCreating}
            className={`px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
              isHidden
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isCreating ? 'Creating...' : 'Create Character'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CharacterCreationModal;