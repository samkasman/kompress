import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// Set the ffmpeg path from the bundled static binary
ffmpeg.setFfmpegPath(ffmpegStatic);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Example function: Get video information
export function getVideoInfo(inputPath) {
  return new Promise((resolve, reject) => {
    if (!existsSync(inputPath)) {
      reject(new Error(`File not found: ${inputPath}`));
      return;
    }

    ffmpeg(inputPath)
      .ffprobe((err, metadata) => {
        if (err) {
          reject(err);
        } else {
          resolve(metadata);
        }
      });
  });
}

// Example function: Convert video to different format
export function convertVideo(inputPath, outputPath, options = {}) {
  return new Promise((resolve, reject) => {
    if (!existsSync(inputPath)) {
      reject(new Error(`File not found: ${inputPath}`));
      return;
    }

    let command = ffmpeg(inputPath);

    // Apply options
    if (options.format) {
      command = command.format(options.format);
    }
    if (options.videoCodec) {
      command = command.videoCodec(options.videoCodec);
    }
    if (options.audioCodec) {
      command = command.audioCodec(options.audioCodec);
    }
    if (options.videoBitrate) {
      command = command.videoBitrate(options.videoBitrate);
    }
    if (options.size) {
      command = command.size(options.size);
    }

    command
      .on('start', (commandLine) => {
        console.log('FFmpeg command: ' + commandLine);
      })
      .on('progress', (progress) => {
        console.log('Processing: ' + Math.round(progress.percent) + '% done');
      })
      .on('end', () => {
        console.log('Conversion completed!');
        resolve(outputPath);
      })
      .on('error', (err) => {
        reject(err);
      })
      .save(outputPath);
  });
}

// Example usage
if (import.meta.url === `file://${process.argv[1]}`) {
  // This file is being run directly
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('FFmpeg bundled successfully!');
    console.log('FFmpeg path:', ffmpegStatic);
    console.log('\nUsage examples:');
    console.log('  node index.js info <video-file>');
    console.log('  node index.js convert <input> <output> [options]');
  } else if (args[0] === 'info' && args[1]) {
    getVideoInfo(args[1])
      .then(metadata => {
        console.log('\nVideo Information:');
        console.log('Duration:', metadata.format.duration, 'seconds');
        console.log('Size:', metadata.format.size, 'bytes');
        console.log('Bitrate:', metadata.format.bit_rate, 'bps');
        if (metadata.streams && metadata.streams.length > 0) {
          const videoStream = metadata.streams.find(s => s.codec_type === 'video');
          if (videoStream) {
            console.log('Video Codec:', videoStream.codec_name);
            console.log('Resolution:', `${videoStream.width}x${videoStream.height}`);
            console.log('FPS:', videoStream.r_frame_rate);
          }
        }
      })
      .catch(err => {
        console.error('Error:', err.message);
        process.exit(1);
      });
  } else if (args[0] === 'convert' && args[1] && args[2]) {
    const options = {};
    // Parse simple options (you can extend this)
    if (args[3]) {
      options.format = args[3];
    }
    convertVideo(args[1], args[2], options)
      .then(outputPath => {
        console.log('Output saved to:', outputPath);
      })
      .catch(err => {
        console.error('Error:', err.message);
        process.exit(1);
      });
  }
}

