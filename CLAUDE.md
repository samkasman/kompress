# CLAUDE.md

Context for AI assistants working in this repo. Read this first to skip rediscovery.

## What this is

**kompress** — a macOS multimedia file compressor. Tauri 2 (Rust backend) +
React/Vite (frontend) + a bundled FFmpeg binary that does the actual work.
Drag in PNG/JPG/JPEG/HEIC/WEBP, MOV/MP4/MKV, or WAV/MP3/AAC/FLAC/M4A/OGG/WMA;
files get compressed in-place with a `-compressed` suffix.

## Hard rules

1. **macOS-only distribution.** Rust code paths handle all three platforms, but
   the release pipeline (`scripts/sign-and-copy-release.js`) and bundled
   binaries are macOS-only. Linux/Windows badges were removed from the README
   for honesty. Don't reintroduce cross-platform release tooling without asking.
2. **No GitHub Actions / no CI.** User preference (cost-driven). All quality
   gates run locally via git hooks (husky). If you want a check enforced, add it
   to `.husky/pre-push` — never to `.github/workflows/`.
3. **`src-tauri/tauri.conf.json` is the version source of truth.**
   `release.js` syncs `package.json` and `package-lock.json` from it. Never
   hand-edit the latter two to bump the version.
4. **Releases go through `bin/cut-release.sh patch|minor|major`** (or
   `npm run release` if the version is already bumped). Never tag/push/release
   manually — the script handles version sync, build, sign, notarize, staple,
   commit, tag, push, GitHub release, and CHANGELOG promotion in one shot.
5. **Conventional Commits are required.** Enforced by `.husky/commit-msg`
   via commitlint. Use `feat:`, `fix:`, `refactor:`, `perf:`, `docs:`, `test:`,
   `build:`, `ci:`, `chore:`, `revert:`. Scope is optional.

## Quirks worth remembering

- **HEIC conversion needs `-update 1 -frames:v 1`** in the image2 muxer args.
  Without them, ffmpeg 8.x decodes the HEIC fine and then refuses to write the
  output as a single JPG ("does not contain an image sequence pattern"). The
  args live in `src-tauri/src/main.rs` inside `compress_file`.
- **Tauri's `onDragDropEvent` is async**, and React StrictMode mounts twice in
  dev. The setup-then-cleanup race is handled with a `cancelled` flag in
  `src/hooks/useDragAndDrop.ts`. Preserve that pattern if you refactor.
- **Settings sliders are HTML-natural now** — earlier versions used
  `transform: scaleX(-1)` to flip image/video sliders, which broke keyboard
  input. Don't reintroduce CSS flipping. If you want a different direction,
  swap the label positions (left ↔ right).

## Where things live

- `src/constants/formats.ts` — **single source of truth** for supported
  extensions per type, the output extension, and label helpers
  (`formatExtList`, `formatConversionLabel`, `ALL_INPUT_EXTS`). If you add a
  format, update this and only this; the file dialog, drag-drop validator,
  format badges, and drawer subtitles all consume it.
- `src/types/ipc.ts` — Rust↔TS payload types
  (`FfmpegProgress`, `CompressResult`, `CompressFileArgs`) matching the
  structs in `src-tauri/src/main.rs`. Keep them in sync.
- `src/components/ui/` — in-house design primitives backed by cva:
  `IconButton`, `Slider`, `Drawer`, `FormatBadge`. Prefer composing these
  over inlining className blobs.
- `src/lib/utils.ts` — `cn()` (clsx + tailwind-merge).
- `tests/fixtures/` — real PD/CC0 media for every supported format, plus a
  README listing sources and licenses. Each fixture is small (~9 MB total).
- `scripts/verify-conversions.sh` (`npm run verify`) — runs the exact ffmpeg
  args from `compress_file` against every fixture using the bundled binary
  and validates output codecs via `ffprobe`. Pre-push runs this if the
  bundled binary is present.

## Settings ranges (must match across UI, Rust defaults, and validation)

| Setting        | Min | Max | Default | Output direction         |
| -------------- | --- | --- | ------- | ------------------------ |
| `imageQuality` | 1   | 8   | 6       | low value = bigger file  |
| `videoCRF`     | 18  | 28  | 22      | low value = bigger file  |
| `audioBitrate` | 128 | 320 | 320     | low value = smaller file |

Defined in `src/hooks/useSettings.ts` (RANGES). Mirrored in:

- `src/components/SettingsDrawer.tsx` slider props
- `src-tauri/src/main.rs` `unwrap_or` defaults inside `compress_file`

## Path alias

`@/` resolves to `src/` (configured in `tsconfig.json` and `vite.config.ts`).
Use `@/` for all internal imports.

## Build / test scripts

| Command                   | What it does                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `npm run tauri:dev`       | Dev server + Tauri window with hot reload                                                              |
| `npx tauri build`         | Local production build, no signing                                                                     |
| `npm run tauri:build`     | Production build + sign + notarize + DMG. Requires macOS signing prerequisites. Use only for releases. |
| `npm run lint`            | ESLint, zero-warning gate                                                                              |
| `npm run format`          | Prettier auto-format on `src/**`                                                                       |
| `npm run verify`          | Run every fixture through the bundled ffmpeg + validate codecs                                         |
| `npm run changelog:draft` | Preview what git-cliff would put in [Unreleased]                                                       |
| `npm run release`         | Full release flow (assumes version already bumped)                                                     |
| `npm run release:local`   | Same but stops before tag/push/publish                                                                 |
| `bin/cut-release.sh X`    | Bump version (X = patch/minor/major) and run release                                                   |

## Notarization signing setup (release prerequisites)

`scripts/sign-and-copy-release.js` hardcodes:

- Developer ID: `Sam Kasman (WC8RY44BN7)` — change `SIGN_IDENTITY` for forks
- Notary profile: `kompress-notary`

Set up the notary profile once:

```bash
xcrun notarytool store-credentials kompress-notary \
  --apple-id <apple-id-email> \
  --team-id <team-id> \
  --password <app-specific-password>
```

`release.js` preflights both and fails fast if either is missing. Skip the
notary profile check (for offline iteration) with
`SKIP_NOTARY_PROFILE_CHECK=1 npm run release:local`.

## Bundled ffmpeg

Lives at `src-tauri/binaries/ffmpeg-aarch64-apple-darwin` and is **gitignored**.
Dev contributors download it themselves per the README. The verify-conversions
script gracefully skips if it's absent.
