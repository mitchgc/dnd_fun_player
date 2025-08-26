import React from 'react';
import { createPortal } from 'react-dom';

interface FloatingRollButtonProps {
  isHidden: boolean;
  onClick: () => void;
}

const FloatingRollButton: React.FC<FloatingRollButtonProps> = ({ isHidden, onClick }) => {
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    // Apply styles with !important directly via JavaScript
    button.style.setProperty('position', 'fixed', 'important');
    button.style.setProperty('bottom', '24px', 'important');
    button.style.setProperty('right', '24px', 'important');
    button.style.setProperty('z-index', '2147483647', 'important');
  }, []);

  const buttonElement = (
    <button
      ref={buttonRef}
      onClick={onClick}
      style={{
        // Appearance
        width: '96px',
        height: '96px',
        borderRadius: '50%',
        border: 'none',
        cursor: 'pointer',
        background: `linear-gradient(135deg, ${isHidden ? '#8b5cf6' : '#3b82f6'} 0%, ${isHidden ? '#7c3aed' : '#2563eb'} 100%)`,
        boxShadow: `0 8px 32px ${isHidden ? 'rgba(139, 92, 246, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`,
        color: 'white',
        
        // Layout & performance
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // transform: 'translate3d(0, 0, 0)', // Force hardware acceleration
        backfaceVisibility: 'hidden',
        // perspective: '1000px',
        
        // Interactions
        touchAction: 'manipulation',
        userSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        transition: 'box-shadow 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 12px 40px ${isHidden ? 'rgba(139, 92, 246, 0.5)' : 'rgba(59, 130, 246, 0.5)'}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = `0 8px 32px ${isHidden ? 'rgba(139, 92, 246, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`;
      }}
      aria-label="Roll dice"
      role="button"
    >
      <svg 
        width="32" 
        height="32" 
        viewBox="0 0 24 24" 
        fill="none"
        style={{ pointerEvents: 'none' }}
      >
        <path 
          d="M10.75,2.56687 C11.5235,2.12029 12.4765,2.12029 13.25,2.56687 L19.5443,6.20084 C20.3178,6.64743 20.7943,7.47274 20.7943,8.36591 L20.7943,15.6339 C20.7943,16.527 20.3178,17.3523 19.5443,17.7989 L13.25,21.4329 C12.4765,21.8795 11.5235,21.8795 10.75,21.4329 L4.45581,17.7989 C3.68231,17.3523 3.20581,16.527 3.20581,15.6339 L3.20581,8.36591 C3.20581,7.47274 3.68231,6.64743 4.45581,6.20084 L10.75,2.56687 Z" 
          fill="currentColor"
        />
        <text 
          x="12" 
          y="12" 
          textAnchor="middle" 
          dominantBaseline="middle"
          fontSize="3.5"
          fill="white"
          fontWeight="bold"
        >
          ROLL
        </text>
      </svg>
    </button>
  );

  return createPortal(buttonElement, document.body);
};

export default FloatingRollButton;