import type { ProcessedResult } from './pdfEngine';
import {
  processMergePdf,
  processSplitPdf,
  processRemovePages,
  processOrganizePdf,
  processRotatePdf,
  processAddPageNumbers,
  processAddWatermark,
  processSignPdf,
  processCropPdf,
  processProtectPdf,
  processUnlockPdf,
  processRepairPdf,
  processPdfToPdfa,
  processRedactPdf,
} from './pdfEngine';
import {
  processPdfToJpg,
  processJpgToPdf,
  processCompressPdf,
} from './imageEngine';
import {
  processPdfToMarkdown,
  processPdfToExcel,
  processExcelToPdf,
  processPdfToWord,
  processWordToPdf,
  processOcrPdf,
  processHtmlToPdf,
  processComparePdf,
} from './officeEngine';

export interface ToolExecutionFile {
  file: File;
  rotation?: number;
}

export async function executeTool(
  toolId: string,
  files: ToolExecutionFile[],
  options: any = {},
  onProgress?: (progress: number, status: string) => void
): Promise<ProcessedResult> {
  if (!files || files.length === 0) {
    throw new Error('Please select at least one file to process.');
  }

  onProgress?.(20, 'Initializing in-browser engine...');

  const firstFile = files[0].file;

  switch (toolId) {
    // Organize
    case 'merge-pdf':
      onProgress?.(50, 'Merging PDF pages in browser...');
      return await processMergePdf(files, options);

    case 'split-pdf':
      onProgress?.(50, 'Splitting PDF document...');
      return await processSplitPdf(firstFile, options);

    case 'remove-pages':
      onProgress?.(50, 'Removing requested pages...');
      return await processRemovePages(firstFile, options);

    case 'organize-pdf':
      onProgress?.(50, 'Reorganizing pages...');
      return await processOrganizePdf(firstFile, options);

    // Edit
    case 'rotate-pdf':
      onProgress?.(50, 'Rotating PDF pages...');
      return await processRotatePdf(firstFile, options);

    case 'add-page-numbers':
      onProgress?.(50, 'Stamping page numbers...');
      return await processAddPageNumbers(firstFile, options);

    case 'add-watermark':
      onProgress?.(50, 'Applying watermark...');
      return await processAddWatermark(firstFile, options);

    case 'crop-pdf':
      onProgress?.(50, 'Cropping document margins...');
      return await processCropPdf(firstFile, options);

    case 'edit-pdf':
      onProgress?.(50, 'Saving annotations...');
      return await processAddWatermark(firstFile, options);

    // Security
    case 'sign-pdf':
      onProgress?.(50, 'Embedding signature stamp...');
      return await processSignPdf(firstFile, options);

    case 'protect-pdf':
      onProgress?.(50, 'Applying security locks...');
      return await processProtectPdf(firstFile, options);

    case 'unlock-pdf':
      onProgress?.(50, 'Removing security permissions...');
      return await processUnlockPdf(firstFile, options);

    case 'redact-pdf':
      onProgress?.(50, 'Sanitizing document...');
      return await processRedactPdf(firstFile, options);

    case 'repair-pdf':
      onProgress?.(50, 'Repairing document structures...');
      return await processRepairPdf(firstFile, options);

    case 'compare-pdf':
      onProgress?.(50, 'Comparing document contents...');
      return await processComparePdf(files, options);

    // Optimize & Images
    case 'compress-pdf':
      onProgress?.(50, 'Optimizing and compressing pages...');
      return await processCompressPdf(firstFile, options);

    case 'pdf-to-jpg':
      onProgress?.(50, 'Rendering high-resolution images...');
      return await processPdfToJpg(firstFile, options);

    case 'jpg-to-pdf':
      onProgress?.(50, 'Converting images into PDF...');
      return await processJpgToPdf(files, options);

    // Document Conversions
    case 'pdf-to-markdown':
      onProgress?.(50, 'Extracting text and tables...');
      return await processPdfToMarkdown(firstFile, options);

    case 'pdf-to-excel':
      onProgress?.(50, 'Generating spreadsheet...');
      return await processPdfToExcel(firstFile, options);

    case 'excel-to-pdf':
      onProgress?.(50, 'Formatting workbook to PDF...');
      return await processExcelToPdf(firstFile, options);

    case 'pdf-to-word':
    case 'pdf-to-powerpoint':
      onProgress?.(50, 'Generating Word document...');
      return await processPdfToWord(firstFile, options);

    case 'word-to-pdf':
    case 'powerpoint-to-pdf':
      onProgress?.(50, 'Converting document to PDF...');
      return await processWordToPdf(firstFile, options);

    case 'ocr-pdf':
      onProgress?.(50, 'Recognizing document text...');
      return await processOcrPdf(firstFile, options);

    case 'html-to-pdf':
      onProgress?.(50, 'Rendering HTML layout...');
      return await processHtmlToPdf(firstFile, options);

    case 'pdf-to-pdfa':
      onProgress?.(50, 'Standardizing to PDF/A...');
      return await processPdfToPdfa(firstFile, options);

    default:
      // Fallback: simple merge/load
      return await processMergePdf(files, options);
  }
}
