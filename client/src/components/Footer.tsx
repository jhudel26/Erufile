import { FileText, Shield, Zap, Lock } from 'lucide-react';

interface FooterProps {
  onSelectTool: (toolId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTool }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/30">
                <FileText className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                Eru<span className="text-teal-400">File</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              The modern, all-in-one document productivity suite. Merge, split, compress, convert,
              edit, and secure your PDF files online completely free — with no accounts or passwords required.
            </p>
            <div className="flex items-center gap-6 pt-2 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Client-Side &amp; TLS Encryption</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Instant Processing</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-sky-400" />
                <span>Strict Ephemeral Storage</span>
              </div>
            </div>
          </div>

          {/* Column: Popular Tools */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Popular Tools
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => onSelectTool('merge-pdf')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Merge PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('split-pdf')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Split PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('compress-pdf')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Compress PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('pdf-to-word')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  PDF to Word
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('jpg-to-pdf')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  JPG to PDF
                </button>
              </li>
            </ul>
          </div>

          {/* Column: Edit & Security */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Edit &amp; Security
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => onSelectTool('rotate-pdf')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Rotate PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('add-page-numbers')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Add Page Numbers
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('add-watermark')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Add Watermark
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('protect-pdf')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Protect PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('unlock-pdf')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Unlock PDF
                </button>
              </li>
            </ul>
          </div>

          {/* Column: Document Suite */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Document Suite
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => onSelectTool('organize-pdf')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Organize PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('ocr-pdf')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  OCR PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('pdf-to-markdown')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  PDF to Markdown
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('repair-pdf')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Repair PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('compare-pdf')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Compare PDF
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} EruFile &reg; — Free Online PDF &amp; Document Productivity Platform.
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
            <span>developed by</span>
            <a
              href="https://jhudel.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-400 hover:text-teal-300 font-bold underline underline-offset-2 transition-colors"
            >
              Jhudel
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
