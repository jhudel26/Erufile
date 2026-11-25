import React from 'react';
import { Languages, FileText, Search, Sparkles } from 'lucide-react';

interface OcrOptionsProps {
  options: Record<string, any>;
  setOptions: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

export const OcrOptions: React.FC<OcrOptionsProps> = ({ options, setOptions }) => {
  const currentLang = options.language || 'eng';
  const currentMode = options.ocrMode || 'searchable_pdf';

  const languages = [
    { code: 'eng', name: 'English' },
    { code: 'spa', name: 'Spanish (Español)' },
    { code: 'fra', name: 'French (Français)' },
    { code: 'deu', name: 'German (Deutsch)' },
    { code: 'ita', name: 'Italian (Italiano)' },
    { code: 'por', name: 'Portuguese (Português)' },
    { code: 'fil', name: 'Filipino / Tagalog' },
    { code: 'jpn', name: 'Japanese (日本語)' },
    { code: 'chi_sim', name: 'Chinese Simplified (简体中文)' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
          Document Language:
        </label>
        <div className="relative">
          <Languages className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={currentLang}
            onChange={(e) => setOptions((prev) => ({ ...prev, language: e.target.value }))}
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer"
          >
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <p className="text-[11px] text-slate-600 mt-1.5">
          Select the primary language appearing in your scanned document for optimal accuracy.
        </p>
      </div>

      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
          Output Format:
        </label>
        <div className="grid grid-cols-1 gap-2.5">
          <div
            onClick={() => setOptions((prev) => ({ ...prev, ocrMode: 'searchable_pdf' }))}
            className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
              currentMode === 'searchable_pdf'
                ? 'border-teal-500 bg-teal-50/40'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                currentMode === 'searchable_pdf' ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'
              }`}
            >
              <Search className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900">Searchable PDF</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-100 text-teal-700">
                  Recommended
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Preserves visual pages while embedding an invisible selectable text layer.
              </p>
            </div>
          </div>

          <div
            onClick={() => setOptions((prev) => ({ ...prev, ocrMode: 'text_extract' }))}
            className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
              currentMode === 'text_extract'
                ? 'border-teal-500 bg-teal-50/40'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                currentMode === 'text_extract' ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'
              }`}
            >
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900">Extracted Text (.txt)</span>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Extracts all detected text characters into a pure, clean text document.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <span>EruFile OCR utilizes Tesseract neural networks for character recognition.</span>
      </div>
    </div>
  );
};
