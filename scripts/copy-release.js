import { readdir, copyFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const configPath = join(rootDir, 'src-tauri/tauri.conf.json');
const releasesDir = join(rootDir, 'releases');

// Check for architecture-specific paths
const possiblePaths = [
  'src-tauri/target/aarch64-apple-darwin/release/bundle',
  'src-tauri/target/x86_64-apple-darwin/release/bundle',
  'src-tauri/target/release/bundle',
];

try {
  const config = JSON.parse(await readFile(configPath, 'utf-8'));
  const version = config.version;
  const productName = config.productName || 'sk-compress';

  await mkdir(releasesDir, { recursive: true });

  // Find DMG in any of the possible build paths
  let dmgFile = null;
  let sourceDir = null;

  for (const basePath of possiblePaths) {
    const dmgDir = join(rootDir, basePath, 'dmg');
    const macosDir = join(rootDir, basePath, 'macos');

    for (const dir of [dmgDir, macosDir]) {
      try {
        const files = await readdir(dir);
        const found = files.find(
          (f) => f.endsWith('.dmg') && !f.startsWith('rw.')
        );
        if (found) {
          dmgFile = found;
          sourceDir = dir;
          break;
        }
      } catch {
        // Directory doesn't exist, continue
      }
    }
    if (dmgFile) break;
  }

  if (dmgFile && sourceDir) {
    // Extract architecture from filename
    const archMatch = dmgFile.match(/_([a-z0-9_]+)\.dmg$/);
    const arch = archMatch ? archMatch[1] : 'unknown';

    const sourcePath = join(sourceDir, dmgFile);
    const destPath = join(
      releasesDir,
      `${productName}-v${version}-${arch}.dmg`
    );

    await copyFile(sourcePath, destPath);
    console.log(`✓ Copied to releases/${productName}-v${version}-${arch}.dmg`);
  } else {
    console.log(
      '⚠ No DMG found - build may have failed or DMG creation was skipped'
    );
  }
} catch (error) {
  console.error('Error copying release:', error);
  process.exit(1);
}
