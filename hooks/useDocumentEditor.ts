import React, { useCallback } from 'react';
import { AppState } from '../types';
import { runAccessibilityAudit, enrichHtmlAccessibility, computeSemanticAccessibilityTags } from '../utils/accessibility';

export const useDocumentEditor = (
  setState: React.Dispatch<React.SetStateAction<AppState>>
) => {
  const updatePageHtml = useCallback((pageIndex: number, rawHtml: string) => {
    setState(prev => {
      const newResults = [...prev.results];
      if (newResults[pageIndex]) {
        const enrichedHtml = enrichHtmlAccessibility(rawHtml);
        const audit = runAccessibilityAudit(enrichedHtml, pageIndex === 0);
        const semanticTags = computeSemanticAccessibilityTags(enrichedHtml, newResults[pageIndex].title);
        
        newResults[pageIndex] = {
          ...newResults[pageIndex],
          html: enrichedHtml,
          audit,
          semanticTags
        };
      }
      return { ...prev, results: newResults };
    });
  }, [setState]);

  return { updatePageHtml };
};
