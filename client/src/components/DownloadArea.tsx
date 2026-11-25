import React, { useState } from 'react';
import type { ToolDefinition, ProcessResult } from '../types';
import {
  Download,
  CheckCircle2,
  Trash2,
  RotateCcw,
  Sparkles,
  Minimize2,
  Lock,
  RotateCw,
} from 'lucide-react';

interface DownloadAreaProps {
  tool: ToolDefinition;
  result: ProcessResult;
  onRestart: () => void;
  onSelectTool: (toolId: string) => void;
}

export const DownloadArea: React.FC<DownloadAreaProps> = ({
  tool,
  result,
  onRestart,
  onSelectTool,
}) => {
  const [deleted, setDeleted] = useState(false);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDeleteNow = async () => {
    try {
      if (result.downloadUrl && result.downloadUrl.startsWith('blob:')) {
        URL.revokeObjectURL(result.downloadUrl);
      }
      setDeleted(true);
    } catch (err) {
      console.error('Error deleting task files:', err);
      setDeleted(true);
    }
  };

  const isCompressed = result.newSize && result.newSize < result.originalSize;
  const savingsPct = isCompressed
    ? Math.round(((result.originalSize - result.newSize!) / result.originalSize) * 100)
    : 0;

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Success Badge */}
      <div className="flex flex-col items-center space-y-3">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="w-12 h-12 stroke-[2.2]" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
          Your document is ready!
        </h2>
        <p className="text-slate-600 text-sm sm:text-base">
          {tool.name} was completed successfully. Your files are ready for instant download.
        </p>

        {isCompressed && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>
              Your PDF is now {savingsPct}% smaller! ({formatSize(result.originalSize)} &rarr;{' '}
              {formatSize(result.newSize!)})
            </span>
          </div>
        )}
      </div>

      {/* Primary Download Action */}
      <div className="w-full max-w-md space-y-3">
        {deleted ? (
          <div className="p-4 rounded-2xl bg-slate-100 text-slate-500 text-sm font-semibold">
            Files permanently deleted from the server.
          </div>
        ) : (
          <a
            href={result.downloadUrl}
            download={result.filename}
            className="w-full h-16 rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-bold text-lg shadow-xl shadow-teal-600/30 flex items-center justify-center gap-3 transition-all cursor-pointer"
          >
            <Download className="w-6 h-6 stroke-[2.5]" />
            <span>Download {result.filename.endsWith('.zip') ? 'ZIP Archive' : 'Document'}</span>
          </a>
        )}

        <div className="flex items-center justify-center gap-4 text-xs font-semibold pt-1">
          <button
            onClick={onRestart}
            className="text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Process another file
          </button>

          {!deleted && (
            <button
              onClick={handleDeleteNow}
              className="text-red-600 hover:text-red-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Permanently remove your files from the server immediately"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete now
            </button>
          )}
        </div>
      </div>

      {/* Tool Chaining / "Continue in another tool" */}
      <div className="w-full pt-8 border-t border-slate-200">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-4">
          Continue with your document
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <button
            onClick={() => onSelectTool('compress-pdf')}
            className="p-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 text-left transition-all cursor-pointer group flex items-center gap-2.5"
          >
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
              <Minimize2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">Compress</div>
              <div className="text-[10px] text-slate-600">Reduce size</div>
            </div>
          </button>

          <button
            onClick={() => onSelectTool('protect-pdf')}
            className="p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 text-left transition-all cursor-pointer group flex items-center gap-2.5"
          >
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700">Protect</div>
              <div className="text-[10px] text-slate-600">Set password</div>
            </div>
          </button>

          <button
            onClick={() => onSelectTool('rotate-pdf')}
            className="p-3 rounded-xl bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50/30 text-left transition-all cursor-pointer group flex items-center gap-2.5"
          >
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
              <RotateCw className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 group-hover:text-purple-700">Rotate</div>
              <div className="text-[10px] text-slate-600">Change angle</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
