#!/usr/bin/env bash
# Exercises every supported input format through the exact ffmpeg args used by
# compress_file in src-tauri/src/main.rs, using the bundled ffmpeg binary.
# Verifies each output decodes via ffprobe and reports a summary.

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FIXTURES="$ROOT/tests/fixtures"
FFMPEG="$ROOT/src-tauri/binaries/ffmpeg-aarch64-apple-darwin"
OUT_DIR="$(mktemp -d -t kompress-verify-XXXXXX)"
trap 'rm -rf "$OUT_DIR"' EXIT

if ! command -v ffprobe >/dev/null; then
    echo "ffprobe required for output verification (brew install ffmpeg)" >&2
    exit 2
fi
if [[ ! -x "$FFMPEG" ]]; then
    echo "Bundled ffmpeg not found at $FFMPEG" >&2
    exit 2
fi

# Defaults matching main.rs unwrap_or values
IMG_Q=6
VID_CRF=22
AUD_BR=320

PASS=0
FAIL=0
FAILED_FILES=()

red()    { printf '\033[31m%s\033[0m' "$*"; }
green()  { printf '\033[32m%s\033[0m' "$*"; }
yellow() { printf '\033[33m%s\033[0m' "$*"; }

# convert <input> <file_type> <expected_codec>
convert() {
    local input="$1" file_type="$2" expected_codec="$3"
    local base; base="$(basename "$input")"
    local stem="${base%.*}-compressed"
    local output log
    log="$(mktemp -t kompress-verify-log-XXXXXX)"

    case "$file_type" in
        image)
            output="$OUT_DIR/${stem}.jpg"
            "$FFMPEG" -y -i "$input" -update 1 -frames:v 1 -q:v "$IMG_Q" "$output" \
                >"$log" 2>&1 ;;
        audio)
            output="$OUT_DIR/${stem}.mp3"
            "$FFMPEG" -y -i "$input" -codec:a libmp3lame -b:a "${AUD_BR}k" "$output" \
                >"$log" 2>&1 ;;
        video)
            output="$OUT_DIR/${stem}.mp4"
            "$FFMPEG" -y -i "$input" -c:v libx264 -preset medium -crf "$VID_CRF" \
                -c:a aac -b:a 128k -stats_period 0.5 "$output" >"$log" 2>&1 ;;
    esac

    local ffmpeg_status=$?
    local size=0
    [[ -f "$output" ]] && size=$(stat -f%z "$output" 2>/dev/null || stat -c%s "$output")

    local probed_codec=""
    if [[ "$ffmpeg_status" -eq 0 && "$size" -gt 0 ]]; then
        probed_codec="$(ffprobe -v error -select_streams 0 \
            -show_entries stream=codec_name -of csv=p=0 "$output" 2>/dev/null \
            | head -1)"
    fi

    if [[ "$ffmpeg_status" -eq 0 && "$size" -gt 0 && "$probed_codec" == "$expected_codec" ]]; then
        printf '  %s  %s -> %s (%s, %d bytes)\n' "$(green PASS)" "$base" "$(basename "$output")" "$probed_codec" "$size"
        PASS=$((PASS + 1))
    else
        printf '  %s  %s\n' "$(red FAIL)" "$base"
        printf '         exit=%d size=%d codec=%s expected=%s\n' "$ffmpeg_status" "$size" "${probed_codec:-<none>}" "$expected_codec"
        printf '         %s\n' "$(yellow "last ffmpeg line: $(tail -1 "$log" 2>/dev/null)")"
        FAIL=$((FAIL + 1))
        FAILED_FILES+=("$base")
    fi
    rm -f "$log"
}

run_category() {
    local dir="$1" file_type="$2" expected_codec="$3"
    shift 3
    local exts=("$@")
    echo
    echo "$(yellow "[$file_type]") -> $expected_codec"
    for ext in "${exts[@]}"; do
        for f in "$dir"/*."$ext"; do
            [[ -e "$f" ]] || continue
            convert "$f" "$file_type" "$expected_codec"
        done
    done
}

echo "Bundled ffmpeg: $("$FFMPEG" -version | head -1)"
echo "Output dir: $OUT_DIR"

run_category "$FIXTURES/image" image mjpeg png jpg jpeg heic webp
run_category "$FIXTURES/video" video h264 mov mp4 mkv
run_category "$FIXTURES/audio" audio mp3 wav mp3 aac flac m4a ogg wma

echo
echo "----------------------------------------"
printf 'Summary: %s passed, %s failed\n' "$(green "$PASS")" "$( ((FAIL == 0)) && green "$FAIL" || red "$FAIL")"
if (( FAIL > 0 )); then
    printf 'Failed inputs: %s\n' "${FAILED_FILES[*]}"
    exit 1
fi
