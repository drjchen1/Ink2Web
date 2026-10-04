import { useState, useCallback } from 'react';
import { AppState, ModelType, ThinkingLevelType, MathAnnotationStyle, PageProcessingMode } from '../types';

export const useDocumentState = () => {
  const [state, setState] = useState<AppState>({
    isProcessing: false,
    progress: 0,
    results: [],
    error: null,
    statusMessage: 'Waiting for upload...',
    selectedModel: 'gemini-3.8-flash',
    selectedThinkingLevel: 'LOW',
    mathAnnotationStyle: 'clean-breakdown',
    pageProcessingMode: 'page-by-page'
  });
  
  const [originalFiles, setOriginalFiles] = useState<File[]>([]);
  const [pageMapping, setPageMapping] = useState<{fileIndex: number, localPageIndex: number}[]>([]);

  const setModel = useCallback((model: ModelType) => {
    setState(prev => ({ ...prev, selectedModel: model }));
  }, []);

  const setThinkingLevel = useCallback((level: ThinkingLevelType) => {
    setState(prev => ({ ...prev, selectedThinkingLevel: level }));
  }, []);

  const setMathAnnotationStyle = useCallback((style: MathAnnotationStyle) => {
    setState(prev => ({ ...prev, mathAnnotationStyle: style }));
  }, []);

  const setPageProcessingMode = useCallback((mode: PageProcessingMode) => {
    setState(prev => ({ ...prev, pageProcessingMode: mode }));
  }, []);

  const reset = useCallback(() => {
    setState(prev => ({
      isProcessing: false,
      progress: 0,
      results: [],
      error: null,
      statusMessage: 'Waiting for upload...',
      selectedModel: prev.selectedModel,
      selectedThinkingLevel: prev.selectedThinkingLevel,
      mathAnnotationStyle: prev.mathAnnotationStyle,
      pageProcessingMode: prev.pageProcessingMode,
      currentProcessingImages: null
    }));
    setOriginalFiles([]);
    setPageMapping([]);
  }, []);

  return {
    state,
    setState,
    originalFiles,
    setOriginalFiles,
    pageMapping,
    setPageMapping,
    setModel,
    setThinkingLevel,
    setMathAnnotationStyle,
    setPageProcessingMode,
    reset
  };
};
