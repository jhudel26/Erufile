import React, { useState } from 'react';
import type { ToolDefinition, UploadedFileItem, ProcessingStage, ProcessResult } from '../types';
import { DropArea } from './DropArea';
import { WorkArea } from './WorkArea';
import { ProgressModal } from './ProgressModal';
import { DownloadArea } from './DownloadArea';
import { SplitOptions } from './options/SplitOptions';
import { CompressOptions } from './options/CompressOptions';
import { RepairOptions } from './options/RepairOptions';
import { OcrOptions } from './options/OcrOptions';
import { JpgToPdfOptions } from './options/JpgToPdfOptions';
import { PdfToJpgOptions } from './options/PdfToJpgOptions';
import { PdfToMarkdownOptions } from './options/PdfToMarkdownOptions';
import { PdfToPdfaOptions } from './options/PdfToPdfaOptions';
import { RotateOptions } from './options/RotateOptions';
import { PageNumberOptions } from './options/PageNumberOptions';
import { WatermarkOptions } from './options/WatermarkOptions';
import { SecurityOptions } from './options/SecurityOptions';
import { CropOptions } from './options/CropOptions';
import { RemovePagesView } from './views/RemovePagesView';
import { OrganizePagesView } from './views/OrganizePagesView';
import { SignPdfView } from './views/SignPdfView';
import { RotatePagesView } from './views/RotatePagesView';
import { apiUrl } from '../config/api';

interface ToolPageProps {
  tool: ToolDefinition;
  onSelectTool: (toolId: string) => void;
  onGoHome: () => void;
}

export const ToolPage: React.FC<ToolPageProps> = ({
  tool,
  onSelectTool,
}) => {
  const [stage, setStage] = useState<ProcessingStage>('upload');
  const [files, setFiles] = useState<UploadedFileItem[]>([]);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Uploading files...');
  const [result, setResult] = useState<ProcessResult | null>(null);

  const handleFilesSelected = (selectedFiles: UploadedFileItem[]) => {
    setFiles(selectedFiles);
    setStage('workspace');
  };

  const handleRestart = () => {
    setFiles([]);
    setResult(null);
    setStage('upload');
  };

  const executeToolProcess = async (options: Record<string, any>) => {
    if (files.length === 0) return;

    setStage('processing');
    setProgress(15);
    setStatusText('Uploading files to secure workspace...');

    try {
      // Step 1: Upload files to backend
      const formData = new FormData();
      files.forEach((item) => {
        formData.append('files', item.file);
      });
      formData.append('tool', tool.id);
      formData.append('options', JSON.stringify(options));

      const uploadRes = await fetch(apiUrl('/api/upload'), {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error('Upload failed');
      }

      const uploadData = await uploadRes.json();
      setProgress(50);
      setStatusText(`Executing ${tool.name}...`);

      // Prepare files with rotations
      const filesWithRotations = uploadData.files.map((backendFile: any, index: number) => ({
        ...backendFile,
        rotation: files[index]?.rotation || 0,
      }));

      // Step 2: Trigger tool processor endpoint
      const processRes = await fetch(apiUrl(`/api/tools/${tool.id}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: uploadData.taskId,
          files: filesWithRotations,
          options,
        }),
      });

      setProgress(85);
      setStatusText('Finalizing document...');

      if (!processRes.ok) {
        const errorData = await processRes.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to process ${tool.name}`);
      }

      const processData = await processRes.json();
      setProgress(100);

      // Transition to download stage
      setTimeout(() => {
        setResult({
          downloadUrl: apiUrl(`/api/download/${uploadData.taskId}/${processData.outputFilename}`),
          filename: processData.outputFilename,
          originalSize: files.reduce((acc, f) => acc + f.size, 0),
          newSize: processData.outputSize,
          taskId: uploadData.taskId,
        });
        setStage('download');
      }, 500);
    } catch (err: any) {
      console.error('Execution error:', err);
      alert(`Error processing files: ${err.message}`);
      setStage('workspace');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50/50">
      {stage === 'upload' && (
        <DropArea tool={tool} onFilesSelected={handleFilesSelected} />
      )}

      {stage === 'workspace' && (
        <>
          {tool.id === 'remove-pages' && files[0] ? (
            <RemovePagesView
              fileItem={files[0]}
              onExecute={executeToolProcess}
              onCancel={handleRestart}
            />
          ) : tool.id === 'organize-pdf' && files[0] ? (
            <OrganizePagesView
              fileItem={files[0]}
              onExecute={executeToolProcess}
              onCancel={handleRestart}
            />
          ) : tool.id === 'sign-pdf' && files[0] ? (
            <SignPdfView
              fileItem={files[0]}
              onExecute={executeToolProcess}
              onCancel={handleRestart}
            />
          ) : tool.id === 'rotate-pdf' && files[0] ? (
            <RotatePagesView
              fileItem={files[0]}
              onExecute={executeToolProcess}
              onCancel={handleRestart}
            />
          ) : (
            <WorkArea
              tool={tool}
              files={files}
              onFilesChange={setFiles}
              onExecute={executeToolProcess}
              renderSidebarOptions={
                tool.id === 'split-pdf'
                  ? (opts, setOpts) => (
                      <SplitOptions
                        totalPages={files[0]?.pageCount || 1}
                        options={opts}
                        setOptions={setOpts}
                      />
                    )
                  : tool.id === 'compress-pdf'
                  ? (opts, setOpts) => (
                      <CompressOptions options={opts} setOptions={setOpts} />
                    )
                  : tool.id === 'repair-pdf'
                  ? (opts, setOpts) => (
                      <RepairOptions options={opts} setOptions={setOpts} />
                    )
                  : tool.id === 'ocr-pdf'
                  ? (opts, setOpts) => (
                      <OcrOptions options={opts} setOptions={setOpts} />
                    )
                  : tool.id === 'jpg-to-pdf'
                  ? (opts, setOpts) => (
                      <JpgToPdfOptions options={opts} setOptions={setOpts} />
                    )
                  : tool.id === 'pdf-to-jpg'
                  ? (opts, setOpts) => (
                      <PdfToJpgOptions options={opts} setOptions={setOpts} />
                    )
                  : tool.id === 'pdf-to-markdown'
                  ? (opts, setOpts) => (
                      <PdfToMarkdownOptions options={opts} setOptions={setOpts} />
                    )
                  : tool.id === 'pdf-to-pdfa'
                  ? (opts, setOpts) => (
                      <PdfToPdfaOptions options={opts} setOptions={setOpts} />
                    )
                  : tool.id === 'rotate-pdf'
                  ? (opts, setOpts) => (
                      <RotateOptions options={opts} setOptions={setOpts} />
                    )
                  : tool.id === 'add-page-numbers'
                  ? (opts, setOpts) => (
                      <PageNumberOptions
                        totalPages={files[0]?.pageCount || 1}
                        options={opts}
                        setOptions={setOpts}
                      />
                    )
                  : tool.id === 'add-watermark'
                  ? (opts, setOpts) => (
                      <WatermarkOptions options={opts} setOptions={setOpts} />
                    )
                  : tool.id === 'protect-pdf' || tool.id === 'unlock-pdf'
                  ? (opts, setOpts) => (
                      <SecurityOptions toolId={tool.id} options={opts} setOptions={setOpts} />
                    )
                  : tool.id === 'crop-pdf'
                  ? (opts, setOpts) => (
                      <CropOptions options={opts} setOptions={setOpts} />
                    )
                  : undefined
              }
            />
          )}
        </>
      )}

      {stage === 'processing' && (
        <ProgressModal
          toolName={tool.name}
          progress={progress}
          statusText={statusText}
        />
      )}

      {stage === 'download' && result && (
        <DownloadArea
          tool={tool}
          result={result}
          onRestart={handleRestart}
          onSelectTool={onSelectTool}
        />
      )}
    </div>
  );
};
