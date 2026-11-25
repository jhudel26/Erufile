# EruFile (DOCSUITE) 📄✨

> Free, powerful, and elegant online PDF & document productivity platform with 27 professional tools.
> Built to run **100% in the browser** with zero backend server dependencies and complete client-side data privacy.
> Developed by **[Jhudel](https://jhudel.vercel.app/)**.

---

## 🌟 Overview

**EruFile** is an all-in-one PDF and document manipulation suite built with modern web standards, high performance, and an intuitive Teal-themed UI.

- **100% In-Browser Execution**: Files never leave your device. All PDF merges, rotations, splits, watermarks, signs, and conversions happen directly in browser memory.
- **27 Tools in 1**: Merge, Split, Compress, Rotate, Sign, Organize, Convert (Word, Excel, JPG, Markdown, PDF/A), Protect, Unlock, OCR, and more.
- **Client-Side Previews**: High-speed multi-page PDF rendering via local PDF.js.
- **Instant Processing**: Zero upload or download wait times.
- **Zero Server Costs**: Fully deployable on Vercel as a static web application.

---

## 🏗️ Architecture

```
DOCSUITE / EruFile
└── client/                  # React 19 + TypeScript + Vite + Tailwind CSS v4
    ├── vercel.json          # Single Page App routing configuration
    └── src/
        ├── services/
        │   ├── pdfEngine.ts    # pdf-lib: merge, split, rotate, watermark, sign, crop, protect, unlock
        │   ├── imageEngine.ts  # canvas + pdfjs-dist: PDF to JPG, JPG to PDF, Compress PDF
        │   ├── officeEngine.ts # xlsx, docx, mammoth: Word, Excel, Markdown conversions
        │   ├── zipEngine.ts    # jszip: multi-page file zipping & direct download trigger
        │   └── toolRunner.ts   # Unified in-browser tool dispatcher
        └── components/         # DropArea, WorkArea, ToolPage, DownloadArea, options & views
```

---

## 🚀 Local Development

### Prerequisites
- Node.js 18+
- npm or pnpm

### Quick Start

1. **Install dependencies:**
   ```bash
   cd client
   npm install
   ```

2. **Run in development:**
   ```bash
   npm run dev
   ```

3. **Open browser:**
   Navigate to `http://localhost:3000`

---

## 🌐 1-Click Deployment to Vercel

Because all 27 tools run directly in the browser, **you do not need a backend server**:

1. Go to **[vercel.com](https://vercel.com)** and click **"Add New" ➔ "Project"**.
2. Select your repository: **`jhudel26/Erufile`**.
3. In the project setup:
   - **Root Directory**: Click *Edit* and select **`client`**.
   - **Framework Preset**: **Vite** (auto-detected).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Click **Deploy**! Your site is live and fully functional immediately.

---

## 👤 Author

Developed with care by **[Jhudel](https://jhudel.vercel.app/)**.
