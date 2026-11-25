import React, { useEffect, useState } from 'react';
import type { UploadedFileItem } from '../../types';
import { generateAllPagePreviews } from '../../utils/pdfPreview';
import { Trash2, ArrowRight, Loader2 } from 'lucide-react';

interface RemovePagesViewProps {
  fileItem: UploadedFileItem;
  onExecute: (options: Record<string, any>) => void;
  onCancel: () => void;
}

interface PagePreview {
  pageNumber: number;
  previewUrl: string;
}

export const RemovePagesView: React.FC<RemovePagesViewProps> = ({
  fileItem,
  onExecute,
  onCancel,
}) => {
  const [pages, setPages] = useState<PagePreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagesToRemove, setPagesToRemove] = useState<Set<number>>(new Set());

  useEffect(() => {
    let isMounted = true;
    async function loadPreviews() {
      setLoading(true);
      const list = await generateAllPagePreviews(fileItem.file);
      if (isMounted) {
        setPages(list);
        setLoading(false);
      }
    }
    loadPreviews();
    return () => {
      isMounted = false;
    };
  }, [fileItem]);

  const togglePageRemoval = (pageNumber: number) => {
    setPagesToRemove((prev) => {
      const next = new Set(prev);
      if (next.has(pageNumber)) {
        next.delete(pageNumber);
      } else {
        next.add(pageNumber);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setPagesToRemove(new Set(pages.map((p) => p.pageNumber)));
  };

  const handleClearSelection = () => {
    setPagesToRemove(new Set());
  };

  const remainingPagesCount = pages.length - pagesToRemove.size;

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)]">
      {/* Canvas showing all pages */}
      <div className="flex-1 p-6 lg:p-8 bg-slate-50/70 overflow-y-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-3.5 px-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">{fileItem.name}</h2>
            <p className="text-xs text-slate-600">
              Click on the pages you want to remove from your PDF.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              Select all
            </button>
            <button
              onClick={handleClearSelection}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              Reset selection
            </button>
            <button
              onClick={onCancel}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              Choose another file
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3 text-slate-600">
            <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
            <p className="text-sm font-semibold">Generating visual page thumbnails...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
            {pages.map((p) => {
              const isMarked = pagesToRemove.has(p.pageNumber);
              return (
                <div
                  key={p.pageNumber}
                  onClick={() => togglePageRemoval(p.pageNumber)}
                  className={`group relative bg-white rounded-2xl border-2 shadow-xs hover:shadow-md transition-all duration-150 flex flex-col overflow-hidden cursor-pointer ${
                    isMarked
                      ? 'border-red-500 ring-2 ring-red-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Page index badge */}
                  <div
                    className={`absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded-full text-xs font-bold ${
                      isMarked ? 'bg-red-600 text-white' : 'bg-slate-900/80 text-white'
                    }`}
                  >
                    Page {p.pageNumber}
                  </div>

                  {/* Thumbnail */}
                  <div className="aspect-[3/4] bg-slate-100 flex items-center justify-center p-3 relative overflow-hidden">
                    <img
                      src={p.previewUrl}
                      alt={`Page ${p.pageNumber}`}
                      className="max-h-full max-w-full object-contain rounded-sm shadow-xs"
                    />

                    {/* Delete overlay */}
                    {isMarked && (
                      <div className="absolute inset-0 bg-red-600/30 backdrop-blur-xs flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                          <Trash2 className="w-6 h-6 stroke-[2.2]" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card bottom footer */}
                  <div className="p-2.5 text-center text-xs font-bold border-t border-slate-100">
                    {isMarked ? (
                      <span className="text-red-600 flex items-center justify-center gap-1">
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </span>
                    ) : (
                      <span className="text-slate-600">Keep</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 p-6 flex flex-col justify-between shadow-xs">
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-black text-slate-900">Remove Pages</h3>
            <p className="text-xs text-slate-600 mt-1">
              Select which pages to permanently eliminate.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Total pages:</span>
                <span className="font-bold text-slate-800">{pages.length}</span>
              </div>
              <div className="flex justify-between items-center text-red-600">
                <span>Pages to remove:</span>
                <span className="font-bold">{pagesToRemove.size}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-700 pt-2 border-t border-slate-200 font-bold text-sm">
                <span>Remaining pages:</span>
                <span>{remainingPagesCount}</span>
              </div>
            </div>

            {pagesToRemove.size === 0 && (
              <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200 font-medium">
                Click on one or more page cards on the left to mark them for removal.
              </p>
            )}

            {remainingPagesCount === 0 && (
              <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200 font-medium">
                You cannot delete all pages from the document.
              </p>
            )}
          </div>
        </div>

        {/* Execution button */}
        <div className="pt-6 border-t border-slate-100 mt-6">
          <button
            onClick={() => onExecute({ pagesToRemove: Array.from(pagesToRemove) })}
            disabled={pagesToRemove.size === 0 || remainingPagesCount === 0}
            className="w-full h-14 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-bold text-base shadow-lg shadow-teal-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Remove {pagesToRemove.size} {pagesToRemove.size === 1 ? 'Page' : 'Pages'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
