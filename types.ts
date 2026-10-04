
export interface DocumentMetadata {
  title: string;
  author: string;
  subject: string;
  description?: string;
  keywords?: string;
  institution?: string;
  language?: string;
  copyright?: string;
  creationDate?: string;
}

export type ModelType = 'gemini-3.8-flash' | 'gemini-3.7-flash' | 'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.1-pro-preview';
export type LayoutMode = 'paginated' | 'continuous';
export type ThinkingLevelType = 'AUTO' | 'LOW' | 'HIGH' | 'NONE';
export type MultiFileMode = 'combine' | 'separate';
export type MathAnnotationStyle = 'clean-breakdown' | 'visual-underbraces';
export type PageProcessingMode = 'page-by-page' | 'bundle-two';
export type NarrationOption = 'none' | 'transcript' | 'full-audio';

export interface Figure {
  id: string;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax]
  alt: string;
  caption: string;
}

export interface SemanticAccessibilityTags {
  pageTitle?: string;
  headingsCount: number;
  mathExpressionsCount: number;
  tablesCount: number;
  figuresCount: number;
  hasAriaLandmarks: boolean;
  hasAccessibleTables: boolean;
  hasFormulasEnriched: boolean;
}

export interface GeminiPageResponse {
  html: string;
  figures: Figure[];
  title?: string;
  semanticTags?: SemanticAccessibilityTags;
}

export interface BatchResponse {
  pages: GeminiPageResponse[];
  tokenCount: number;
  actualModelUsed?: ModelType;
}

export interface AccessibilityAudit {
  score: number;
  checks: {
    title: string;
    passed: boolean;
    description: string;
    suggestion?: string;
  }[];
}

export interface FigureResult {
  id: string;
  originalSrc: string;
  currentSrc: string;
  alt: string;
  caption: string;
}

export interface ConversionResult {
  html: string;
  pageNumber: number;
  title?: string;
  width: number;
  height: number;
  audit?: AccessibilityAudit;
  figures: FigureResult[];
  semanticTags?: SemanticAccessibilityTags;
}

export interface AppState {
  isProcessing: boolean;
  progress: number;
  results: ConversionResult[];
  error: string | null;
  statusMessage: string;
  totalTime?: number;
  selectedModel: ModelType;
  selectedThinkingLevel: ThinkingLevelType;
  mathAnnotationStyle: MathAnnotationStyle;
  pageProcessingMode: PageProcessingMode;
  currentProcessingImages?: string[] | null;
  actualModelUsed?: ModelType;
}

declare global {
  const __BUILD_DATE__: string;
  const __JULIAN_VERSION__: string;
  interface Window {
    MathJax?: {
      typesetClear: (elements: any[]) => void;
      typesetPromise: (elements: any[]) => Promise<any>;
    };
    pdfjsLib: any;
  }
}
