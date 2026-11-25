import React from 'react';

interface PageNumberOptionsProps {
  totalPages: number;
  options: Record<string, any>;
  setOptions: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

export const PageNumberOptions: React.FC<PageNumberOptionsProps> = ({
  totalPages,
  options,
  setOptions,
}) => {
  const position = options.position || 'bottom-right';
  const format = options.format || 'page_n_of_p';
  const startNumber = options.startNumber || 1;
  const fromPage = options.fromPage || 1;
  const toPage = options.toPage || Math.max(1, totalPages);
  const fontSize = options.fontSize || 11;

  const positions = [
    { id: 'top-left', label: 'Top Left' },
    { id: 'top-center', label: 'Top Center' },
    { id: 'top-right', label: 'Top Right' },
    { id: 'bottom-left', label: 'Bottom Left' },
    { id: 'bottom-center', label: 'Bottom Center' },
    { id: 'bottom-right', label: 'Bottom Right' },
  ];

  const formats = [
    { id: 'n', label: '1, 2, 3...', example: '1' },
    { id: 'page_n', label: 'Page 1, Page 2...', example: 'Page 1' },
    { id: 'page_n_of_p', label: 'Page 1 of 5...', example: 'Page 1 of ' + totalPages },
    { id: 'n_of_p', label: '1/5, 2/5...', example: '1/' + totalPages },
  ];

  return (
    <div className="space-y-5">
      {/* Position 3x2 Matrix */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
          Position on Page:
        </label>
        <div className="grid grid-cols-3 gap-2">
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

      {/* Format Selector */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
          Numbering Format:
        </label>
        <div className="space-y-2">
          {formats.map((f) => (
            <div
              key={f.id}
              onClick={() => setOptions((prev) => ({ ...prev, format: f.id }))}
              className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                format === f.id
                  ? 'border-teal-500 bg-teal-50/40 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <span className="text-xs font-bold text-slate-900">{f.label}</span>
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {f.example}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Page Interval */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
          Pages to Number:
        </label>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-slate-600 block mb-1">From page:</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={fromPage}
              onChange={(e) =>
                setOptions((prev) => ({
                  ...prev,
                  fromPage: Math.max(1, Math.min(totalPages, Number(e.target.value))),
                }))
              }
              className="w-full h-9 px-3 rounded-xl bg-white border border-slate-200 font-bold text-slate-800"
            />
          </div>
          <div>
            <span className="text-slate-600 block mb-1">To page:</span>
            <input
              type="number"
              min={fromPage}
              max={totalPages}
              value={toPage}
              onChange={(e) =>
                setOptions((prev) => ({
                  ...prev,
                  toPage: Math.max(fromPage, Math.min(totalPages, Number(e.target.value))),
                }))
              }
              className="w-full h-9 px-3 rounded-xl bg-white border border-slate-200 font-bold text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Start Number & Font Size */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-slate-600 block mb-1">First number:</span>
          <input
            type="number"
            min="1"
            value={startNumber}
            onChange={(e) =>
              setOptions((prev) => ({
                ...prev,
                startNumber: Math.max(1, Number(e.target.value)),
              }))
            }
            className="w-full h-9 px-3 rounded-xl bg-white border border-slate-200 font-bold text-slate-800"
          />
        </div>
        <div>
          <span className="text-slate-600 block mb-1">Font size:</span>
          <input
            type="number"
            min="8"
            max="24"
            value={fontSize}
            onChange={(e) =>
              setOptions((prev) => ({
                ...prev,
                fontSize: Math.max(8, Math.min(24, Number(e.target.value))),
              }))
            }
            className="w-full h-9 px-3 rounded-xl bg-white border border-slate-200 font-bold text-slate-800"
          />
        </div>
      </div>
    </div>
  );
};
