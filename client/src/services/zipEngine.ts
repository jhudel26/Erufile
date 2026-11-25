import JSZip from 'jszip';

export interface FileToZip {
  name: string;
  data: Uint8Array | Blob | string;
}

/**
 * Creates a ZIP file containing multiple files and returns a Blob.
 */
export async function createZipBlob(files: FileToZip[]): Promise<Blob> {
  const zip = new JSZip();
  for (const file of files) {
    zip.file(file.name, file.data);
  }
  return await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

/**
 * Converts a Uint8Array into a downloadable Blob URL.
 */
export function createDownloadUrlFromBytes(bytes: Uint8Array, mimeType: string): string {
  const blob = new Blob([bytes as unknown as BlobPart], { type: mimeType });
  return URL.createObjectURL(blob);
}

/**
 * Converts a Blob into a downloadable URL.
 */
export function createDownloadUrlFromBlob(blob: Blob): string {
  return URL.createObjectURL(blob);
}
