import React from 'react';

const LoadingSpinner = ({ size = 'md', color = 'primary' }) => {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  const colors = {
    primary: 'border-violet-600 border-t-transparent',
    white: 'border-white border-t-transparent',
    accent: 'border-indigo-600 border-t-transparent'
  };

  return (
    <div className="flex justify-center items-center py-4">
      <div className={`${sizes[size]} ${colors[color]} rounded-full animate-spin`}></div>
    </div>
  );
};

export default LoadingSpinner;
