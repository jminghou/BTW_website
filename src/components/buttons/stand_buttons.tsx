'use client';

import React from 'react';

interface StandButtonProps {
  text: string;
  onClick: () => void;
  className?: string;
}

const StandButton: React.FC<StandButtonProps> = ({ 
  text, 
  onClick, 
  className = ""
}) => {
  return (
    <button 
      onClick={onClick}
      className={`px-6 py-2 bg-[#00bed6] text-white rounded-lg hover:bg-[#ffb71b] transition-colors duration-300 shadow-md hover:shadow-lg text-base font-medium ${className}`}
    >
      {text}
    </button>
  );
};

export default StandButton;
