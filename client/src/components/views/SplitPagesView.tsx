import React, { useEffect, useState } from 'react';
import type { UploadedFileItem } from '../../types';
import { generateAllPagePreviews } from '../../utils/pdfPreview';
import {
  Layers,
  Split as SplitIcon,
  FileSpreadsheet,
  Check,
  Plus,
  Trash2,
  Loader2,
  ArrowRight,
  CheckCheck,
  X,
  FileText,
} from 'lucide-react';

interface SplitPagesViewProps {
  fileItem: UploadedFileItem;
  onExecute: (options: Record<string, any>) => void;
  onCancel: () => void;
}

interface PagePreview {
  pageNumber: number;
  previewUrl: string;
}

interface RangeItem {
  id: string;
  from: number;
  to: number;
}

const RANGE_COLORS = [
  { border: 'border-teal-500', bg: 'bg-teal-50', badge: 'bg-teal-600 text-white', ring: 'ring-teal-500/20' },
  { border: 'border-indigo-500', bg: 'bg-indigo-50', badge: 'bg-indigo-600 text-white', ring: 'ring-indigo-500/20' },
  { border: 'border-amber-500', bg: 'bg-amber-50', badge: 'bg-amber-600 text-white', ring: 'ring-amber-500/20' },
  { border: 'border-rose-500', bg: 'bg-rose-50', badge: 'bg-rose-600 text-white', ring: 'ring-rose-500/20' },
  { border: 'border-emerald-500', bg: 'bg-emerald-50', badge: 'bg-emerald-600 text-white', ring: 'ring-emerald-500/20' },
  { border: 'border-cyan-500', bg: 'bg-cyan-50', badge: 'bg-cyan-600 text-white', ring: 'ring-cyan-500/20' },
];

export const SplitPagesView: React.FC<SplitPagesViewProps> = ({
  fileItem,
  onExecute,
  onCancel,
}) => {
  const [pages, setPages] = useState<PagePreview[]>([]);
  const [loading, setLoading] = useState(true);

  // Split Modes: 'extract_pages' | 'ranges' | 'fixed_range'
  const [mode, setMode] = useState<'extract_pages' | 'ranges' | 'fixed_range'>('extract_pages');

  // Mode 1: Extract pages selection (set of page numbers)
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [mergeExtracted, setMergeExtracted] = useState(true);

  // Mode 2: Ranges
  const [ranges, setRanges] = useState<RangeItem[]>([
    { id: 'r1', from: 1, to: 1 },
  ]);
  const [mergeRanges, setMergeRanges] = useState(false);

  // Mode 3: Fixed range
  const [fixedRange, setFixedRange] = useState<number>(2);

  // Automatically load all page previews with high resolution
  useEffect(() => {
    let isMounted = true;
    async function loadPreviews() {
      setLoading(true);
      const list = await generateAllPagePreviews(fileItem.file, 1.2);
      if (isMounted) {
        setPages(list);
        setLoading(false);

        const total = list.length;
        // Default: select all pages in extract mode
        setSelectedPages(new Set(list.map((p) => p.pageNumber)));
        // Default range
        setRanges([{ id: 'r1', from: 1, to: Math.max(1, total) }]);
      }
    }
    loadPreviews();
    return () => {
      isMounted = false;
    };
  }, [fileItem]);

  const totalPages = Math.max(pages.length, fileItem.pageCount || 1);

  // Toggle page selection in Extract mode
  const togglePageSelect = (pageNumber: number) => {
    setSelectedPages((prev) => {
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
    setSelectedPages(new Set(pages.map((p) => p.pageNumber)));
  };

  const handleDeselectAll = () => {
    setSelectedPages(new Set());
  };

  // Ranges handlers
  const handleAddRange = () => {
    const lastRange = ranges[ranges.length - 1];
    const newFrom = lastRange ? Math.min(totalPages, lastRange.to + 1) : 1;
    const newTo = totalPages;
    setRanges((prev) => [
      ...prev,
      { id: `r-${Date.now()}`, from: newFrom, to: newTo },
    ]);
  };

  const handleRemoveRange = (id: string) => {
    if (ranges.length <= 1) return;
    setRanges((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateRange = (id: string, field: 'from' | 'to', val: number) => {
    setRanges((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const clamped = Math.max(1, Math.min(totalPages, val));
        return { ...r, [field]: clamped };
      })
    );
  };

  // Helper to determine which range a page belongs to
  const getPageRangeIndex = (pageNum: number): number => {
    for (let i = 0; i < ranges.length; i++) {
      if (pageNum >= ranges[i].from && pageNum <= ranges[i].to) {
        return i;
      }
    }
    return -1;
  };

  // Helper to determine chunk group in fixed set mode
  const getFixedChunkIndex = (pageNum: number): number => {
    return Math.floor((pageNum - 1) / Math.max(1, fixedRange));
  };

  const handleExecute = () => {
    if (mode === 'extract_pages') {
      const pageList = Array.from(selectedPages).sort((a, b) => a - b);
      if (pageList.length === 0) {
        alert('Please select at least one page to extract.');
        return;
      }
      onExecute({
        split_mode: 'extract_pages',
        pages: pageList,
        merge_extracted: mergeExtracted,
      });
    } else if (mode === 'ranges') {
      onExecute({
        split_mode: 'ranges',
        ranges: ranges.map((r) => ({
          from: Math.min(r.from, r.to),
          to: Math.max(r.from, r.to),
        })),
        merge_after_ranges: mergeRanges,
      });
    } else if (mode === 'fixed_range') {
      onExecute({
        split_mode: 'fixed_range',
        fixed_range: Math.max(1, fixedRange),
      });
    }
  };

  const selectedCount = selectedPages.size;

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)]">
      {/* Visual Canvas of All Pages */}
      <div className="flex-1 p-4 lg:p-8 bg-slate-50/70 overflow-y-auto">
        {/* Header Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white p-3.5 px-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-slate-900 truncate" title={fileItem.name}>
              {fileItem.name}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              {mode === 'extract_pages'
                ? `Click pages to select/unselect for extraction (${selectedCount} of ${totalPages} selected).`
                : mode === 'ranges'
                ? `Splitting into ${ranges.length} range ${ranges.length === 1 ? 'part' : 'parts'}.`
                : `Grouping every ${fixedRange} pages into separate files.`}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {mode === 'extract_pages' && (
              <>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Select All</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[450px] gap-3 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
            <span className="text-sm font-semibold text-slate-600">
              Loading all {totalPages} document pages...
            </span>
          </div>
        ) : (
          /* Multi-Page Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 lg:gap-5">
            {pages.map((p) => {
              const isSelected = selectedPages.has(p.pageNumber);
              const rangeIdx = getPageRangeIndex(p.pageNumber);
              const rangeColor = rangeIdx >= 0 ? RANGE_COLORS[rangeIdx % RANGE_COLORS.length] : null;
              const chunkIdx = getFixedChunkIndex(p.pageNumber);

              return (
                <div
                  key={p.pageNumber}
                  onClick={() => {
                    if (mode === 'extract_pages') {
                      togglePageSelect(p.pageNumber);
                    }
                  }}
                  className={`relative group bg-white rounded-2xl border-2 overflow-hidden shadow-xs transition-all duration-150 select-none ${
                    mode === 'extract_pages'
                      ? isSelected
                        ? 'border-teal-500 ring-4 ring-teal-500/20 shadow-md cursor-pointer'
                        : 'border-slate-200 hover:border-slate-300 opacity-60 hover:opacity-100 cursor-pointer'
                      : mode === 'ranges'
                      ? rangeColor
                        ? `${rangeColor.border} shadow-sm`
                        : 'border-slate-200 opacity-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Page Number Badge */}
                  <div className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-bold">
                    {p.pageNumber}
                  </div>

                  {/* Extract Mode Checkmark Badge */}
                  {mode === 'extract_pages' && (
                    <div
                      className={`absolute top-2.5 right-2.5 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-teal-600 text-white shadow-md scale-100'
                          : 'bg-slate-200 text-slate-400 group-hover:scale-105'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}

                  {/* Range Mode Badge */}
                  {mode === 'ranges' && rangeColor && (
                    <div
                      className={`absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs ${rangeColor.badge}`}
                    >
                      Part {rangeIdx + 1}
                    </div>
                  )}

                  {/* Fixed Set Mode Badge */}
                  {mode === 'fixed_range' && (
                    <div className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-white shadow-xs">
                      File {chunkIdx + 1}
                    </div>
                  )}

                  {/* Document Page Thumbnail */}
                  <div className="aspect-[3/4] bg-slate-100 flex items-center justify-center p-3 relative overflow-hidden">
                    {p.previewUrl ? (
                      <img
                        src={p.previewUrl}
                        alt={`Page ${p.pageNumber}`}
                        className="max-h-full max-w-full object-contain rounded-xs shadow-xs pointer-events-none"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <FileText className="w-10 h-10 stroke-[1.5]" />
                        <span className="text-[10px] font-medium mt-1">Page {p.pageNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Info */}
                  <div className="p-2 px-3 bg-white border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                    <span>Page {p.pageNumber}</span>
                    {mode === 'extract_pages' ? (
                      <span className={isSelected ? 'text-teal-600 font-bold' : 'text-slate-400'}>
                        {isSelected ? 'Selected' : 'Omitted'}
                      </span>
                    ) : mode === 'ranges' && rangeIdx >= 0 ? (
                      <span className="font-bold text-slate-800">Range {rangeIdx + 1}</span>
                    ) : (
                      <span className="text-slate-500">File {chunkIdx + 1}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Sidebar: Split Mode Selector & Settings */}
      <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 p-6 flex flex-col justify-between shadow-xs">
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-black text-slate-900">Split PDF</h3>
            <p className="text-xs text-slate-600 mt-1">
              Document contains <strong>{totalPages} pages</strong>.
            </p>
          </div>

          {/* Mode Selector Tabs */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
              Split Mode:
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1.5 rounded-xl">
              {[
                { id: 'extract_pages', label: 'Extract', icon: FileSpreadsheet },
                { id: 'ranges', label: 'Ranges', icon: Layers },
                { id: 'fixed_range', label: 'Fixed Set', icon: SplitIcon },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setMode(tab.id as any)}
                    className={`py-2 px-1 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      mode === tab.id
                        ? 'bg-white text-teal-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode 1: Extract Pages Options */}
          {mode === 'extract_pages' && (
            <div className="space-y-4">
              <div className="bg-teal-50/70 border border-teal-200/80 rounded-xl p-3">
                <div className="flex items-center justify-between text-xs font-bold text-teal-950 mb-1.5">
                  <span>Selected Pages ({selectedCount} of {totalPages}):</span>
                </div>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                  {selectedCount === 0 ? (
                    <span className="text-[11px] text-slate-500 italic">
                      No pages selected. Click pages on the left to extract.
                    </span>
                  ) : (
                    Array.from(selectedPages)
                      .sort((a, b) => a - b)
                      .map((pNum) => (
                        <span
                          key={pNum}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-white border border-teal-300 text-teal-800"
                        >
                          p{pNum}
                          <button
                            type="button"
                            onClick={() => togglePageSelect(pNum)}
                            className="hover:text-red-500 ml-0.5 cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))
                  )}
                </div>
              </div>

              {/* Merge Extracted Option */}
              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={mergeExtracted}
                    onChange={(e) => setMergeExtracted(e.target.checked)}
                    className="w-4 h-4 rounded-sm text-teal-600 border-slate-300 focus:ring-teal-500 cursor-pointer"
                  />
                  <span>Merge extracted pages into 1 PDF</span>
                </label>
                <p className="text-[11px] text-slate-500 mt-1 px-1">
                  {mergeExtracted
                    ? 'All selected pages will be saved into a single PDF.'
                    : 'Each selected page will be downloaded as a separate file inside a ZIP.'}
                </p>
              </div>
            </div>
          )}

          {/* Mode 2: Custom Ranges Options */}
          {mode === 'ranges' && (
            <div className="space-y-4">
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {ranges.map((r, idx) => {
                  const color = RANGE_COLORS[idx % RANGE_COLORS.length];
                  return (
                    <div
                      key={r.id}
                      className={`p-3 rounded-xl border-2 ${color.border} ${color.bg} space-y-2`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          Range {idx + 1}
                        </span>
                        {ranges.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRange(r.id)}
                            className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                            title="Remove range"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                            From Page:
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={totalPages}
                            value={r.from}
                            onChange={(e) => handleUpdateRange(r.id, 'from', Number(e.target.value))}
                            className="w-full h-8 px-2 rounded-lg bg-white border border-slate-300 font-bold text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                            To Page:
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={totalPages}
                            value={r.to}
                            onChange={(e) => handleUpdateRange(r.id, 'to', Number(e.target.value))}
                            className="w-full h-8 px-2 rounded-lg bg-white border border-slate-300 font-bold text-slate-800"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleAddRange}
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-teal-500 text-slate-700 hover:text-teal-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-slate-50 hover:bg-teal-50/30"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Range</span>
              </button>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={mergeRanges}
                  onChange={(e) => setMergeRanges(e.target.checked)}
                  className="w-4 h-4 rounded-sm text-teal-600 border-slate-300 focus:ring-teal-500 cursor-pointer"
                />
                <span>Merge all ranges into 1 PDF</span>
              </label>
            </div>
          )}

          {/* Mode 3: Fixed Set Options */}
          {mode === 'fixed_range' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  Split into files of:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={fixedRange}
                    onChange={(e) => setFixedRange(Math.max(1, Number(e.target.value)))}
                    className="w-24 h-10 px-3 rounded-xl bg-white border border-slate-300 font-bold text-sm text-slate-800 text-center"
                  />
                  <span className="text-xs font-bold text-slate-600">pages per file</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 text-xs text-teal-950 font-medium">
                Document will be split into{' '}
                <strong>{Math.ceil(totalPages / Math.max(1, fixedRange))} files</strong> (packaged into a ZIP).
              </div>
            </div>
          )}
        </div>

        {/* Execution Button */}
        <div className="pt-6 border-t border-slate-100 mt-6">
          <button
            onClick={handleExecute}
            disabled={loading || (mode === 'extract_pages' && selectedCount === 0)}
            className="w-full h-14 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-bold text-base shadow-lg shadow-teal-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>
              {mode === 'extract_pages'
                ? selectedCount === 0
                  ? 'Select pages to extract'
                  : `Extract ${selectedCount} ${selectedCount === 1 ? 'Page' : 'Pages'}`
                : mode === 'ranges'
                ? `Split into ${ranges.length} ${ranges.length === 1 ? 'Part' : 'Parts'}`
                : `Split into ${Math.ceil(totalPages / Math.max(1, fixedRange))} Files`}
            </span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
