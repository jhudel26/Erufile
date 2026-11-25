import { useEffect, useState } from 'react';
import type { UploadedFileItem } from '../../types';
import { generateAllPagePreviews } from '../../utils/pdfPreview';
import {
  RotateCw,
  Trash2,
  Plus,
  ArrowRight,
  FilePlus,
  Loader2,
} from 'lucide-react';

interface OrganizePagesViewProps {
  fileItem: UploadedFileItem;
  onExecute: (options: Record<string, any>) => void;
  onCancel: () => void;
}

interface PageItem {
  id: string;
  originalPageNumber: number;
  previewUrl: string;
  rotation: number;
  isBlank?: boolean;
}

export const OrganizePagesView: React.FC<OrganizePagesViewProps> = ({
  fileItem,
  onExecute,
  onCancel,
}) => {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadPreviews() {
      setLoading(true);
      const list = await generateAllPagePreviews(fileItem.file);
      if (isMounted) {
        setPages(
          list.map((p) => ({
            id: `p-${p.pageNumber}-${Date.now()}-${Math.random()}`,
            originalPageNumber: p.pageNumber,
            previewUrl: p.previewUrl,
            rotation: 0,
          }))
        );
        setLoading(false);
      }
    }
    loadPreviews();
    return () => {
      isMounted = false;
    };
  }, [fileItem]);

  const handleRotatePage = (id: string) => {
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
  };

  const handleRemovePage = (id: string) => {
    setPages((prev) => prev.filter((p) => p.id !== id));
  };

  const handleRotateAll = () => {
    setPages((prev) => prev.map((p) => ({ ...p, rotation: (p.rotation + 90) % 360 })));
  };

  const handleAddBlankPage = () => {
    const newBlank: PageItem = {
      id: `blank-${Date.now()}-${Math.random()}`,
      originalPageNumber: 0,
      previewUrl: '',
      rotation: 0,
      isBlank: true,
    };
    setPages((prev) => [...prev, newBlank]);
  };

  // Drag and drop reordering
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const reordered = [...pages];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(index, 0, moved);

    setDraggedIndex(index);
    setPages(reordered);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleExecute = () => {
    const payload = pages.map((p) => ({
      pageNumber: p.originalPageNumber,
      rotation: p.rotation,
      isBlank: p.isBlank,
    }));
    onExecute({ pages: payload });
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)]">
      {/* Canvas */}
      <div className="flex-1 p-6 lg:p-8 bg-slate-50/70 overflow-y-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-3.5 px-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">{fileItem.name}</h2>
            <p className="text-xs text-slate-600">
              Drag and drop pages to reorder them, rotate individual pages, or add blank pages.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddBlankPage}
              className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FilePlus className="w-4 h-4" />
              Add blank page
            </button>
            <button
              onClick={handleRotateAll}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Rotate all
            </button>
            <button
              onClick={onCancel}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3 text-slate-600">
            <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
            <p className="text-sm font-semibold">Loading pages for visual organization...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
            {pages.map((p, index) => (
              <div
                key={p.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`group relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-150 flex flex-col overflow-hidden cursor-grab active:cursor-grabbing ${
                  draggedIndex === index ? 'opacity-40 scale-95 border-red-400' : ''
                }`}
              >
                {/* New Page Sequence Number Badge */}
                <div className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded-full bg-slate-900/80 text-white text-xs font-bold">
                  {index + 1}
                </div>

                {/* Card Action Controls */}
                <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!p.isBlank && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRotatePage(p.id);
                      }}
                      className="p-1.5 rounded-lg bg-white/95 text-slate-700 hover:text-blue-600 hover:bg-white shadow-md transition-all cursor-pointer"
                      title="Rotate 90°"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemovePage(p.id);
                    }}
                    className="p-1.5 rounded-lg bg-white/95 text-slate-700 hover:text-red-600 hover:bg-white shadow-md transition-all cursor-pointer"
                    title="Delete page"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Thumbnail */}
                <div className="aspect-[3/4] bg-slate-100 flex items-center justify-center p-3 relative overflow-hidden">
                  {p.isBlank ? (
                    <div className="w-full h-full bg-white border border-slate-300 rounded flex flex-col items-center justify-center text-slate-400 text-xs font-bold">
                      <FilePlus className="w-8 h-8 mb-1" />
                      Blank Page
                    </div>
                  ) : (
                    <img
                      src={p.previewUrl}
                      alt={`Page ${index + 1}`}
                      style={{ transform: `rotate(${p.rotation}deg)` }}
                      className="max-h-full max-w-full object-contain rounded-sm shadow-xs transition-transform duration-200"
                    />
                  )}
                </div>

                {/* Card bottom info */}
                <div className="p-2.5 text-center text-xs font-bold text-slate-700 border-t border-slate-100">
                  {p.isBlank ? 'Blank' : `Original: p. ${p.originalPageNumber}`}
                  {p.rotation > 0 && ` (${p.rotation}°)`}
                </div>
              </div>
            ))}

            {/* Add Blank Page Card */}
            <button
              onClick={handleAddBlankPage}
              className="aspect-[3/4] rounded-2xl border-2 border-dashed border-slate-300 hover:border-teal-400 hover:bg-teal-50/40 text-slate-600 hover:text-teal-700 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-teal-100 flex items-center justify-center transition-colors">
                <Plus className="w-5 h-5 text-slate-600 group-hover:text-teal-700" />
              </div>
              <span className="text-xs font-bold">Add Blank Page</span>
            </button>
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 p-6 flex flex-col justify-between shadow-xs">
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-black text-slate-900">Organize PDF</h3>
            <p className="text-xs text-slate-600 mt-1">
              Rearrange, delete, and rotate pages in any order.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Output page count:</span>
                <span className="font-bold text-slate-800 text-sm">{pages.length}</span>
              </div>
              <p className="text-[11px] text-slate-600 pt-2 border-t border-slate-200">
                Pages will be merged in the exact sequence shown on the canvas.
              </p>
            </div>
          </div>
        </div>

        {/* Execution button */}
        <div className="pt-6 border-t border-slate-100 mt-6">
          <button
            onClick={handleExecute}
            disabled={pages.length === 0}
            className="w-full h-14 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-bold text-base shadow-lg shadow-teal-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <span>Organize PDF</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
