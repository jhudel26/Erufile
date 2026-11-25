import React, { useState } from 'react';
import { TOOLS } from '../config/tools';
import type { ToolCategory } from '../types';
import {
  Search,
  Layers,
  Split,
  Trash2,
  Grid,
  Minimize2,
  Wrench,
  ScanText,
  Image,
  FileText,
  Presentation,
  Sheet,
  Code,
  FileImage,
  FileCode,
  Table,
  Archive,
  RotateCw,
  Hash,
  Stamp,
  Crop,
  Edit3,
  Lock,
  Unlock,
  PenTool,
  EyeOff,
  Columns,
  Sparkles,
  Shield,
  Zap,
} from 'lucide-react';

interface HomeProps {
  onSelectTool: (toolId: string) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Layers: <Layers className="w-8 h-8" />,
  Split: <Split className="w-8 h-8" />,
  Trash2: <Trash2 className="w-8 h-8" />,
  Grid: <Grid className="w-8 h-8" />,
  Minimize2: <Minimize2 className="w-8 h-8" />,
  Wrench: <Wrench className="w-8 h-8" />,
  ScanText: <ScanText className="w-8 h-8" />,
  Image: <Image className="w-8 h-8" />,
  FileText: <FileText className="w-8 h-8" />,
  Presentation: <Presentation className="w-8 h-8" />,
  Sheet: <Sheet className="w-8 h-8" />,
  Code: <Code className="w-8 h-8" />,
  FileImage: <FileImage className="w-8 h-8" />,
  FileCode: <FileCode className="w-8 h-8" />,
  Table: <Table className="w-8 h-8" />,
  Archive: <Archive className="w-8 h-8" />,
  RotateCw: <RotateCw className="w-8 h-8" />,
  Hash: <Hash className="w-8 h-8" />,
  Stamp: <Stamp className="w-8 h-8" />,
  Crop: <Crop className="w-8 h-8" />,
  Edit3: <Edit3 className="w-8 h-8" />,
  Lock: <Lock className="w-8 h-8" />,
  Unlock: <Unlock className="w-8 h-8" />,
  PenTool: <PenTool className="w-8 h-8" />,
  EyeOff: <EyeOff className="w-8 h-8" />,
  Columns: <Columns className="w-8 h-8" />,
};

const CATEGORIES: { id: ToolCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'organize', label: 'Organize PDF' },
  { id: 'optimize', label: 'Optimize PDF' },
  { id: 'to_pdf', label: 'Convert to PDF' },
  { id: 'from_pdf', label: 'Convert from PDF' },
  { id: 'edit', label: 'Edit PDF' },
  { id: 'security', label: 'PDF Security' },
];

export const Home: React.FC<HomeProps> = ({ onSelectTool }) => {
  const [activeCategory, setActiveCategory] = useState<ToolCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTools = TOOLS.filter((tool) => {
    const matchesCategory =
      activeCategory === 'all' || tool.category === activeCategory;
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-12 pb-20">
      {/* Hero Section */}
      <section className="pt-14 pb-8 px-4 text-center max-w-4xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-700 text-xs font-bold">
          <Sparkles className="w-4 h-4 fill-teal-600" />
          <span>Full Document Productivity • 100% Free &amp; Unrestricted</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight">
          Every tool you need to work with PDFs in one place
        </h1>
        <p className="text-base sm:text-lg text-slate-700 max-w-2xl mx-auto leading-relaxed">
          Merge, split, compress, convert, rotate, protect, and watermark PDFs with just a few clicks.
          No accounts, no logins, no limits.
        </p>

        {/* Search bar */}
        <div className="pt-4 max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search any PDF tool..."
              className="w-full h-13 pl-12 pr-4 rounded-2xl bg-white border border-slate-200 shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none text-sm font-medium transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Category Pills Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none justify-start md:justify-center">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Tools Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {filteredTools.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
            <Search className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">No tools found matching "{searchQuery}"</h3>
            <p className="text-xs text-slate-600">Try searching for keywords like merge, compress, or split.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredTools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => onSelectTool(tool.id)}
                className="group relative bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-slate-300 hover:-translate-y-1 transition-all duration-200 text-left flex flex-col justify-between cursor-pointer overflow-hidden"
              >
                {/* Badge if present */}
                {tool.badge && (
                  <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    {tool.badge}
                  </span>
                )}

                <div className="space-y-4">
                  {/* Tool Icon */}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: `${tool.color}15`,
                      color: tool.color,
                    }}
                  >
                    {ICON_MAP[tool.icon] || <FileText className="w-8 h-8" />}
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>
                </div>

                {/* Footer Tag */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                  <span>{tool.categoryLabel}</span>
                  <span className="text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 font-bold">
                    Open &rarr;
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Trust & Guarantee Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="max-w-2xl space-y-4 relative z-10">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
              Zero Login • Complete Privacy
            </span>
            <h2 className="text-2xl sm:text-3xl font-black">
              Built for seamless document productivity
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Every document uploaded to EruFile is processed in an isolated ephemeral workspace.
              Files are automatically purged after processing, ensuring 100% data confidentiality and privacy.
            </p>
            <div className="flex flex-wrap gap-6 pt-2 text-xs font-medium text-slate-300">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Encrypted Transport</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Fast Multi-Core Processing</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
