# kompress

A simple multimedia file compressor with macOS releases and Linux local-build support.

![Version](https://img.shields.io/github/package-json/v/samkasman/kompress)
![License](https://img.shields.io/badge/license-MIT-green)

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri-FFC131?logo=tauri&logoColor=black)
![Rust](https://img.shields.io/badge/Rust-000000?logo=rust&logoColor=white)

![macOS](https://img.shields.io/badge/macOS-000000?logo=apple&logoColor=white)
![Linux](https://img.shields.io/badge/Linux-FCC624?logo=linux&logoColor=black)
![Windows](https://img.shields.io/badge/Windows-0078D6?logo=windows&logoColor=white)

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
  - **Linux**: the system packages Tauri/WebKitGTK needs for your distro before building locally

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

> kompress supports **macOS** and **Linux** builds.
>
> - **macOS** is the release path: builds can be signed, notarized, and published from a macOS host.
> - **Linux** is supported for local development and local unsigned builds.
>
> In development mode, if no bundled binary is found, the app falls back to system ffmpeg at runtime. For packaged builds, place the target-specific ffmpeg binary in `src-tauri/binaries/` first so Tauri can bundle it.

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

> **Build support:** kompress supports both **macOS** and **Linux** builds.
>
> - **macOS** is the public release path. `npm run tauri:build` / `npm run release:*` produce the signed, notarized app and DMG.
> - **Linux** is supported for local development and local unsigned builds via `npx tauri build`.
>
> There is **no CI**. All quality gates and release steps run locally.

For local development builds without code signing, invoke the Tauri CLI directly:

```bash
npx tauri build
```

Outputs land in `src-tauri/target/release/bundle/`:

- **macOS**: `.app` bundle and `.dmg` installer
- **Linux**: `.AppImage` or `.deb` (when built on Linux, unsigned)

> The `npm run tauri:build` script chains `sign-and-copy-release.js`, which hard-fails without macOS code-signing credentials. Use it only when releasing — see the [Releasing](#releasing) section below.

## Issues

For bugs or feature requests, please [open an issue](https://github.com/samkasman/kompress/issues). For **security issues**, see [SECURITY.md](SECURITY.md) — please don't file public issues for vulnerabilities.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for dev setup, quality gates, commit conventions, and how to add a new supported format.

## Releasing

`src-tauri/tauri.conf.json` is the single source of truth for the app version; the release flow syncs it into `package.json` and `package-lock.json` automatically.

This repo follows [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow): one long-lived `main` branch with short-lived feature branches. Releases tag `main` directly — there's no separate "release" or "develop" branch.

**Cut a release** — one command, no prompts:

```bash
npm run release:patch    # 1.1.2 → 1.1.3 (bug-fix only)
npm run release:minor    # 1.1.2 → 1.2.0 (new behavior, backward-compatible)
npm run release:major    # 1.1.2 → 2.0.0 (breaking change)
```

The script: bumps the version in `tauri.conf.json` and syncs the package files; promotes `[Unreleased]` in `CHANGELOG.md` to a versioned section; builds `aarch64-apple-darwin`; signs the bundled FFmpeg + app + DMG with the Developer ID; notarizes via `notarytool --wait`; staples the ticket; commits the version + changelog; tags `v{version}`; pushes the current `main` commit and the tag to `origin`; then opens a GitHub release with the DMG attached and the promoted changelog as the body.

**Dry-run** — build/sign/notarize without tagging or publishing:

```bash
bash bin/cut-release.sh minor --local --yes
```

If the version is already bumped, `npm run release` (publish) or `npm run release:local` (dry-run) skips the bump step and runs the rest.

### Auto-updater setup (one-time, per maintainer)

kompress ships with an in-app updater (Tauri's Updater + Process plugins). On launch the app silently checks `https://github.com/samkasman/kompress/releases/latest/download/latest.json` and shows an **Update to v…** button in the header if there's a newer signed release.

The updater verifies a [minisign](https://jedisct1.github.io/minisign/) signature on every update payload, separate from Apple's Developer ID. You need to generate a keypair once and pass the private key as an environment variable during releases.

**Generate the keypair** (one time, ever):

```bash
npx @tauri-apps/cli signer generate -w ~/.tauri/kompress-updater.key
```

You'll be prompted for a passphrase. Keep the `.key` file **outside the repo**; save the passphrase in your password manager.

The command prints a public key. Paste it into `src-tauri/tauri.conf.json` → `plugins.updater.pubkey`, replacing `REPLACE_WITH_GENERATED_PUBLIC_KEY`. The public key is safe to commit and check into git.

**Per-release env vars** — `release.js` only attaches updater artifacts when these are set in the shell before running `npm run release:*`:

```bash
export TAURI_SIGNING_PRIVATE_KEY="$(cat ~/.tauri/kompress-updater.key)"
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD="<your passphrase>"
```

You can put these in a `.env.release` file that's gitignored, and `source` it before releasing — or stash them in your password manager and paste before running. Without them, the release still ships a fully-signed DMG (existing users can still download from GitHub Releases), but no `latest.json` is published, so in-app update prompts won't appear for that version.

### Signing & notarization prerequisites

The release pipeline expects a macOS host with the following.

**1. A Developer ID Application certificate in the login keychain.** The signing identity is resolved in this order:

1. `MACOS_SIGN_IDENTITY` env var, if set (e.g. `Developer ID Application: Your Name (XXXXXXXXXX)`).
2. Otherwise auto-detected: the script uses the unique `Developer ID Application: …` cert it finds in your keychain.
3. If zero or more than one cert is present, the script errors with the available choices and asks you to set `MACOS_SIGN_IDENTITY`.

That means kompress just works for a maintainer with a single matching cert, and forks don't need to edit any source.

**2. A notarytool keychain profile.** Resolved as `$MACOS_NOTARY_PROFILE` if set, otherwise `<productName>-notary` (so for kompress: `kompress-notary`). Set up once with:

```bash
xcrun notarytool store-credentials kompress-notary \
  --apple-id <apple-id-email> \
  --team-id <team-id> \
  --password <app-specific-password>
```

See Apple's [Customizing the notarization workflow](https://developer.apple.com/documentation/security/customizing-the-notarization-workflow) for app-specific password creation.

**3. Xcode Command Line Tools** (`codesign`, `xcrun notarytool`, `xcrun stapler`, `hdiutil`).

### Forking checklist

If you're forking kompress for your own distribution, the only file you have to hand-edit is `src-tauri/tauri.conf.json` (it gets compiled into the bundle, so it can't read env vars at runtime):

- `productName` and `identifier` — change to yours.
- `plugins.updater.endpoints` — change the GitHub URL to your repo's `releases/latest/download/latest.json`.
- `plugins.updater.pubkey` — generate your own minisign keypair via `npx @tauri-apps/cli signer generate` and paste the public key here.

Then update `package.json`'s `repository` field to point at your fork. Everything else (sign identity, notary profile, updater download URL) is derived from your environment and `package.json` at release time — the scripts themselves stay generic.

## License

kompress is released under the MIT License — see [LICENSE](LICENSE) for the full text.

The app bundles FFmpeg (LGPL v2.1+) and other third-party software with their own licenses. See [NOTICE.md](NOTICE.md) for the full attribution list and your rights as a redistributor.
