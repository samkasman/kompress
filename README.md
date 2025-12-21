# sk-convert

A native desktop application built with Tauri and React for compressing images and videos. Click to select files and they compress automatically.

## Features

- 🖼️ **Image Compression**: Convert PNG/JPG to compressed JPG (quality 85)
- 📹 **Video Compression**: Convert MOV/MP4 to compressed MP4 (H.264, CRF 22)
- 📦 **Bundled FFmpeg**: No need to install FFmpeg separately

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Node.js + FFmpeg (via `ffmpeg-static`)
- **Desktop**: Tauri v2
- **Code Quality**: ESLint + Prettier

## Prerequisites

- Node.js 18+
- Rust (for Tauri)
- npm

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

## Development

Run the development server:

```bash
npm run tauri:dev
```

This will:

- Start the Vite dev server on `http://localhost:5173`
- Launch the Tauri window
- Enable hot reload

## Building

Build for production:

```bash
npm run tauri:build
```

Outputs will be in `src-tauri/target/release/`:

- **macOS**: `.app` bundle
- **Windows**: `.exe` installer
- **Linux**: `.AppImage` or `.deb`

## Usage

1. Launch the application
2. Click anywhere to select PNG, JPG, MOV, or MP4 files
3. Files will automatically be compressed
4. Output files appear in the same directory as the source

## File Conversion

- **PNG → JPG**: Compressed with quality 85
- **JPG → JPG**: Recompressed with quality 85
- **MOV → MP4**: H.264 codec, CRF 22, medium preset
- **MP4 → MP4**: Recompressed with H.264, CRF 22

Output files are saved in the same directory as the source with `-compressed` suffix.

## Project Structure

```
sk-convert/
├── src/                 # React frontend
│   ├── components/      # React components
│   ├── lib/             # Utilities
│   └── utils/           # File utilities
├── backend/             # Node.js backend
│   ├── processors/      # Image/video processors
│   └── utils/           # FFmpeg utilities
├── src-tauri/           # Tauri configuration
└── docs/                # Documentation
```

## License

MIT
