import React, { useState, useRef, useEffect } from 'react';
import { ThinkingLevelType } from '../types';
import InkWebLogo from './InkWebLogo';
import { 
  Sparkles, 
  Zap, 
  UploadCloud, 
  FileText, 
  ShieldCheck, 
  HelpCircle,
  Camera,
  Check,
  ClipboardPaste,
  BookOpen,
  Waves,
  Grid3X3
} from 'lucide-react';
import { createSampleMathNoteFile } from '../utils/sampleData';

interface DashboardProps {
  onFileUpload: (files: File[]) => void;
  isProcessing: boolean;
  onShowDocs: () => void;
  selectedThinkingLevel: ThinkingLevelType;
  onThinkingLevelChange: (level: ThinkingLevelType) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  onFileUpload, 
  isProcessing, 
  onShowDocs,
  selectedThinkingLevel,
  onThinkingLevelChange
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [pasteShortcut, setPasteShortcut] = useState('⌘V');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      setPasteShortcut(isMac ? '⌘V' : 'Ctrl+V');
    }
  }, []);

  // Global paste handler for instant screenshot/image paste
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isProcessing) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            const renamedFile = new File([file], `math_note_${Date.now()}.png`, { type: file.type });
            pastedFiles.push(renamedFile);
          }
        }
      }

      if (pastedFiles.length > 0) {
        onFileUpload(pastedFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isProcessing, onFileUpload]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      onFileUpload(files);
    }
    if (event.target) event.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessing) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isProcessing) return;

    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      onFileUpload(files);
    }
  };

  const handlePasteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isProcessing) return;

    try {
      if (navigator.clipboard?.read) {
        const items = await navigator.clipboard.read();
        const pastedFiles: File[] = [];
        for (const item of items) {
          const imageType = item.types.find(type => type.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            pastedFiles.push(new File([blob], `pasted_note_${Date.now()}.png`, { type: imageType }));
          }
        }
        if (pastedFiles.length > 0) {
          onFileUpload(pastedFiles);
          return;
        }
      }
    } catch (_) {
      // If clipboard read permission is blocked, open file browser as friendly fallback
    }
    fileInputRef.current?.click();
  };

  const triggerSampleNote = (topic: 'calculus' | 'fourier' | 'linear_algebra') => {
    if (isProcessing) return;
    const sampleFile = createSampleMathNoteFile(topic);
    onFileUpload([sampleFile]);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] w-full px-4 py-6 sm:py-10">
      {/* Hidden File Inputs */}
      <input 
        ref={fileInputRef}
        type="file" 
        multiple 
        className="sr-only" 
        accept="application/pdf,image/*,.heic,.heif,.txt" 
        onChange={handleFileChange} 
        disabled={isProcessing} 
        id="file-upload-input"
      />
      <input 
        ref={cameraInputRef}
        type="file" 
        accept="image/*"
        capture="environment"
        className="sr-only" 
        onChange={handleFileChange} 
        disabled={isProcessing} 
        id="camera-upload-input"
      />

      <div className="w-full max-w-xl mx-auto flex flex-col items-center text-center">
        
        {/* Header & Logo with Ink Droplet on Spiderweb */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative group mb-3 cursor-pointer" onClick={() => fileInputRef.current?.click()} title="Drop notes to weave accessible HTML">
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-3xl p-1 shadow-md bg-white border border-zinc-200/90 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-lg">
              <InkWebLogo size={70} glow={true} />
            </div>
            {/* Playful ink ripple badge */}
            <span className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs border-2 border-white">
              v2.2
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-950 flex items-center gap-1.5">
            <span>Ink</span>
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-800 bg-clip-text text-transparent font-bold">
              2Web
            </span>
          </h1>

          <p className="text-zinc-600 text-sm sm:text-base font-normal max-w-md leading-relaxed mt-2">
            Weaving handwritten math notes into clean, accessible <span className="font-semibold text-zinc-900">WCAG 2.2 AA</span> web pages with MathJax LaTeX.
          </p>
        </div>

        {/* Thinking Level Selector Pill: Fast (Low Thinking) vs Thorough (Deep Thinking) */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100/90 border border-zinc-200 rounded-full mb-6 text-xs font-semibold text-zinc-700 shadow-2xs">
          <button
            type="button"
            onClick={() => onThinkingLevelChange('LOW')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-all cursor-pointer ${
              selectedThinkingLevel === 'LOW'
                ? 'bg-white text-zinc-950 shadow-xs font-bold'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
            title="Fast mode: Low latency (~3s) ideal for clear scans and legible lecture notes"
          >
            <Zap size={13} className="text-amber-500 fill-amber-500" />
            <span>Fast Flash</span>
            {selectedThinkingLevel === 'LOW' && <Check size={12} className="text-indigo-600 ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={() => onThinkingLevelChange('HIGH')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-all cursor-pointer ${
              selectedThinkingLevel === 'HIGH'
                ? 'bg-white text-zinc-950 shadow-xs font-bold'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
            title="Thorough mode: Deep mathematical verification ideal for messy handwriting, multi-line proofs and graphs"
          >
            <Sparkles size={13} className="text-indigo-600 fill-indigo-600" />
            <span>Thorough Reasoning</span>
            {selectedThinkingLevel === 'HIGH' && <Check size={12} className="text-indigo-600 ml-0.5" />}
          </button>
        </div>

        {/* The Interactive Spiderweb Dropzone */}
        <div 
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !isProcessing) {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={`w-full relative text-center p-8 sm:p-11 border-2 border-dashed rounded-3xl bg-white transition-all duration-300 shadow-xs cursor-pointer select-none group focus:outline-none focus:ring-4 focus:ring-indigo-600/20 overflow-hidden ${
            isDragging 
              ? 'border-indigo-600 bg-indigo-50/70 scale-[1.01] shadow-xl shadow-indigo-500/10' 
              : 'border-zinc-300 hover:border-indigo-400 hover:bg-gradient-to-b hover:from-white hover:to-indigo-50/30 hover:shadow-md'
          }`}
          id="main-dropzone-card"
        >
          {/* Subtle Decorative Spiderweb Watermark in Background */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.06] group-hover:opacity-[0.11] transition-opacity duration-300 flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 200 200" className="w-[140%] h-[140%] -rotate-12 stroke-indigo-900" fill="none">
              <line x1="100" y1="0" x2="100" y2="200" strokeWidth="1" />
              <line x1="0" y1="100" x2="200" y2="100" strokeWidth="1" />
              <line x1="29" y1="29" x2="171" y2="171" strokeWidth="1" />
              <line x1="171" y1="29" x2="29" y2="171" strokeWidth="1" />
              <polygon points="100,20 156,44 180,100 156,156 100,180 44,156 20,100 44,44" strokeWidth="0.8" />
              <polygon points="100,45 138,62 155,100 138,138 100,155 62,138 45,100 62,62" strokeWidth="0.8" />
              <polygon points="100,70 121,79 130,100 121,121 100,130 79,121 70,100 79,79" strokeWidth="0.8" />
            </svg>
          </div>

          <div className="relative z-10 flex flex-col items-center pointer-events-none">
            {/* Center Droplet / Upload Icon */}
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${
              isDragging 
                ? 'bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-600/30' 
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200 group-hover:scale-105 group-hover:bg-indigo-100/80 group-hover:text-indigo-800'
            }`}>
              <UploadCloud size={32} className="transition-transform duration-200 group-hover:-translate-y-0.5" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight mb-2">
              Drop your math notes onto the web
            </h2>
            
            <p className="text-zinc-600 text-xs sm:text-sm mb-5 max-w-sm px-2 leading-relaxed">
              Upload PDF documents, scanned notebook pages, or paste directly from clipboard
            </p>

            {/* Intuitive Action Triggers */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 w-full max-w-sm pointer-events-auto">
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                disabled={isProcessing}
                className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 text-white font-semibold text-sm rounded-xl shadow-xs transition-all cursor-pointer hover:shadow-indigo-600/20 hover:shadow-md"
                id="select-files-button"
              >
                <FileText size={16} />
                <span>Browse Files</span>
              </button>

              <button 
                type="button"
                onClick={handlePasteClick}
                disabled={isProcessing}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 text-zinc-800 font-semibold text-xs rounded-xl border border-zinc-200 transition-all cursor-pointer"
                title={`Paste image from clipboard (${pasteShortcut})`}
                id="paste-clipboard-button"
              >
                <ClipboardPaste size={15} />
                <span className="hidden sm:inline">Paste</span>
                <kbd className="font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-zinc-300 text-zinc-700 font-bold">{pasteShortcut}</kbd>
              </button>

              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  cameraInputRef.current?.click();
                }}
                disabled={isProcessing}
                className="inline-flex sm:hidden items-center justify-center gap-1.5 px-3.5 py-2.5 bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 text-zinc-800 font-semibold text-xs rounded-xl border border-zinc-200 transition-all cursor-pointer"
                id="camera-capture-button"
              >
                <Camera size={15} />
                <span>Camera</span>
              </button>
            </div>

            <div className="mt-4 text-[11px] text-zinc-500 font-medium">
              Accepts PDF · PNG · JPG · HEIC · WebP
            </div>
          </div>
        </div>

        {/* Creative One-Click Sample Notes Carousel */}
        <div className="mt-6 w-full flex flex-col items-center">
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-2 flex items-center gap-1.5">
            <Sparkles size={12} className="text-indigo-600" />
            <span>Or test immediately with sample notes:</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => triggerSampleNote('calculus')}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 bg-white hover:bg-indigo-50 hover:text-indigo-800 hover:border-indigo-300 border border-zinc-200 shadow-2xs transition-all cursor-pointer"
              title="Differential Equations: Malthusian Growth Model with diagram"
            >
              <BookOpen size={13} className="text-indigo-600" />
              <span>Calculus ODEs</span>
            </button>

            <button
              type="button"
              onClick={() => triggerSampleNote('fourier')}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 bg-white hover:bg-indigo-50 hover:text-indigo-800 hover:border-indigo-300 border border-zinc-200 shadow-2xs transition-all cursor-pointer"
              title="Fourier Series: Orthogonal expansions & square wave summation"
            >
              <Waves size={13} className="text-violet-600" />
              <span>Fourier Series</span>
            </button>

            <button
              type="button"
              onClick={() => triggerSampleNote('linear_algebra')}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 bg-white hover:bg-indigo-50 hover:text-indigo-800 hover:border-indigo-300 border border-zinc-200 shadow-2xs transition-all cursor-pointer"
              title="Linear Algebra: Characteristic polynomial, eigenvalues & diagonalization"
            >
              <Grid3X3 size={13} className="text-indigo-600" />
              <span>Eigenvalues & Matrices</span>
            </button>
          </div>
        </div>

        {/* Clean WCAG & Help Links */}
        <div className="mt-8 flex items-center justify-center gap-5 text-xs font-semibold text-zinc-600">
          <button 
            type="button"
            onClick={onShowDocs} 
            className="flex items-center gap-1.5 hover:text-indigo-700 transition-colors cursor-pointer bg-transparent border-none p-0"
            id="footer-how-to-use-btn"
          >
            <HelpCircle size={14} />
            <span>How to use</span>
          </button>
          <span className="text-zinc-300" aria-hidden="true">•</span>
          <a 
            href="https://www.w3.org/WAI/standards-guidelines/wcag/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-1.5 hover:text-indigo-700 transition-colors"
            id="footer-wcag-link"
          >
            <ShieldCheck size={14} className="text-emerald-700" />
            <span>WCAG 2.2 AA Standard</span>
          </a>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
