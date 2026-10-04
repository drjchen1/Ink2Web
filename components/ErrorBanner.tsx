import React from 'react';

interface ErrorBannerProps {
  error: string;
  onClear: () => void;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({ error, onClear }) => {
  const [title, message] = error.includes('|') ? error.split('|') : ['Error', error];

  return (
    <div className="mb-8 p-6 bg-red-50 border border-red-100 rounded-3xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600 flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <div>
        <h3 className="font-black text-red-900 text-sm mb-1">{title}</h3>
        <p className="text-red-700 text-xs leading-relaxed font-medium">{message}</p>
      </div>
      <button 
        onClick={onClear} 
        className="ml-auto p-2 text-red-400 hover:text-red-600 transition-colors"
        title="Clear Error"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
  );
};

export default ErrorBanner;
