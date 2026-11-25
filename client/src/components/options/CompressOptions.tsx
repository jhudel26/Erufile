import React from 'react';
import { Zap, CheckCircle2, ShieldCheck } from 'lucide-react';

interface CompressOptionsProps {
  options: Record<string, any>;
  setOptions: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

export const CompressOptions: React.FC<CompressOptionsProps> = ({
  options,
  setOptions,
}) => {
  const currentLevel = options.compressionLevel || 'recommended';

  const levels = [
    {
      id: 'extreme',
      title: 'Extreme Compression',
      subtitle: 'Less quality, high compression',
      badge: 'Smallest Size',
      icon: Zap,
      iconColor: 'text-amber-500',
      bgColor: 'hover:border-amber-400',
      selectedBg: 'border-teal-500 bg-teal-50/40',
      description: 'Ideal when you need to email or upload under strict file size limits.',
    },
    {
      id: 'recommended',
      title: 'Recommended Compression',
      subtitle: 'Good quality, good compression',
      badge: 'Recommended',
      icon: CheckCircle2,
      iconColor: 'text-emerald-500',
      bgColor: 'hover:border-emerald-400',
      selectedBg: 'border-teal-500 bg-teal-50/40',
      description: 'The golden balance between high visual fidelity and compact file size.',
    },
    {
      id: 'low',
      title: 'Less Compression',
      subtitle: 'High quality, less compression',
      badge: 'Best Quality',
      icon: ShieldCheck,
      iconColor: 'text-blue-500',
      bgColor: 'hover:border-blue-400',
      selectedBg: 'border-teal-500 bg-teal-50/40',
      description: 'Subtle optimization that retains sharp vector graphics and highest-res images.',
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-3">
          Compression Level:
        </label>
        <div className="space-y-3">
          {levels.map((lvl) => {
            const isSelected = currentLevel === lvl.id;
            const Icon = lvl.icon;
            return (
              <div
                key={lvl.id}
                onClick={() => setOptions((prev) => ({ ...prev, compressionLevel: lvl.id }))}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                  isSelected
                    ? 'border-teal-500 bg-teal-50/30 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-sm font-bold text-slate-900">{lvl.title}</h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-teal-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {lvl.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">{lvl.subtitle}</p>
                    <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                      {lvl.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
