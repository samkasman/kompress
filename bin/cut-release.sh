#!/usr/bin/env bash
# Bump version, then hand off to `npm run release` for build/sign/notarize/tag/push.
#
# Usage:
#   bin/cut-release.sh patch              # 1.1.2 → 1.1.3 (prompts)
#   bin/cut-release.sh minor              # 1.1.2 → 1.2.0
#   bin/cut-release.sh major              # 1.1.2 → 2.0.0
#   bin/cut-release.sh patch --local      # dry run (build only, no tag/push/release)
#   bin/cut-release.sh patch --yes        # skip the confirmation prompt
#
# The `--yes` flag is what the `release:patch|minor|major` npm scripts pass so
# you never have to type "y" when you've already typed the bump level.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONF="$ROOT/src-tauri/tauri.conf.json"

BUMP=""
LOCAL_FLAG=""
SKIP_CONFIRM=0
for arg in "$@"; do
    case "$arg" in
        patch|minor|major) BUMP="$arg" ;;
        --local)           LOCAL_FLAG="--local" ;;
        --yes|-y)          SKIP_CONFIRM=1 ;;
        *)                 echo "Unknown arg: $arg" >&2; exit 1 ;;
    esac
done

if [[ -z "$BUMP" ]]; then
    echo "Usage: $0 <patch|minor|major> [--local] [--yes|-y]" >&2
    exit 1
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
if [[ "$SKIP_CONFIRM" -ne 1 ]]; then
    printf 'Proceed? [y/N] '
    read -r ans
    if [[ "$ans" != "y" && "$ans" != "Y" ]]; then
        echo "Aborted."
        exit 0
    fi
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
