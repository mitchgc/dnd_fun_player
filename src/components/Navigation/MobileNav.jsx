import React, { useState } from 'react';
import { Sword, Shield, User, BookOpen, Menu, X } from 'lucide-react';
import { hapticFeedback } from '../../utils/touchUtils';
import CharacterToggle from '../Character/CharacterToggle';

const MobileNav = ({ 
  activeTab, 
  setActiveTab, 
  isHidden, 
  activeCharacter, 
  switchCharacter, 
  user, 
  signOut 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigationItems = [
    { id: 'battle', label: 'Battle', icon: Sword, color: 'blue' },
    { id: 'stats', label: 'Stats', icon: Shield, color: 'blue' },
    { id: 'backstory', label: 'Story', icon: User, color: 'blue' },
    { id: 'journal', label: 'Journal', icon: BookOpen, color: 'green' }
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setIsMenuOpen(false);
    hapticFeedback.light();
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    hapticFeedback.medium();
  };

  return (
    <React.Fragment>
      {/* Mobile Header */}
      <div className="flex items-center justify-between p-4">
        {/* Hamburger Menu Button */}
        <button
          onClick={toggleMenu}
          className={`p-2 rounded-lg touch-ripple min-h-[44px] min-w-[44px] transition-all duration-200 ${
            isHidden 
              ? 'text-purple-400 active:bg-gray-800' 
              : 'text-blue-400 active:bg-gray-700'
          }`}
          aria-label="Open navigation menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Current Tab Indicator - Now takes full width */}
        <div className="flex-1 text-center">
          <span className={`font-bold text-lg ${
            isHidden ? 'text-purple-400' : 'text-blue-400'
          }`}>
            {navigationItems.find(item => item.id === activeTab)?.label || 'Battle'}
          </span>
        </div>

        {/* Empty space for symmetry */}
        <div className="w-10"></div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <React.Fragment>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] z-50 transform transition-transform duration-300 ease-out overflow-hidden flex flex-col ${
            isHidden 
              ? 'bg-gradient-to-b from-gray-900 to-gray-800 border-r border-purple-600'
              : 'bg-gradient-to-b from-gray-800 to-gray-700 border-r border-gray-600'
          } ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            
            {/* Menu Header - Fixed */}
            <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className={`text-xl font-bold ${
                isHidden ? 'text-purple-400' : 'text-blue-400'
              }`}>
                Navigation
              </h2>
              <button
                onClick={toggleMenu}
                className={`p-2 rounded-lg touch-ripple ${
                  isHidden 
                    ? 'text-gray-400 active:bg-gray-800' 
                    : 'text-gray-400 active:bg-gray-700'
                }`}
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto">
              {/* Navigation Items */}
              <nav className="py-4">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={`w-full flex items-center space-x-4 px-6 py-4 text-left transition-all duration-200 touch-ripple min-h-[44px] ${
                        isActive
                          ? isHidden
                            ? 'bg-gray-800 text-purple-400 border-r-4 border-purple-400'
                            : item.id === 'journal'
                              ? 'bg-gray-700 text-green-400 border-r-4 border-green-400'
                              : 'bg-gray-700 text-blue-400 border-r-4 border-blue-400'
                          : isHidden
                            ? 'text-gray-300 active:bg-gray-800 active:text-purple-400'
                            : 'text-gray-300 active:bg-gray-700 active:text-blue-400'
                      }`}
                    >
                      <Icon size={24} />
                      <span className="text-lg font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Character Selection Section */}
              <div className="px-6 py-4 border-t border-gray-700">
                <h3 className={`text-sm font-medium mb-3 ${
                  isHidden ? 'text-purple-300' : 'text-blue-300'
                }`}>
                  Character
                </h3>
                <CharacterToggle
                  currentCharacterId={activeCharacter?.id || ''}
                  switchCharacter={switchCharacter}
                  currentCharacter={activeCharacter}
                  className="w-full"
                />
              </div>

              {/* Sign Out Section - Inside scrollable area */}
              {user && (
                <div className="px-6 py-4 border-t border-gray-700">
                  <button
                    onClick={() => {
                      signOut();
                      setIsMenuOpen(false);
                      hapticFeedback.light();
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 touch-ripple min-h-[44px] ${
                      isHidden
                        ? 'text-gray-400 active:bg-gray-800 active:text-red-400'
                        : 'text-gray-400 active:bg-gray-700 active:text-red-400'
                    }`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16,17V14H9V10H16V7L21,12L16,17M14,2A2,2 0 0,1 16,4V6H14V4H5V20H14V18H16V20A2,2 0 0,1 14,22H5A2,2 0 0,1 3,20V4A2,2 0 0,1 5,2H14Z" />
                    </svg>
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Fixed Bottom Section - Provides safe spacing */}
            <div className="flex-shrink-0 h-2"></div>
          </div>
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

export default MobileNav;