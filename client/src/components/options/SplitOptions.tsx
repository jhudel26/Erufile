import React from 'react';
import { Layers, Split as SplitIcon, FileSpreadsheet, Plus, Trash2 } from 'lucide-react';

interface SplitOptionsProps {
  totalPages: number;
  options: Record<string, any>;
  setOptions: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

export const SplitOptions: React.FC<SplitOptionsProps> = ({
  totalPages,
  options,
  setOptions,
}) => {
  const mode = options.split_mode || 'ranges';
  const ranges = options.ranges || [{ from: 1, to: Math.max(1, totalPages) }];

  const handleModeChange = (newMode: 'ranges' | 'fixed_range' | 'extract_pages') => {
    setOptions((prev) => ({
      ...prev,
      split_mode: newMode,
      ...(newMode === 'fixed_range' ? { fixed_range: 2 } : {}),
      ...(newMode === 'extract_pages' ? { pages: 'all', merge_extracted: true } : {}),
    }));
  };

  const handleAddRange = () => {
    setOptions((prev) => ({
      ...prev,
      ranges: [...(prev.ranges || ranges), { from: 1, to: totalPages }],
    }));
  };

  const handleRemoveRange = (index: number) => {
    setOptions((prev) => {
      const currentRanges = prev.ranges || ranges;
      if (currentRanges.length <= 1) return prev;
      return {
        ...prev,
        ranges: currentRanges.filter((_: any, i: number) => i !== index),
      };
    });
  };

  const handleUpdateRange = (index: number, field: 'from' | 'to', value: number) => {
    setOptions((prev) => {
      const currentRanges = [...(prev.ranges || ranges)];
      currentRanges[index] = {
        ...currentRanges[index],
        [field]: Math.max(1, Math.min(totalPages, value)),
      };
      return { ...prev, ranges: currentRanges };
    });
  };

  return (
    <div className="space-y-6">
      {/* Mode Selector Tabs */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
          Split Mode:
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleModeChange('ranges')}
            className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
              mode === 'ranges'
                ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>By Range</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('fixed_range')}
            className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
              mode === 'fixed_range'
                ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <SplitIcon className="w-4 h-4" />
            <span>Fixed Set</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('extract_pages')}
            className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
              mode === 'extract_pages'
                ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Extract</span>
          </button>
        </div>
      </div>

      {/* Mode A: Custom Ranges */}
      {mode === 'ranges' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">Custom Ranges</span>
            <button
              type="button"
              onClick={handleAddRange}
              className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add range
            </button>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {(options.ranges || ranges).map((r: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              >
                <span className="font-bold text-slate-600 w-16">Range {idx + 1}:</span>
                <div className="flex items-center gap-1.5 flex-1">
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={r.from}
                    onChange={(e) => handleUpdateRange(idx, 'from', Number(e.target.value))}
                    className="w-16 h-8 px-2 rounded-lg bg-white border border-slate-200 text-center font-bold text-slate-800"
                  />
                  <span className="text-slate-600">to</span>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={r.to}
                    onChange={(e) => handleUpdateRange(idx, 'to', Number(e.target.value))}
                    className="w-16 h-8 px-2 rounded-lg bg-white border border-slate-200 text-center font-bold text-slate-800"
                  />
                </div>
                {(options.ranges || ranges).length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveRange(idx)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-md cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={Boolean(options.merge_after_ranges)}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    merge_after_ranges: e.target.checked,
                  }))
                }
                className="w-4 h-4 rounded-sm text-teal-600 border-slate-300 focus:ring-teal-500"
              />
              <span>Merge all ranges into one single PDF</span>
            </label>
          </div>
        </div>
      )}

      {/* Mode B: Fixed Range */}
      {mode === 'fixed_range' && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              Split into page ranges of:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max={totalPages}
                value={options.fixed_range || 2}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    fixed_range: Math.max(1, Number(e.target.value)),
                  }))
                }
                className="w-24 h-10 px-3 rounded-xl bg-white border border-slate-200 font-bold text-sm text-slate-800 text-center"
              />
              <span className="text-xs font-semibold text-slate-600">pages per file</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            This document will be divided into files of{' '}
            <strong>{options.fixed_range || 2}</strong> pages each.
          </div>
        </div>
      )}

      {/* Mode C: Extract Pages */}
      {mode === 'extract_pages' && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              Pages to extract:
            </label>
            <input
              type="text"
              placeholder="e.g. 1, 3, 5-8"
              value={options.pages === 'all' ? '' : options.pages || ''}
              onChange={(e) =>
                setOptions((prev) => ({
                  ...prev,
                  pages: e.target.value,
                }))
              }
              className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-800"
            />
            <p className="text-[11px] text-slate-600 mt-1">
              Leave blank to extract all pages, or type specific numbers like <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">1, 3, 5-8</code>.
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={Boolean(options.merge_extracted)}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    merge_extracted: e.target.checked,
                  }))
                }
                className="w-4 h-4 rounded-sm text-teal-600 border-slate-300 focus:ring-teal-500"
              />
              <span>Merge extracted pages into one PDF</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
