import React from 'react';
import { Type, Image as ImageIcon } from 'lucide-react';

interface WatermarkOptionsProps {
  options: Record<string, any>;
  setOptions: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

export const WatermarkOptions: React.FC<WatermarkOptionsProps> = ({
  options,
  setOptions,
}) => {
  const type = options.watermarkType || 'text';
  const text = options.text !== undefined ? options.text : 'CONFIDENTIAL';
  const position = options.position || 'center';
  const opacity = options.opacity !== undefined ? options.opacity : 0.3;
  const rotation = options.rotation !== undefined ? options.rotation : 45;
  const fontSize = options.fontSize || 36;

  const positions = [
    { id: 'top-left', label: 'Top Left' },
    { id: 'top-center', label: 'Top' },
    { id: 'top-right', label: 'Top Right' },
    { id: 'center-left', label: 'Left' },
    { id: 'center', label: 'Center' },
    { id: 'center-right', label: 'Right' },
    { id: 'bottom-left', label: 'Bottom Left' },
    { id: 'bottom-center', label: 'Bottom' },
    { id: 'bottom-right', label: 'Bottom Right' },
  ];

  return (
    <div className="space-y-5">
      {/* Type Toggle */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
          Watermark Type:
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setOptions((prev) => ({ ...prev, watermarkType: 'text' }))}
            className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              type === 'text'
                ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>Text</span>
          </button>

          <button
            type="button"
            onClick={() => setOptions((prev) => ({ ...prev, watermarkType: 'image' }))}
            className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              type === 'image'
                ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Image Stamp</span>
          </button>
        </div>
      </div>

      {/* Text Input */}
      {type === 'text' && (
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
            Watermark Text:
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setOptions((prev) => ({ ...prev, text: e.target.value }))}
            placeholder="e.g. CONFIDENTIAL, DRAFT"
            className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-800"
          />
        </div>
      )}

      {/* 3x3 Position Grid */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
          Position Grid:
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {positions.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setOptions((prev) => ({ ...prev, position: p.id }))}
              className={`p-2.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer text-center ${
                position === p.id
                  ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Opacity & Rotation Sliders */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
            <span>Transparency:</span>
            <span>{Math.round(opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.05"
            max="1.0"
            step="0.05"
            value={opacity}
            onChange={(e) =>
              setOptions((prev) => ({ ...prev, opacity: Number(e.target.value) }))
            }
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
            <span>Rotation Angle:</span>
            <span>{rotation}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            step="15"
            value={rotation}
            onChange={(e) =>
              setOptions((prev) => ({ ...prev, rotation: Number(e.target.value) }))
            }
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
            <span>Font Size:</span>
            <span>{fontSize} pt</span>
          </div>
          <input
            type="range"
            min="14"
            max="72"
            step="2"
            value={fontSize}
            onChange={(e) =>
              setOptions((prev) => ({ ...prev, fontSize: Number(e.target.value) }))
            }
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
          />
        </div>
      </div>
    </div>
  );
};
