import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure local worker bundled by Vite
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export async function generatePdfPreview(
  file: File
): Promise<{ previewUrl: string; pageCount: number }> {
  try {
    if (file.type.startsWith('image/')) {
      const previewUrl = URL.createObjectURL(file);
      return { previewUrl, pageCount: 1 };
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return { previewUrl: '', pageCount: 1 };
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;

    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 0.5 }); // thumbnail resolution

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      return { previewUrl: '', pageCount };
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await (page.render as any)({
      canvasContext: context,
      viewport: viewport,
      canvas: canvas,
    }).promise;

    const previewUrl = canvas.toDataURL('image/jpeg', 0.85);
    return { previewUrl, pageCount };
  } catch (err) {
    console.warn('Could not generate PDF thumbnail preview:', err);
    return { previewUrl: '', pageCount: 1 };
  }
}

export async function generateAllPagePreviews(
  file: File,
  scale = 1.3
): Promise<{ pageNumber: number; previewUrl: string }[]> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;
    const results: { pageNumber: number; previewUrl: string }[] = [];

    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await (page.render as any)({
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        }).promise;

        results.push({
          pageNumber: i,
          previewUrl: canvas.toDataURL('image/jpeg', 0.88),
        });
      }
    }

    return results;
  } catch (err) {
    console.error('Error generating all page previews:', err);
    return [];
  }
}
