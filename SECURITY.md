# Security Policy

## Reporting a vulnerability

If you believe you've found a security issue in kompress, **please don't open a public GitHub issue.** Instead, use one of these private channels:

- GitHub's [private vulnerability reporting](https://github.com/samkasman/kompress/security/advisories/new) (preferred).
- Email **<redacted>** with the word "kompress" in the subject.

Please include:

- A description of the issue and its impact.
- Steps to reproduce, or a proof of concept.
- The kompress version (`About → Version` or the `.dmg` filename).
- Your environment (macOS version, Apple Silicon vs Intel).

I'll acknowledge within 7 days and aim to ship a fix within 30 days for high-severity issues. There's no bug-bounty program.

## Scope

In scope:

- The compiled macOS app and its bundled FFmpeg binary.
- The Rust backend (`src-tauri/`) and the React frontend (`src/`).
- The release/signing pipeline (`scripts/`, `bin/`).

Out of scope:

- Vulnerabilities in upstream FFmpeg (report to the [FFmpeg project](https://ffmpeg.org/security.html)).
- Vulnerabilities in upstream Tauri (report to the [Tauri project](https://github.com/tauri-apps/tauri/security/policy)).
- Dev-only npm dependency CVEs — they never reach end users; `npm audit --omit=dev` is the gate that matters.

## Verifying the integrity of a release

Releases on the [Releases page](https://github.com/samkasman/kompress/releases) are:

1. **Code-signed** with a Developer ID Application certificate (team `WC8RY44BN7`).
2. **Notarized** by Apple via `notarytool`.
3. **Stapled**, so Gatekeeper trusts the build offline.

To verify a downloaded `.dmg` before installing:

```bash
# Confirm the signature chains to a Developer ID and was notarized.
spctl --assess --type install --verbose=4 ~/Downloads/kompress-vX.Y.Z-aarch64.dmg

# Inspect the codesign metadata, including the team identifier.
codesign --display --verbose=2 --deep ~/Downloads/kompress-vX.Y.Z-aarch64.dmg

# After mounting and copying to /Applications, the same checks work on the .app.
codesign --display --verbose=2 --deep /Applications/kompress.app
```

You should see `Authority=Developer ID Application: Sam Kasman (WC8RY44BN7)` and `Notarization=accepted`. If you don't, do not run the binary — please report it as a security issue using the channels above.
