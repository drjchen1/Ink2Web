import React from 'react';

interface FooterProps {
  isReadingMode?: boolean;
}

const Footer: React.FC<FooterProps> = () => {
  return (
    <footer className="w-full py-6 border-t border-zinc-200 mt-auto flex items-center justify-center select-none text-center px-4">
      <div className="text-xs text-zinc-500 flex flex-wrap items-center justify-center gap-2">
        <span className="font-semibold text-zinc-700">Ink2Web</span>
        <span className="text-zinc-300" aria-hidden="true">•</span>
        <span>WCAG 2.2 AA Compliant Mathematical Transcription</span>
        <span className="text-zinc-300" aria-hidden="true">•</span>
        <span>MathJax LaTeX</span>
      </div>
    </footer>
  );
};

export default Footer;

