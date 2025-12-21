import { ffmpeg } from '../utils/ffmpegUtils.js';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function compressImage(inputPath, outputPath, quality = 85) {
  return new Promise((resolve, reject) => {
    if (!existsSync(inputPath)) {
      reject(new Error(`File not found: ${inputPath}`));
      return;
    }

    ffmpeg(inputPath)
      .output(outputPath)
      .outputOptions(['-q:v', quality.toString()])
      .on('start', (commandLine) => {
        console.log('FFmpeg command: ' + commandLine);
      })
      .on('end', () => {
        resolve(outputPath);
      })
      .on('error', (err) => {
        reject(err);
      })
      .run();
  });
}

