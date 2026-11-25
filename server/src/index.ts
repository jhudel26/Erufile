import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import {
  UPLOADS_ROOT,
  OUTPUTS_ROOT,
  createTaskSession,
  getTaskPaths,
  cleanupTask,
  startPeriodicCleanup,
} from './utils/storage.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer storage per task session
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    let taskId = req.body.taskId as string;
    if (!taskId) {
      taskId = uuidv4();
      req.body.taskId = taskId;
    }
    const uploadDir = path.join(UPLOADS_ROOT, taskId);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Preserve clean original name with timestamp prefix to prevent collisions
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${cleanName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB per file
  },
});

import toolsRouter from './routes/tools.js';

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'EruFile Document Processing Engine',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

app.use('/api/tools', toolsRouter);

// Create a task session before uploading
app.post('/api/session', (_req, res) => {
  const session = createTaskSession();
  res.json({
    success: true,
    taskId: session.taskId,
  });
});

// Generic multi-file upload endpoint
app.post('/api/upload', upload.array('files', 50), (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    const taskId = req.body.taskId;

    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No files uploaded' });
      return;
    }

    const uploadedFiles = files.map((file) => ({
      id: uuidv4(),
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: file.path,
    }));

    res.json({
      success: true,
      taskId,
      files: uploadedFiles,
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message || 'File upload failed' });
  }
});

// Download processed file endpoint
app.get('/api/download/:taskId/:filename', (req, res) => {
  const { taskId, filename } = req.params;
  const { outputDir } = getTaskPaths(taskId);
  const filePath = path.join(outputDir, filename);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Requested file not found or expired' });
    return;
  }

  res.download(filePath, filename);
});

// Instant file purge / cleanup endpoint
app.delete('/api/cleanup/:taskId', (req, res) => {
  const { taskId } = req.params;
  const success = cleanupTask(taskId);
  res.json({ success, message: 'Task files cleaned up successfully' });
});

// Start periodic cleanup background worker
startPeriodicCleanup();

// Start server
app.listen(PORT, () => {
  console.log(`[EruFile Server] Running on http://localhost:${PORT}`);
});
