# kompress

A simple multimedia file compressor for macOS.

![Version](https://img.shields.io/github/package-json/v/samkasman/kompress)
![License](https://img.shields.io/badge/license-MIT-green)
![macOS](https://img.shields.io/badge/macOS-000000?logo=apple&logoColor=white)

![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri-FFC131?logo=tauri&logoColor=black)
![Rust](https://img.shields.io/badge/Rust-000000?logo=rust&logoColor=white)

<img src="demo.gif" alt="kompress demo GIF" width="400">

## Features

- 🖱️ **Drag & Drop**: Drag files directly onto the window or click to browse
- ⚙️ **Configurable Settings**: Adjustable quality, CRF, and bitrate via settings drawer with persistent storage
- 📝 **Console Logs**: Built-in console drawer for monitoring compression progress and debug logs
- 📦 **Bundled Packages**: `FFmpeg` is bundled with the app - no external dependencies/requirements
- 🗜️ **Compression**
  - 🖼️ **Image**: Convert PNG/JPG/JPEG/HEIC/WEBP to compressed JPG (configurable quality 1-8)
  - 📹 **Video**: Convert MOV/MP4/MKV to compressed MP4 (H.264, configurable CRF 18-28)
  - 🎵 **Audio**: Convert WAV/MP3/AAC/FLAC/M4A/OGG/WMA to MP3 (configurable bitrate 128-320 kbps)

## Download / Install

Download the latest release from the [Releases](https://github.com/samkasman/kompress/releases) page.

## Usage

1. **Install** and **launch** the application
1. Review **compression settings** via the settings icon in the top-right corner
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
kompress/
├── src/                 # React source (front-end)
│   ├── components/      # React components
│   ├── hooks/           # React hooks
│   └── utils/           # TS utilities
├── src-tauri/           # Tauri/Rust source (back-end)
│   ├── binaries/        # FFmpeg binaries (per platform, gitignored)
│   ├── icons/           # App icons
│   └── src/             # Rust source
├── scripts/             # Build, release, and verification scripts
└── tests/
    └── fixtures/        # Real PD/CC0 media samples for every supported format
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

### Other scripts

| Script           | Purpose                                                                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint`   | ESLint over `src/**/*.{ts,tsx}` (zero-warning gate)                                                                                                                                |
| `npm run format` | Prettier auto-format on `src/**`                                                                                                                                                   |
| `npm run verify` | Run the bundled ffmpeg against every fixture in `tests/fixtures/` and validate each output codec via `ffprobe`. Requires a system `ffprobe` and a populated `src-tauri/binaries/`. |

## Building

> **Distribution is macOS-only.** The signing + notarization pipeline only ships macOS builds. The Rust/Tauri source itself builds on Linux and Windows too, so contributors on those platforms can clone, build, and run locally — they just won't get a signed release artifact out the other end.

For local development builds without code signing, invoke the Tauri CLI directly:

```bash
npx tauri build
```

Outputs land in `src-tauri/target/release/bundle/`:

- **macOS**: `.app` bundle and `.dmg` installer
- **Linux**: `.AppImage` or `.deb` (when built on Linux, unsigned)
- **Windows**: `.exe` installer (when built on Windows, unsigned)

> The `npm run tauri:build` script chains `sign-and-copy-release.js`, which hard-fails without macOS code-signing credentials. Use it only when releasing — see the [Releasing](#releasing) section below.

## Issues

For bugs or feature requests, please [open an issue](https://github.com/samkasman/kompress/issues).

## Contributing

Contributions are welcome. Feel free to:

1. Fork the repository
1. Create a feature branch (`git checkout -b feature/amazing-feature`)
1. Commit your changes (`git commit -m 'Add amazing feature'`)
1. Push to the branch (`git push origin feature/amazing-feature`)
1. Open a Pull Request

## Releasing

`src-tauri/tauri.conf.json` is the single source of truth for the app version; `release.js` syncs it into `package.json` and `package-lock.json` automatically.

1. **Bump version** in `src-tauri/tauri.conf.json`
2. **(Optional) dry run** — builds, signs, notarizes, and produces the DMG without tagging or publishing:
   ```bash
   npm run release:local
   ```
3. **Publish:**
   ```bash
   npm run release
   ```
   This syncs versions, builds `aarch64-apple-darwin`, signs the bundled FFmpeg + app + DMG with the Developer ID, notarizes via `notarytool --wait`, staples the ticket, commits the version bump, tags `v{version}`, pushes to `origin`, and opens a GitHub release with the DMG and auto-generated notes.

### Signing & notarization prerequisites

The release pipeline (`scripts/sign-and-copy-release.js`) expects a macOS host with:

- **A Developer ID Application certificate** in the login keychain. The identity is currently hardcoded as `Developer ID Application: Sam Kasman (WC8RY44BN7)` — a fork would need to update `SIGN_IDENTITY` in `scripts/sign-and-copy-release.js`.
- **A notarytool keychain profile named `kompress-notary`**, set up once with:
  ```bash
  xcrun notarytool store-credentials kompress-notary \
    --apple-id <apple-id-email> \
    --team-id <team-id> \
    --password <app-specific-password>
  ```
  See Apple's [Customizing the notarization workflow](https://developer.apple.com/documentation/security/customizing-the-notarization-workflow) for app-specific password creation.
- Xcode Command Line Tools (`codesign`, `xcrun notarytool`, `xcrun stapler`, `hdiutil`).

## License

MIT License - see [LICENSE](LICENSE) file for details.
