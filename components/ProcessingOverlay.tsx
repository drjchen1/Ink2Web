import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ModelType } from '../types';

interface ProcessingOverlayProps {
  progress: number;
  currentImages?: string[] | null;
  selectedModel?: ModelType;
  actualModelUsed?: ModelType;
  selectedThinkingLevel?: string;
  statusMessage?: string;
}

const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ 
  progress, 
  currentImages, 
  selectedThinkingLevel = 'LOW',
  statusMessage 
}) => {
  const isDone = progress >= 100;
  
  const imgSrcs = currentImages 
    ? currentImages.map(img => img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`) 
    : [];

  const isThorough = selectedThinkingLevel === 'HIGH';
  const modeLabel = isThorough ? 'Thorough' : 'Fast';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Converting notes to accessible HTML"
    >
      <motion.div 
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-zinc-200 shadow-xl flex flex-col items-center text-center relative overflow-hidden"
      >
        {/* Document Thumbnail Preview (clean, without scanning laser) */}
        {imgSrcs.length > 0 && !isDone && (
          <div className="mb-5 flex gap-3 max-w-full overflow-x-auto justify-center px-1">
            {imgSrcs.slice(0, 2).map((imgSrc, idx) => (
              <div 
                key={idx} 
                className="bg-zinc-50 rounded-xl overflow-hidden border border-zinc-200 shadow-xs relative flex-shrink-0"
              >
                <img 
                  src={imgSrc} 
                  alt={`Document page ${idx + 1}`} 
                  className="h-32 sm:h-36 w-auto block object-cover opacity-90" 
                />
              </div>
            ))}
          </div>
        )}

        {/* Title */}
        <h2 className="text-lg font-bold text-zinc-950 tracking-tight mb-1">
          {isDone ? 'Conversion Complete' : 'Converting to Accessible HTML'}
        </h2>

        {/* Current Step / Status Message */}
        <p className="text-xs text-zinc-600 mb-5 min-h-[20px] font-medium leading-relaxed px-2">
          {statusMessage || 'Transcribing handwritten math into WCAG 2.2 AA compliant HTML...'}
        </p>

        {/* Progress Bar Container */}
        <div className="w-full mb-3">
          <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/80">
            <motion.div 
              className="h-full bg-indigo-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Progress Percentage & Details */}
        <div className="flex items-center justify-between w-full px-1 text-xs text-zinc-500 font-medium">
          <span>Processing document</span>
          <span className="font-mono font-bold text-indigo-700">{Math.round(progress)}%</span>
        </div>

        {/* Clean Model & Standard Badge */}
        <div className="mt-5 pt-4 border-t border-zinc-100 w-full flex items-center justify-center gap-2 text-[11px] font-semibold text-zinc-500">
          <span>Gemini 3.8 Flash</span>
          <span className="text-zinc-300" aria-hidden="true">•</span>
          <span className={isThorough ? 'text-indigo-700 font-bold' : 'text-amber-600 font-bold'}>
            {modeLabel}
          </span>
          <span className="text-zinc-300" aria-hidden="true">•</span>
          <span className="text-emerald-700 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            WCAG 2.2 AA
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default ProcessingOverlay;
