import { useState } from 'react';
import { TOOLS } from './config/tools';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Home } from './components/Home';
import { ToolPage } from './components/ToolPage';

export function App() {
  const [currentToolId, setCurrentToolId] = useState<string | null>(null);

  const selectedTool = TOOLS.find((t) => t.id === currentToolId);

  const handleSelectTool = (toolId: string) => {
    setCurrentToolId(toolId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoHome = () => {
    setCurrentToolId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased selection:bg-red-500 selection:text-white">
      <Header
        onSelectTool={handleSelectTool}
        onGoHome={handleGoHome}
        currentToolId={currentToolId}
      />

      <main className="flex-1">
        {selectedTool ? (
          <ToolPage
            tool={selectedTool}
            onSelectTool={handleSelectTool}
            onGoHome={handleGoHome}
          />
        ) : (
          <Home onSelectTool={handleSelectTool} />
        )}
      </main>

      <Footer onSelectTool={handleSelectTool} />
    </div>
  );
}

export default App;
