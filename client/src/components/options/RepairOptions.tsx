import { Wrench, Activity, CheckCircle2 } from 'lucide-react';

interface RepairOptionsProps {
  options: Record<string, any>;
  setOptions: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

export const RepairOptions: React.FC<RepairOptionsProps> = () => {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80">
        <div className="flex items-center gap-2.5 text-amber-900 font-bold text-sm mb-1.5">
          <Wrench className="w-4 h-4 text-amber-600" />
          <span>Document Diagnostic Mode</span>
        </div>
        <p className="text-xs text-amber-800 leading-relaxed">
          EruFile will deeply inspect and reconstruct internal cross-reference (xref) tables, restore broken stream offsets, and rebuild corrupted page trees.
        </p>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Automated Recovery Pipeline:
        </h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Reconstruct XREF Table & Trailer Offsets</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Repair Unclosed Content & Binary Streams</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Sanitize Font Dictionaries & Annotations</span>
          </div>
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-slate-100 text-slate-600 text-xs flex items-center gap-2">
        <Activity className="w-4 h-4 text-slate-600 shrink-0" />
        <span>Click <strong>Repair PDF</strong> below to start full reconstruction.</span>
      </div>
    </div>
  );
};
