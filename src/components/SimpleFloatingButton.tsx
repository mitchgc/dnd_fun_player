import React, { useEffect } from 'react';

interface SimpleFloatingButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

const SimpleFloatingButton: React.FC<SimpleFloatingButtonProps> = ({ onClick, children }) => {
  useEffect(() => {
    // Create button element directly with vanilla DOM
    const button = document.createElement('button');
    button.textContent = typeof children === 'string' ? children : 'TEST';
    button.addEventListener('click', onClick);
    
    // Apply styles using the exact same CSS that worked in our test page
    const styles = {
      'position': 'fixed',
      'bottom': '20px',
      'left': '20px',
      'width': '60px',
      'height': '60px',
      'border-radius': '50%',
      'background-color': '#3b82f6',
      'color': 'white',
      'border': 'none',
      'cursor': 'pointer',
      'z-index': '9999',
      'display': 'flex',
      'align-items': 'center',
      'justify-content': 'center',
      'font-size': '12px',
      'font-weight': 'bold',
      'box-shadow': '0 4px 12px rgba(0, 0, 0, 0.15)',
      'font-family': 'Arial, sans-serif'
    };
    
    // Apply each style with !important
    Object.entries(styles).forEach(([property, value]) => {
      button.style.setProperty(property, value, 'important');
    });
    
    // Append directly to document.body
    document.body.appendChild(button);
    
    // Cleanup function
    return () => {
      if (document.body.contains(button)) {
        document.body.removeChild(button);
      }
    };
  }, [onClick, children]);

  // Return null since we're managing the DOM directly
  return null;
};

export default SimpleFloatingButton;