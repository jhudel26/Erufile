import { useRef, useState } from 'react';
import type { ToolDefinition, UploadedFileItem } from '../types';
import { generatePdfPreview } from '../utils/pdfPreview';
import { Upload, FileUp, AlertCircle } from 'lucide-react';

interface DropAreaProps {
  tool: ToolDefinition;
  onFilesSelected: (files: UploadedFileItem[]) => void;
}

export const DropArea: React.FC<DropAreaProps> = ({ tool, onFilesSelected }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingPreviews, setLoadingPreviews] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (rawFiles: FileList | File[]) => {
    setErrorMsg(null);
    const validFiles: File[] = [];

    const fileArray = Array.from(rawFiles);
    if (!tool.multiple && fileArray.length > 1) {
      setErrorMsg(`This tool accepts only 1 file at a time.`);
      validFiles.push(fileArray[0]);
    } else {
      validFiles.push(...fileArray);
    }

    if (validFiles.length === 0) return;

    setLoadingPreviews(true);
    try {
      const items: UploadedFileItem[] = [];

      for (const file of validFiles) {
        const { previewUrl, pageCount } = await generatePdfPreview(file);
        items.push({
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          file,
          name: file.name,
          size: file.size,
          previewUrl,
          pageCount,
          rotation: 0,
        });
      }

      onFilesSelected(items);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error loading file previews');
    } finally {
      setLoadingPreviews(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`min-h-[70vh] flex flex-col items-center justify-center p-6 text-center transition-all duration-200 relative ${
        isDragging
          ? 'bg-teal-50/80 border-4 border-dashed border-teal-500 scale-[0.99] rounded-3xl'
          : 'bg-transparent'
      }`}
    >
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept={tool.accept}
        multiple={tool.multiple}
        className="hidden"
      />

      {/* Main Tool Header */}
      <div className="max-w-2xl mx-auto space-y-3 mb-8">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900">
          {tool.name}
        </h1>
        <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
          {tool.description}
        </p>
      </div>

      {/* Primary Action Button & Drop container */}
      <div className="flex flex-col items-center space-y-4 w-full max-w-md">
        <div className="relative group">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loadingPreviews}
            className="w-full sm:w-80 h-16 px-8 rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-bold text-lg shadow-xl shadow-teal-600/30 flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50"
          >
            {loadingPreviews ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Reading document...</span>
              </>
            ) : (
              <>
                <FileUp className="w-6 h-6 stroke-[2.2]" />
                <span>Select {tool.name.replace(' PDF', '')} files</span>
              </>
            )}
          </button>
        </div>

        <p className="text-sm font-medium text-slate-600">
          or drop {tool.multiple ? 'files' : 'file'} here
        </p>

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Drag overlay state */}
      {isDragging && (
        <div className="absolute inset-0 bg-teal-600/10 backdrop-blur-xs flex flex-col items-center justify-center rounded-3xl pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-xl mb-4 animate-bounce">
            <Upload className="w-10 h-10 stroke-[2.5]" />
          </div>
          <p className="text-2xl font-black text-teal-600">Drop files here to start</p>
        </div>
      )}
    </div>
  );
};
