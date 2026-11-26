import React, { useState } from 'react';
import type { ToolDefinition, UploadedFileItem, ProcessingStage, ProcessResult } from '../types';
import { DropArea } from './DropArea';
import { WorkArea } from './WorkArea';
import { ProgressModal } from './ProgressModal';
import { DownloadArea } from './DownloadArea';
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
import { SplitPagesView } from './views/SplitPagesView';
import { executeTool } from '../services/toolRunner';

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
    setStatusText('Processing document in browser...');

    try {
      const output = await executeTool(
        tool.id,
        files.map((f) => ({ file: f.file, rotation: f.rotation })),
        options,
        (progress, status) => {
          setProgress(progress);
          setStatusText(status);
        }
      );

      setProgress(100);
      setStatusText('Complete!');

      setTimeout(() => {
        setResult({
          downloadUrl: output.downloadUrl,
          filename: output.filename,
          originalSize: files.reduce((acc, f) => acc + f.size, 0),
          newSize: output.outputSize,
          taskId: 'browser-task',
        });
        setStage('download');
      }, 400);
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
          ) : tool.id === 'split-pdf' && files[0] ? (
            <SplitPagesView
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
                tool.id === 'compress-pdf'
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
