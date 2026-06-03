# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- In-house design system in `src/components/ui/` backed by
  `class-variance-authority`: `IconButton`, `Slider`, `Drawer`, `FormatBadge`.
  Replaces ad-hoc className blobs throughout the app.
- `tests/fixtures/` — real public-domain / Creative Commons media samples
  covering every supported input format, derived from three canonical
  masters (Hubble _Pillars of Creation_, _Big Buck Bunny_, Apollo 11 audio).
  See `tests/fixtures/README.md` for sources and licenses.
- `scripts/verify-conversions.sh` (`npm run verify`) runs the exact ffmpeg
  args from `compress_file` against every fixture using the bundled binary
  and validates each output codec via `ffprobe`.
- Reset-to-defaults button in the settings drawer.
- Window is now resizable (min 360×360); the file list grows with window
  height (`max-h-[50vh]`).
- `src/constants/formats.ts` — single source of truth for supported file
  extensions, output formats, and UI label helpers.
- `src/types/ipc.ts` — shared Rust↔TS payload types matching the structs
  in `main.rs`.
- Husky git hooks: `pre-commit` (lint-staged), `commit-msg` (commitlint
  with Conventional Commits), `pre-push` (tsc + lint + verify).
- `.editorconfig`, `.npmrc` with `engine-strict=true`.
- git-cliff integration: `release.js` auto-promotes the `[Unreleased]`
  section to a versioned section on each release, drafts entries from
  conventional commits when `[Unreleased]` is empty, and uses the result
  as the GitHub release body. `npm run changelog:draft` previews.
- `bin/cut-release.sh patch|minor|major` wraps the entire release flow
  including the version bump.
- Release preflight checks in `release.js` — verifies the Developer ID
  Application cert and the `kompress-notary` keychain profile before the
  multi-minute build/sign cycle.
- `CLAUDE.md` documenting load-bearing project conventions for AI
  assistants and new contributors.

### Fixed

- HEIC and other multi-item image containers now convert correctly.
  The ffmpeg 8.x `image2` muxer needs `-update 1 -frames:v 1` when writing
  a single still from a HEIF/AVIF input; without it the decode succeeded
  but the mux step failed with an opaque "FFmpeg failed" error.
- File dialog filter previously omitted `heic`, `webp`, and `mkv` —
  the dialog and drag-drop now accept the same set, derived from
  `ALL_INPUT_EXTS`.
- Settings drawer subtitles for image and audio were inaccurate
  (image dropped JPEG, audio said "WAV/MP3 → MP3"). Now generated from
  the format constants.
- Slider keyboard accessibility — image and video sliders previously
  used `transform: scaleX(-1)` to flip direction, which left ArrowRight
  decreasing the value and screen readers reading the wrong position.
  Labels swapped instead.
- `pending → processing` race in `DropZone`: the trigger effect could
  re-fire with the same file before `processFile`'s status flip applied,
  occasionally double-launching a compression. Started file IDs now
  tracked in a ref-held `Set`.
- StrictMode listener leak in `useDragAndDrop` — cleanup ran before
  `onDragDropEvent`'s promise resolved, leaving an orphaned listener for
  the lifetime of the window in dev. A `cancelled` flag now guards.
- `reveal_in_folder` failures (e.g., file deleted) are now logged to the
  console drawer instead of silently doing nothing.

### Changed

- `useSettings` hydrates via a lazy `useState` initializer instead of
  defaults → effect-reads-localStorage → effect-writes round-trip. Adds
  `resetDefaults()` and centralizes value clamping (read and write).
- `useFileProcessor` mounts a single global `ffmpeg-progress` listener
  at hook init instead of one per file. Listener reads callbacks via
  refs to avoid resubscribing on every render.
- `DropZone` panel state collapsed from four booleans to a `useReducer`
  with `{ phase: 'closed' | 'open' | 'closing', panel: 'settings' | 'console' }`.
  Drawer animations finish via `onTransitionEnd` instead of three
  hardcoded `setTimeout(300)` calls.
- File IDs switched from `${path}-${Date.now()}-${Math.random()}` to
  `crypto.randomUUID()`.
- `Header`, `SettingsDrawer`, `ConsoleDrawer` memoized; their onClick props
  hoisted with `useCallback`.
- All internal imports now use the `@/` path alias (configured in
  `tsconfig.json` and `vite.config.ts`, previously unused).
- Splash animation timing extracted to named constants; debug-log
  truncation constant (`MAX_DEBUG_LOGS`) extracted from a magic 10.
- README refreshed for accuracy: documented the release flow,
  signing/notarization prerequisites, the lint/format/verify scripts,
  and the current project structure. Removed Linux/Windows badges that
  didn't match the macOS-only distribution pipeline.
- Version badge now sourced from `shields.io/github/package-json/v` so
  it tracks releases.
- `demo.gif` re-encoded from 42 MB to 5.8 MB (400px wide, 10 fps,
  per-frame-diff palette).

### Removed

- `react-old-icons` dep — orphan since v1.1.2 Lucide migration but never
  uninstalled.
- `@radix-ui/react-progress` and `@radix-ui/react-slot` deps — only
  consumed by dead `src/components/ui/` components.
- `class-variance-authority` was removed alongside the dead ui/ purge,
  then re-added for the new design system primitives.
- `ThemeToggle` component (unused — `main.tsx` forces dark mode).
- `src/components/ui/{badge,button,card,progress}.tsx` — shadcn scaffolding
  that nothing actually rendered.
- `cn()` helper in `utils/fileUtils.ts` — re-added at the conventional
  `src/lib/utils.ts` location as part of the design system commit.
- `scripts/copy-release.js` — superseded by `sign-and-copy-release.js`.
- `components.json` (shadcn CLI config) — will be regenerated by
  `npx shadcn init` if shadcn is reintroduced.

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
- HEIC input support (image). _Note: HEIC decoding worked but the output
  step silently failed under ffmpeg 8.x; fixed in Unreleased._
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
