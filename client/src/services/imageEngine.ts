import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { createZipBlob, createDownloadUrlFromBlob, createDownloadUrlFromBytes } from './zipEngine';
import type { ProcessedResult } from './pdfEngine';

/** Helper to render a PDF page to a canvas and get a Blob */
async function renderPageToBlob(
  page: any,
  scale: number,
  format: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality = 0.88
): Promise<Blob> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create canvas context');

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  // White background for transparent PDF pages
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await (page.render as any)({
    canvasContext: ctx,
    viewport,
  }).promise;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to convert canvas to blob'));
      },
      format,
      quality
    );
  });
}

// 1. PDF TO JPG
export async function processPdfToJpg(
  file: File,
  options?: any
): Promise<ProcessedResult> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  const dpi = Number(options?.dpi) || 150;
  // 72 DPI is scale 1.0, 150 DPI is ~2.08, 300 DPI is ~4.16
  const scale = dpi === 300 ? 4.16 : dpi === 72 ? 1.0 : 2.08;

  if (numPages === 1) {
    const page = await pdf.getPage(1);
    const blob = await renderPageToBlob(page, scale, 'image/jpeg', 0.9);
    const filename = `${file.name.replace(/\.[^/.]+$/, '')}_page_1.jpg`;
    return {
      downloadUrl: createDownloadUrlFromBlob(blob),
      filename,
      outputSize: blob.size,
    };
  }

  // Multi-page PDF: render each page and bundle into a ZIP
  const zipFiles = [];
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const blob = await renderPageToBlob(page, scale, 'image/jpeg', 0.9);
    zipFiles.push({
      name: `page_${i}.jpg`,
      data: blob,
    });
  }

  const zipBlob = await createZipBlob(zipFiles);
  const filename = `${file.name.replace(/\.[^/.]+$/, '')}_images.zip`;
  return {
    downloadUrl: createDownloadUrlFromBlob(zipBlob),
    filename,
    outputSize: zipBlob.size,
  };
}

// 2. JPG TO PDF
export async function processJpgToPdf(
  files: { file: File; rotation?: number }[],
  options?: any
): Promise<ProcessedResult> {
  const pdfDoc = await PDFDocument.create();
  const fitMode = options?.fit || options?.margin || 'fit';

  for (const item of files) {
    const imageBytes = new Uint8Array(await item.file.arrayBuffer());
    let embeddedImage;

    const isPng = item.file.type === 'image/png' || item.file.name.toLowerCase().endsWith('.png');
    if (isPng) {
      embeddedImage = await pdfDoc.embedPng(imageBytes);
    } else {
      embeddedImage = await pdfDoc.embedJpg(imageBytes);
    }

    const { width: imgW, height: imgH } = embeddedImage;

    // Standard A4 dimensions
    let pageWidth = 595.28;
    let pageHeight = 841.89;

    if (fitMode === 'original') {
      pageWidth = imgW;
      pageHeight = imgH;
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    let drawW = imgW;
    let drawH = imgH;
    let drawX = 0;
    let drawY = 0;

    if (fitMode !== 'original') {
      const margin = 20;
      const usableW = pageWidth - margin * 2;
      const usableH = pageHeight - margin * 2;
      const scale = Math.min(usableW / imgW, usableH / imgH);

      drawW = imgW * scale;
      drawH = imgH * scale;
      drawX = (pageWidth - drawW) / 2;
      drawY = (pageHeight - drawH) / 2;
    }

    page.drawImage(embeddedImage, {
      x: drawX,
      y: drawY,
      width: drawW,
      height: drawH,
    });
  }

  const pdfBytes = await pdfDoc.save();
  const filename = `erufile_converted_${Date.now()}.pdf`;
  return {
    downloadUrl: createDownloadUrlFromBytes(pdfBytes, 'application/pdf'),
    filename,
    outputSize: pdfBytes.length,
  };
}

// 3. COMPRESS PDF
export async function processCompressPdf(
  file: File,
  options?: any
): Promise<ProcessedResult> {
  const compressionLevel = options?.level || 'recommended'; // extreme, recommended, low
  const quality = compressionLevel === 'extreme' ? 0.5 : compressionLevel === 'low' ? 0.85 : 0.7;
  const scale = compressionLevel === 'extreme' ? 1.0 : compressionLevel === 'low' ? 1.8 : 1.4;

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  const compressedPdf = await PDFDocument.create();

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.0 });

    // Render page to canvas and re-encode compressed JPEG
    const imageBlob = await renderPageToBlob(page, scale, 'image/jpeg', quality);
    const imageBytes = new Uint8Array(await imageBlob.arrayBuffer());
    const embedded = await compressedPdf.embedJpg(imageBytes);

    const pdfPage = compressedPdf.addPage([viewport.width, viewport.height]);
    pdfPage.drawImage(embedded, {
      x: 0,
      y: 0,
      width: viewport.width,
      height: viewport.height,
    });
  }

  const compressedBytes = await compressedPdf.save();
  const filename = `erufile_compressed_${file.name}`;
  return {
    downloadUrl: createDownloadUrlFromBytes(compressedBytes, 'application/pdf'),
    filename,
    outputSize: compressedBytes.length,
  };
}
