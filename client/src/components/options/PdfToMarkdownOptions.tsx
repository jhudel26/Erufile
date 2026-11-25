import { Sparkles, CheckCircle2 } from 'lucide-react';

interface PdfToMarkdownOptionsProps {
  options: Record<string, any>;
  setOptions: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

export const PdfToMarkdownOptions: React.FC<PdfToMarkdownOptionsProps> = ({
  options,
  setOptions,
}) => {
  const detectHeadings = options.detectHeadings !== undefined ? options.detectHeadings : true;
  const extractTables = options.extractTables !== undefined ? options.extractTables : true;

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80">
        <div className="flex items-center gap-2 text-purple-900 font-bold text-sm mb-1">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span>LLM & Note-Taking Optimized</span>
        </div>
        <p className="text-xs text-purple-800 leading-relaxed">
          Transforms complex document layouts into structured GitHub-flavored Markdown (`.md`), perfect for Obsidian, Notion, and AI prompts.
        </p>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
          Formatting Options:
        </label>

        <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 cursor-pointer hover:bg-slate-100 transition-colors">
          <input
            type="checkbox"
            checked={Boolean(detectHeadings)}
            onChange={(e) =>
              setOptions((prev) => ({
                ...prev,
                detectHeadings: e.target.checked,
              }))
            }
            className="w-4 h-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500"
          />
          <span>Auto-detect Headings & Hierarchy (#, ##, ###)</span>
        </label>

        <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 cursor-pointer hover:bg-slate-100 transition-colors">
          <input
            type="checkbox"
            checked={Boolean(extractTables)}
            onChange={(e) =>
              setOptions((prev) => ({
                ...prev,
                extractTables: e.target.checked,
              }))
            }
            className="w-4 h-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500"
          />
          <span>Format Tabular Content into Markdown Tables</span>
        </label>
      </div>

      <div className="p-3 rounded-xl bg-slate-100 text-slate-600 text-[11px] flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0" />
        <span>Outputs clean, readable `.md` file ready for instant download.</span>
      </div>
    </div>
  );
};
