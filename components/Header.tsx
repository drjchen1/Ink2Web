
import React from 'react';
import InkWebLogo from './InkWebLogo';

interface HeaderProps {
  onShowDocs: () => void;
}

const Header: React.FC<HeaderProps> = ({ onShowDocs }) => {
  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-zinc-200/80 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 flex items-center justify-center rounded-xl overflow-hidden shrink-0 shadow-xs border border-zinc-200/80">
            <InkWebLogo size={36} />
          </div>
          <span className="text-2xl font-black tracking-tight text-zinc-950 flex items-center">
            Ink<span className="text-indigo-600 font-bold">2Web</span>
          </span>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 ml-2 text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
            Math Digitizer
          </span>
        </div>
        
        <nav className="flex items-center gap-4 sm:gap-6 text-xs font-semibold text-zinc-600">
          <button 
            type="button"
            onClick={onShowDocs} 
            className="hover:text-indigo-700 transition-colors cursor-pointer bg-transparent border-none p-0"
          >
            How to Use
          </button>
          <a 
            href="https://www.w3.org/WAI/standards-guidelines/wcag/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center gap-1 hover:text-indigo-700 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            WCAG 2.2 AA
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
