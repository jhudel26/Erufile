import React from 'react';
import { RotateCw, RotateCcw, RefreshCw } from 'lucide-react';

interface RotateOptionsProps {
  options: Record<string, any>;
  setOptions: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

export const RotateOptions: React.FC<RotateOptionsProps> = ({
  options,
  setOptions,
}) => {
  const angle = options.angle || 90;

  return (
    <div className="space-y-6">
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
          Rotation Direction:
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 90, label: '90° Right', icon: RotateCw },
            { id: 180, label: '180° Flip', icon: RefreshCw },
            { id: 270, label: '90° Left', icon: RotateCcw },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setOptions((prev) => ({ ...prev, angle: item.id }))}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  angle === item.id
                    ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
        You can also hover over individual page preview cards on the left canvas to rotate specific pages individually.
      </div>
    </div>
  );
};
