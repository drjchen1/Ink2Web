import React, { useState } from 'react';

interface InkWebLogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

export const InkWebLogo: React.FC<InkWebLogoProps> = ({ size = 32, className = '', glow = false }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div 
      className={`relative inline-flex items-center justify-center shrink-0 rounded-2xl select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer ambient glow if enabled */}
      {glow && (
        <div 
          className="absolute inset-0 rounded-2xl bg-indigo-500/25 blur-md -z-10 animate-pulse" 
          aria-hidden="true" 
        />
      )}

      {!imageError ? (
        <img
          src="/src/assets/images/ink_spiderweb_logo_1790948044972.jpg"
          alt="Ink2Web Logo - Drop of ink on a spiderweb"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover rounded-2xl shadow-inner transition-transform duration-300 hover:scale-105"
          onError={() => setImageError(true)}
        />
      ) : (
        /* Crisp Vector SVG Fallback: Ink droplet resting on geometric silk web */
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full rounded-2xl bg-gradient-to-br from-zinc-950 via-indigo-950 to-zinc-900 p-1.5 shadow-sm"
        >
          <defs>
            {/* Ink droplet gradient */}
            <linearGradient id="inkDropGrad" x1="30" y1="20" x2="70" y2="85" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="35%" stopColor="#4f46e5" />
              <stop offset="70%" stopColor="#312e81" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            {/* Spiderweb silk line gradient */}
            <linearGradient id="webSilkGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#c7d2fe" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#a5b4fc" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#e0e7ff" stopOpacity="0.7" />
            </linearGradient>

            {/* Specular ink droplet reflection */}
            <radialGradient id="inkGlint" cx="44" cy="46" r="14" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Spiderweb radial foundation rays */}
          <g stroke="url(#webSilkGrad)" strokeWidth="1.2" opacity="0.65">
            <line x1="50" y1="10" x2="50" y2="90" />
            <line x1="10" y1="50" x2="90" y2="50" />
            <line x1="22" y1="22" x2="78" y2="78" />
            <line x1="78" y1="22" x2="22" y2="78" />
            <line x1="34" y1="14" x2="66" y2="86" />
            <line x1="66" y1="14" x2="34" y2="86" />
          </g>

          {/* Concentric spiral web silk arcs */}
          <g stroke="url(#webSilkGrad)" strokeWidth="1" fill="none" opacity="0.5">
            <polygon points="50,22 69,30 78,50 69,70 50,78 31,70 22,50 31,30" />
            <polygon points="50,32 63,38 68,50 63,62 50,68 37,62 32,50 37,38" />
            <polygon points="50,40 57,44 60,50 57,56 50,60 43,56 40,50 43,44" />
          </g>

          {/* Dewdrops along the web threads */}
          <circle cx="22" cy="22" r="1.5" fill="#e0e7ff" opacity="0.8" />
          <circle cx="78" cy="22" r="1.5" fill="#e0e7ff" opacity="0.8" />
          <circle cx="78" cy="78" r="1.5" fill="#e0e7ff" opacity="0.8" />
          <circle cx="22" cy="78" r="1.5" fill="#e0e7ff" opacity="0.8" />

          {/* Central organic suspended ink droplet */}
          <path 
            d="M 50 25 C 50 25, 68 48, 68 62 C 68 72, 60 80, 50 80 C 40 80, 32 72, 32 62 C 32 48, 50 25, 50 25 Z" 
            fill="url(#inkDropGrad)"
            filter="drop-shadow(0 4px 6px rgba(0, 0, 0, 0.4))"
          />

          {/* Delicate web strands catching the ink droplet */}
          <path 
            d="M 32 62 Q 50 66 68 62" 
            stroke="#a5b4fc" 
            strokeWidth="0.8" 
            fill="none" 
            opacity="0.75" 
          />

          {/* Specular curved reflection glint on the droplet */}
          <ellipse cx="45" cy="54" rx="4" ry="7" transform="rotate(-22 45 54)" fill="url(#inkGlint)" />
          <circle cx="43" cy="49" r="1.8" fill="#ffffff" opacity="0.95" />
        </svg>
      )}
    </div>
  );
};

export default InkWebLogo;
