import React, { useRef, useEffect, useState } from 'react';
import { ConversionResult, LayoutMode } from '../types';
import { ResultsToolbar } from './ResultsToolbar';
import { ResultsContent } from './ResultsContent';
import { generateHtmlDocument } from '../utils/exportHtml';

interface ResultsViewProps {
  results: ConversionResult[];
  activeTab: number;
  setActiveTab: (index: number) => void;
  viewMode: 'preview' | 'source';
  setViewMode: (mode: 'preview' | 'source') => void;
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  onDownloadHtml: () => void;
  onReset: () => void;
  onUpdateHtml: (pageIndex: number, html: string) => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({
  results,
  activeTab,
  setActiveTab,
  viewMode,
  setViewMode,
  layoutMode,
  setLayoutMode,
  onDownloadHtml,
  onReset,
  onUpdateHtml
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Trigger MathJax re-typesetting whenever results, active page, or view mode changes
  useEffect(() => {
    let checkInterval: NodeJS.Timeout | null = null;

    if (results.length > 0 && contentRef.current && viewMode === 'preview') {
      const element = contentRef.current;

      const triggerTypeset = (target?: HTMLElement) => {
        const el = target || element;
        if (window.MathJax) {
          try {
            window.MathJax.typesetClear([el]);
            window.MathJax.typesetPromise([el]).catch(err => {
              console.error('MathJax typeset error:', err);
            });
          } catch (err) {
            console.error('MathJax execution error:', err);
          }
        }
      };

      if (window.MathJax) {
        triggerTypeset();
      } else {
        checkInterval = setInterval(() => {
          if (window.MathJax && contentRef.current) {
            triggerTypeset();
            if (checkInterval) clearInterval(checkInterval);
          }
        }, 150);

        setTimeout(() => {
          if (checkInterval) clearInterval(checkInterval);
        }, 3000);
      }

      // Re-typeset math if a user opens a <details> element
      const detailsList = element.querySelectorAll('details');
      const handleDetailsToggle = (e: Event) => {
        const detailsEl = e.currentTarget as HTMLDetailsElement;
        if (detailsEl && detailsEl.open) {
          triggerTypeset(detailsEl);
        }
      };
      detailsList.forEach(details => {
        details.addEventListener('toggle', handleDetailsToggle);
      });

      return () => {
        if (checkInterval) clearInterval(checkInterval);
        detailsList.forEach(details => {
          details.removeEventListener('toggle', handleDetailsToggle);
        });
      };
    }
  }, [results, activeTab, viewMode, layoutMode]);

  // Handle 1-click Copy HTML
  const handleCopyHtml = async () => {
    try {
      const htmlToCopy = generateHtmlDocument(results, '', layoutMode);
      await navigator.clipboard.writeText(htmlToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy HTML to clipboard:', err);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
      {/* Streamlined Top Results Toolbar (No sidebar) */}
      <ResultsToolbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        layoutMode={layoutMode}
        setLayoutMode={setLayoutMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        resultsLength={results.length}
        onDownloadHtml={onDownloadHtml}
        onReset={onReset}
        onCopyHtml={handleCopyHtml}
        isCopied={isCopied}
      />

      {/* Main Document Content */}
      <div className="w-full min-h-[600px] pb-16">
        <ResultsContent
          viewMode={viewMode}
          layoutMode={layoutMode}
          results={results}
          activeTab={activeTab}
          onUpdateHtml={onUpdateHtml}
          contentRef={contentRef}
        />
      </div>
    </div>
  );
};

export default ResultsView;
