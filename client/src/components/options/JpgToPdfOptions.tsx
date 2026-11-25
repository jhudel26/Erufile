import React from 'react';
import { Smartphone, Monitor, FileSpreadsheet, Maximize2 } from 'lucide-react';

interface JpgToPdfOptionsProps {
  options: Record<string, any>;
  setOptions: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

export const JpgToPdfOptions: React.FC<JpgToPdfOptionsProps> = ({
  options,
  setOptions,
}) => {
  const orientation = options.orientation || 'portrait';
  const pageSize = options.pageSize || 'a4';
  const margin = options.margin || 'no_margin';
  const mergeAll = options.mergeAll !== undefined ? options.mergeAll : true;

  return (
    <div className="space-y-6">
      {/* Page Orientation */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
          Page Orientation:
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setOptions((prev) => ({ ...prev, orientation: 'portrait' }))}
            className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
              orientation === 'portrait'
                ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Portrait</span>
          </button>

          <button
            type="button"
            onClick={() => setOptions((prev) => ({ ...prev, orientation: 'landscape' }))}
            className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
              orientation === 'landscape'
                ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Landscape</span>
          </button>
        </div>
      </div>

      {/* Page Size */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
          Page Size:
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'fit', label: 'Fit to Image', icon: Maximize2 },
            { id: 'a4', label: 'A4 (297x210mm)', icon: FileSpreadsheet },
            { id: 'us_letter', label: 'US Letter', icon: FileSpreadsheet },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setOptions((prev) => ({ ...prev, pageSize: item.id }))}
              className={`p-2.5 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer text-center ${
                pageSize === item.id
                  ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Margins */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
          Margin:
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'no_margin', label: 'No Margin' },
            { id: 'small', label: 'Small' },
            { id: 'big', label: 'Big' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setOptions((prev) => ({ ...prev, margin: item.id }))}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                margin === item.id
                  ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Merge into one PDF */}
      <div className="pt-2 border-t border-slate-100">
        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={Boolean(mergeAll)}
            onChange={(e) =>
              setOptions((prev) => ({
                ...prev,
                mergeAll: e.target.checked,
              }))
            }
            className="w-4 h-4 rounded-sm text-teal-600 border-slate-300 focus:ring-teal-500"
          />
          <span>Merge all images into one single PDF</span>
        </label>
      </div>
    </div>
  );
};
