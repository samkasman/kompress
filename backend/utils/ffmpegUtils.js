import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set the ffmpeg path from the bundled static binary
ffmpeg.setFfmpegPath(ffmpegStatic);

export { ffmpeg };

