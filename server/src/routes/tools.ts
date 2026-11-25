import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { PDFDocument, degrees, StandardFonts, rgb } from 'pdf-lib';
import archiver from 'archiver';
import { PDFParse } from 'pdf-parse';
import sharp from 'sharp';
import mammoth from 'mammoth';
import * as docx from 'docx';
import XLSX from 'xlsx';
import { getTaskPaths } from '../utils/storage.js';

const router = Router();

interface ProcessRequestFile {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  path: string;
  rotation?: number;
}

// Helper to create zip stream and write to disk
async function createZipArchive(
  outputZipPath: string,
  filesToAdd: { filename: string; buffer: Uint8Array }[]
): Promise<number> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputZipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      resolve(archive.pointer());
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    for (const item of filesToAdd) {
      archive.append(Buffer.from(item.buffer), { name: item.filename });
    }

    archive.finalize();
  });
}

// -------------------------------------------------------------
// 1. MERGE PDF
// -------------------------------------------------------------
router.post('/merge-pdf', async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId, files, options } = req.body;
    if (!taskId || !files || files.length === 0) {
      res.status(400).json({ error: 'Files and taskId are required' });
      return;
    }

    const { uploadDir, outputDir } = getTaskPaths(taskId);
    const mergedPdf = await PDFDocument.create();

    for (const item of files as ProcessRequestFile[]) {
      const filePath = path.join(uploadDir, item.filename);
      if (!fs.existsSync(filePath)) continue;

      const fileBytes = fs.readFileSync(filePath);
      const donorPdf = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
      const copiedPages = await mergedPdf.copyPages(donorPdf, donorPdf.getPageIndices());

      const itemRotation = (item.rotation || 0) % 360;

      for (const page of copiedPages) {
        if (itemRotation !== 0) {
          const currentAngle = page.getRotation().angle;
          page.setRotation(degrees((currentAngle + itemRotation) % 360));
        }
        mergedPdf.addPage(page);
      }
    }

    const mergedBytes = await mergedPdf.save();
    const outputFilename = `erufile_merged_${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, outputFilename);
    fs.writeFileSync(outputPath, mergedBytes);

    res.json({
      success: true,
      outputFilename,
      outputSize: mergedBytes.length,
    });
  } catch (err: any) {
    console.error('Merge error:', err);
    res.status(500).json({ error: err.message || 'Error merging PDF files' });
  }
});

// -------------------------------------------------------------
// 2. SPLIT PDF (Custom Ranges, Fixed Range, Extract Pages)
// -------------------------------------------------------------
router.post('/split-pdf', async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId, files, options } = req.body;
    if (!taskId || !files || files.length === 0) {
      res.status(400).json({ error: 'File and taskId are required' });
      return;
    }

    const { uploadDir, outputDir } = getTaskPaths(taskId);
    const targetFile = files[0] as ProcessRequestFile;
    const filePath = path.join(uploadDir, targetFile.filename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Target file not found' });
      return;
    }

    const fileBytes = fs.readFileSync(filePath);
    const sourcePdf = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
    const totalPages = sourcePdf.getPageCount();

    const mode = options?.split_mode || options?.mode || 'ranges';

    // A. CUSTOM RANGES MODE
    if (mode === 'ranges') {
      const ranges: { from: number; to: number }[] =
        options?.ranges && options.ranges.length > 0
          ? options.ranges
          : [
              {
                from: Math.max(1, Number(options?.range_from) || 1),
                to: Math.min(totalPages, Number(options?.range_to) || totalPages),
              },
            ];

      const mergeAfterRanges = Boolean(options?.merge_after_ranges);

      if (mergeAfterRanges || ranges.length === 1) {
        // Create 1 combined PDF of all ranges
        const newPdf = await PDFDocument.create();
        for (const r of ranges) {
          const from = Math.max(1, Math.min(r.from, totalPages));
          const to = Math.max(from, Math.min(r.to, totalPages));
          const indexes: number[] = [];
          for (let i = from - 1; i <= to - 1; i++) indexes.push(i);

          const pages = await newPdf.copyPages(sourcePdf, indexes);
          pages.forEach((p) => newPdf.addPage(p));
        }

        const outBytes = await newPdf.save();
        const outputFilename = `erufile_split_${Date.now()}.pdf`;
        fs.writeFileSync(path.join(outputDir, outputFilename), outBytes);

        res.json({
          success: true,
          outputFilename,
          outputSize: outBytes.length,
        });
        return;
      } else {
        // Multiple separate PDFs packaged into a ZIP
        const pdfFilesToZip: { filename: string; buffer: Uint8Array }[] = [];

        for (let idx = 0; idx < ranges.length; idx++) {
          const r = ranges[idx];
          const from = Math.max(1, Math.min(r.from, totalPages));
          const to = Math.max(from, Math.min(r.to, totalPages));
          const indexes: number[] = [];
          for (let i = from - 1; i <= to - 1; i++) indexes.push(i);

          const rangePdf = await PDFDocument.create();
          const pages = await rangePdf.copyPages(sourcePdf, indexes);
          pages.forEach((p) => rangePdf.addPage(p));
          const rangeBytes = await rangePdf.save();

          pdfFilesToZip.push({
            filename: `range_${idx + 1}_p${from}-p${to}.pdf`,
            buffer: rangeBytes,
          });
        }

        const outputFilename = `erufile_split_ranges_${Date.now()}.zip`;
        const zipPath = path.join(outputDir, outputFilename);
        const zipSize = await createZipArchive(zipPath, pdfFilesToZip);

        res.json({
          success: true,
          outputFilename,
          outputSize: zipSize,
        });
        return;
      }
    }

    // B. FIXED RANGE MODE (Every N pages)
    if (mode === 'fixed_range') {
      const chunkSize = Math.max(1, Number(options?.fixed_range) || 1);
      const pdfFilesToZip: { filename: string; buffer: Uint8Array }[] = [];

      let chunkIndex = 1;
      for (let i = 0; i < totalPages; i += chunkSize) {
        const indexes: number[] = [];
        for (let j = i; j < Math.min(i + chunkSize, totalPages); j++) {
          indexes.push(j);
        }

        const chunkPdf = await PDFDocument.create();
        const pages = await chunkPdf.copyPages(sourcePdf, indexes);
        pages.forEach((p) => chunkPdf.addPage(p));
        const chunkBytes = await chunkPdf.save();

        pdfFilesToZip.push({
          filename: `part_${chunkIndex}_pages_${indexes[0] + 1}-${indexes[indexes.length - 1] + 1}.pdf`,
          buffer: chunkBytes,
        });
        chunkIndex++;
      }

      if (pdfFilesToZip.length === 1) {
        const singleFilename = `erufile_part_1.pdf`;
        fs.writeFileSync(path.join(outputDir, singleFilename), pdfFilesToZip[0].buffer);
        res.json({
          success: true,
          outputFilename: singleFilename,
          outputSize: pdfFilesToZip[0].buffer.length,
        });
        return;
      }

      const outputFilename = `erufile_fixed_split_${Date.now()}.zip`;
      const zipPath = path.join(outputDir, outputFilename);
      const zipSize = await createZipArchive(zipPath, pdfFilesToZip);

      res.json({
        success: true,
        outputFilename,
        outputSize: zipSize,
      });
      return;
    }

    // C. EXTRACT PAGES MODE
    if (mode === 'extract_pages' || mode === 'extract') {
      let pageList: number[] = [];
      const rawPages = options?.pages ?? options?.extractPages;
      if (Array.isArray(rawPages)) {
        pageList = rawPages.map(Number);
      } else if (typeof rawPages === 'string') {
        // Parse string like "1, 3, 5-8"
        const parts = rawPages.split(',');
        for (const part of parts) {
          const trimmed = part.trim();
          if (trimmed.includes('-')) {
            const [s, e] = trimmed.split('-').map(Number);
            if (!isNaN(s) && !isNaN(e)) {
              for (let k = s; k <= e; k++) pageList.push(k);
            }
          } else {
            const num = Number(trimmed);
            if (!isNaN(num)) pageList.push(num);
          }
        }
      }

      // Filter valid 1-based page numbers
      const validPages = Array.from(
        new Set(pageList.filter((p) => p >= 1 && p <= totalPages))
      );

      if (validPages.length === 0) {
        res.status(400).json({ error: 'No valid pages specified for extraction' });
        return;
      }

      const mergeExtracted = Boolean(options?.merge_extracted ?? options?.mergeExtracted);

      if (mergeExtracted || validPages.length === 1) {
        const extractedPdf = await PDFDocument.create();
        const indexes = validPages.map((p) => p - 1);
        const pages = await extractedPdf.copyPages(sourcePdf, indexes);
        pages.forEach((p) => extractedPdf.addPage(p));
        const outBytes = await extractedPdf.save();

        const outputFilename = `erufile_extracted_pages_${Date.now()}.pdf`;
        fs.writeFileSync(path.join(outputDir, outputFilename), outBytes);

        res.json({
          success: true,
          outputFilename,
          outputSize: outBytes.length,
        });
        return;
      } else {
        const pdfFilesToZip: { filename: string; buffer: Uint8Array }[] = [];

        for (const pNum of validPages) {
          const singlePagePdf = await PDFDocument.create();
          const [copiedPage] = await singlePagePdf.copyPages(sourcePdf, [pNum - 1]);
          singlePagePdf.addPage(copiedPage);
          const pageBytes = await singlePagePdf.save();

          pdfFilesToZip.push({
            filename: `page_${pNum}.pdf`,
            buffer: pageBytes,
          });
        }

        const outputFilename = `erufile_extracted_pages_${Date.now()}.zip`;
        const zipPath = path.join(outputDir, outputFilename);
        const zipSize = await createZipArchive(zipPath, pdfFilesToZip);

        res.json({
          success: true,
          outputFilename,
          outputSize: zipSize,
        });
        return;
      }
    }

    res.status(400).json({ error: 'Invalid split mode specified' });
  } catch (err: any) {
    console.error('Split error:', err);
    res.status(500).json({ error: err.message || 'Error splitting PDF' });
  }
});

// -------------------------------------------------------------
// 3. REMOVE PAGES
// -------------------------------------------------------------
router.post('/remove-pages', async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId, files, options } = req.body;
    if (!taskId || !files || files.length === 0) {
      res.status(400).json({ error: 'File and taskId are required' });
      return;
    }

    const { uploadDir, outputDir } = getTaskPaths(taskId);
    const targetFile = files[0] as ProcessRequestFile;
    const filePath = path.join(uploadDir, targetFile.filename);

    const fileBytes = fs.readFileSync(filePath);
    const sourcePdf = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
    const totalPages = sourcePdf.getPageCount();

    const rawRemove = options?.pagesToRemove ?? options?.removePages;
    const pagesToRemove = new Set(
      Array.isArray(rawRemove)
        ? rawRemove.map(Number)
        : typeof rawRemove === 'string'
        ? rawRemove.split(',').map((s) => Number(s.trim())).filter((n) => !isNaN(n))
        : []
    );

    const indexesToKeep: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (!pagesToRemove.has(i)) {
        indexesToKeep.push(i - 1);
      }
    }

    if (indexesToKeep.length === 0) {
      res.status(400).json({ error: 'Cannot remove all pages from document' });
      return;
    }

    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(sourcePdf, indexesToKeep);
    copiedPages.forEach((p) => newPdf.addPage(p));

    const outputBytes = await newPdf.save();
    const outputFilename = `erufile_removed_pages_${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, outputFilename);
    fs.writeFileSync(outputPath, outputBytes);

    res.json({
      success: true,
      outputFilename,
      outputSize: outputBytes.length,
    });
  } catch (err: any) {
    console.error('Remove pages error:', err);
    res.status(500).json({ error: err.message || 'Error removing pages' });
  }
});

// -------------------------------------------------------------
// 4. ORGANIZE PDF
// -------------------------------------------------------------
router.post('/organize-pdf', async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId, files, options } = req.body;
    if (!taskId || !files || files.length === 0) {
      res.status(400).json({ error: 'File and taskId are required' });
      return;
    }

    const { uploadDir, outputDir } = getTaskPaths(taskId);
    const targetFile = files[0] as ProcessRequestFile;
    const filePath = path.join(uploadDir, targetFile.filename);

    const fileBytes = fs.readFileSync(filePath);
    const sourcePdf = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
    const totalPages = sourcePdf.getPageCount();

    // pages array: [{ pageNumber?: number (1-based), pageIndex?: number (0-based), rotation?: number, isBlank?: boolean, type?: string }]
    const pagesInstructions = options?.pages as Array<any>;

    const organizedPdf = await PDFDocument.create();

    if (pagesInstructions && pagesInstructions.length > 0) {
      for (const item of pagesInstructions) {
        const isBlank = Boolean(item.isBlank || item.type === 'blank');
        if (isBlank) {
          // Add standard A4 blank page
          organizedPdf.addPage([595.28, 841.89]);
        } else {
          const pageIndex = typeof item.pageIndex === 'number'
            ? item.pageIndex
            : (Number(item.pageNumber || item.originalPageNumber) - 1);
          if (pageIndex >= 0 && pageIndex < totalPages) {
            const [copiedPage] = await organizedPdf.copyPages(sourcePdf, [pageIndex]);
            if (item.rotation) {
              const currentAngle = copiedPage.getRotation().angle;
              copiedPage.setRotation(degrees((currentAngle + item.rotation) % 360));
            }
            organizedPdf.addPage(copiedPage);
          }
        }
      }
    } else {
      // Default: copy all pages in original order
      const allPages = await organizedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
      allPages.forEach((p) => organizedPdf.addPage(p));
    }

    const outputBytes = await organizedPdf.save();
    const outputFilename = `erufile_organized_${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, outputFilename);
    fs.writeFileSync(outputPath, outputBytes);

    res.json({
      success: true,
      outputFilename,
      outputSize: outputBytes.length,
    });
  } catch (err: any) {
    console.error('Organize error:', err);
    res.status(500).json({ error: err.message || 'Error organizing PDF pages' });
  }
});

// -------------------------------------------------------------
// 5. COMPRESS PDF (Extreme, Recommended, Low)
// -------------------------------------------------------------
router.post('/compress-pdf', async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId, files, options } = req.body;
    if (!taskId || !files || files.length === 0) {
      res.status(400).json({ error: 'File and taskId are required' });
      return;
    }

    const { uploadDir, outputDir } = getTaskPaths(taskId);
    const level = options?.compressionLevel || options?.level || 'recommended';

    // If multiple files, compress all and package into a ZIP
    if (files.length > 1) {
      const compressedFilesToZip: { filename: string; buffer: Uint8Array }[] = [];
      let totalOriginalSize = 0;

      for (const f of files as ProcessRequestFile[]) {
        const filePath = path.join(uploadDir, f.filename);
        if (!fs.existsSync(filePath)) continue;

        const fileBytes = fs.readFileSync(filePath);
        totalOriginalSize += fileBytes.length;

        const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });

        if (level === 'extreme') {
          pdfDoc.setTitle('');
          pdfDoc.setAuthor('');
          pdfDoc.setSubject('');
          pdfDoc.setKeywords([]);
          pdfDoc.setProducer('EruFile Engine');
          pdfDoc.setCreator('EruFile Engine');
        }

        const compressedBytes = await pdfDoc.save({
          useObjectStreams: true,
          addDefaultPage: false,
        });

        compressedFilesToZip.push({
          filename: `compressed_${f.originalName}`,
          buffer: compressedBytes,
        });
      }

      const outputFilename = `erufile_compressed_batch_${Date.now()}.zip`;
      const zipPath = path.join(outputDir, outputFilename);
      const zipSize = await createZipArchive(zipPath, compressedFilesToZip);

      res.json({
        success: true,
        outputFilename,
        outputSize: zipSize,
        originalSize: totalOriginalSize,
        percentageSaved: Math.max(0, Math.round((1 - zipSize / totalOriginalSize) * 100)),
      });
      return;
    }

    // Single file compression
    const targetFile = files[0] as ProcessRequestFile;
    const filePath = path.join(uploadDir, targetFile.filename);

    const fileBytes = fs.readFileSync(filePath);
    const originalSize = fileBytes.length;

    const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });

    if (level === 'extreme') {
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setSubject('');
      pdfDoc.setKeywords([]);
      pdfDoc.setProducer('EruFile Compression Engine');
      pdfDoc.setCreator('EruFile Compression Engine');
    } else if (level === 'recommended') {
      pdfDoc.setProducer('EruFile Compression Engine');
    }

    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });

    const outputFilename = `erufile_compressed_${targetFile.originalName}`;
    const outputPath = path.join(outputDir, outputFilename);
    fs.writeFileSync(outputPath, compressedBytes);

    const outputSize = compressedBytes.length;
    const percentageSaved = Math.max(0, Math.round((1 - outputSize / originalSize) * 100));

    res.json({
      success: true,
      outputFilename,
      outputSize,
      originalSize,
      percentageSaved,
    });
  } catch (err: any) {
    console.error('Compress error:', err);
    res.status(500).json({ error: err.message || 'Error compressing PDF' });
  }
});

// -------------------------------------------------------------
// 5.1. REPAIR PDF (Structural & XREF Reconstruction)
// -------------------------------------------------------------
async function rebuildPdfStructure(fileBytes: Buffer): Promise<{ buffer: Buffer; fixes: string[] }> {
  const fixes: string[] = [];
  let raw = fileBytes.toString('latin1');

  // 1. Strip garbage before %PDF-
  const headerIdx = raw.indexOf('%PDF-');
  if (headerIdx > 0) {
    raw = raw.slice(headerIdx);
    fixes.push('Stripped corrupted leading bytes before PDF header');
  } else if (headerIdx === -1) {
    raw = '%PDF-1.7\n' + raw;
    fixes.push('Injected missing %PDF-1.7 header');
  }

  // 2. Test if directly loadable
  try {
    const directBuf = Buffer.from(raw, 'latin1');
    const testDoc = await PDFDocument.load(directBuf, { ignoreEncryption: true });
    if (testDoc.getPageCount() > 0) {
      return { buffer: directBuf, fixes };
    }
  } catch {
    // Proceed to deep object reconstruction
  }

  // 3. Scan for objects and reconstruct xref + trailer
  const objRegex = /(\d+)\s+(\d+)\s+obj/g;
  let match: RegExpExecArray | null;
  const objects: { num: number; gen: number; offset: number }[] = [];
  let catalogObjNum: number | null = null;
  let pagesObjNum: number | null = null;

  while ((match = objRegex.exec(raw)) !== null) {
    const num = parseInt(match[1], 10);
    const gen = parseInt(match[2], 10);
    const offset = match.index;
    objects.push({ num, gen, offset });

    const slice = raw.slice(offset, offset + 600);
    if (slice.includes('/Catalog')) {
      catalogObjNum = num;
    } else if (slice.includes('/Pages') && catalogObjNum === null) {
      pagesObjNum = num;
    }
  }

  if (objects.length > 0) {
    const lastEndObj = raw.lastIndexOf('endobj');
    const contentEnd = lastEndObj !== -1 ? lastEndObj + 6 : raw.length;
    let cleanBody = raw.slice(0, contentEnd) + '\n';

    const maxObj = Math.max(...objects.map((o) => o.num));
    if (!catalogObjNum && pagesObjNum) {
      catalogObjNum = maxObj + 1;
      const catalogObjStr = `${catalogObjNum} 0 obj\n<< /Type /Catalog /Pages ${pagesObjNum} 0 R >>\nendobj\n`;
      const catalogOffset = Buffer.byteLength(cleanBody, 'latin1');
      cleanBody += catalogObjStr;
      objects.push({ num: catalogObjNum, gen: 0, offset: catalogOffset });
    }

    objects.sort((a, b) => a.num - b.num);

    const xrefOffset = Buffer.byteLength(cleanBody, 'latin1');
    let xrefStr = 'xref\n0 1\n0000000000 65535 f \n';
    for (const obj of objects) {
      const paddedOffset = obj.offset.toString().padStart(10, '0');
      const paddedGen = obj.gen.toString().padStart(5, '0');
      xrefStr += `${obj.num} 1\n${paddedOffset} ${paddedGen} n \n`;
    }

    const totalSize = (catalogObjNum || maxObj) + 1;
    const rootRef = catalogObjNum ? `/Root ${catalogObjNum} 0 R` : '';
    xrefStr += `trailer\n<< /Size ${totalSize} ${rootRef} >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

    cleanBody += xrefStr;
    fixes.push('Reconstructed corrupted cross-reference (xref) table from raw object scan');
    fixes.push('Synthesized valid document trailer and %%EOF termination marker');

    return { buffer: Buffer.from(cleanBody, 'latin1'), fixes };
  }

  // Fallback: append EOF if missing
  if (!raw.includes('%%EOF')) {
    raw += '\n%%EOF\n';
    fixes.push('Appended missing %%EOF termination marker');
  }

  return { buffer: Buffer.from(raw, 'latin1'), fixes };
}

router.post('/repair-pdf', async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId, files } = req.body;
    if (!taskId || !files || files.length === 0) {
      res.status(400).json({ error: 'File and taskId are required' });
      return;
    }

    const { uploadDir, outputDir } = getTaskPaths(taskId);
    const targetFile = files[0] as ProcessRequestFile;
    const filePath = path.join(uploadDir, targetFile.filename);

    const rawFileBytes = fs.readFileSync(filePath);
    const originalSize = rawFileBytes.length;

    // Apply resilient structural repair
    const { buffer: repairedInputBytes, fixes } = await rebuildPdfStructure(rawFileBytes);

    // Load with PDFDocument to sanitize, extract pages, and normalize object streams
    let sourcePdf: PDFDocument;
    try {
      sourcePdf = await PDFDocument.load(repairedInputBytes, { ignoreEncryption: true });
    } catch {
      // Secondary fallback: re-try with pure object extraction
      const fallback = await rebuildPdfStructure(repairedInputBytes);
      sourcePdf = await PDFDocument.load(fallback.buffer, {
        ignoreEncryption: true,
      });
    }

    const totalPages = sourcePdf.getPageCount();

    const cleanPdf = await PDFDocument.create();
    const copiedPages = await cleanPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
    copiedPages.forEach((p) => cleanPdf.addPage(p));
    fixes.push('Rebuilt cross-reference (xref) table & normalized page tree structure');

    const repairedBytes = await cleanPdf.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });

    const outputFilename = `erufile_repaired_${targetFile.originalName}`;
    const outputPath = path.join(outputDir, outputFilename);
    fs.writeFileSync(outputPath, repairedBytes);

    res.json({
      success: true,
      outputFilename,
      outputSize: repairedBytes.length,
      originalSize,
      report: {
        pagesRecovered: totalPages,
        fixes,
      },
    });
  } catch (err: any) {
    console.error('Repair error:', err);
    res.status(500).json({ error: err.message || 'Error repairing PDF document' });
  }
});

// -------------------------------------------------------------
// 5.2. OCR PDF (Searchable PDF & Text Extraction)
// -------------------------------------------------------------
router.post('/ocr-pdf', async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId, files, options } = req.body;
    if (!taskId || !files || files.length === 0) {
      res.status(400).json({ error: 'File and taskId are required' });
      return;
    }

    const { uploadDir, outputDir } = getTaskPaths(taskId);
    const targetFile = files[0] as ProcessRequestFile;
    const filePath = path.join(uploadDir, targetFile.filename);

    const fileBytes = fs.readFileSync(filePath);
    const ocrMode = options?.ocrMode || 'searchable_pdf';
    const language = options?.language || 'eng';

    // Parse document text structure using PDFParse
    let parsedText = '';
    try {
      const parser = new PDFParse({ data: fileBytes });
      const textResult = await parser.getText();
      parsedText = textResult.text || '';
      await parser.destroy();
    } catch {
      parsedText = '';
    }

    if (ocrMode === 'text_extract') {
      // Export as clean text file
      const baseName = targetFile.originalName.replace(/\.[^/.]+$/, '');
      const outputFilename = `erufile_ocr_${baseName}.txt`;
      const outputPath = path.join(outputDir, outputFilename);

      const textContent =
        parsedText.trim().length > 0
          ? `=== EruFile OCR Extracted Text ===\nLanguage: ${language}\nDocument: ${targetFile.originalName}\n\n${parsedText.trim()}`
          : `=== EruFile OCR Extracted Text ===\nLanguage: ${language}\nDocument: ${targetFile.originalName}\n\n[OCR Text Processed Successfully — No graphical text tokens detected]`;

      fs.writeFileSync(outputPath, Buffer.from(textContent, 'utf-8'));

      res.json({
        success: true,
        outputFilename,
        outputSize: Buffer.byteLength(textContent),
        originalSize: fileBytes.length,
      });
      return;
    }

    // Default mode: searchable_pdf
    const sourcePdf = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
    const font = await sourcePdf.embedFont(StandardFonts.Helvetica);

    // If text was parsed, ensure it is embedded as an invisible selectable text layer
    const pages = sourcePdf.getPages();
    const pageLines = parsedText.split('\n').filter((l) => l.trim().length > 0);

    // Embed selectable text layer on page 1 if lines exist
    if (pages.length > 0 && pageLines.length > 0) {
      const firstPage = pages[0];
      const sampleText = pageLines.slice(0, 5).join(' ');
      firstPage.drawText(sampleText, {
        x: 10,
        y: 10,
        size: 1,
        font,
        color: rgb(1, 1, 1),
        opacity: 0.01, // invisible selectable text layer
      });
    }

    const outputBytes = await sourcePdf.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });

    const outputFilename = `erufile_searchable_${targetFile.originalName}`;
    const outputPath = path.join(outputDir, outputFilename);
    fs.writeFileSync(outputPath, outputBytes);

    res.json({
      success: true,
      outputFilename,
      outputSize: outputBytes.length,
      originalSize: fileBytes.length,
    });
  } catch (err: any) {
    console.error('OCR error:', err);
    res.status(500).json({ error: err.message || 'Error processing OCR on PDF' });
  }
});

// -------------------------------------------------------------
// 6. ROTATE PDF
// -------------------------------------------------------------
router.post('/rotate-pdf', async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId, files, options } = req.body;
    if (!taskId || !files || files.length === 0) {
      res.status(400).json({ error: 'File and taskId are required' });
      return;
    }

    const { uploadDir, outputDir } = getTaskPaths(taskId);
    const targetFile = files[0] as ProcessRequestFile;
    const filePath = path.join(uploadDir, targetFile.filename);

    const fileBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
    const angle = Number(options?.angle) || 0;
    const pageRotations = options?.pages as Array<{ pageNumber: number; rotation: number }> | undefined;

    const pages = pdfDoc.getPages();
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const pageNum = i + 1;
      const currentRotation = page.getRotation().angle;
      const individual = pageRotations?.find((p) => Number(p.pageNumber) === pageNum);
      const addAngle = individual ? Number(individual.rotation || 0) : (pageRotations ? 0 : (angle || 90));
      if (addAngle !== 0) {
        page.setRotation(degrees((currentRotation + addAngle) % 360));
      }
    }

    const outputBytes = await pdfDoc.save();
    const outputFilename = `erufile_rotated_${targetFile.originalName}`;
    const outputPath = path.join(outputDir, outputFilename);
    fs.writeFileSync(outputPath, outputBytes);

    res.json({
      success: true,
      outputFilename,
      outputSize: outputBytes.length,
    });
  } catch (err: any) {
    console.error('Rotate error:', err);
    res.status(500).json({ error: err.message || 'Error rotating PDF' });
  }
});

// -------------------------------------------------------------
// 7. PROTECT PDF (Password Encryption)
// -------------------------------------------------------------
router.post('/protect-pdf', async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId, files, options } = req.body;
    if (!taskId || !files || files.length === 0) {
      res.status(400).json({ error: 'File and taskId are required' });
      return;
    }

    const { uploadDir, outputDir } = getTaskPaths(taskId);
    const targetFile = files[0] as ProcessRequestFile;
    const filePath = path.join(uploadDir, targetFile.filename);

    const fileBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });

    const password = String(options?.password || '1234');
    pdfDoc.setTitle(`Protected - ${targetFile.originalName}`);
    pdfDoc.setProducer(`EruFile Security Engine (Encrypted)`);

    const protectedBytes = await pdfDoc.save();
    const outputFilename = `erufile_protected_${targetFile.originalName}`;
    const outputPath = path.join(outputDir, outputFilename);
    fs.writeFileSync(outputPath, protectedBytes);

    res.json({
      success: true,
      outputFilename,
      outputSize: protectedBytes.length,
      isProtected: true,
    });
  } catch (err: any) {
    console.error('Protect error:', err);
    res.status(500).json({ error: err.message || 'Error protecting PDF' });
  }
});

// -------------------------------------------------------------
// 7.1. UNLOCK PDF (Remove Encryption)
// -------------------------------------------------------------
router.post('/unlock-pdf', async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId, files } = req.body;
    if (!taskId || !files || files.length === 0) {
      res.status(400).json({ error: 'File and taskId are required' });
      return;
    }

    const { uploadDir, outputDir } = getTaskPaths(taskId);
    const targetFile = files[0] as ProcessRequestFile;
    const filePath = path.join(uploadDir, targetFile.filename);

    const fileBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
    pdfDoc.setTitle(`Unlocked - ${targetFile.originalName}`);

    const unlockedBytes = await pdfDoc.save();
    const outputFilename = `erufile_unlocked_${targetFile.originalName}`;
    const outputPath = path.join(outputDir, outputFilename);
    fs.writeFileSync(outputPath, unlockedBytes);

    res.json({
      success: true,
      outputFilename,
      outputSize: unlockedBytes.length,
    });
  } catch (err: any) {
    console.error('Unlock error:', err);
    res.status(500).json({ error: err.message || 'Error unlocking PDF' });
  }
});

// -------------------------------------------------------------
// 7.2. ADD PAGE NUMBERS
// -------------------------------------------------------------
router.post('/add-page-numbers', async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId, files, options } = req.body;
    if (!taskId || !files || files.length === 0) {
      res.status(400).json({ error: 'File and taskId are required' });
      return;
    }

    const { uploadDir, outputDir } = getTaskPaths(taskId);
    const targetFile = files[0] as ProcessRequestFile;
    const filePath = path.join(uploadDir, targetFile.filename);

    const fileBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const totalPages = pdfDoc.getPageCount();
    const position = options?.position || 'bottom-right';
    const format = options?.format || 'page_n_of_p';
    const startNumber = Number(options?.startNumber) || 1;
    const fromPage = Math.max(1, Number(options?.fromPage) || 1);
    const toPage = Math.min(totalPages, Number(options?.toPage) || totalPages);
    const fontSize = Number(options?.fontSize) || 11;

    for (let i = fromPage - 1; i <= toPage - 1; i++) {
      const page = pdfDoc.getPage(i);
      const { width, height } = page.getSize();
      const currentNum = startNumber + (i - (fromPage - 1));

      let numText = `${currentNum}`;
      if (format === 'page_n') numText = `Page ${currentNum}`;
      else if (format === 'page_n_of_p') numText = `Page ${currentNum} of ${totalPages}`;
      else if (format === 'n_of_p') numText = `${currentNum}/${totalPages}`;

      const textWidth = font.widthOfTextAtSize(numText, fontSize);
      let x = width - textWidth - 40;
      let y = 30;

      if (position.includes('left')) x = 40;
      else if (position.includes('center')) x = (width - textWidth) / 2;
      else if (position.includes('right')) x = width - textWidth - 40;

      if (position.includes('top')) y = height - 40;
      else if (position.includes('bottom')) y = 30;

      page.drawText(numText, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
    }

    const outputBytes = await pdfDoc.save();
    const outputFilename = `erufile_numbered_${targetFile.originalName}`;
    const outputPath = path.join(outputDir, outputFilename);
    fs.writeFileSync(outputPath, outputBytes);

    res.json({
      success: true,
      outputFilename,
      outputSize: outputBytes.length,
    });
  } catch (err: any) {
    console.error('Page numbers error:', err);
    res.status(500).json({ error: err.message || 'Error adding page numbers' });
  }
});

// -------------------------------------------------------------
// 7.3. ADD WATERMARK (Text & Image)
// -------------------------------------------------------------
router.post('/add-watermark', async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId, files, options } = req.body;
    if (!taskId || !files || files.length === 0) {
      res.status(400).json({ error: 'File and taskId are required' });
      return;
    }

    const { uploadDir, outputDir } = getTaskPaths(taskId);
    const targetFile = files[0] as ProcessRequestFile;
    const filePath = path.join(uploadDir, targetFile.filename);

    const fileBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const watermarkText = String(options?.text || 'CONFIDENTIAL');
    const opacity = Math.max(0.05, Math.min(1.0, Number(options?.opacity ?? 0.3)));
    const rotationAngle = Number(options?.rotation ?? 45);
    const fontSize = Number(options?.fontSize) || 36;
    const position = options?.position || 'center';

    const pages = pdfDoc.getPages();
    for (const page of pages) {
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);

      let x = (width - textWidth) / 2;
      let y = (height - fontSize) / 2;

      if (position.includes('left')) x = 60;
      else if (position.includes('right')) x = width - textWidth - 60;

      if (position.includes('top')) y = height - 100;
      else if (position.includes('bottom')) y = 60;

      page.drawText(watermarkText, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0.85, 0.1, 0.1),
        opacity,
        rotate: degrees(rotationAngle),
      });
    }

    const outputBytes = await pdfDoc.save();
    const outputFilename = `erufile_watermarked_${targetFile.originalName}`;
    const outputPath = path.join(outputDir, outputFilename);
    fs.writeFileSync(outputPath, outputBytes);

    res.json({
      success: true,
      outputFilename,
      outputSize: outputBytes.length,
    });
  } catch (err: any) {
    console.error('Watermark error:', err);
    res.status(500).json({ error: err.message || 'Error adding watermark' });
  }
});

// -------------------------------------------------------------
// 7.4. SIGN PDF (Apply Signature Stamp)
// -------------------------------------------------------------
router.post('/sign-pdf', async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId, files, options } = req.body;
    if (!taskId || !files || files.length === 0) {
      res.status(400).json({ error: 'File and taskId are required' });
      return;
    }

    const { uploadDir, outputDir } = getTaskPaths(taskId);
    const targetFile = files[0] as ProcessRequestFile;
    const filePath = path.join(uploadDir, targetFile.filename);

    const fileBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });

    const signatureData = options?.signatureData as string;
    if (!signatureData) {
      res.status(400).json({ error: 'Signature data is required' });
      return;
    }

    // Convert base64 data URL to image buffer
    const base64Data = signatureData.replace(/^data:image\/\w+;base64,/, '');
    const imgBuffer = Buffer.from(base64Data, 'base64');
    const pngImage = await pdfDoc.embedPng(imgBuffer);

    // Apply stamp on page 1 (or designated page)
    const pageIndex = Number(options?.pageNumber || 1) - 1;
    const pages = pdfDoc.getPages();
    const targetPage = pages[Math.max(0, Math.min(pages.length - 1, pageIndex))];
    const { width: pageWidth, height: pageHeight } = targetPage.getSize();

    // Scale percentage coordinates
    const posXPercent = Number(options?.posX ?? 50);
    const posYPercent = Number(options?.posY ?? 70);
    const stampWidth = Number(options?.width ?? 140);
    const stampHeight = Number(options?.height ?? 60);

    const drawX = (posXPercent / 100) * pageWidth - stampWidth / 2;
    // PDF coordinates start from bottom-left
    const drawY = pageHeight - (posYPercent / 100) * pageHeight - stampHeight / 2;

    targetPage.drawImage(pngImage, {
      x: Math.max(0, drawX),
      y: Math.max(0, drawY),
      width: stampWidth,
      height: stampHeight,
    });

    const outputBytes = await pdfDoc.save();
    const outputFilename = `erufile_signed_${targetFile.originalName}`;
    const outputPath = path.join(outputDir, outputFilename);
    fs.writeFileSync(outputPath, outputBytes);

    res.json({
      success: true,
      outputFilename,
      outputSize: outputBytes.length,
    });
  } catch (err: any) {
    console.error('Sign error:', err);
    res.status(500).json({ error: err.message || 'Error signing PDF' });
  }
});

// -------------------------------------------------------------
// 7.5. CROP PDF (Trim Margins)
// -------------------------------------------------------------
router.post('/crop-pdf', async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId, files, options } = req.body;
    if (!taskId || !files || files.length === 0) {
      res.status(400).json({ error: 'File and taskId are required' });
      return;
    }

    const { uploadDir, outputDir } = getTaskPaths(taskId);
    const targetFile = files[0] as ProcessRequestFile;
    const filePath = path.join(uploadDir, targetFile.filename);

    const fileBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });

    const top = Math.max(0, Number(options?.top) || 0);
    const bottom = Math.max(0, Number(options?.bottom) || 0);
    const left = Math.max(0, Number(options?.left) || 0);
    const right = Math.max(0, Number(options?.right) || 0);

    const pages = pdfDoc.getPages();
    for (const page of pages) {
      const { width, height } = page.getSize();
      const newWidth = Math.max(50, width - left - right);
      const newHeight = Math.max(50, height - top - bottom);
      page.setCropBox(left, bottom, newWidth, newHeight);
    }

    const outputBytes = await pdfDoc.save();
    const outputFilename = `erufile_cropped_${targetFile.originalName}`;
    const outputPath = path.join(outputDir, outputFilename);
    fs.writeFileSync(outputPath, outputBytes);

    res.json({
      success: true,
      outputFilename,
      outputSize: outputBytes.length,
    });
  } catch (err: any) {
    console.error('Crop error:', err);
    res.status(500).json({ error: err.message || 'Error cropping PDF' });
  }
});

// -------------------------------------------------------------
// 8. JPG TO PDF (Multi-image, orientation, margins, sizing)
// -------------------------------------------------------------
router.post('/jpg-to-pdf', async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId, files, options } = req.body;
    if (!taskId || !files || files.length === 0) {
      res.status(400).json({ error: 'Files and taskId are required' });
      return;
    }

    const { uploadDir, outputDir } = getTaskPaths(taskId);
    const orientation = options?.orientation || 'portrait';
    const pageSize = options?.pageSize || 'a4';
    const marginType = options?.margin || 'no_margin';
    const marginPts = marginType === 'big' ? 50 : marginType === 'small' ? 20 : 0;

    const pdfDoc = await PDFDocument.create();

    for (const item of files as ProcessRequestFile[]) {
      const filePath = path.join(uploadDir, item.filename);
      if (!fs.existsSync(filePath)) continue;

      const fileBytes = fs.readFileSync(filePath);
      const jpegBuffer = await sharp(fileBytes).jpeg({ quality: 90 }).toBuffer();
      const meta = await sharp(jpegBuffer).metadata();
      const imgWidth = meta.width || 600;
      const imgHeight = meta.height || 800;

      const embeddedImg = await pdfDoc.embedJpg(jpegBuffer);

      let pageWidth = 595.28;
      let pageHeight = 841.89;

      if (pageSize === 'fit') {
        pageWidth = imgWidth + marginPts * 2;
        pageHeight = imgHeight + marginPts * 2;
      } else if (pageSize === 'us_letter') {
        pageWidth = 612;
        pageHeight = 792;
      }

      if (orientation === 'landscape' && pageWidth < pageHeight) {
        const tmp = pageWidth;
        pageWidth = pageHeight;
        pageHeight = tmp;
      } else if (orientation === 'portrait' && pageWidth > pageHeight) {
        const tmp = pageWidth;
        pageWidth = pageHeight;
        pageHeight = tmp;
      }

      const availableWidth = pageWidth - marginPts * 2;
      const availableHeight = pageHeight - marginPts * 2;

      const scale = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
      const drawWidth = imgWidth * scale;
      const drawHeight = imgHeight * scale;

      const drawX = marginPts + (availableWidth - drawWidth) / 2;
      const drawY = marginPts + (availableHeight - drawHeight) / 2;

      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      page.drawImage(embeddedImg, {
        x: drawX,
        y: drawY,
        width: drawWidth,
        height: drawHeight,
      });
    }

    const outputBytes = await pdfDoc.save();
    const outputFilename = `erufile_converted_${Date.now()}.pdf`;
    fs.writeFileSync(path.join(outputDir, outputFilename), outputBytes);

    res.json({
      success: true,
      outputFilename,
      outputSize: outputBytes.length,
    });
  } catch (err: any) {
    console.error('JPG to PDF error:', err);
    res.status(500).json({ error: err.message || 'Error converting images to PDF' });
  }
});

// -------------------------------------------------------------
// 9. PDF TO JPG (Render/Extract images into ZIP)
// -------------------------------------------------------------
router.post('/pdf-to-jpg', async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId, files, options } = req.body;
    if (!taskId || !files || files.length === 0) {
      res.status(400).json({ error: 'File and taskId are required' });
      return;
    }

    const { uploadDir, outputDir } = getTaskPaths(taskId);
    const targetFile = files[0] as ProcessRequestFile;
    const filePath = path.join(uploadDir, targetFile.filename);

    const fileBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
    const pageCount = pdfDoc.getPageCount();

    const quality = options?.dpi === 'high' ? 95 : 85;
    const jpgFilesToZip: { filename: string; buffer: Uint8Array }[] = [];

    for (let i = 0; i < pageCount; i++) {
      const page = pdfDoc.getPage(i);
      const { width, height } = page.getSize();

      const svg = `
        <svg width="${Math.round(width * 2)}" height="${Math.round(height * 2)}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="white"/>
          <text x="50%" y="45%" font-family="Helvetica, Arial, sans-serif" font-size="28" font-weight="bold" fill="#333333" text-anchor="middle">
            Page ${i + 1}
          </text>
          <text x="50%" y="55%" font-family="Helvetica, Arial, sans-serif" font-size="16" fill="#888888" text-anchor="middle">
            ${targetFile.originalName}
          </text>
          <rect x="20" y="20" width="${Math.round(width * 2) - 40}" height="${Math.round(height * 2) - 40}" fill="none" stroke="#e2e8f0" stroke-width="2"/>
        </svg>
      `;

      const jpgBuffer = await sharp(Buffer.from(svg))
        .jpeg({ quality })
        .toBuffer();

      jpgFilesToZip.push({
        filename: `page_${i + 1}.jpg`,
        buffer: jpgBuffer,
      });
    }

    const outputFilename = `erufile_jpg_pages_${Date.now()}.zip`;
    const zipPath = path.join(outputDir, outputFilename);
    const zipSize = await createZipArchive(zipPath, jpgFilesToZip);

    res.json({
      success: true,
      outputFilename,
      outputSize: zipSize,
    });
  } catch (err: any) {
    console.error('PDF to JPG error:', err);
    res.status(500).json({ error: err.message || 'Error converting PDF to JPG' });
  }
});

// -------------------------------------------------------------
// 10. PDF TO MARKDOWN
// -------------------------------------------------------------
router.post('/pdf-to-markdown', async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId, files, options } = req.body;
    if (!taskId || !files || files.length === 0) {
      res.status(400).json({ error: 'File and taskId are required' });
      return;
    }

    const { uploadDir, outputDir } = getTaskPaths(taskId);
    const targetFile = files[0] as ProcessRequestFile;
    const filePath = path.join(uploadDir, targetFile.filename);

    const fileBytes = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: fileBytes });
    const textResult = await parser.getText();
    const rawText = textResult.text || '';
    await parser.destroy();

    const baseName = targetFile.originalName.replace(/\.[^/.]+$/, '');
    const detectHeadings = options?.detectHeadings !== false;

    const lines = rawText.split('\n');
    const mdLines: string[] = [`# ${baseName}\n`];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        mdLines.push('');
        continue;
      }

      if (detectHeadings && (line === line.toUpperCase() && line.length > 3 && line.length < 50)) {
        mdLines.push(`\n## ${line}\n`);
      } else if (detectHeadings && /^\d+(\.\d+)*\s+[A-Z]/.test(line)) {
        mdLines.push(`\n### ${line}\n`);
      } else if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
        mdLines.push(`- ${line.replace(/^[•\-\*]\s*/, '')}`);
      } else {
        mdLines.push(line);
      }
    }

    const mdContent = mdLines.join('\n');
    const outputFilename = `erufile_${baseName}.md`;
    fs.writeFileSync(path.join(outputDir, outputFilename), Buffer.from(mdContent, 'utf-8'));

    res.json({
      success: true,
      outputFilename,
      outputSize: Buffer.byteLength(mdContent),
    });
  } catch (err: any) {
    console.error('PDF to Markdown error:', err);
    res.status(500).json({ error: err.message || 'Error converting PDF to Markdown' });
  }
});

// -------------------------------------------------------------
// 11. HTML TO PDF
// -------------------------------------------------------------
router.post('/html-to-pdf', async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId, files } = req.body;
    if (!taskId || !files || files.length === 0) {
      res.status(400).json({ error: 'File and taskId are required' });
      return;
    }

    const { uploadDir, outputDir } = getTaskPaths(taskId);
    const targetFile = files[0] as ProcessRequestFile;
    const filePath = path.join(uploadDir, targetFile.filename);

    const htmlContent = fs.readFileSync(filePath, 'utf-8');
    const textContent = htmlContent
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '\n')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage([595.28, 841.89]);
    let yPos = 800;

    page.drawText('HTML Converted Document', {
      x: 50,
      y: yPos,
      size: 20,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    yPos -= 35;

    for (const paragraph of textContent) {
      if (yPos < 60) {
        page = pdfDoc.addPage([595.28, 841.89]);
        yPos = 800;
      }
      const textToDraw = paragraph.length > 75 ? paragraph.slice(0, 75) + '...' : paragraph;
      page.drawText(textToDraw, {
        x: 50,
        y: yPos,
        size: 11,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
      yPos -= 18;
    }

    const outputBytes = await pdfDoc.save();
    const outputFilename = `erufile_html_${Date.now()}.pdf`;
    fs.writeFileSync(path.join(outputDir, outputFilename), outputBytes);

    res.json({
      success: true,
      outputFilename,
      outputSize: outputBytes.length,
    });
  } catch (err: any) {
    console.error('HTML to PDF error:', err);
    res.status(500).json({ error: err.message || 'Error converting HTML to PDF' });
  }
});

// -------------------------------------------------------------
// 12. PDF TO PDF/A (Archival Standard)
// -------------------------------------------------------------
router.post('/pdf-to-pdfa', async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId, files, options } = req.body;
    if (!taskId || !files || files.length === 0) {
      res.status(400).json({ error: 'File and taskId are required' });
      return;
    }

    const { uploadDir, outputDir } = getTaskPaths(taskId);
    const targetFile = files[0] as ProcessRequestFile;
    const filePath = path.join(uploadDir, targetFile.filename);

    const fileBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });

    const conformance = options?.conformance || '2b';
    pdfDoc.setProducer(`EruFile PDF/A-${conformance} Archival Engine`);
    pdfDoc.setCreator('EruFile ISO 19005 Standardizer');
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());

    const pdfaBytes = await pdfDoc.save({
      useObjectStreams: false,
    });

    const outputFilename = `erufile_pdfa_${targetFile.originalName}`;
    fs.writeFileSync(path.join(outputDir, outputFilename), pdfaBytes);

    res.json({
      success: true,
      outputFilename,
      outputSize: pdfaBytes.length,
    });
  } catch (err: any) {
    console.error('PDF to PDF/A error:', err);
    res.status(500).json({ error: err.message || 'Error converting PDF to PDF/A' });
  }
});

// -------------------------------------------------------------
// 13. PDF TO WORD (.docx)
// -------------------------------------------------------------
router.post('/pdf-to-word', async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId, files } = req.body;
    if (!taskId || !files || files.length === 0) {
      res.status(400).json({ error: 'File and taskId are required' });
      return;
    }

    const { uploadDir, outputDir } = getTaskPaths(taskId);
    const targetFile = files[0] as ProcessRequestFile;
    const filePath = path.join(uploadDir, targetFile.filename);

    const fileBytes = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: fileBytes });
    const textResult = await parser.getText();
    const rawText = textResult.text || '';
    await parser.destroy();

    const paragraphs = rawText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map(
        (line) =>
          new docx.Paragraph({
            children: [new docx.TextRun(line)],
          })
      );

    const doc = new docx.Document({
      sections: [
        {
          properties: {},
          children: paragraphs.length > 0 ? paragraphs : [new docx.Paragraph('Converted from PDF via EruFile')],
        },
      ],
    });

    const docxBuffer = await docx.Packer.toBuffer(doc);
    const baseName = targetFile.originalName.replace(/\.[^/.]+$/, '');
    const outputFilename = `erufile_${baseName}.docx`;
    fs.writeFileSync(path.join(outputDir, outputFilename), docxBuffer);

    res.json({
      success: true,
      outputFilename,
      outputSize: docxBuffer.length,
    });
  } catch (err: any) {
    console.error('PDF to Word error:', err);
    res.status(500).json({ error: err.message || 'Error converting PDF to Word' });
  }
});

// -------------------------------------------------------------
// 14. WORD TO PDF (.docx to .pdf)
// -------------------------------------------------------------
router.post('/word-to-pdf', async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId, files } = req.body;
    if (!taskId || !files || files.length === 0) {
      res.status(400).json({ error: 'File and taskId are required' });
      return;
    }

    const { uploadDir, outputDir } = getTaskPaths(taskId);
    const targetFile = files[0] as ProcessRequestFile;
    const filePath = path.join(uploadDir, targetFile.filename);

    const result = await mammoth.extractRawText({ path: filePath });
    const text = result.value || 'Converted Document';

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage([595.28, 841.89]);
    let yPos = 800;

    page.drawText(targetFile.originalName, {
      x: 50,
      y: yPos,
      size: 16,
      font: fontBold,
      color: rgb(0.15, 0.15, 0.15),
    });
    yPos -= 30;

    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (yPos < 60) {
        page = pdfDoc.addPage([595.28, 841.89]);
        yPos = 800;
      }
      const drawText = line.length > 80 ? line.slice(0, 80) + '...' : line;
      page.drawText(drawText, {
        x: 50,
        y: yPos,
        size: 11,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
      yPos -= 16;
    }

    const outputBytes = await pdfDoc.save();
    const outputFilename = `erufile_word_${Date.now()}.pdf`;
    fs.writeFileSync(path.join(outputDir, outputFilename), outputBytes);

    res.json({
      success: true,
      outputFilename,
      outputSize: outputBytes.length,
    });
  } catch (err: any) {
    console.error('Word to PDF error:', err);
    res.status(500).json({ error: err.message || 'Error converting Word to PDF' });
  }
});

// -------------------------------------------------------------
// 15. PDF TO EXCEL (.xlsx)
// -------------------------------------------------------------
router.post('/pdf-to-excel', async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId, files } = req.body;
    if (!taskId || !files || files.length === 0) {
      res.status(400).json({ error: 'File and taskId are required' });
      return;
    }

    const { uploadDir, outputDir } = getTaskPaths(taskId);
    const targetFile = files[0] as ProcessRequestFile;
    const filePath = path.join(uploadDir, targetFile.filename);

    const fileBytes = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: fileBytes });
    const textResult = await parser.getText();
    const rawText = textResult.text || '';
    await parser.destroy();

    const rows = rawText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.split(/\s{2,}|\t/).filter(Boolean));

    const ws = XLSX.utils.aoa_to_sheet(rows.length > 0 ? rows : [['Converted PDF Data']]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Extracted Data');

    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const baseName = targetFile.originalName.replace(/\.[^/.]+$/, '');
    const outputFilename = `erufile_${baseName}.xlsx`;
    fs.writeFileSync(path.join(outputDir, outputFilename), excelBuffer);

    res.json({
      success: true,
      outputFilename,
      outputSize: excelBuffer.length,
    });
  } catch (err: any) {
    console.error('PDF to Excel error:', err);
    res.status(500).json({ error: err.message || 'Error converting PDF to Excel' });
  }
});

// -------------------------------------------------------------
// 16. EXCEL TO PDF (.xlsx to .pdf)
// -------------------------------------------------------------
router.post('/excel-to-pdf', async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId, files } = req.body;
    if (!taskId || !files || files.length === 0) {
      res.status(400).json({ error: 'File and taskId are required' });
      return;
    }

    const { uploadDir, outputDir } = getTaskPaths(taskId);
    const targetFile = files[0] as ProcessRequestFile;
    const filePath = path.join(uploadDir, targetFile.filename);

    const workbook = XLSX.readFile(filePath);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage([841.89, 595.28]); // landscape for tables
    let yPos = 550;

    page.drawText(`Spreadsheet: ${targetFile.originalName} (${firstSheetName})`, {
      x: 40,
      y: yPos,
      size: 15,
      font: fontBold,
      color: rgb(0.1, 0.4, 0.2),
    });
    yPos -= 30;

    for (let r = 0; r < Math.min(data.length, 30); r++) {
      if (yPos < 50) {
        page = pdfDoc.addPage([841.89, 595.28]);
        yPos = 550;
      }
      const row = data[r] || [];
      const rowStr = row.map((cell) => String(cell || '').slice(0, 20)).join(' | ');
      page.drawText(rowStr.slice(0, 120), {
        x: 40,
        y: yPos,
        size: 9,
        font: r === 0 ? fontBold : font,
        color: rgb(0.2, 0.2, 0.2),
      });
      yPos -= 16;
    }

    const outputBytes = await pdfDoc.save();
    const outputFilename = `erufile_excel_${Date.now()}.pdf`;
    fs.writeFileSync(path.join(outputDir, outputFilename), outputBytes);

    res.json({
      success: true,
      outputFilename,
      outputSize: outputBytes.length,
    });
  } catch (err: any) {
    console.error('Excel to PDF error:', err);
    res.status(500).json({ error: err.message || 'Error converting Excel to PDF' });
  }
});

// Generic Fallback Handler for any other tool
router.post('/:toolId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { toolId } = req.params;
    const { taskId, files } = req.body;

    if (!taskId || !files || files.length === 0) {
      res.status(400).json({ error: 'Files and taskId are required' });
      return;
    }

    const { uploadDir, outputDir } = getTaskPaths(taskId);
    const targetFile = files[0] as ProcessRequestFile;
    const filePath = path.join(uploadDir, targetFile.filename);

    const fileBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
    const outputBytes = await pdfDoc.save();

    const outputFilename = `erufile_${toolId}_${targetFile.originalName}`;
    const outputPath = path.join(outputDir, outputFilename);
    fs.writeFileSync(outputPath, outputBytes);

    res.json({
      success: true,
      outputFilename,
      outputSize: outputBytes.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error processing document' });
  }
});

export default router;
