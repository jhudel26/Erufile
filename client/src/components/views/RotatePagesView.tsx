import React, { useEffect, useState } from 'react';
import type { UploadedFileItem } from '../../types';
import { generateAllPagePreviews } from '../../utils/pdfPreview';
import { RotateCw, RotateCcw, RefreshCw, ArrowRight, Loader2, FileText } from 'lucide-react';

interface RotatePagesViewProps {
  fileItem: UploadedFileItem;
  onExecute: (options: Record<string, any>) => void;
  onCancel: () => void;
}

interface PagePreview {
  pageNumber: number;
  previewUrl: string;
}

export const RotatePagesView: React.FC<RotatePagesViewProps> = ({
  fileItem,
  onExecute,
  onCancel,
}) => {
  const [pages, setPages] = useState<PagePreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [rotations, setRotations] = useState<Record<number, number>>({});

  useEffect(() => {
    let isMounted = true;
    async function loadPages() {
      setLoading(true);
      const list = await generateAllPagePreviews(fileItem.file);
      if (isMounted) {
        setPages(list);
        const initRotations: Record<number, number> = {};
        list.forEach((p) => {
          initRotations[p.pageNumber] = 0;
        });
        setRotations(initRotations);
        setLoading(false);
      }
    }
    loadPages();
    return () => {
      isMounted = false;
    };
  }, [fileItem]);

  const rotatePage = (pageNumber: number, direction: 'cw' | 'ccw' = 'cw') => {
    setRotations((prev) => {
      const current = prev[pageNumber] || 0;
      const delta = direction === 'cw' ? 90 : -90;
      const next = (current + delta + 360) % 360;
      return { ...prev, [pageNumber]: next };
    });
  };

  const rotateAll = (direction: 'cw' | 'ccw' = 'cw') => {
    setRotations((prev) => {
      const next: Record<number, number> = {};
      const delta = direction === 'cw' ? 90 : -90;
      pages.forEach((p) => {
        const current = prev[p.pageNumber] || 0;
        next[p.pageNumber] = (current + delta + 360) % 360;
      });
      return next;
    });
  };

  const resetAll = () => {
    const next: Record<number, number> = {};
    pages.forEach((p) => {
      next[p.pageNumber] = 0;
    });
    setRotations(next);
  };

  const rotatedCount = Object.values(rotations).filter((r) => r !== 0).length;

  const handleApply = () => {
    const pageInstructions = pages.map((p) => ({
      pageNumber: p.pageNumber,
      rotation: rotations[p.pageNumber] || 0,
    }));
    onExecute({
      pages: pageInstructions,
    });
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)]">
      {/* Main Pages Canvas */}
      <div className="flex-1 p-6 lg:p-8 bg-slate-50/70 overflow-y-auto">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-3.5 px-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800">
              {pages.length} {pages.length === 1 ? 'Page' : 'Pages'}
            </span>
            <span className="text-xs text-slate-500">
              ({rotatedCount} rotated)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => rotateAll('cw')}
              className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Rotate all pages 90° clockwise"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Rotate All Right
            </button>
            <button
              onClick={() => rotateAll('ccw')}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Rotate all pages 90° counter-clockwise"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Rotate All Left
            </button>
            <button
              onClick={resetAll}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Reset all rotations"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* Page Thumbnail Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            <p className="text-sm font-medium">Extracting and rendering all document pages...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
            {pages.map((p) => {
              const rot = rotations[p.pageNumber] || 0;
              return (
                <div
                  key={p.pageNumber}
                  className={`group relative bg-white rounded-2xl border shadow-sm transition-all flex flex-col overflow-hidden ${
                    rot !== 0 ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Page Number & Rotation Badge */}
                  <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-full bg-slate-900/80 backdrop-blur-xs text-white text-xs font-bold flex items-center justify-center">
                      {p.pageNumber}
                    </span>
                    {rot !== 0 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-teal-600 text-white text-[10px] font-bold">
                        {rot}°
                      </span>
                    )}
                  </div>

                  {/* Rotate Buttons overlay */}
                  <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => rotatePage(p.pageNumber, 'cw')}
                      className="p-1.5 rounded-lg bg-white/95 text-slate-700 hover:text-teal-600 hover:bg-white shadow-md transition-all cursor-pointer"
                      title="Rotate 90° clockwise"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => rotatePage(p.pageNumber, 'ccw')}
                      className="p-1.5 rounded-lg bg-white/95 text-slate-700 hover:text-teal-600 hover:bg-white shadow-md transition-all cursor-pointer"
                      title="Rotate 90° counter-clockwise"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Thumbnail */}
                  <div
                    onClick={() => rotatePage(p.pageNumber, 'cw')}
                    className="aspect-[3/4] bg-slate-100 flex items-center justify-center p-3 cursor-pointer overflow-hidden"
                    title="Click to rotate page 90°"
                  >
                    {p.previewUrl ? (
                      <img
                        src={p.previewUrl}
                        alt={`Page ${p.pageNumber}`}
                        style={{ transform: `rotate(${rot}deg)` }}
                        className="max-h-full max-w-full object-contain rounded-sm shadow-xs transition-transform duration-200"
                      />
                    ) : (
                      <FileText className="w-10 h-10 text-slate-300" />
                    )}
                  </div>

                  {/* Card bottom */}
                  <div className="p-2.5 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Page {p.pageNumber}</span>
                    <button
                      onClick={() => rotatePage(p.pageNumber, 'cw')}
                      className="text-[11px] font-bold text-teal-600 hover:text-teal-700 cursor-pointer flex items-center gap-1"
                    >
                      <RotateCw className="w-3 h-3" />
                      Rotate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 p-6 flex flex-col justify-between shadow-xs">
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-black text-slate-900">Rotate PDF</h3>
            <p className="text-xs text-slate-600 mt-1">
              Rotate individual pages or the entire document.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Total Pages:</span>
              <span className="font-bold text-slate-900">{pages.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Pages Rotated:</span>
              <span className="font-bold text-teal-600">{rotatedCount}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
              Quick Bulk Actions
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => rotateAll('cw')}
                className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5 text-teal-600" />
                <span>All +90°</span>
              </button>
              <button
                type="button"
                onClick={() => rotateAll('ccw')}
                className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-teal-600" />
                <span>All -90°</span>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-6 space-y-3">
          <button
            onClick={handleApply}
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-base shadow-lg shadow-teal-600/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>Rotate PDF</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={onCancel}
            className="w-full py-2.5 rounded-xl text-slate-600 hover:text-slate-800 text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
