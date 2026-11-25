import React from 'react';
import { Archive, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface PdfToPdfaOptionsProps {
  options: Record<string, any>;
  setOptions: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

export const PdfToPdfaOptions: React.FC<PdfToPdfaOptionsProps> = ({
  options,
  setOptions,
}) => {
  const conformance = options.conformance || '2b';

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80">
        <div className="flex items-center gap-2 text-blue-900 font-bold text-sm mb-1">
          <Archive className="w-4 h-4 text-blue-600" />
          <span>ISO Standard Digital Archiving</span>
        </div>
        <p className="text-xs text-blue-800 leading-relaxed">
          Standardizes PDF files to PDF/A for legal compliance, government submission, and guaranteed long-term visual preservation across decades.
        </p>
      </div>

      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
          PDF/A Conformance Level:
        </label>
        <div className="grid grid-cols-1 gap-2.5">
          {[
            {
              id: '2b',
              title: 'PDF/A-2b (Recommended)',
              desc: 'Visual preservation based on ISO 19005-2. Widely accepted across court and corporate repositories.',
            },
            {
              id: '1b',
              title: 'PDF/A-1b (Legacy Archive)',
              desc: 'Basic conformance based on ISO 19005-1. Compatible with older legal archiving systems.',
            },
          ].map((lvl) => (
            <div
              key={lvl.id}
              onClick={() => setOptions((prev) => ({ ...prev, conformance: lvl.id }))}
              className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                conformance === lvl.id
                  ? 'border-teal-500 bg-teal-50/40 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{lvl.title}</span>
                {conformance === lvl.id && (
                  <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-slate-600 mt-1">{lvl.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Embeds ICC DeviceRGB color profile and XMP metadata stream.</span>
      </div>
    </div>
  );
};
