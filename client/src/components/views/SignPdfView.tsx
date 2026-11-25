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
  Trash2,
  CheckCheck,
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

interface StampPlacement {
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
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

  // Multi-page signature placements: map of pageNumber -> {x, y}
  const [pagePlacements, setPagePlacements] = useState<Record<number, StampPlacement>>({
    1: { x: 50, y: 70 },
  });

  const [stampSize, setStampSize] = useState({ width: 140, height: 60 });
  const [isDrawing, setIsDrawing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load all pages with crisp resolution
  useEffect(() => {
    let isMounted = true;
    async function loadPages() {
      setLoadingPages(true);
      const list = await generateAllPagePreviews(fileItem.file, 1.3);
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

  const totalPages = Math.max(pages.length, fileItem.pageCount || 1);
  const currentStamp = pagePlacements[currentPage];

  // Apply signature to all pages
  const handleApplyToAllPages = () => {
    const basePos = currentStamp || { x: 50, y: 70 };
    const newMap: Record<number, StampPlacement> = {};
    for (let i = 1; i <= totalPages; i++) {
      newMap[i] = { ...basePos };
    }
    setPagePlacements(newMap);
  };

  // Remove signature from current page
  const handleRemoveCurrentPage = () => {
    setPagePlacements((prev) => {
      const next = { ...prev };
      delete next[currentPage];
      return next;
    });
  };

  // Remove signature from specific page
  const handleRemoveSpecificPage = (pNum: number) => {
    setPagePlacements((prev) => {
      const next = { ...prev };
      delete next[pNum];
      return next;
    });
  };

  const signedPageNumbers = Object.keys(pagePlacements)
    .map(Number)
    .sort((a, b) => a - b);
  const signedCount = signedPageNumbers.length;

  const handleApply = () => {
    if (!signatureData) {
      alert('Please create or upload a signature first.');
      return;
    }

    if (signedCount === 0) {
      alert('Please click on at least one page to place your signature.');
      return;
    }

    const placements = Object.entries(pagePlacements).map(([pNum, pos]) => ({
      pageNumber: Number(pNum),
      posX: pos.x,
      posY: pos.y,
      width: stampSize.width,
      height: stampSize.height,
    }));

    onExecute({
      signatureData,
      placements,
      // Backwards-compatible single-page properties:
      pageNumber: currentPage,
      posX: currentStamp?.x ?? 50,
      posY: currentStamp?.y ?? 70,
      width: stampSize.width,
      height: stampSize.height,
    });
  };

  const activePageObj = pages.find((p) => p.pageNumber === currentPage);
  const activePreviewUrl = activePageObj?.previewUrl || fileItem.previewUrl;

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)]">
      {/* Visual Document Canvas with Drag-Positioned Stamp */}
      <div className="flex-1 p-4 lg:p-6 bg-slate-100 flex flex-col items-center justify-between overflow-auto relative">
        {/* Top Control Bar with Page Navigation and Multi-Page Actions */}
        <div className="flex flex-wrap items-center justify-between w-full max-w-3xl mb-3 bg-white p-3 px-5 rounded-2xl border border-slate-200 shadow-xs gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-slate-800 truncate" title={fileItem.name}>
              {fileItem.name}
            </h3>
            <p className="text-[11px] text-slate-500 truncate">
              {currentStamp
                ? `Signature placed on Page ${currentPage}. Click to reposition.`
                : `Click anywhere on Page ${currentPage} to place your signature.`}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Quick multi-page buttons */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5 mr-1">
                <button
                  type="button"
                  onClick={handleApplyToAllPages}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2.5 py-1.5 rounded-lg border border-teal-200 flex items-center gap-1 cursor-pointer transition-colors"
                  title="Sign all pages in document"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign All</span>
                </button>

                {currentStamp && (
                  <button
                    type="button"
                    onClick={handleRemoveCurrentPage}
                    className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg border border-red-200 flex items-center gap-1 cursor-pointer transition-colors"
                    title="Remove signature from this page"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Clear Page</span>
                  </button>
                )}
              </div>
            )}

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
              <span className="text-xs font-bold text-slate-700 px-2 whitespace-nowrap">
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

        {/* Document Page Canvas: hugs image exactly so percentage clicks match PDF exactly */}
        <div className="flex-1 w-full flex items-center justify-center p-1 min-h-0">
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = ((e.clientX - rect.left) / rect.width) * 100;
              const clickY = ((e.clientY - rect.top) / rect.height) * 100;
              setPagePlacements((prev) => ({
                ...prev,
                [currentPage]: {
                  x: Math.max(2, Math.min(98, clickX)),
                  y: Math.max(2, Math.min(98, clickY)),
                },
              }));
            }}
            className="relative inline-block max-w-2xl max-h-[75vh] bg-white rounded-xl shadow-2xl border border-slate-300 cursor-crosshair overflow-hidden select-none"
          >
            {loadingPages && !activePreviewUrl ? (
              <div className="w-80 sm:w-96 aspect-[1/1.35] flex flex-col items-center justify-center text-slate-400 gap-2 p-8">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                <span className="text-xs font-semibold">Rendering page {currentPage}...</span>
              </div>
            ) : activePreviewUrl ? (
              <img
                src={activePreviewUrl}
                alt={`Page ${currentPage} Preview`}
                className="max-w-full max-h-[75vh] w-auto h-auto block object-contain pointer-events-none"
              />
            ) : (
              <div className="w-80 sm:w-96 aspect-[1/1.35] flex flex-col items-center justify-center text-slate-300 text-xs">
                <FileText className="w-16 h-16 stroke-1" />
                <span>Page {currentPage}</span>
              </div>
            )}

            {/* Draggable/Positioned Signature Stamp Badge on Current Page */}
            {signatureData && currentStamp && (
              <div
                style={{
                  left: `${currentStamp.x}%`,
                  top: `${currentStamp.y}%`,
                  width: `${stampSize.width}px`,
                  height: `${stampSize.height}px`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="absolute border-2 border-dashed border-teal-500 bg-white/95 rounded-lg p-1.5 shadow-xl flex items-center justify-center cursor-move"
              >
                <img
                  src={signatureData}
                  alt="Signature Stamp"
                  className="max-w-full max-h-full object-contain pointer-events-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Bottom Horizontal Thumbnails Strip for Multi-Page Docs */}
        {pages.length > 1 && (
          <div className="w-full max-w-2xl mt-4 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto">
            {pages.map((p) => {
              const isSigned = Boolean(pagePlacements[p.pageNumber]);
              return (
                <button
                  key={p.pageNumber}
                  type="button"
                  onClick={() => setCurrentPage(p.pageNumber)}
                  className={`flex-shrink-0 w-16 aspect-[3/4] rounded-lg border-2 overflow-hidden relative cursor-pointer transition-all ${
                    currentPage === p.pageNumber
                      ? 'border-teal-600 ring-2 ring-teal-600/30 shadow-sm'
                      : isSigned
                      ? 'border-teal-400 bg-teal-50/30'
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

                  {/* Signed status indicator badge */}
                  {isSigned && (
                    <span className="absolute top-1 right-1 bg-teal-600 text-white rounded-full p-0.5 shadow-xs" title="Signed page">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}

                  <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/70 text-[9px] font-bold text-white">
                    {p.pageNumber}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Sidebar: Signature Creator & Multi-Page Manager */}
      <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 p-6 flex flex-col justify-between shadow-xs">
        <div className="space-y-5">
          <div>
            <h3 className="text-xl font-black text-slate-900">Sign Document</h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Current view: <strong>Page {currentPage}</strong> of {totalPages}.
            </p>
          </div>

          {/* Signed Pages Summary & Quick Selection */}
          <div className="bg-teal-50/70 border border-teal-200/80 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-teal-950 flex items-center gap-1">
                <span>Signed Pages ({signedCount} of {totalPages})</span>
              </span>
              {totalPages > 1 && (
                <button
                  type="button"
                  onClick={handleApplyToAllPages}
                  className="text-[11px] font-bold text-teal-700 hover:text-teal-900 underline cursor-pointer"
                >
                  Sign All
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {signedPageNumbers.length === 0 ? (
                <span className="text-[11px] text-slate-500 italic">
                  No pages signed yet. Click on any page to place signature.
                </span>
              ) : (
                signedPageNumbers.map((pNum) => (
                  <span
                    key={pNum}
                    onClick={() => setCurrentPage(pNum)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      currentPage === pNum
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-white border border-teal-300 text-teal-800 hover:bg-teal-100'
                    }`}
                  >
                    Page {pNum}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSpecificPage(pNum);
                      }}
                      className="hover:text-red-500 ml-0.5 text-xs font-extrabold cursor-pointer"
                      title={`Remove signature from page ${pNum}`}
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
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
            disabled={!signatureData || signedCount === 0}
            className="w-full h-14 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-bold text-base shadow-lg shadow-teal-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-5 h-5" />
            <span>
              {signedCount === 0
                ? 'Place Signature on Page'
                : signedCount === 1
                ? `Apply Signature (1 Page)`
                : `Apply Signature (${signedCount} Pages)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
