import React, { useRef, useState } from 'react';
import type { ToolDefinition, UploadedFileItem } from '../types';
import { generatePdfPreview, generateAllPagePreviews } from '../utils/pdfPreview';
import {
  Plus,
  RotateCw,
  Trash2,
  ArrowUpDown,
  FileText,
  ArrowRight,
  Eye,
  X,
  Loader2,
} from 'lucide-react';

interface WorkAreaProps {
  tool: ToolDefinition;
  files: UploadedFileItem[];
  onFilesChange: (files: UploadedFileItem[]) => void;
  onExecute: (options: Record<string, any>) => void;
  renderSidebarOptions?: (
    options: Record<string, any>,
    setOptions: React.Dispatch<React.SetStateAction<Record<string, any>>>
  ) => React.ReactNode;
}

export const WorkArea: React.FC<WorkAreaProps> = ({
  tool,
  files,
  onFilesChange,
  onExecute,
  renderSidebarOptions,
}) => {
  const [options, setOptions] = useState<Record<string, any>>({
    compression_level: 'recommended',
    split_mode: 'ranges',
    range_from: 1,
    range_to: 1,
    password: '',
    text: 'CONFIDENTIAL',
    position: 'bottom-right',
    opacity: 0.35,
    rotation: 45,
    format: 'page_n_of_p',
  });

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gallery modal for viewing all pages of a file
  const [inspectFile, setInspectFile] = useState<UploadedFileItem | null>(null);
  const [inspectPages, setInspectPages] = useState<{ pageNumber: number; previewUrl: string }[]>([]);
  const [loadingInspect, setLoadingInspect] = useState(false);

  const handleOpenInspect = async (item: UploadedFileItem) => {
    setInspectFile(item);
    setLoadingInspect(true);
    setInspectPages([]);
    const pages = await generateAllPagePreviews(item.file);
    setInspectPages(pages);
    setLoadingInspect(false);
  };

  const handleCloseInspect = () => {
    setInspectFile(null);
    setInspectPages([]);
  };

  const handleAddMoreFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const newItems: UploadedFileItem[] = [];

    for (const file of Array.from(e.target.files)) {
      const { previewUrl, pageCount } = await generatePdfPreview(file);
      newItems.push({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
        previewUrl,
        pageCount,
        rotation: 0,
      });
    }

    onFilesChange([...files, ...newItems]);
  };

  const handleRemoveFile = (id: string) => {
    onFilesChange(files.filter((f) => f.id !== id));
  };

  const handleRotateFile = (id: string) => {
    onFilesChange(
      files.map((f) => {
        if (f.id === id) {
          const newRot = ((f.rotation || 0) + 90) % 360;
          return { ...f, rotation: newRot };
        }
        return f;
      })
    );
  };

  const handleRotateAll = () => {
    onFilesChange(
      files.map((f) => ({
        ...f,
        rotation: ((f.rotation || 0) + 90) % 360,
      }))
    );
  };

  const handleSortAlphabetically = () => {
    const sorted = [...files].sort((a, b) => a.name.localeCompare(b.name));
    onFilesChange(sorted);
  };

  // Drag and drop reordering
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const reordered = [...files];
    const [movedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(index, 0, movedItem);

    setDraggedIndex(index);
    onFilesChange(reordered);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)]">
      {/* Hidden file input for adding more files */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAddMoreFiles}
        accept={tool.accept}
        multiple={tool.multiple}
        className="hidden"
      />

      {/* Main Interactive Canvas */}
      <div className="flex-1 p-6 lg:p-8 bg-slate-50/70 overflow-y-auto">
        {/* Top Floating Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-3.5 px-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800">
              {files.length} {files.length === 1 ? 'file' : 'files'} selected
            </span>
            <span className="text-xs text-slate-500">
              (Total: {formatFileSize(files.reduce((acc, f) => acc + f.size, 0))})
            </span>
          </div>

          <div className="flex items-center gap-2">
            {tool.multiple && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add files
                </button>

                <button
                  onClick={handleSortAlphabetically}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Order files alphabetically"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  Sort A-Z
                </button>
              </>
            )}

            <button
              onClick={handleRotateAll}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Rotate all files 90°"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Rotate all
            </button>
          </div>
        </div>

        {/* File Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
          {files.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`group relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-150 flex flex-col overflow-hidden cursor-grab active:cursor-grabbing ${
                draggedIndex === index ? 'opacity-40 scale-95 border-teal-400' : ''
              }`}
            >
              {/* Order Number Badge */}
              <div className="absolute top-2.5 left-2.5 z-10 w-6 h-6 rounded-full bg-slate-900/80 backdrop-blur-xs text-white text-xs font-bold flex items-center justify-center">
                {index + 1}
              </div>

              {/* Action Buttons Overlay on Hover */}
              <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {item.pageCount && item.pageCount > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenInspect(item);
                    }}
                    className="p-1.5 rounded-lg bg-white/95 text-slate-700 hover:text-teal-600 hover:bg-white shadow-md transition-all cursor-pointer"
                    title={`View all ${item.pageCount} pages`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRotateFile(item.id);
                  }}
                  className="p-1.5 rounded-lg bg-white/95 text-slate-700 hover:text-teal-600 hover:bg-white shadow-md transition-all cursor-pointer"
                  title="Rotate page 90°"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(item.id);
                  }}
                  className="p-1.5 rounded-lg bg-white/95 text-slate-700 hover:text-red-600 hover:bg-white shadow-md transition-all cursor-pointer"
                  title="Remove file"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Document Thumbnail Preview Canvas */}
              <div
                onClick={() => {
                  if (item.pageCount && item.pageCount > 1) {
                    handleOpenInspect(item);
                  }
                }}
                className="aspect-[3/4] bg-slate-100 flex items-center justify-center p-3 relative overflow-hidden cursor-pointer"
                title={item.pageCount && item.pageCount > 1 ? `Click to inspect all ${item.pageCount} pages` : ''}
              >
                {item.previewUrl ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      style={{ transform: `rotate(${item.rotation || 0}deg)` }}
                      className="max-h-full max-w-full object-contain rounded-sm shadow-xs transition-transform duration-200"
                    />

                    {/* Live Watermark Overlay Preview */}
                    {tool.id === 'add-watermark' && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
                        <div
                          style={{
                            transform: `rotate(${options.rotation !== undefined ? options.rotation : 45}deg)`,
                            opacity: options.opacity !== undefined ? options.opacity : 0.35,
                            fontSize: '13px',
                            color: '#b91c1c',
                            fontWeight: 'bold',
                            letterSpacing: '0.05em',
                          }}
                          className="border border-red-500/40 bg-red-50/20 px-2.5 py-0.5 rounded-sm select-none text-center shadow-xs"
                        >
                          {options.text || 'CONFIDENTIAL'}
                        </div>
                      </div>
                    )}

                    {/* Live Page Number Overlay Preview */}
                    {tool.id === 'add-page-numbers' && (
                      <div className="absolute inset-0 pointer-events-none p-2 flex flex-col justify-between">
                        <div
                          className={`flex ${(options.position || 'bottom-right').includes('center') ? 'justify-center' : (options.position || 'bottom-right').includes('right') ? 'justify-end' : 'justify-start'}`}
                        >
                          {(options.position || 'bottom-right').includes('top') && (
                            <span className="bg-slate-900/85 text-white text-[9px] font-mono px-1.5 py-0.5 rounded-xs shadow-xs font-bold">
                              {options.format === 'page_n'
                                ? 'Page 1'
                                : options.format === 'n_of_p'
                                ? `1/${item.pageCount || 1}`
                                : options.format === 'page_n_of_p'
                                ? `Page 1 of ${item.pageCount || 1}`
                                : '1'}
                            </span>
                          )}
                        </div>
                        <div
                          className={`flex ${(options.position || 'bottom-right').includes('center') ? 'justify-center' : (options.position || 'bottom-right').includes('right') ? 'justify-end' : 'justify-start'}`}
                        >
                          {(options.position || 'bottom-right').includes('bottom') && (
                            <span className="bg-slate-900/85 text-white text-[9px] font-mono px-1.5 py-0.5 rounded-xs shadow-xs font-bold">
                              {options.format === 'page_n'
                                ? 'Page 1'
                                : options.format === 'n_of_p'
                                ? `1/${item.pageCount || 1}`
                                : options.format === 'page_n_of_p'
                                ? `Page 1 of ${item.pageCount || 1}`
                                : '1'}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Live Crop Bounding Box Preview */}
                    {tool.id === 'crop-pdf' && (
                      <div
                        style={{
                          top: `${Math.min(30, (options.top || 0) / 3)}%`,
                          bottom: `${Math.min(30, (options.bottom || 0) / 3)}%`,
                          left: `${Math.min(30, (options.left || 0) / 3)}%`,
                          right: `${Math.min(30, (options.right || 0) / 3)}%`,
                        }}
                        className="absolute border-2 border-dashed border-teal-500 bg-teal-500/10 pointer-events-none rounded-xs flex items-center justify-center text-[10px] text-teal-800 font-bold"
                      >
                        Crop Area
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <FileText className="w-12 h-12 stroke-[1.5]" />
                    <span className="text-[11px] font-medium mt-1">PDF Document</span>
                  </div>
                )}
              </div>

              {/* Card Footer Info */}
              <div className="p-3 bg-white border-t border-slate-100">
                <p className="text-xs font-bold text-slate-800 truncate" title={item.name}>
                  {item.name}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span>{formatFileSize(item.size)}</span>
                  {item.pageCount && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenInspect(item);
                      }}
                      className="text-teal-700 hover:text-teal-800 font-semibold cursor-pointer underline underline-offset-1"
                    >
                      {item.pageCount} {item.pageCount === 1 ? 'page' : 'pages'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Add more files card */}
          {tool.multiple && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="aspect-[3/4] rounded-2xl border-2 border-dashed border-slate-300 hover:border-teal-400 hover:bg-teal-50/40 text-slate-500 hover:text-teal-700 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-teal-100 flex items-center justify-center transition-colors">
                <Plus className="w-5 h-5 text-slate-500 group-hover:text-teal-700" />
              </div>
              <span className="text-xs font-bold">Add more files</span>
            </button>
          )}
        </div>
      </div>

      {/* Right Options Sidebar */}
      <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 p-6 flex flex-col justify-between shadow-xs">
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-black text-slate-900">{tool.name}</h3>
            <p className="text-xs text-slate-500 mt-1">Configure your tool settings below.</p>
          </div>

          {/* Tool specific options */}
          {renderSidebarOptions ? (
            renderSidebarOptions(options, setOptions)
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                Files will be processed in the exact order shown on the canvas. You can drag cards to rearrange them.
              </div>
            </div>
          )}
        </div>

        {/* Primary Execution Action Button */}
        <div className="pt-6 border-t border-slate-100 mt-6">
          <button
            onClick={() => onExecute(options)}
            className="w-full h-14 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-bold text-base shadow-lg shadow-teal-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>{tool.name}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Modal: View All Pages Gallery */}
      {inspectFile && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 px-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 truncate max-w-md">
                  {inspectFile.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {inspectPages.length > 0 ? `Showing all ${inspectPages.length} pages` : 'Inspecting pages...'}
                </p>
              </div>
              <button
                onClick={handleCloseInspect}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Pages Grid */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
              {loadingInspect ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                  <span className="text-xs font-medium">Extracting and rendering all document pages...</span>
                </div>
              ) : inspectPages.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-sm">
                  No preview pages available for this file.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {inspectPages.map((p) => (
                    <div
                      key={p.pageNumber}
                      className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col"
                    >
                      <div className="aspect-[3/4] bg-slate-100 p-2.5 flex items-center justify-center">
                        <img
                          src={p.previewUrl}
                          alt={`Page ${p.pageNumber}`}
                          className="max-h-full max-w-full object-contain rounded-xs shadow-xs"
                        />
                      </div>
                      <div className="p-2 text-center text-xs font-bold text-slate-700 border-t border-slate-100 bg-white">
                        Page {p.pageNumber}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 border-t border-slate-100 bg-white flex justify-end">
              <button
                onClick={handleCloseInspect}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
