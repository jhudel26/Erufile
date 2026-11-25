import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import mammoth from 'mammoth';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { createDownloadUrlFromBytes, createDownloadUrlFromBlob } from './zipEngine';
import type { ProcessedResult } from './pdfEngine';

/** Helper to extract all text lines per page from a PDF */
async function extractPdfText(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pageTexts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items
      .map((item: any) => item.str)
      .filter((s: string) => s.trim().length > 0);
    pageTexts.push(strings.join(' '));
  }

  return pageTexts;
}

// 1. PDF TO MARKDOWN
export async function processPdfToMarkdown(
  file: File,
  _options?: any
): Promise<ProcessedResult> {
  const pages = await extractPdfText(file);
  let md = `# ${file.name.replace(/\.[^/.]+$/, '')}\n\n`;

  pages.forEach((pageText, index) => {
    md += `## Page ${index + 1}\n\n`;
    const paragraphs = pageText.split(/(?<=[.!?])\s+/);
    paragraphs.forEach((p) => {
      if (p.trim()) md += `${p.trim()}\n\n`;
    });
    md += `---\n\n`;
  });

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const filename = `${file.name.replace(/\.[^/.]+$/, '')}.md`;
  return {
    downloadUrl: createDownloadUrlFromBlob(blob),
    filename,
    outputSize: blob.size,
  };
}

// 2. PDF TO EXCEL
export async function processPdfToExcel(
  file: File,
  _options?: any
): Promise<ProcessedResult> {
  const pages = await extractPdfText(file);
  const wb = XLSX.utils.book_new();

  pages.forEach((pageText, idx) => {
    // Attempt to split rows by newline or sentence
    const rows = pageText.split(/(?<=[.!?])\s+/).map((line, rIdx) => ({
      Row: rIdx + 1,
      Content: line.trim(),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, `Page ${idx + 1}`);
  });

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const uint8 = new Uint8Array(wbout);
  const filename = `${file.name.replace(/\.[^/.]+$/, '')}.xlsx`;
  return {
    downloadUrl: createDownloadUrlFromBytes(uint8, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
    filename,
    outputSize: uint8.length,
  };
}

// 3. EXCEL TO PDF
export async function processExcelToPdf(
  file: File,
  _options?: any
): Promise<ProcessedResult> {
  const arrayBuffer = await file.arrayBuffer();
  const wb = XLSX.read(arrayBuffer, { type: 'array' });

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

    let page = pdfDoc.addPage([595.28, 841.89]); // A4
    let y = 800;

    // Sheet title
    page.drawText(`Sheet: ${sheetName}`, {
      x: 40,
      y,
      size: 16,
      font: boldFont,
      color: rgb(0.05, 0.58, 0.53),
    });
    y -= 30;

    // Render rows
    for (const row of data.slice(0, 35)) {
      const rowText = row.map((c) => String(c ?? '')).join('  |  ');
      if (rowText.trim()) {
        page.drawText(rowText.slice(0, 85), {
          x: 40,
          y,
          size: 10,
          font,
          color: rgb(0.2, 0.2, 0.2),
        });
        y -= 20;
      }
    }
  }

  const pdfBytes = await pdfDoc.save();
  const filename = `${file.name.replace(/\.[^/.]+$/, '')}.pdf`;
  return {
    downloadUrl: createDownloadUrlFromBytes(pdfBytes, 'application/pdf'),
    filename,
    outputSize: pdfBytes.length,
  };
}

// 4. PDF TO WORD (.docx)
export async function processPdfToWord(
  file: File,
  _options?: any
): Promise<ProcessedResult> {
  const pages = await extractPdfText(file);

  const docChildren: Paragraph[] = [];
  pages.forEach((pageText, idx) => {
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Page ${idx + 1}`,
            bold: true,
            size: 28,
            color: '0d9488',
          }),
        ],
      })
    );

    const paragraphs = pageText.split(/(?<=[.!?])\s+/);
    paragraphs.forEach((p) => {
      if (p.trim()) {
        docChildren.push(
          new Paragraph({
            children: [new TextRun({ text: p.trim(), size: 22 })],
          })
        );
      }
    });
  });

  const doc = new Document({
    sections: [{ properties: {}, children: docChildren }],
  });

  const docxBlob = await Packer.toBlob(doc);
  const filename = `${file.name.replace(/\.[^/.]+$/, '')}.docx`;
  return {
    downloadUrl: createDownloadUrlFromBlob(docxBlob),
    filename,
    outputSize: docxBlob.size,
  };
}

// 5. WORD TO PDF
export async function processWordToPdf(
  file: File,
  _options?: any
): Promise<ProcessedResult> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const rawText = result.value;

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const lines = rawText.split('\n').filter((l) => l.trim().length > 0);
  let page = pdfDoc.addPage([595.28, 841.89]);
  let y = 800;

  // Header
  page.drawText(file.name.replace(/\.[^/.]+$/, ''), {
    x: 40,
    y,
    size: 16,
    font: boldFont,
    color: rgb(0.05, 0.58, 0.53),
  });
  y -= 35;

  for (const line of lines) {
    if (y < 50) {
      page = pdfDoc.addPage([595.28, 841.89]);
      y = 800;
    }
    page.drawText(line.slice(0, 85), {
      x: 40,
      y,
      size: 11,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 18;
  }

  const pdfBytes = await pdfDoc.save();
  const filename = `${file.name.replace(/\.[^/.]+$/, '')}.pdf`;
  return {
    downloadUrl: createDownloadUrlFromBytes(pdfBytes, 'application/pdf'),
    filename,
    outputSize: pdfBytes.length,
  };
}

// 6. OCR PDF (Browser text recognition / extraction)
export async function processOcrPdf(
  file: File,
  _options?: any
): Promise<ProcessedResult> {
  // Extract text layer from PDF
  const pages = await extractPdfText(file);
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  pages.forEach((pageText, idx) => {
    const page = pdfDoc.addPage([595.28, 841.89]);
    page.drawText(`[OCR Extracted Text - Page ${idx + 1}]`, {
      x: 40,
      y: 800,
      size: 12,
      font,
      color: rgb(0.05, 0.58, 0.53),
    });

    const lines = pageText.split(/(?<=[.!?])\s+/);
    let y = 770;
    for (const line of lines.slice(0, 40)) {
      if (y < 40) break;
      page.drawText(line.slice(0, 85), {
        x: 40,
        y,
        size: 10,
        font,
        color: rgb(0.15, 0.15, 0.15),
      });
      y -= 16;
    }
  });

  const pdfBytes = await pdfDoc.save();
  const filename = `erufile_ocr_${file.name}`;
  return {
    downloadUrl: createDownloadUrlFromBytes(pdfBytes, 'application/pdf'),
    filename,
    outputSize: pdfBytes.length,
  };
}

// 7. HTML TO PDF
export async function processHtmlToPdf(
  file: File,
  _options?: any
): Promise<ProcessedResult> {
  const text = await file.text();
  // Strip simple HTML tags for clean document printing
  const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  let page = pdfDoc.addPage([595.28, 841.89]);
  let y = 800;

  const words = cleanText.split(' ');
  let line = '';
  for (const word of words) {
    if (line.length + word.length > 75) {
      if (y < 50) {
        page = pdfDoc.addPage([595.28, 841.89]);
        y = 800;
      }
      page.drawText(line, { x: 40, y, size: 11, font });
      y -= 18;
      line = word;
    } else {
      line += (line ? ' ' : '') + word;
    }
  }
  if (line && y >= 50) {
    page.drawText(line, { x: 40, y, size: 11, font });
  }

  const pdfBytes = await pdfDoc.save();
  return {
    downloadUrl: createDownloadUrlFromBytes(pdfBytes, 'application/pdf'),
    filename: `erufile_converted_${file.name.replace(/\.[^/.]+$/, '')}.pdf`,
    outputSize: pdfBytes.length,
  };
}

// 8. COMPARE PDF
export async function processComparePdf(
  files: { file: File }[],
  _options?: any
): Promise<ProcessedResult> {
  if (files.length < 2) {
    throw new Error('At least 2 PDF files are required for comparison');
  }

  const text1 = (await extractPdfText(files[0].file)).join('\n');
  const text2 = (await extractPdfText(files[1].file)).join('\n');

  const pdfDoc = await PDFDocument.create();
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const page = pdfDoc.addPage([595.28, 841.89]);
  page.drawText('Document Comparison Summary', {
    x: 40,
    y: 800,
    size: 16,
    font: boldFont,
    color: rgb(0.05, 0.58, 0.53),
  });

  page.drawText(`File 1: ${files[0].file.name} (${files[0].file.size} bytes)`, {
    x: 40,
    y: 770,
    size: 11,
    font,
  });
  page.drawText(`File 2: ${files[1].file.name} (${files[1].file.size} bytes)`, {
    x: 40,
    y: 750,
    size: 11,
    font,
  });

  const diffCount = Math.abs(text1.length - text2.length);
  page.drawText(`Character Length Difference: ~${diffCount} characters`, {
    x: 40,
    y: 720,
    size: 11,
    font: boldFont,
  });

  page.drawText(
    text1 === text2
      ? '✅ The documents have identical text contents.'
      : '⚠️ Variations and textual differences were detected between files.',
    {
      x: 40,
      y: 690,
      size: 11,
      font,
      color: text1 === text2 ? rgb(0.1, 0.6, 0.2) : rgb(0.8, 0.2, 0.1),
    }
  );

  const pdfBytes = await pdfDoc.save();
  return {
    downloadUrl: createDownloadUrlFromBytes(pdfBytes, 'application/pdf'),
    filename: `erufile_comparison_${Date.now()}.pdf`,
    outputSize: pdfBytes.length,
  };
}
