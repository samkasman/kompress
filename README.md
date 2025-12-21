# sk-compress

A dead simple native desktop multimedia file compressor.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![macOS](https://img.shields.io/badge/macOS-000000?logo=apple&logoColor=white)
![Linux](https://img.shields.io/badge/Linux-FCC624?logo=linux&logoColor=black)
![Windows](https://img.shields.io/badge/Windows-0078D6?logo=windows&logoColor=white)

![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri-FFC131?logo=tauri&logoColor=black)
![Rust](https://img.shields.io/badge/Rust-000000?logo=rust&logoColor=white)

<img src="demo.gif" alt="sk-compress demo GIF" width="400">

## Features

- 🖱️ **Drag & Drop**: Drag files directly onto the window or click to browse
- ⚙️ **Configurable Settings**: Adjustable quality, CRF, and bitrate via settings drawer with persistent storage
- 📝 **Console Logs**: Built-in console drawer for monitoring compression progress and debug logs
- 📦 **Bundled Packages**: `FFmpeg` is bundled with the app - no external dependencies/requirements
- 🗜️ **Compression**
  - 🖼️ **Image**: Convert PNG/JPG to compressed JPG (configurable quality 1-8)
  - 📹 **Video**: Convert MOV/MP4 to compressed MP4 (H.264, configurable CRF 18-28)
  - 🎵 **Audio**: Convert WAV/MP3/AAC/FLAC/M4A/OGG/WMA to MP3 (configurable bitrate 128-320 kbps)

## Usage

1. **Install** and **launch** the application
1. Review **compression settings** via the settings icon (⚙️) in the top-right corner
1. **Select files**: Click anywhere or drag and drop media files onto the window
1. Files are **automatically compressed** in the background
1. **Output** files appear in the same directory as the **source** file(s) with `-compressed` suffix

**Settings persist** between sessions - your quality/CRF/bitrate preferences are saved automatically.

## Tech Stack

- 🟢 **Runtime**: [Node.js](https://nodejs.org/)
- ⚛️ **Frontend**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- 🎨 **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- 📦 **Native Builds**: [Tauri](https://tauri.app/)
- 🦀 **Backend**: [Rust](https://www.rust-lang.org/) calls bundled [FFmpeg](https://ffmpeg.org/) directly
- ✅ **Code Quality**: [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/)

## Development Prerequisites

- [Node.js](https://nodejs.org/) `v18`+ (includes `npm`)
- [Rust](https://www.rust-lang.org/tools/install)
- Platform-specific native build tools:
  - **macOS**: [Xcode Command Line Tools](https://developer.apple.com/xcode/) (`xcode-select --install`)
  - **Linux**: [Tauri prerequisites](https://v1.tauri.app/v1/guides/getting-started/prerequisites/#setting-up-linux)
  - **Windows**: [Microsoft Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) or [Visual Studio w/ C++ workload](https://visualstudio.microsoft.com/downloads/)

## Development Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Download `FFmpeg` binary for your platform and place it in `src-tauri/binaries/`:

**macOS (Apple Silicon):**

```bash
# Download from https://evermeet.cx/ffmpeg/ or use Homebrew
cp $(which ffmpeg) src-tauri/binaries/ffmpeg-aarch64-apple-darwin
```

**macOS (Intel):**

```bash
cp $(which ffmpeg) src-tauri/binaries/ffmpeg-x86_64-apple-darwin
```

**Linux:**

```bash
cp $(which ffmpeg) src-tauri/binaries/ffmpeg-x86_64-unknown-linux-gnu
```

**Windows:**

```bash
# Download from https://www.gyan.dev/ffmpeg/builds/
# Place ffmpeg.exe as src-tauri/binaries/ffmpeg-x86_64-pc-windows-msvc.exe
```

> In development mode, if no bundled binary is found, the app falls back to system ffmpeg.

## Project Structure

```
sk-compress/
├── src/                 # React source (front-end)
│   ├── components/      # React components
│   ├── hooks/           # React hooks
│   └── utils/           # TS utilities
└── src-tauri/           # Tauri/Rust source (back-end)
    ├── binaries/        # FFmpeg binaries (per platform)
    ├── icons/           # App icons
    └── src/             # Rust source
```

## Development

Run the development server:

```bash
npm run tauri:dev
```

This will:

- Start the `Vite` dev server on `http://localhost:5173`
- Launch the `Tauri` native app dev window
- Enable hot reload (UI updates on file changes)

## Building

Build for production:

```bash
npm run tauri:build
```

Outputs will be in `src-tauri/target/release/bundle/`:

- **macOS**: `.app` bundle and `.dmg` installer
- **Linux**: `.AppImage` or `.deb`
- **Windows**: `.exe` installer

## File Conversion / Compression

Currently, we only render to compressed JPG, MP4, and MP3.

- **PNG/JPG → JPG**: Compressed with configurable quality (default: 6, range: 1-8)
- **MOV/MP4 → MP4**: H.264 codec with configurable CRF (default: 22, range: 18-28), medium preset
- **WAV/MP3/AAC/FLAC/M4A/OGG/WMA → MP3**: Compressed with configurable bitrate (default: 320 kbps, range: 128-320 kbps)

All settings are adjustable via the settings drawer (top-right icon). Output files are saved in the same directory as the source with `-compressed` suffix.

## Issues

For bugs or feature requests, please [open an issue](https://github.com/yourusername/sk-compress/issues).

## Contributing

Contributions are welcome. Feel free to:

1. Fork the repository
1. Create a feature branch (`git checkout -b feature/amazing-feature`)
1. Commit your changes (`git commit -m 'Add amazing feature'`)
1. Push to the branch (`git push origin feature/amazing-feature`)
1. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.
