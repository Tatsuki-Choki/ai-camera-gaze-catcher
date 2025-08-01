import React from 'react';

interface ExpandIconProps {
  className?: string;
}

export const ExpandIcon: React.FC<ExpandIconProps> = ({ className = "w-6 h-6" }) => {
  return (
    <svg 
      className={className} 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor"
      strokeWidth={2}
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" 
      />
    </svg>
  );
};