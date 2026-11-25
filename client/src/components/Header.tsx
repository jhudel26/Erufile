import React, { useState } from 'react';
import { TOOLS } from '../config/tools';
import {
  FileText,
  ChevronDown,
  Menu,
  X,
  Layers,
  Minimize2,
  Split,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  onSelectTool: (toolId: string) => void;
  onGoHome: () => void;
  currentToolId: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  onSelectTool,
  onGoHome,
  currentToolId,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [allToolsOpen, setAllToolsOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);

  const organizeTools = TOOLS.filter((t) => t.category === 'organize');
  const optimizeTools = TOOLS.filter((t) => t.category === 'optimize');
  const toPdfTools = TOOLS.filter((t) => t.category === 'to_pdf');
  const fromPdfTools = TOOLS.filter((t) => t.category === 'from_pdf');
  const editTools = TOOLS.filter((t) => t.category === 'edit');
  const securityTools = TOOLS.filter((t) => t.category === 'security');

  const handleToolClick = (id: string) => {
    onSelectTool(id);
    setAllToolsOpen(false);
    setConvertOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <button
              onClick={onGoHome}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
                <FileText className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-2xl font-black tracking-tight text-slate-900 group-hover:text-teal-600 transition-colors">
                  Eru<span className="text-teal-600">File</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest -mt-1">
                  PDF Suite
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => handleToolClick('merge-pdf')}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentToolId === 'merge-pdf'
                    ? 'text-teal-600 bg-teal-50'
                    : 'text-slate-700 hover:text-teal-600 hover:bg-slate-50'
                }`}
              >
                <Layers className="w-4 h-4 text-teal-600" />
                Merge PDF
              </button>

              <button
                onClick={() => handleToolClick('split-pdf')}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentToolId === 'split-pdf'
                    ? 'text-teal-600 bg-teal-50'
                    : 'text-slate-700 hover:text-teal-600 hover:bg-slate-50'
                }`}
              >
                <Split className="w-4 h-4 text-teal-600" />
                Split PDF
              </button>

              <button
                onClick={() => handleToolClick('compress-pdf')}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentToolId === 'compress-pdf'
                    ? 'text-teal-600 bg-teal-50'
                    : 'text-slate-700 hover:text-teal-600 hover:bg-slate-50'
                }`}
              >
                <Minimize2 className="w-4 h-4 text-teal-600" />
                Compress PDF
              </button>

              {/* Convert PDF Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setConvertOpen(!convertOpen);
                    setAllToolsOpen(false);
                  }}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                    convertOpen
                      ? 'text-teal-600 bg-slate-50'
                      : 'text-slate-700 hover:text-teal-600 hover:bg-slate-50'
                  }`}
                >
                  Convert PDF
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      convertOpen ? 'rotate-180 text-teal-600' : ''
                    }`}
                  />
                </button>

                {convertOpen && (
                  <div
                    className="absolute left-0 mt-2 w-140 bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 grid grid-cols-2 gap-6 z-50 animate-in fade-in zoom-in-95 duration-150"
                    onMouseLeave={() => setConvertOpen(false)}
                  >
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 pb-1 border-b border-slate-100">
                        Convert to PDF
                      </div>
                      <div className="space-y-1">
                        {toPdfTools.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => handleToolClick(t.id)}
                            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-600 transition-colors cursor-pointer flex items-center justify-between"
                          >
                            <span>{t.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 pb-1 border-b border-slate-100">
                        Convert from PDF
                      </div>
                      <div className="space-y-1">
                        {fromPdfTools.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => handleToolClick(t.id)}
                            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-600 transition-colors cursor-pointer flex items-center justify-between"
                          >
                            <span>{t.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* All PDF Tools Mega-Menu */}
              <div className="relative">
                <button
                  onClick={() => {
                    setAllToolsOpen(!allToolsOpen);
                    setConvertOpen(false);
                  }}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                    allToolsOpen
                      ? 'text-teal-600 bg-slate-50'
                      : 'text-slate-700 hover:text-teal-600 hover:bg-slate-50'
                  }`}
                >
                  All PDF Tools
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      allToolsOpen ? 'rotate-180 text-teal-600' : ''
                    }`}
                  />
                </button>

                {allToolsOpen && (
                  <div
                    className="absolute -left-32 mt-2 w-210 bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 grid grid-cols-4 gap-6 z-50 animate-in fade-in zoom-in-95 duration-150"
                    onMouseLeave={() => setAllToolsOpen(false)}
                  >
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-orange-600 mb-3 pb-1 border-b border-orange-100">
                        Organize PDF
                      </div>
                      <div className="space-y-1">
                        {organizeTools.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => handleToolClick(t.id)}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition-colors cursor-pointer block"
                          >
                            {t.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-3 pb-1 border-b border-emerald-100">
                        Optimize PDF
                      </div>
                      <div className="space-y-1">
                        {optimizeTools.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => handleToolClick(t.id)}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors cursor-pointer block"
                          >
                            {t.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-purple-600 mb-3 pb-1 border-b border-purple-100">
                        Edit PDF
                      </div>
                      <div className="space-y-1">
                        {editTools.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => handleToolClick(t.id)}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-sm text-slate-700 hover:bg-purple-50 hover:text-purple-600 transition-colors cursor-pointer block"
                          >
                            {t.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3 pb-1 border-b border-blue-100">
                        PDF Security
                      </div>
                      <div className="space-y-1">
                        {securityTools.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => handleToolClick(t.id)}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer block"
                          >
                            {t.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 max-h-[80vh] overflow-y-auto space-y-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold">
            <Sparkles className="w-4 h-4" />
            All tools accessible instantly without an account
          </div>

          <div>
            <div className="text-xs font-bold uppercase text-slate-600 mb-2">Popular Tools</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleToolClick('merge-pdf')}
                className="text-left px-3 py-2 rounded-lg bg-slate-50 text-sm font-medium text-slate-800"
              >
                Merge PDF
              </button>
              <button
                onClick={() => handleToolClick('split-pdf')}
                className="text-left px-3 py-2 rounded-lg bg-slate-50 text-sm font-medium text-slate-800"
              >
                Split PDF
              </button>
              <button
                onClick={() => handleToolClick('compress-pdf')}
                className="text-left px-3 py-2 rounded-lg bg-slate-50 text-sm font-medium text-slate-800"
              >
                Compress PDF
              </button>
              <button
                onClick={() => handleToolClick('rotate-pdf')}
                className="text-left px-3 py-2 rounded-lg bg-slate-50 text-sm font-medium text-slate-800"
              >
                Rotate PDF
              </button>
            </div>
          </div>

          <div>
            <div className="text-xs font-bold uppercase text-slate-600 mb-2">All Tools</div>
            <div className="space-y-1">
              {TOOLS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleToolClick(t.id)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                >
                  <span>{t.name}</span>
                  <span className="text-[11px] text-slate-600">{t.categoryLabel}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
