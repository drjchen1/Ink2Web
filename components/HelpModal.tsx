import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Zap, 
  FileText, 
  Download, 
  ShieldCheck, 
  Copy,
  Eye,
  Code
} from 'lucide-react';
import InkWebLogo from './InkWebLogo';

interface HelpModalProps {
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  // Handle escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col relative overflow-hidden border border-zinc-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center rounded-xl overflow-hidden shrink-0 shadow-xs border border-zinc-200">
              <InkWebLogo size={36} />
            </div>
            <div>
              <h2 id="help-modal-title" className="text-lg font-black text-zinc-950 tracking-tight">
                How to Use Ink<span className="text-indigo-600 font-bold">2Web</span>
              </h2>
              <p className="text-xs text-zinc-500 font-medium">
                Streamlined accessible math transcription
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose} 
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200/60 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-zinc-700">
          
          {/* Step 1: Upload */}
          <div className="flex gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-200">
              1
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 mb-1 flex items-center gap-1.5">
                <FileText size={15} className="text-indigo-600" />
                Upload or Paste Notes
              </h3>
              <p className="text-zinc-600 leading-relaxed text-xs">
                Drag and drop your math lecture notes, exam pages, or scanned PDF documents. You can also paste screenshots directly with <kbd className="font-mono bg-zinc-100 px-1 py-0.5 rounded border border-zinc-300 text-zinc-800 text-[11px]">Ctrl+V</kbd> / <kbd className="font-mono bg-zinc-100 px-1 py-0.5 rounded border border-zinc-300 text-zinc-800 text-[11px]">⌘V</kbd>, or click <strong>Try sample math note</strong>.
              </p>
            </div>
          </div>

          {/* Step 2: Conversion */}
          <div className="flex gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-200">
              2
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 mb-1 flex items-center gap-1.5">
                <Zap size={15} className="text-amber-500 fill-amber-500" />
                Multimodal AI Transcription
              </h3>
              <p className="text-zinc-600 leading-relaxed text-xs">
                Gemini 3.8 Flash analyzes your handwritten equations, formulas, tables, and graphs using your choice of <strong>Fast</strong> (rapid low-thinking latency) or <strong>Thorough</strong> (deep reasoning verification for complex proofs). It transcribes them cleanly into standard LaTeX syntax with native environments (<code className="bg-zinc-100 px-1 rounded text-zinc-800 font-mono text-[11px]">\begin&#123;aligned&#125;</code>, <code className="bg-zinc-100 px-1 rounded text-zinc-800 font-mono text-[11px]">\begin&#123;cases&#125;</code>).
              </p>
            </div>
          </div>

          {/* Step 3: Accessible Output */}
          <div className="flex gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-200">
              3
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 mb-1 flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-emerald-600" />
                WCAG 2.2 AA Compliance
              </h3>
              <p className="text-zinc-600 leading-relaxed text-xs">
                The output adheres to accessibility standards:
              </p>
              <ul className="mt-1.5 space-y-1 text-xs text-zinc-600 list-disc list-inside">
                <li>Strict heading order without skipping levels (<code className="text-zinc-800 font-mono text-[11px]">&lt;h1&gt;</code> to <code className="text-zinc-800 font-mono text-[11px]">&lt;h3&gt;</code>)</li>
                <li>High-contrast typography (&gt; 7:1 ratio for body text)</li>
                <li>Accessible vector MathJax rendering with assistive math tags</li>
                <li>Semantic tables with header scopes and summaries</li>
                <li>Screen-reader descriptive alt text for technical diagrams</li>
              </ul>
            </div>
          </div>

          {/* Step 4: Preview & Export */}
          <div className="flex gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-200">
              4
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 mb-1 flex items-center gap-1.5">
                <Download size={15} className="text-indigo-600" />
                Copy or Download Standalone HTML
              </h3>
              <p className="text-zinc-600 leading-relaxed text-xs">
                Toggle between <strong>Rendered Preview</strong> and <strong>HTML Source</strong>. Click <strong>Copy HTML</strong> to paste anywhere, or click <strong>Download HTML</strong> for a self-contained, offline-ready file that opens in any browser.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between text-xs">
          <a 
            href="https://www.w3.org/WAI/standards-guidelines/wcag/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-indigo-700 transition-colors flex items-center gap-1 font-medium"
          >
            <ShieldCheck size={13} className="text-emerald-600" />
            W3C WCAG 2.2 Standards
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-semibold transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>

      </div>
    </div>
  );
};

export default HelpModal;
