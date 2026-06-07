# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- HEIC, WEBP, and MKV are first-class inputs across the file picker,
  drag-drop, and format badges.
- Reset-to-defaults button in the settings drawer.
- A new in-house design system replaces ad-hoc styling — consistent
  iconography, sliders, and drawer chrome throughout.

### Fixed

- HEIC conversion. ffmpeg 8 silently failed to mux a single still from
  HEIF/AVIF inputs without `-update 1 -frames:v 1`; the decode worked,
  the output didn't.
- Video progress percent now animates in real time instead of jumping
  from 0 to 100 at end-of-file. (ffmpeg writes stats separated by `\r`;
  the previous line parser only saw `\n`.)
- Settings drawer subtitles for image and audio were stale — image
  dropped JPEG, audio said "WAV/MP3 → MP3." Now derived from the format
  registry.
- Slider keyboard accessibility — image and video sliders no longer flip
  via CSS transform, which had left ArrowRight decreasing the value and
  screen readers reading the wrong position.
- Drops over an open settings or console drawer used to vanish silently.
  They now close the drawer and process the files.
- "Show in Finder" failures (e.g., file deleted) are logged to the
  console drawer instead of doing nothing visible.
- Two drop-pipeline races: the same file could be double-launched into
  compression, and the StrictMode drag-drop listener could leak for the
  lifetime of the window in dev.

### Changed

- Bumped `@tauri-apps` stack to 2.11.x; prettier, postcss, autoprefixer
  patch updates. React 19 / ESLint 9 / Vite 8 / Tailwind 4 majors
  deferred.
- `demo.gif` re-encoded from 42 MB to 5.8 MB.

### Removed

- `react-old-icons` — orphan since the v1.1.2 Lucide migration.
- `@radix-ui/react-progress`, `@radix-ui/react-slot`, and the unused
  shadcn scaffolding in `src/components/ui/` they backed.
- Android, iOS, and Windows Store tile icon assets that
  `tauri.conf.json` never referenced.

### Internal

These don't change app behavior but matter for contributors.

- **Verification & tests:** `tests/fixtures/` with PD/CC0 samples for
  every supported format; `scripts/verify-conversions.sh` exercises the
  bundled ffmpeg with the production args and validates output codecs
  via `ffprobe`. Vitest + happy-dom + Testing Library with 16 unit tests
  covering formats / fileUtils / useSettings.
- **Release pipeline:** `bin/cut-release.sh patch|minor|major` wraps
  bump-build-sign-notarize-tag-push-publish in one command, with
  preflight checks for the Developer ID cert and notary keychain
  profile. `release.js` integrates git-cliff to auto-promote
  `[Unreleased]` to a versioned section and draft entries from
  conventional commits when empty. `npm run release:patch|minor|major`
  shortcuts wrap the bin script with `--yes` so you only type the bump
  level. `release.js` also fast-forwards `master` to the released commit
  so the branch always reflects the latest shipped version (`develop`
  remains the integration branch).
- **Quality gates:** Husky hooks for `commit-msg` (commitlint /
  Conventional Commits), `pre-commit` (lint-staged), and `pre-push`
  (tsc + lint + test + verify).
- **Source-of-truth modules:** `src/constants/formats.ts` for supported
  extensions and output formats; `src/types/ipc.ts` for Rust↔TS payload
  types. `@/` path alias adopted throughout.
- **State and rendering hygiene:** `useSettings` hydrates lazily and
  clamps centrally; `useFileProcessor` mounts a single global
  `ffmpeg-progress` listener with ref-held callbacks; `DropZone` panel
  state migrated to a reducer with explicit `closed | open | closing`
  phases; file IDs use `crypto.randomUUID()`; key components memoized.
- **Backend safety:** TOCTOU race in `get_output_path` fixed with
  atomic `OpenOptions::create_new(true)`. `listen('ffmpeg-progress')`
  rejections now surface to the console drawer.
- **Docs and tooling:** `CLAUDE.md` documents load-bearing conventions.
  README clarifies macOS-only distribution. `.editorconfig`, `.npmrc`
  with `engine-strict=true`. Cargo.toml metadata populated. Husky hooks
  standardized with shebangs and `--no-install`.

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

- `codesign` calls now pass `--timestamp`, required for notarization.

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
