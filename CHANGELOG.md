# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Test fixtures in `tests/fixtures/` covering every supported input format,
  derived from three canonical public-domain / Creative Commons masters
  (Hubble *Pillars of Creation*, *Big Buck Bunny*, Apollo 11 audio).
- `scripts/verify-conversions.sh` (`npm run verify`) — runs the exact ffmpeg
  args from `compress_file` against every fixture using the bundled binary
  and validates each output codec via `ffprobe`.

### Fixed

- HEIC and other multi-item image containers (AVIF) now convert correctly.
  The ffmpeg 8.x `image2` muxer rejects single-still output to a plain
  filename without `-update 1 -frames:v 1`; previously this surfaced as an
  opaque "FFmpeg failed" error from `compress_file`.

### Changed

- README refreshed for accuracy: documented the `release.js` workflow,
  Developer ID + `notarytool` keychain profile prerequisites, lint/format/
  verify scripts, and the current Project Structure. Removed Linux/Windows
  badges that didn't match the macOS-only distribution pipeline.

## [1.1.2] — 2026-05-01

### Changed

- Replaced `react-old-icons` with [Lucide](https://lucide.dev/) for a single,
  maintained icon set.

### Added

- DMG installer now includes an `/Applications` symlink for drag-to-install.

## [1.1.1] — 2026-05-01

### Added

- Full notarization pipeline: Developer ID signing of bundled FFmpeg, app,
  and DMG; `xcrun notarytool` submission with `--wait`; `xcrun stapler` for
  offline-trusted installs.

### Fixed

- Release script: `codesign` calls now pass `--timestamp` (required for
  notarization); whitelisted `package.json`, `package-lock.json`,
  `tauri.conf.json`, and `scripts/release.js` from the dirty-tree check
  since the script writes to them.

## [1.1.0] — 2026-05-01

### Added

- `npm run release` / `npm run release:local` — single-command release flow
  that syncs versions, builds, signs, and pushes a tagged GitHub release.
- MKV input support (video).
- WEBP input support (image).
- HEIC input support (image). *Note: HEIC decoding worked but the output
  step silently failed under ffmpeg 8.x; fixed in Unreleased.*
- Surface FFmpeg errors in the UI rather than failing silently.
- Real progress reporting (parsed from ffmpeg stderr `Duration:` / `time=`).
- "Show in Finder" action on compressed output.

### Changed

- Renamed the app to **kompress** (from prior working name).
- Tauri window resized.

### Fixed

- Settings drawer sliders.

## [1.0.1] — 2025-12-21

### Added

- Code signing and release process documentation.

### Fixed

- Drawer close animation now slides out smoothly.

## [1.0.0] — 2025-12-21

Initial release.

### Added

- Drag-and-drop multimedia compression for macOS.
- Bundled FFmpeg binary invoked from a Rust (Tauri 2) backend — no system
  ffmpeg required at runtime.
- Image compression: PNG/JPG/JPEG → JPG, configurable quality 1–8.
- Video compression: MOV/MP4 → H.264 MP4, configurable CRF 18–28.
- Audio compression: WAV/MP3/AAC/FLAC/M4A/OGG/WMA → MP3, configurable
  bitrate 128–320 kbps.
- Settings drawer with sliders, persisted via `localStorage`.
- Console drawer streaming FFmpeg output for debugging.
- Animated splash screen.
- MIT license.

[Unreleased]: https://github.com/samkasman/kompress/compare/v1.1.2...HEAD
[1.1.2]: https://github.com/samkasman/kompress/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/samkasman/kompress/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/samkasman/kompress/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/samkasman/kompress/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/samkasman/kompress/releases/tag/v1.0.0
