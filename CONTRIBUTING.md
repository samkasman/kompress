# Contributing to kompress

Thanks for thinking about contributing. kompress is a small, opinionated macOS app; this guide describes how to get a working setup and the standards every PR is held to.

## Before you start

- Skim [`CLAUDE.md`](CLAUDE.md). It's the authoritative project-conventions doc — load-bearing rules around the macOS-only distribution stance, the single source of truth for versions, the no-CI policy, and a handful of ffmpeg quirks. Saves you re-discovering them.
- Read the [Code of Conduct](CODE_OF_CONDUCT.md).
- For security issues, see [SECURITY.md](SECURITY.md) — please don't file public issues for vulnerabilities.

## Dev setup

Prerequisites: Node `v18+`, Rust (stable), Xcode Command Line Tools on macOS. See the README for Linux/Windows dev prereqs.

```bash
git clone git@github.com:samkasman/kompress.git
cd kompress
npm install
# Download an FFmpeg binary into src-tauri/binaries/ — see README "Development Setup"
npm run tauri:dev
```

## Quality gates

Every push runs the same checks. Run them locally before pushing to keep cycles short:

```bash
npx tsc --noEmit      # type check
npm run lint          # eslint, zero-warning gate
npm run test:run      # vitest, 16 unit tests
npm run verify        # exercises every fixture through bundled ffmpeg + ffprobe
```

The husky `pre-push` hook runs all four. The `pre-commit` hook runs lint-staged on changed files. The `commit-msg` hook enforces [Conventional Commits](https://www.conventionalcommits.org/) via commitlint.

There is no CI — quality is enforced locally. **Don't add GitHub Actions workflows.** See `CLAUDE.md` hard rule #2.

## Commit style

Conventional Commits is enforced. Allowed types: `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `build`, `ci`, `chore`, `revert`. Scope is optional but appreciated.

```
feat(ipc): emit per-file ffmpeg-progress events for image conversions
fix: HEIC -> JPG needs -update 1 -frames:v 1 on ffmpeg 8.x
docs(readme): clarify macOS-only distribution
```

git-cliff drafts CHANGELOG entries from these commits when `[Unreleased]` is empty at release time, so a clear `type(scope): subject` pays off twice.

## Pull requests

- Fork → feature branch → PR against `develop`. Releases are cut from `develop`.
- Fill out the PR template; pictures help for any UI change.
- Keep PRs focused. A fix and an unrelated refactor in the same PR get pushed back.
- If you're updating shipped behavior, add or update a fixture and an entry in `CHANGELOG.md` `[Unreleased]`.

## Adding a new supported format

Single source of truth: `src/constants/formats.ts`. Add the extension to the right group there, and the file picker, drag-drop validator, format badges, and drawer subtitles all update. Then:

1. Add a fixture in `tests/fixtures/<image|video|audio>/` and document its license in `tests/fixtures/README.md`.
2. Add the extension and expected output codec to `scripts/verify-conversions.sh`.
3. Run `npm run verify` to confirm the bundled ffmpeg handles it with the same args `compress_file` uses.

## Releases

Maintainers only — see the README's "Releasing" section. The short version: `bin/cut-release.sh patch|minor|major` does everything (bump → build → sign → notarize → tag → push → publish + CHANGELOG promotion). Don't tag manually.

## Questions

[Open an issue](https://github.com/samkasman/kompress/issues) with the "question" label.
