import React, { useRef, useState, useEffect } from 'react';
import type { UploadedFileItem } from '../../types';
import { generateAllPagePreviews } from '../../utils/pdfPreview';
import {
  PenTool,
  Type,
  Upload,
  RotateCcw,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
} from 'lucide-react';

interface SignPdfViewProps {
  fileItem: UploadedFileItem;
  onExecute: (options: Record<string, any>) => void;
  onCancel: () => void;
}

interface PagePreview {
  pageNumber: number;
  previewUrl: string;
}

export const SignPdfView: React.FC<SignPdfViewProps> = ({
  fileItem,
  onExecute,
  onCancel,
}) => {
  const [pages, setPages] = useState<PagePreview[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingPages, setLoadingPages] = useState(true);

  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedName, setTypedName] = useState('Jane Doe');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [stampPos, setStampPos] = useState({ x: 50, y: 70 }); // in percentages
  const [stampSize, setStampSize] = useState({ width: 140, height: 60 });
  const [isDrawing, setIsDrawing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load all pages
  useEffect(() => {
    let isMounted = true;
    async function loadPages() {
      setLoadingPages(true);
      const list = await generateAllPagePreviews(fileItem.file);
      if (isMounted) {
        setPages(list);
        setLoadingPages(false);
      }
    }
    loadPages();
    return () => {
      isMounted = false;
    };
  }, [fileItem]);

  // Initialize canvas
  useEffect(() => {
    if (activeTab === 'draw' && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0f766e';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [activeTab]);

  // Handle freehand drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (canvasRef.current) {
      setSignatureData(canvasRef.current.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSignatureData(null);
    }
  };

  // Convert typed name to signature image
  const generateTypedSignature = (text: string) => {
    setTypedName(text);
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 300;
    tempCanvas.height = 100;
    const ctx = tempCanvas.getContext('2d');
    if (ctx) {
      ctx.font = 'italic bold 38px "Brush Script MT", "Caveat", cursive, sans-serif';
      ctx.fillStyle = '#0f766e';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 150, 50);
      setSignatureData(tempCanvas.toDataURL('image/png'));
    }
  };

  useEffect(() => {
    if (activeTab === 'type') {
      generateTypedSignature(typedName);
    }
  }, [activeTab]);

  // Handle signature upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSignatureData(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApply = () => {
    if (!signatureData) {
      alert('Please create or upload a signature first.');
      return;
    }

    onExecute({
      signatureData,
      posX: stampPos.x,
      posY: stampPos.y,
      width: stampSize.width,
      height: stampSize.height,
      pageNumber: currentPage,
    });
  };

  const activePageObj = pages.find((p) => p.pageNumber === currentPage);
  const activePreviewUrl = activePageObj?.previewUrl || fileItem.previewUrl;
  const totalPages = Math.max(pages.length, fileItem.pageCount || 1);

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)]">
      {/* Visual Document Canvas with Drag-Positioned Stamp */}
      <div className="flex-1 p-6 lg:p-8 bg-slate-100 flex flex-col items-center justify-between overflow-auto relative">
        {/* Top Control Bar with Page Navigation */}
        <div className="flex items-center justify-between w-full max-w-2xl mb-4 bg-white p-3 px-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-800">{fileItem.name}</h3>
            <p className="text-[11px] text-slate-500">
              Click on the page below to place your signature stamp.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Page navigation */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg hover:bg-white text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-700 px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg hover:bg-white text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onCancel}
              className="text-xs font-bold text-slate-600 hover:text-slate-800 px-3 py-1.5 rounded-lg bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Document Page Canvas */}
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = ((e.clientX - rect.left) / rect.width) * 100;
            const clickY = ((e.clientY - rect.top) / rect.height) * 100;
            setStampPos({
              x: Math.max(5, Math.min(85, clickX)),
              y: Math.max(5, Math.min(85, clickY)),
            });
          }}
          className="w-full max-w-xl aspect-[1/1.414] bg-white rounded-2xl shadow-xl border border-slate-300 relative cursor-crosshair overflow-hidden select-none p-4"
        >
          {loadingPages && !activePreviewUrl ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-teal-600" />
              <span className="text-xs">Rendering page {currentPage}...</span>
            </div>
          ) : activePreviewUrl ? (
            <img
              src={activePreviewUrl}
              alt={`Page ${currentPage} Preview`}
              className="w-full h-full object-contain pointer-events-none"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 text-xs">
              <FileText className="w-16 h-16 stroke-1" />
              <span>Page {currentPage}</span>
            </div>
          )}

          {/* Draggable/Positioned Signature Stamp Badge */}
          {signatureData && (
            <div
              style={{
                left: `${stampPos.x}%`,
                top: `${stampPos.y}%`,
                width: `${stampSize.width}px`,
                height: `${stampSize.height}px`,
                transform: 'translate(-50%, -50%)',
              }}
              className="absolute border-2 border-dashed border-teal-500 bg-white/90 rounded-lg p-1.5 shadow-lg flex items-center justify-center cursor-move"
            >
              <img
                src={signatureData}
                alt="Signature Stamp"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}
        </div>

        {/* Bottom Horizontal Thumbnails Strip for Multi-Page Docs */}
        {pages.length > 1 && (
          <div className="w-full max-w-2xl mt-4 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto">
            {pages.map((p) => (
              <button
                key={p.pageNumber}
                type="button"
                onClick={() => setCurrentPage(p.pageNumber)}
                className={`flex-shrink-0 w-14 aspect-[3/4] rounded-lg border-2 overflow-hidden relative cursor-pointer transition-all ${
                  currentPage === p.pageNumber
                    ? 'border-teal-600 ring-2 ring-teal-600/30 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                }`}
              >
                {p.previewUrl ? (
                  <img
                    src={p.previewUrl}
                    alt={`Page ${p.pageNumber}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">
                    {p.pageNumber}
                  </div>
                )}
                <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/70 text-[9px] font-bold text-white">
                  {p.pageNumber}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Sidebar: Signature Creator */}
      <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 p-6 flex flex-col justify-between shadow-xs">
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-black text-slate-900">Sign Document</h3>
            <p className="text-xs text-slate-600 mt-1">
              Signing on <strong>Page {currentPage}</strong> of {totalPages}.
            </p>
          </div>

          {/* Creation Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
            {[
              { id: 'draw', label: 'Draw', icon: PenTool },
              { id: 'type', label: 'Type', icon: Type },
              { id: 'upload', label: 'Upload', icon: Upload },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-white text-teal-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content: Draw */}
          {activeTab === 'draw' && (
            <div className="space-y-3">
              <div className="border border-slate-300 rounded-xl overflow-hidden bg-slate-50 relative">
                <canvas
                  ref={canvasRef}
                  width={340}
                  height={140}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="cursor-crosshair bg-white w-full h-[140px] block"
                />
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="Clear canvas"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 text-center">
                Draw your signature above using your mouse or touchscreen.
              </p>
            </div>
          )}

          {/* Tab Content: Type */}
          {activeTab === 'type' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                  Your Full Name:
                </label>
                <input
                  type="text"
                  value={typedName}
                  onChange={(e) => generateTypedSignature(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 text-sm font-medium"
                />
              </div>

              {signatureData && (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center min-h-[90px]">
                  <img src={signatureData} alt="Typed Signature" className="max-h-16" />
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Upload */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <label className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50 hover:bg-teal-50/20">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-700">Upload signature image</span>
                <span className="text-[11px] text-slate-500 mt-0.5">PNG, JPG, or SVG with transparent background</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {signatureData && (
                <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-center">
                  <img src={signatureData} alt="Uploaded Signature" className="max-h-14" />
                </div>
              )}
            </div>
          )}

          {/* Stamp Size Control */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
              <span>Stamp Width:</span>
              <span>{stampSize.width} px</span>
            </div>
            <input
              type="range"
              min="80"
              max="240"
              step="10"
              value={stampSize.width}
              onChange={(e) => {
                const w = Number(e.target.value);
                setStampSize({ width: w, height: Math.round(w * 0.42) });
              }}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
            />
          </div>
        </div>

        {/* Execution Button */}
        <div className="pt-6 border-t border-slate-100 mt-6">
          <button
            onClick={handleApply}
            disabled={!signatureData}
            className="w-full h-14 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-bold text-base shadow-lg shadow-teal-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-5 h-5" />
            <span>Apply Signature (Page {currentPage})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
