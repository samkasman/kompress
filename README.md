# kompress

A simple desktop app for compressing images, video, and audio files.

![macOS](https://img.shields.io/badge/macOS-000000?logo=apple&logoColor=white)
![Linux](https://img.shields.io/badge/Linux-FCC624?logo=linux&logoColor=black)
![Windows](https://img.shields.io/badge/Windows-0078D6?logo=windows&logoColor=white)
![Version](https://img.shields.io/github/package-json/v/samkasman/kompress)
![License](https://img.shields.io/badge/license-MIT-green)

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri-FFC131?logo=tauri&logoColor=black)
![Rust](https://img.shields.io/badge/Rust-000000?logo=rust&logoColor=white)

<img src="demo.gif" alt="kompress demo GIF" width="400">

## Features

- Drag-and-drop or click-to-browse workflow
- Compress **images** (`png`, `jpg`, `jpeg`, `heic`, `webp`) to JPG
- Compress **video** (`mov`, `mp4`, `mkv`) to MP4 / H.264
- Compress **audio** (`wav`, `mp3`, `aac`, `flac`, `m4a`, `ogg`, `wma`) to MP3
- Adjustable image quality, video CRF, and audio bitrate
- Built-in console drawer for progress and debug logs
- Bundled FFmpeg for packaged builds

## Quick Start

### Download

Download the latest release from [GitHub Releases](https://github.com/samkasman/kompress/releases).

### Use

1. Launch the app
2. Adjust compression settings if needed
3. Drag files into the window or click to browse
4. Find output files next to the originals with a `-compressed` suffix

Settings persist between sessions automatically.

## Build Support

kompress supports **macOS** and **Linux** builds.

- **macOS** is the release path: signed, notarized, published builds
- **Linux** is supported for local development and unsigned local builds
- There is **no CI**; checks and releases run locally

## From Source

### Prerequisites

- [Node.js](https://nodejs.org/) `v18+`
- [Rust](https://www.rust-lang.org/tools/install)
- Platform-native build dependencies:
  - **macOS**: [Xcode Command Line Tools](https://developer.apple.com/xcode/) (`xcode-select --install`)
  - **Linux**: the system packages Tauri/WebKitGTK needs for your distro

### Setup

```bash
git clone https://github.com/samkasman/kompress.git
cd kompress
npm install
```

Place a target-specific FFmpeg binary in `src-tauri/binaries/` before packaged builds:

```bash
# macOS (Apple Silicon)
cp $(which ffmpeg) src-tauri/binaries/ffmpeg-aarch64-apple-darwin

# macOS (Intel)
cp $(which ffmpeg) src-tauri/binaries/ffmpeg-x86_64-apple-darwin

# Linux
cp $(which ffmpeg) src-tauri/binaries/ffmpeg-x86_64-unknown-linux-gnu
```

In development mode, if no bundled binary is found, the app falls back to system ffmpeg at runtime.

## Development

```bash
npm run tauri:dev   # run the desktop app in dev mode
npx tauri build     # local production build
npm run lint        # eslint
npm run test:run    # vitest
npm run verify      # fixture-based ffmpeg verification
```

Build outputs land in `src-tauri/target/release/bundle/`:

- **macOS**: `.app` bundle and `.dmg`
- **Linux**: `.AppImage`, `.deb`, or `.rpm` depending on host tooling

## Documentation

- [Contributing Guide](./CONTRIBUTING.md)
- [Security Policy](./SECURITY.md)
- [Third-Party Notices](./NOTICE.md)

For maintainers: releases are cut on macOS via `npm run release:patch|minor|major`. See [CONTRIBUTING.md](./CONTRIBUTING.md) and the release section below for workflow details.

## Releasing

`src-tauri/tauri.conf.json` is the single source of truth for the app version; the release flow syncs it into `package.json` and `package-lock.json` automatically.

This repo follows [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow): one long-lived `main` branch with short-lived feature branches. Releases tag `main` directly — there's no separate "release" or "develop" branch.

**Cut a release** — one command, no prompts:

```bash
npm run release:patch    # 1.1.2 → 1.1.3
npm run release:minor    # 1.1.2 → 1.2.0
npm run release:major    # 1.1.2 → 2.0.0
```

The script bumps the version in `tauri.conf.json`, syncs package files, promotes `[Unreleased]` in `CHANGELOG.md`, builds `aarch64-apple-darwin`, signs and notarizes the app, tags `v{version}`, pushes `main` and the tag to `origin`, and creates the GitHub release.

**Dry-run**:

```bash
bash bin/cut-release.sh minor --local --yes
```

If the version is already bumped, `npm run release` (publish) or `npm run release:local` (dry-run) skips the bump step and runs the rest.

## License

kompress is released under the MIT License — see [LICENSE](LICENSE) for the full text.

The app bundles FFmpeg (LGPL v2.1+) and other third-party software with their own licenses. See [NOTICE.md](NOTICE.md) for attribution and redistribution details.
