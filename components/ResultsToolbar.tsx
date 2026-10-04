import React, { useState } from 'react';
import { LayoutMode } from '../types';
import { 
  Eye, 
  Code, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Copy, 
  Check, 
  RotateCcw,
  Layers,
  FileText
} from 'lucide-react';

interface ResultsToolbarProps {
  viewMode: 'preview' | 'source';
  setViewMode: (mode: 'preview' | 'source') => void;
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  activeTab: number;
  setActiveTab: (index: number) => void;
  resultsLength: number;
  onDownloadHtml: () => void;
  onReset: () => void;
  onCopyHtml: () => void;
  isCopied: boolean;
}

export const ResultsToolbar: React.FC<ResultsToolbarProps> = ({
  viewMode,
  setViewMode,
  layoutMode,
  setLayoutMode,
  activeTab,
  setActiveTab,
  resultsLength,
  onDownloadHtml,
  onReset,
  onCopyHtml,
  isCopied
}) => {
  return (
    <div className="w-full bg-white border border-zinc-200/90 rounded-2xl p-2.5 sm:p-3 mb-6 shadow-xs flex flex-wrap items-center justify-between gap-3 sticky top-22 z-30 backdrop-blur-md bg-white/95">
      {/* Left: View Mode Toggle (Preview vs HTML Source) */}
      <div className="flex items-center gap-1.5">
        <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200/80">
          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'preview'
                ? 'bg-white text-zinc-950 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
            aria-label="View rendered HTML"
          >
            <Eye size={14} className={viewMode === 'preview' ? 'text-indigo-600' : 'text-zinc-500'} />
            <span>Rendered Preview</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('source')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'source'
                ? 'bg-white text-zinc-950 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
            aria-label="View HTML code"
          >
            <Code size={14} className={viewMode === 'source' ? 'text-indigo-600' : 'text-zinc-500'} />
            <span>HTML Source</span>
          </button>
        </div>

        {/* Accessibility Tag */}
        <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60 ml-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          WCAG 2.2 AA
        </span>
      </div>

      {/* Center: Pagination & Layout (for multi-page documents) */}
      {resultsLength > 1 && (
        <div className="flex items-center gap-2">
          {layoutMode === 'paginated' ? (
            <div className="flex items-center gap-1 bg-zinc-50 border border-zinc-200 rounded-xl px-2 py-1">
              <button
                type="button"
                onClick={() => setActiveTab(Math.max(0, activeTab - 1))}
                disabled={activeTab === 0}
                className="p-1 rounded-lg hover:bg-zinc-200/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-zinc-700 cursor-pointer"
                title="Previous Page"
                aria-label="Previous Page"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-bold text-zinc-800 px-2 select-none">
                Page {activeTab + 1} of {resultsLength}
              </span>
              <button
                type="button"
                onClick={() => setActiveTab(Math.min(resultsLength - 1, activeTab + 1))}
                disabled={activeTab === resultsLength - 1}
                className="p-1 rounded-lg hover:bg-zinc-200/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-zinc-700 cursor-pointer"
                title="Next Page"
                aria-label="Next Page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          ) : (
            <span className="text-xs font-semibold text-zinc-600 bg-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-200">
              All {resultsLength} Pages (Continuous)
            </span>
          )}

          {/* Toggle Paginated vs Continuous */}
          <button
            type="button"
            onClick={() => setLayoutMode(layoutMode === 'paginated' ? 'continuous' : 'paginated')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-700 transition-colors cursor-pointer"
            title={layoutMode === 'paginated' ? 'Switch to Continuous scroll' : 'Switch to Paginated mode'}
          >
            {layoutMode === 'paginated' ? <Layers size={13} className="text-zinc-500" /> : <FileText size={13} className="text-zinc-500" />}
            <span className="hidden sm:inline">{layoutMode === 'paginated' ? 'All Pages' : 'Paged'}</span>
          </button>
        </div>
      )}

      {/* Right: Actions (Copy HTML, Download HTML, Reset) */}
      <div className="flex items-center gap-2">
        {/* Copy HTML Button */}
        <button
          type="button"
          onClick={onCopyHtml}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            isCopied
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400'
              : 'bg-white hover:bg-zinc-50 text-zinc-800 border-zinc-200 shadow-2xs'
          }`}
          title="Copy HTML to clipboard"
          id="copy-html-btn"
        >
          {isCopied ? (
            <>
              <Check size={14} className="text-emerald-600" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} className="text-zinc-600" />
              <span>Copy HTML</span>
            </>
          )}
        </button>

        {/* Download HTML Button */}
        <button
          type="button"
          onClick={onDownloadHtml}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          title="Download accessible HTML file"
          id="download-html-btn"
        >
          <Download size={14} />
          <span>Download HTML</span>
        </button>

        {/* Reset / New Document */}
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-zinc-600 text-xs font-medium transition-colors cursor-pointer"
          title="Convert another document"
          id="new-document-btn"
        >
          <RotateCcw size={13} />
          <span className="hidden sm:inline">New</span>
        </button>
      </div>
    </div>
  );
};
