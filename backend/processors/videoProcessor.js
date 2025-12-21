import { ffmpeg } from '../utils/ffmpegUtils.js';
import { existsSync } from 'fs';

export function compressVideo(inputPath, outputPath, crf = 22) {
  return new Promise((resolve, reject) => {
    if (!existsSync(inputPath)) {
      reject(new Error(`File not found: ${inputPath}`));
      return;
    }

    let progressData = { percent: 0 };

    ffmpeg(inputPath)
      .output(outputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions(['-crf', crf.toString(), '-preset', 'medium'])
      .audioBitrate('128k')
      .on('start', (commandLine) => {
        console.log('FFmpeg command: ' + commandLine);
      })
      .on('progress', (progress) => {
        progressData.percent = Math.round(progress.percent || 0);
        console.log('Processing: ' + progressData.percent + '% done');
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

