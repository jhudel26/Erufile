import React, { useState } from 'react';
import { Lock, Unlock, Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface SecurityOptionsProps {
  toolId: string;
  options: Record<string, any>;
  setOptions: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

export const SecurityOptions: React.FC<SecurityOptionsProps> = ({
  toolId,
  options,
  setOptions,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isProtect = toolId === 'protect-pdf';
  const password = options.password || '';

  return (
    <div className="space-y-5">
      <div
        className={`p-4 rounded-2xl border ${
          isProtect ? 'bg-blue-50/60 border-blue-200/80 text-blue-900' : 'bg-emerald-50/60 border-emerald-200/80 text-emerald-900'
        }`}
      >
        <div className="flex items-center gap-2 font-bold text-sm mb-1">
          {isProtect ? <Lock className="w-4 h-4 text-blue-600" /> : <Unlock className="w-4 h-4 text-emerald-600" />}
          <span>{isProtect ? 'Protect PDF with AES Encryption' : 'Unlock Encrypted PDF'}</span>
        </div>
        <p className="text-xs leading-relaxed opacity-90">
          {isProtect
            ? 'Set a secure password. Anyone opening this document will be prompted to enter it.'
            : 'Enter the password to permanently strip encryption and restrictions from this PDF.'}
        </p>
      </div>

      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
          {isProtect ? 'Choose Password:' : 'Current Password:'}
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setOptions((prev) => ({ ...prev, password: e.target.value }))}
            placeholder={isProtect ? 'Enter a strong password' : 'Enter PDF password'}
            className="w-full h-11 pl-3.5 pr-10 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-800"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {isProtect && (
          <p className="text-[11px] text-slate-600 mt-1.5">
            Keep your password safe. Without it, standard viewers cannot open the encrypted file.
          </p>
        )}
      </div>

      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>EruFile never logs or stores your password on servers.</span>
      </div>
    </div>
  );
};
