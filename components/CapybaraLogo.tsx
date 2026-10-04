import React from 'react';

interface CapybaraLogoProps {
  size?: number;
  className?: string;
}

export const CapybaraLogo: React.FC<CapybaraLogoProps> = ({ size = 24, className }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Soft, warm colored-pencil style gradient for the body */}
        <linearGradient id="capyBodyGrad" x1="20" y1="20" x2="80" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#d4c3b3" />
          <stop offset="60%" stopColor="#bfa891" />
          <stop offset="100%" stopColor="#9e846b" />
        </linearGradient>
        
        {/* Slightly darker gradient for ears/feet shading */}
        <linearGradient id="capyDarkGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9e846b" />
          <stop offset="100%" stopColor="#7c634c" />
        </linearGradient>
      </defs>

      {/* 1. Subtle sketch shadow ground line */}
      <path 
        d="M 12 87 C 32 88, 68 88, 85 87" 
        stroke="#2b1d14" 
        strokeWidth="3" 
        strokeLinecap="round" 
        opacity="0.15" 
      />

      {/* 2. Main Capybara Body Path (with ears and feet integrated into silhouette) */}
      <path 
        d="M 25 85 
           C 10 82, 9 52, 26 35 
           C 23 25, 26 13, 31 13 
           C 34.5 13, 34 21, 34 25 
           C 38 23, 40 10, 45 10 
           C 49 10, 49 19, 48 24 
           C 60 21, 75 20, 85 22 
           C 92.5 23.5, 94.5, 31.5, 94.5, 40 
           C 94.5 48.5, 87.5 56.5, 75 61.5 
           C 70.5 63, 71.5 68, 71.5 73.5 
           C 71.5 79, 73.5 84, 66.5 84.5 
           C 61 85, 57 83.5, 52 84.5 
           C 47.5 85.5, 41 84.5, 36.5 84.5 
           C 31.5 84.5, 28 82, 25 85 Z" 
        fill="url(#capyBodyGrad)" 
        stroke="#2c1e15" 
        strokeWidth="3.2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* 3. Back Foot Shading (darker overlay at bottom-left) */}
      <path 
        d="M 25 85 C 28 82, 31.5 84.5, 36.5 84.5 C 34.5 81.5, 30.5 79.5, 26.5 81 Z" 
        fill="url(#capyDarkGrad)" 
        opacity="0.8"
      />

      {/* 4. Front Foot Shading (darker overlay at bottom-right) */}
      <path 
        d="M 66.5 84.5 C 73.5 84, 71.5 79, 71.5 73.5 C 68.5 76.5, 65.5 79.5, 60.5 79 C 61 81.5, 63.5 83.5, 66.5 84.5 Z" 
        fill="url(#capyDarkGrad)" 
        opacity="0.8"
      />

      {/* 5. Back Ear Inner Shading */}
      <path 
        d="M 27.5 22 C 26.5 17, 28.5 14.5, 30 14.5 C 31.5 14.5, 32.5 18, 32.5 21 Z" 
        fill="url(#capyDarkGrad)" 
        opacity="0.5"
      />

      {/* 6. Front Ear Inner Shading */}
      <path 
        d="M 42 21 C 41 15, 43 11.5, 44.5 11.5 C 46 11.5, 47 15, 47 19.5 Z" 
        fill="url(#capyDarkGrad)" 
        opacity="0.5"
      />

      {/* 7. Happy Closed Eye (Curved Arc) */}
      <path 
        d="M 52.5 35 C 55 31, 59 31, 61.5 35" 
        stroke="#2c1e15" 
        strokeWidth="3.2" 
        strokeLinecap="round" 
        fill="none" 
      />

      {/* 8. Snout Nose/Mouth Curved Line */}
      <path 
        d="M 85.5 31 C 90 31, 91.5 33, 91.5 35.5 L 91.5 44" 
        stroke="#2c1e15" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none" 
      />

      {/* 9. Cozy Teacup / Mug */}
      {/* Cup body (rounded bottom) */}
      <path 
        d="M 58 64 H 74 Q 74 73.5 66 73.5 Q 58 73.5 58 64 Z" 
        fill="#ffffff" 
        stroke="#2c1e15" 
        strokeWidth="3.2" 
        strokeLinejoin="round" 
      />
      {/* Cup Rim */}
      <path 
        d="M 57 64 C 57 62.5, 75 62.5, 75 64" 
        stroke="#2c1e15" 
        strokeWidth="3.2" 
        strokeLinecap="round" 
        fill="none" 
      />
      {/* Tea bag string dangling inside the cup */}
      <path 
        d="M 66 64 L 66 69" 
        stroke="#2c1e15" 
        strokeWidth="1.8" 
        strokeLinecap="round" 
        fill="none" 
      />
      {/* Tea bag small tag */}
      <rect 
        x="64.5" 
        y="69" 
        width="3" 
        height="3" 
        fill="#eab308" 
        stroke="#2c1e15" 
        strokeWidth="1.2" 
        rx="0.5"
      />

      {/* 10. Left Paw (Wrapping the teacup from the left) */}
      <path 
        d="M 48 65 C 53.5 65, 57.5 68, 57.5 71 C 57.5 73.5, 51.5 75.5, 45 71.5" 
        fill="url(#capyBodyGrad)" 
        stroke="#2c1e15" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* 11. Right Paw (Wrapping the teacup from the right) */}
      <path 
        d="M 74.5 65 C 79 65, 82.5 68, 82.5 71 C 82.5 73.5, 77.5 75.5, 73.5 71.5" 
        fill="url(#capyBodyGrad)" 
        stroke="#2c1e15" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
};

export default CapybaraLogo;
