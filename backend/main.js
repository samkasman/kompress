import { compressImage } from './processors/imageProcessor.js';
import { compressVideo } from './processors/videoProcessor.js';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getOutputPath(inputPath, fileType) {
  const pathParts = inputPath.split(/[/\\]/);
  const fileName = pathParts[pathParts.length - 1];
  const nameWithoutExt = fileName.split('.').slice(0, -1).join('.');
  const ext = fileType === 'image' ? 'jpg' : 'mp4';
  const dir = pathParts.slice(0, -1).join('/');

  let outputPath = `${dir}/${nameWithoutExt}-compressed.${ext}`;
  let counter = 1;

  // Handle duplicate files
  while (existsSync(outputPath)) {
    outputPath = `${dir}/${nameWithoutExt}-compressed-${counter}.${ext}`;
    counter++;
  }

  return outputPath;
}

export async function compressFile(inputPath, fileType) {
  const outputPath = getOutputPath(inputPath, fileType);

  if (fileType === 'image') {
    await compressImage(inputPath, outputPath, 85);
  } else if (fileType === 'video') {
    await compressVideo(inputPath, outputPath, 22);
  } else {
    throw new Error(`Unsupported file type: ${fileType}`);
  }

  return outputPath;
}

// Run when called from command line
const args = process.argv.slice(2);
if (args.length >= 2) {
  const [inputPath, fileType] = args;
  compressFile(inputPath, fileType)
    .then((result) => {
      console.log(JSON.stringify({ success: true, result }));
      process.exit(0);
    })
    .catch((error) => {
      console.log(JSON.stringify({ success: false, error: error.message }));
      process.exit(1);
    });
}
