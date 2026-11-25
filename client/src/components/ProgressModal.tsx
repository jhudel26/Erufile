import React from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';

interface ProgressModalProps {
  toolName: string;
  progress: number;
  statusText?: string;
}

export const ProgressModal: React.FC<ProgressModalProps> = ({
  toolName,
  progress,
  statusText = 'Processing your document...',
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-teal-100" />
          <div
            className="absolute inset-0 rounded-full border-4 border-teal-600 border-t-transparent animate-spin"
            style={{ animationDuration: '1s' }}
          />
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-black text-slate-900">
            {toolName}...
          </h3>
          <p className="text-sm font-medium text-slate-700">{statusText}</p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-teal-600 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
            />
          </div>
          <div className="text-xs font-bold text-slate-700 text-right">
            {Math.round(progress)}%
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Do not close this page. Your files are processed securely.</span>
        </div>
      </div>
    </div>
  );
};
