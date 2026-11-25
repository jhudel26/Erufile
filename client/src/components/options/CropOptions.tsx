import React from 'react';
import { Crop, CheckCircle2 } from 'lucide-react';

interface CropOptionsProps {
  options: Record<string, any>;
  setOptions: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

export const CropOptions: React.FC<CropOptionsProps> = ({
  options,
  setOptions,
}) => {
  const top = options.top || 0;
  const bottom = options.bottom || 0;
  const left = options.left || 0;
  const right = options.right || 0;

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80">
        <div className="flex items-center gap-2 text-amber-900 font-bold text-sm mb-1">
          <Crop className="w-4 h-4 text-amber-600" />
          <span>Margin Trimming & Bounding Box</span>
        </div>
        <p className="text-xs text-amber-800 leading-relaxed">
          Trim excess whitespace or borders from all pages in the PDF document by specifying points to shave off.
        </p>
      </div>

      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
          Margins to Trim (pt):
        </label>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-slate-600 block mb-1">Top Margin:</span>
            <input
              type="number"
              min="0"
              value={top}
              onChange={(e) =>
                setOptions((prev) => ({ ...prev, top: Math.max(0, Number(e.target.value)) }))
              }
              className="w-full h-9 px-3 rounded-xl bg-white border border-slate-200 font-bold text-slate-800"
            />
          </div>
          <div>
            <span className="text-slate-600 block mb-1">Bottom Margin:</span>
            <input
              type="number"
              min="0"
              value={bottom}
              onChange={(e) =>
                setOptions((prev) => ({ ...prev, bottom: Math.max(0, Number(e.target.value)) }))
              }
              className="w-full h-9 px-3 rounded-xl bg-white border border-slate-200 font-bold text-slate-800"
            />
          </div>
          <div>
            <span className="text-slate-600 block mb-1">Left Margin:</span>
            <input
              type="number"
              min="0"
              value={left}
              onChange={(e) =>
                setOptions((prev) => ({ ...prev, left: Math.max(0, Number(e.target.value)) }))
              }
              className="w-full h-9 px-3 rounded-xl bg-white border border-slate-200 font-bold text-slate-800"
            />
          </div>
          <div>
            <span className="text-slate-600 block mb-1">Right Margin:</span>
            <input
              type="number"
              min="0"
              value={right}
              onChange={(e) =>
                setOptions((prev) => ({ ...prev, right: Math.max(0, Number(e.target.value)) }))
              }
              className="w-full h-9 px-3 rounded-xl bg-white border border-slate-200 font-bold text-slate-800"
            />
          </div>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>72 points equals exactly 1 inch.</span>
      </div>
    </div>
  );
};
