import React from 'react';
import { FileImage, Image as ImageIcon, Sparkles, CheckCircle2 } from 'lucide-react';

interface PdfToJpgOptionsProps {
  options: Record<string, any>;
  setOptions: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

export const PdfToJpgOptions: React.FC<PdfToJpgOptionsProps> = ({
  options,
  setOptions,
}) => {
  const mode = options.conversionMode || 'page_to_jpg';
  const dpi = options.dpi || 'high';

  return (
    <div className="space-y-6">
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
          Conversion Mode:
        </label>
        <div className="grid grid-cols-1 gap-3">
          <div
            onClick={() => setOptions((prev) => ({ ...prev, conversionMode: 'page_to_jpg' }))}
            className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
              mode === 'page_to_jpg'
                ? 'border-teal-500 bg-teal-50/40 shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                mode === 'page_to_jpg' ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'
              }`}
            >
              <FileImage className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900">Page to JPG</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-100 text-teal-700">
                  Popular
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Every page of this PDF document will be converted into a separate JPG picture.
              </p>
            </div>
          </div>

          <div
            onClick={() => setOptions((prev) => ({ ...prev, conversionMode: 'extract_images' }))}
            className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
              mode === 'extract_images'
                ? 'border-teal-500 bg-teal-50/40 shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                mode === 'extract_images' ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'
              }`}
            >
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900">Extract Images</span>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Extract all embedded photos and graphical images inside the PDF without pages.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
          Image Quality / DPI:
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setOptions((prev) => ({ ...prev, dpi: 'normal' }))}
            className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
              dpi === 'normal'
                ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>Normal (150 DPI)</span>
          </button>

          <button
            type="button"
            onClick={() => setOptions((prev) => ({ ...prev, dpi: 'high' }))}
            className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
              dpi === 'high'
                ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <span>High (300 DPI)</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </div>
          </button>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Output images will be packaged into a clean, downloadable ZIP archive.</span>
      </div>
    </div>
  );
};
