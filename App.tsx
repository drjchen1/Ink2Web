import React, { useState, Suspense } from 'react';
import Header from './components/Header';
import ProcessingOverlay from './components/ProcessingOverlay';
import Dashboard from './components/Dashboard';
import ResultsView from './components/ResultsView';
const HelpModal = React.lazy(() => import('./components/HelpModal'));
import ErrorBanner from './components/ErrorBanner';
import Footer from './components/Footer';
import { useUsageTracking } from "./hooks/useUsageTracking";
import { useDigitization } from './hooks/useDigitization';
import { LayoutMode } from './types';
import { generateHtmlDocument } from './utils/exportHtml';
import { stripFileExtension } from './utils/fileName';

const App: React.FC = () => {
  const { incrementUsage } = useUsageTracking();

  const {
    state,
    originalFiles,
    handleFileUpload,
    updatePageHtml,
    setThinkingLevel,
    reset
  } = useDigitization(incrementUsage);

  const [viewMode, setViewMode] = useState<'preview' | 'source'>('preview');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('paginated');
  const [activeTab, setActiveTab] = useState<number>(0);
  const [showHelp, setShowHelp] = useState(false);

  const handleReset = () => {
    reset();
    setActiveTab(0);
    setViewMode('preview');
    setLayoutMode('paginated');
  };

  const handleDownloadHtml = () => {
    if (state.results.length === 0) return;
    
    const rawDocName = originalFiles && originalFiles.length > 0 
      ? originalFiles[0].name 
      : 'mathematics_notes';
    const baseFileName = stripFileExtension(rawDocName) || `math_notes_${Date.now()}`;
    const downloadFileName = `${baseFileName}-accessible.html`;

    const htmlContent = generateHtmlDocument(state.results, rawDocName, layoutMode);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = downloadFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      try {
        URL.revokeObjectURL(url);
      } catch (_) {}
    }, 60000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 text-zinc-900 selection:bg-indigo-200 selection:text-indigo-950 font-sans">
      {/* Header */}
      <Header onShowDocs={() => setShowHelp(true)} />

      {/* Processing Overlay during conversion */}
      {state.isProcessing && (
        <ProcessingOverlay 
          progress={state.progress} 
          currentImages={state.currentProcessingImages}
          selectedModel={state.selectedModel}
          actualModelUsed={state.actualModelUsed}
          selectedThinkingLevel={state.selectedThinkingLevel}
          statusMessage={state.statusMessage}
        />
      )}

      {/* Help Modal */}
      {showHelp && (
        <Suspense fallback={null}>
          <HelpModal onClose={() => setShowHelp(false)} />
        </Suspense>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6" role="main">
        {state.error && (
          <ErrorBanner 
            error={state.error} 
            onClear={() => reset()} 
          />
        )}

        {state.results.length === 0 && !state.isProcessing ? (
          <Dashboard 
            onFileUpload={(files) => handleFileUpload(files, 'gemini-3.8-flash', state.selectedThinkingLevel, 'clean-breakdown', 'page-by-page')} 
            isProcessing={state.isProcessing} 
            onShowDocs={() => setShowHelp(true)}
            selectedThinkingLevel={state.selectedThinkingLevel}
            onThinkingLevelChange={setThinkingLevel}
          />
        ) : (
          <ResultsView 
            results={state.results}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            viewMode={viewMode}
            setViewMode={setViewMode}
            layoutMode={layoutMode}
            setLayoutMode={setLayoutMode}
            onDownloadHtml={handleDownloadHtml}
            onReset={handleReset}
            onUpdateHtml={updatePageHtml}
          />
        )}
      </main>

      {/* Clean Footer */}
      <Footer />
    </div>
  );
};

export default App;
