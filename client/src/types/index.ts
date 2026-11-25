export type ToolCategory =
  | 'all'
  | 'organize'
  | 'optimize'
  | 'to_pdf'
  | 'from_pdf'
  | 'edit'
  | 'security';

export interface ToolDefinition {
  id: string;
  name: string;
  category: ToolCategory;
  categoryLabel: string;
  description: string;
  icon: string;
  color: string;
  accept: string;
  multiple: boolean;
  badge?: string;
  popular?: boolean;
}

export interface UploadedFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  previewUrl?: string;
  pageCount?: number;
  rotation?: number; // 0, 90, 180, 270
}

export type ProcessingStage = 'upload' | 'workspace' | 'processing' | 'download';

export interface ProcessResult {
  downloadUrl: string;
  filename: string;
  originalSize: number;
  newSize?: number;
  taskId: string;
  pageCount?: number;
}
