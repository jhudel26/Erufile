# EruFile (DOCSUITE) 📄✨

> Free, powerful, and elegant online PDF & document productivity platform with 27 professional tools.
> Developed by **[Jhudel](https://jhudel.vercel.app/)**.

---

## 🌟 Overview

**EruFile** is an all-in-one PDF and document manipulation suite built with modern web standards, high performance, and an intuitive Teal-themed UI.

- **27 Tools in 1**: Merge, Split, Compress, Rotate, Sign, Organize, Convert (Word, Excel, JPG, Markdown, PDF/A), Protect, Unlock, OCR, and more.
- **Client-Side Previews**: High-speed multi-page PDF rendering via local PDF.js.
- **Fast Backend Engine**: Powered by Node.js, `pdf-lib`, `sharp`, and `tesseract.js`.
- **Privacy-First**: Automated temporary task cleanup after processing.

---

## 🏗️ Architecture

```
DOCSUITE / EruFile
├── client/              # React 19 + TypeScript + Vite + Tailwind CSS v4
│   ├── vercel.json      # Single Page App rewrite configuration
│   └── src/
└── server/              # Express.js + TypeScript
    └── src/
        ├── routes/      # 27 processing tool endpoints
        └── utils/       # Ephemeral session file storage and cleanup
```

---

## 🚀 Local Development

### Prerequisites
- Node.js 18+
- npm or pnpm

### Quick Start

1. **Install dependencies:**
   ```bash
   cd client && npm install
   cd ../server && npm install
   ```

2. **Run in development:**
   Open two terminals:

   **Terminal 1 (Backend):**
   ```bash
   cd server
   npm run dev
   # Runs on http://localhost:5000
   ```

   **Terminal 2 (Frontend):**
   ```bash
   cd client
   npm run dev
   # Runs on http://localhost:3000 (proxies /api to :5000)
   ```

3. **Open browser:**
   Navigate to `http://localhost:3000`

---

## 🌐 Deployment Guide

### 1. Frontend on Vercel
1. Import your GitHub repository (`jhudel26/Erufile`) in [Vercel](https://vercel.com).
2. Set **Root Directory** to `client`.
3. Framework Preset: **Vite**.
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Under **Environment Variables**, add:
   - `VITE_API_URL`: Your deployed backend URL (e.g. `https://erufile-backend.onrender.com`)

### 2. Backend on Render or Railway
*Note: Because the backend utilizes heavy libraries (`sharp`, `tesseract.js`), it is best deployed on a containerized service like [Render](https://render.com) or [Railway](https://railway.app).*

#### On Render:
1. Create a new **Web Service** pointing to your repository.
2. Set **Root Directory** to `server`.
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`
5. Copy your Render URL (e.g. `https://erufile-backend.onrender.com`) and paste it into Vercel's `VITE_API_URL` environment variable.

---

## 👤 Author

Developed with care by **[Jhudel](https://jhudel.vercel.app/)**.
