# Third-Party Notices

kompress is licensed under the MIT License (see [LICENSE](LICENSE)). It bundles and depends on the following third-party software, each governed by its own license.

## Bundled at runtime

### FFmpeg

- **Project:** [FFmpeg](https://ffmpeg.org/)
- **Version shipped:** see `ffmpeg -version` from the bundled binary at `src-tauri/binaries/`.
- **License:** [LGPL v2.1+](https://www.gnu.org/licenses/old-licenses/lgpl-2.1.html) (depending on build configuration; the macOS binaries we ship are built with the LGPL configuration unless otherwise stated).
- **Source:** macOS Apple Silicon binaries are obtained from [evermeet.cx/ffmpeg](https://evermeet.cx/ffmpeg/) (or the equivalent maintained build).
- **Your right of replacement:** kompress reads `src-tauri/binaries/ffmpeg-<triple>` at build time and falls back to `which ffmpeg` in development. End users with the ability to rebuild from source can substitute their own FFmpeg binary, preserving the LGPL section 4 user-replacement guarantee.
- **No modifications** are made to the FFmpeg binaries themselves.

If you redistribute kompress, you are obligated under LGPL to (a) credit FFmpeg, (b) make the source corresponding to the bundled binary available or point users at it, and (c) allow users to replace the FFmpeg library/binary. This file and the dev-setup section of the README satisfy (a) and (c); (b) is satisfied by linking to the upstream project.

## Runtime dependencies (npm, distributed in the JS bundle)

- **[React](https://react.dev/)** — MIT
- **[react-dom](https://react.dev/)** — MIT
- **[Lucide](https://lucide.dev/) (`lucide-react`)** — ISC
- **[clsx](https://github.com/lukeed/clsx)** — MIT
- **[tailwind-merge](https://github.com/dcastil/tailwind-merge)** — MIT
- **[class-variance-authority](https://cva.style/)** — Apache-2.0
- **[Tauri](https://tauri.app/) JS API and plugins** — MIT or Apache-2.0 (at your option)

## Build / native runtime

- **[Tauri](https://tauri.app/) core** (Rust crates) — MIT or Apache-2.0
- **Apple platform crates** consumed transitively by Tauri — see `cargo tree -p kompress` for the full graph; each crate's license is listed in its `Cargo.toml`.

## Build tools (not shipped to end users)

These are dev-time only and not redistributed:

- [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/), [ESLint](https://eslint.org/), [Prettier](https://prettier.io/), [Vitest](https://vitest.dev/), [Husky](https://typicode.github.io/husky), [commitlint](https://commitlint.js.org/), [git-cliff](https://git-cliff.org/).

## Demo media

The `tests/fixtures/` directory contains public-domain and Creative Commons media samples used solely for automated codec verification. See `tests/fixtures/README.md` for the per-file source, license, and attribution.

---

If you spot a missing attribution or incorrect license claim, please [open an issue](https://github.com/samkasman/kompress/issues).
