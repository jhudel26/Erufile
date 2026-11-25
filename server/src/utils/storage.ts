import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOADS_ROOT = path.join(process.cwd(), 'temp_uploads');
const OUTPUTS_ROOT = path.join(process.cwd(), 'temp_outputs');

// Ensure root directories exist
if (!fs.existsSync(UPLOADS_ROOT)) fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
if (!fs.existsSync(OUTPUTS_ROOT)) fs.mkdirSync(OUTPUTS_ROOT, { recursive: true });

export interface TaskSession {
  taskId: string;
  uploadDir: string;
  outputDir: string;
}

export function createTaskSession(): TaskSession {
  const taskId = uuidv4();
  const uploadDir = path.join(UPLOADS_ROOT, taskId);
  const outputDir = path.join(OUTPUTS_ROOT, taskId);

  fs.mkdirSync(uploadDir, { recursive: true });
  fs.mkdirSync(outputDir, { recursive: true });

  return { taskId, uploadDir, outputDir };
}

export function getTaskPaths(taskId: string) {
  const uploadDir = path.join(UPLOADS_ROOT, taskId);
  const outputDir = path.join(OUTPUTS_ROOT, taskId);

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  return {
    uploadDir,
    outputDir,
    exists: true,
  };
}

export function cleanupTask(taskId: string): boolean {
  try {
    const { uploadDir, outputDir } = getTaskPaths(taskId);
    if (fs.existsSync(uploadDir)) {
      fs.rmSync(uploadDir, { recursive: true, force: true });
    }
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
    }
    return true;
  } catch (err) {
    console.error(`Error cleaning up task ${taskId}:`, err);
    return false;
  }
}

// Background cleanup for files older than 1 hour (3600000 ms)
export function startPeriodicCleanup(maxAgeMs = 3600000, intervalMs = 900000) {
  setInterval(() => {
    const now = Date.now();
    [UPLOADS_ROOT, OUTPUTS_ROOT].forEach((dir) => {
      try {
        if (!fs.existsSync(dir)) return;
        const entries = fs.readdirSync(dir);
        for (const entry of entries) {
          const entryPath = path.join(dir, entry);
          const stats = fs.statSync(entryPath);
          if (now - stats.mtimeMs > maxAgeMs) {
            fs.rmSync(entryPath, { recursive: true, force: true });
            console.log(`[Storage] Purged expired temp directory: ${entry}`);
          }
        }
      } catch (err) {
        console.error('[Storage] Cleanup error:', err);
      }
    });
  }, intervalMs);
}

export { UPLOADS_ROOT, OUTPUTS_ROOT };
