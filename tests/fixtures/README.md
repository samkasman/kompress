# Test Fixtures

Real-content samples covering every supported input format. Each category is
derived from one canonical public-domain / Creative Commons master so attribution
is simple and the repo stays small (~9 MB total).

Run `scripts/verify-conversions.sh` to exercise every fixture through the exact
ffmpeg pipeline used by `compress_file` in `src-tauri/src/main.rs`.

## Images — `image/pillars.*`

- **Source:** Hubble Space Telescope, *Pillars of Creation* (2014, WFC3/UVIS)
- **License:** Public domain (NASA/STScI)
- **Master:** `pillars.jpg` downloaded from
  https://assets.science.nasa.gov/content/dam/science/missions/hubble/releases/2015/01/STScI-01EVT2RBPDHYADWQX62QR1ABJ2.tif/jcr:content/renditions/1150x1200.jpg
- **Variants:** `pillars.jpeg` (copy), `pillars.png` / `pillars.webp` (ffmpeg
  re-encode), `pillars.heic` (`sips -s format heic`)

## Video — `video/bbb.*`

- **Source:** *Big Buck Bunny* © Blender Foundation, 10-second 720p clip
- **License:** Creative Commons Attribution 3.0 — credit the Blender Foundation
  (https://peach.blender.org/) when distributing.
- **Master:** `bbb.mp4` from https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4
- **Variants:** `bbb.mov` / `bbb.mkv` (ffmpeg container rewrap, `-c copy`, no
  re-encode)

## Audio — `audio/armstrong.*`

- **Source:** Neil Armstrong, *"That's one small step…"*, Apollo 11, 1969
- **License:** Public domain (NASA)
- **Master:** `armstrong.wav` from https://upload.wikimedia.org/wikipedia/commons/b/bb/Neil_Armstrong_small_step.wav
- **Variants:** `.mp3` (libmp3lame), `.aac`, `.flac`, `.m4a` (aac in mp4),
  `.ogg` (libvorbis), `.wma` (wmav2) — all ffmpeg-encoded from the WAV master.

## Regenerating

Variants can be reproduced from the masters with the bundled ffmpeg
(`src-tauri/binaries/ffmpeg-aarch64-apple-darwin`) plus macOS `sips` for HEIC.
See the original derivation commands in the project history.
