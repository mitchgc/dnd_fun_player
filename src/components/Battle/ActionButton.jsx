import React from 'react';
import PropTypes from 'prop-types';

// Standardized Button Component - All buttons use vertical layout with ICON/TITLE/Subtext structure
const ActionButton = ({ 
  onClick, 
  disabled = false, 
  variant = 'primary', 
  icon,
  title,
  subtitle,
  children, 
  className = '',
  loading = false 
}) => {
  const baseClasses = "font-semibold transition-all duration-300 rounded-xl border p-4";
  
  const variantClasses = {
    primary: disabled 
      ? 'bg-gray-700 text-gray-400 cursor-not-allowed border-gray-600'
      : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:scale-105 border-blue-500',
    secondary: disabled
      ? 'bg-gray-700 text-gray-400 cursor-not-allowed border-gray-600' 
      : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white shadow-lg hover:scale-105 border-gray-500',
    danger: disabled
      ? 'bg-gray-700 text-gray-400 cursor-not-allowed border-gray-600'
      : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:scale-105 border-red-500',
    success: disabled
      ? 'bg-gray-700 text-gray-400 cursor-not-allowed border-gray-600'
      : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:scale-105 border-green-500',
    purple: disabled
      ? 'bg-gray-700 text-gray-400 cursor-not-allowed border-gray-600'
      : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:scale-105 border-purple-500',
    teal: disabled
      ? 'bg-gray-700 text-gray-400 cursor-not-allowed border-gray-600'
      : 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg hover:scale-105 border-teal-500'
  };

  const renderContent = () => {
    if (loading) return <span className="text-sm font-semibold">...</span>;
    
    if (children) return children;

    // Standard vertical layout: ICON / TITLE / Subtext
    return (
      <div className="flex flex-col items-center justify-center gap-2">
        {icon && <span className="flex-shrink-0 text-xl">{icon}</span>}
        {title && <span className="text-sm font-semibold text-center leading-tight">{title}</span>}
        {subtitle && <span className="text-xs font-medium opacity-80 text-center">{subtitle}</span>}
      </div>
    );
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} flex flex-col items-center justify-center ${className}`}
    >
      {renderContent()}
    </button>
  );
};

ActionButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'success', 'purple', 'teal']),
  icon: PropTypes.node,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
  loading: PropTypes.bool
};

export default ActionButton;