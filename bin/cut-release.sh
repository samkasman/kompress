#!/usr/bin/env bash
# Bump version, then hand off to `npm run release` for build/sign/notarize/tag/push.
#
# Usage:
#   bin/cut-release.sh patch    # 1.1.2 → 1.1.3
#   bin/cut-release.sh minor    # 1.1.2 → 1.2.0
#   bin/cut-release.sh major    # 1.1.2 → 2.0.0
#   bin/cut-release.sh patch --local   # dry run (build only, no tag/push/release)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONF="$ROOT/src-tauri/tauri.conf.json"

if [[ $# -lt 1 ]] || [[ ! "$1" =~ ^(patch|minor|major)$ ]]; then
    echo "Usage: $0 <patch|minor|major> [--local]" >&2
    exit 1
fi

BUMP="$1"
LOCAL_FLAG=""
if [[ "${2:-}" == "--local" ]]; then
    LOCAL_FLAG="--local"
fi

CURRENT=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$CONF', 'utf-8')).version)")

NEW=$(node -e "
const parts = '$CURRENT'.split('.').map(Number);
const bump = '$BUMP';
if (bump === 'major')      { parts[0]++; parts[1] = 0; parts[2] = 0; }
else if (bump === 'minor') { parts[1]++; parts[2] = 0; }
else                       { parts[2]++; }
console.log(parts.join('.'));
")

printf 'kompress: %s → %s (%s%s)\n' "$CURRENT" "$NEW" "$BUMP" "${LOCAL_FLAG:+, local}"
printf 'Proceed? [y/N] '
read -r ans
if [[ "$ans" != "y" && "$ans" != "Y" ]]; then
    echo "Aborted."
    exit 0
fi

# Write the new version into tauri.conf.json (single source of truth — release.js
# will sync package.json / package-lock.json from this).
node -e "
const fs = require('fs');
const conf = JSON.parse(fs.readFileSync('$CONF', 'utf-8'));
conf.version = '$NEW';
fs.writeFileSync('$CONF', JSON.stringify(conf, null, 2) + '\n');
"

# Hand off to npm run release (or release:local).
cd "$ROOT"
if [[ -n "$LOCAL_FLAG" ]]; then
    exec npm run release:local
else
    exec npm run release
fi
