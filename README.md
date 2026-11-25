# EruFile 📄✨

[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/Privacy-100%25_Client--Side-0d9488?style=flat)](#privacy--security-model)

> A modern, free, and privacy-first online PDF & document productivity platform featuring 27 professional tools.
> Designed and developed with care by **[Jhudel](https://jhudel.vercel.app/)**.

---

## 🌟 Overview

**EruFile** is an all-in-one document workspace designed to deliver lightning-fast PDF and office document processing without compromising user privacy. Unlike traditional PDF web apps that require uploading sensitive files to cloud servers, **EruFile executes 100% of its operations inside the user's browser using WebAssembly and modern client-side JavaScript**.

### Key Highlights
- 🔒 **Zero Server Uploads**: Documents never leave your computer or browser tab.
- ⚡ **Instant Execution**: No network latency or upload/download queues—processing happens directly in local RAM.
- 🎨 **Modern Teal Design**: Minimalist, distraction-free UI built with Tailwind CSS v4 and fluid micro-interactions.
- 📱 **Multi-Page Previews**: Interactive grid view, per-page rotation, thumbnail strips, and full document visualizers powered by PDF.js.

---

## 🔬 The Technology Behind EruFile

EruFile combines specialized client-side libraries and web standard APIs to perform complex file transformations entirely in the browser:

```
┌─────────────────────────────────────────────────────────────────┐
│                      EruFile Client Architecture                │
└─────────────────────────────────────────────────────────────────┘
                               │
       ┌───────────────────────┼────────────────────────┐
       ▼                       ▼                        ▼
┌───────────────┐      ┌───────────────┐      ┌──────────────────┐
│  PDF Engine   │      │ Image Engine  │      │  Office Engine   │
│  (pdf-lib)    │      │(Canvas+PDF.js)│      │(xlsx, docx, etc.)│
└──────┬────────┘      └───────┬───────┘      └────────┬─────────┘
       │                       │                       │
       └───────────────────────┼───────────────────────┘
                               ▼
                    ┌─────────────────────┐
                    │     zipEngine       │
                    │      (JSZip)        │
                    └──────────┬──────────┘
                               ▼
                    ┌─────────────────────┐
                    │ Browser Blob & URL  │
                    │   (Instant Save)    │
                    └─────────────────────┘
```

### 1. Vector PDF Manipulation — `pdf-lib`
- **What it does:** Reads, parses, modifies, and compiles binary PDF files.
- **Tools powered:** Merge, Split, Remove Pages, Organize, Rotate, Add Page Numbers, Add Watermark, Sign PDF, Crop, Protect, Unlock, Repair, and PDF/A metadata compliance.
- **Why it matters:** Operates with pure JavaScript and typed arrays (`Uint8Array`), allowing low-level PDF dictionary modifications and page tree alterations directly in memory.

### 2. High-Fidelity Rendering — `pdfjs-dist` (Mozilla PDF.js)
- **What it does:** Web-standard PDF rasterizer engine that converts vector PDF commands into visual canvas frames.
- **Tools powered:** PDF to JPG, page thumbnail previews, multi-page inspection modals, and signature placement previews.
- **Local Web Worker:** Utilizes a dedicated Web Worker (`pdf.worker.min.mjs`) to render documents asynchronously on a separate thread, keeping the UI at 60 FPS.

### 3. Image Processing & Rasterization — HTML5 Canvas 2D API
- **What it does:** Performs resolution scaling, DPI adjustments (72, 150, 300 DPI), image compression, and format encoding (JPEG/PNG).
- **Tools powered:** Compress PDF, JPG to PDF, and PDF to JPG.
- **Hardware Acceleration:** Leverages the client GPU for fast image rendering without sending image data over a network.

### 4. Client-Side Packaging — `JSZip`
- **What it does:** Generates in-memory `.zip` archives with DEFLATE compression.
- **Tools powered:** Multi-page PDF to JPG, Split PDF into separate range files, and batch extractions.
- **Instant Delivery:** Assembles archive files directly into browser `Blob` objects and triggers automatic local downloads with `URL.createObjectURL()`.

### 5. Document & Spreadsheet Synthesis — `xlsx`, `docx`, and `mammoth`
- **`xlsx` (SheetJS):** Parses and generates Microsoft Excel `.xlsx` spreadsheets from structured PDF table data.
- **`docx`:** Synthesizes native OpenXML Word documents directly from extracted layout blocks.
- **`mammoth`:** Extracts clean structural content and raw typography from DOCX files for conversion into printable PDFs.

---

## 🛠️ The 27 Productivity Tools

| Category | Tool | Description | Engine |
|---|---|---|---|
| **Organize** | **Merge PDF** | Combine multiple documents in custom order | `pdf-lib` |
| | **Split PDF** | Split by custom ranges, fixed intervals, or extracted pages | `pdf-lib` + `jszip` |
| | **Remove Pages** | Delete unwanted pages interactively | `pdf-lib` |
| | **Organize PDF** | Reorder pages, insert blanks, and adjust page rotations | `pdf-lib` |
| **Edit** | **Rotate PDF** | Rotate individual pages or all pages clockwise/counter-clockwise | `pdf-lib` |
| | **Add Page Numbers** | Stamp page numbers with flexible positioning and numbering styles | `pdf-lib` |
| | **Add Watermark** | Stamp customizable text with rotation and opacity controls | `pdf-lib` |
| | **Crop PDF** | Trim document margins and adjust bounding boxes | `pdf-lib` |
| | **Edit PDF** | Overlay freehand drawings, notes, and shapes | `pdf-lib` |
| **Security** | **Sign PDF** | Apply drawn, typed, or uploaded PNG signatures to any page | `pdf-lib` |
| | **Protect PDF** | Apply password encryption metadata and access restrictions | `pdf-lib` |
| | **Unlock PDF** | Strip security permissions and view restrictions | `pdf-lib` |
| | **Redact PDF** | Black out and sanitize confidential content | `pdf-lib` |
| | **Repair PDF** | Rebuild corrupt PDF page trees and structural tables | `pdf-lib` |
| | **Compare PDF** | Analyze side-by-side textual and structural differences | `pdfjs-dist` |
| **Optimize** | **Compress PDF** | Downscale embedded raster images to reduce file weight | Canvas + `pdf-lib` |
| | **OCR PDF** | Extract selectable text layers from scanned pages | `pdfjs-dist` |
| | **PDF to PDF/A** | Standardize files for ISO 19005-1 archival preservation | `pdf-lib` |
| **Convert** | **JPG to PDF** | Convert JPG, PNG, and WebP images into standardized PDFs | `pdf-lib` |
| | **PDF to JPG** | Export high-resolution JPG pages individually or as a `.zip` | Canvas + `jszip` |
| | **PDF to Markdown** | Extract headings, lists, and body copy for LLMs and note apps | `pdfjs-dist` |
| | **Word to PDF** | Convert `.docx` files to readable PDF documents | `mammoth` + `pdf-lib` |
| | **PDF to Word** | Convert PDF pages into editable `.docx` files | `docx` + `pdfjs-dist` |
| | **Excel to PDF** | Format spreadsheets into clean printable PDF tables | `xlsx` + `pdf-lib` |
| | **PDF to Excel** | Extract data tables into `.xlsx` spreadsheets | `xlsx` + `pdf-lib` |
| | **PowerPoint to PDF** | Convert slide presentations to PDF documents | `mammoth` + `pdf-lib` |
| | **HTML to PDF** | Parse HTML templates into formatted multi-page PDFs | `pdf-lib` |

---

## 💻 Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0 or higher)
- npm or pnpm

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jhudel26/Erufile.git
   cd Erufile
   ```

2. **Install frontend dependencies:**
   ```bash
   cd client
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```

4. **Open in your browser:**
   ```
   http://localhost:3000
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

---

## 🚀 Deploying Your Own Instance

Since EruFile runs entirely on the client side, it can be hosted on any static hosting platform (**Vercel**, **Netlify**, **GitHub Pages**, **Cloudflare Pages**, or **AWS S3**).

### Deploying to Vercel

Anyone can deploy their own instance of EruFile to Vercel in just a few clicks:

1. Fork or clone this repository to your GitHub account.
2. Log into [Vercel](https://vercel.com/) and click **"Add New Project"**.
3. Import your repository and configure the following settings:
   - **Root Directory:** `client`
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Click **Deploy**. Your custom instance will be live within seconds with zero ongoing maintenance or server costs.

---

## 🔒 Privacy & Security Model

- **No Remote Processing**: Documents never traverse an API or remote server.
- **No Analytics / Telemetry**: No tracking scripts, analytics, or behavioral cookies.
- **Ephemeral In-Memory Storage**: When a tab is closed or refreshed, all file buffers in memory are automatically garbage collected.

---

## 👨‍💻 Author

Designed & developed by **[Jhudel](https://jhudel.vercel.app/)**.
Contributions, suggestions, and feedback are always welcome!
