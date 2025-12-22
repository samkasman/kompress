import { readdir, rename, readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const dmgDir = join(rootDir, 'src-tauri/target/release/bundle/dmg');
const macosDir = join(rootDir, 'src-tauri/target/release/bundle/macos');
const configPath = join(rootDir, 'src-tauri/tauri.conf.json');

try {
  const config = JSON.parse(await readFile(configPath, 'utf-8'));
  const version = config.version;
  const productName = config.productName || 'sk-compress';

  // Check dmg directory first, then macos directory
  let dmgFile = null;
  let sourceDir = null;
  
  try {
    const dmgFiles = await readdir(dmgDir);
    dmgFile = dmgFiles.find((f) => f.endsWith('.dmg') && !f.startsWith('rw.'));
    if (dmgFile) sourceDir = dmgDir;
  } catch {
    // dmg directory might not exist
  }
  
  if (!dmgFile) {
    try {
      const macosFiles = await readdir(macosDir);
      dmgFile = macosFiles.find((f) => f.endsWith('.dmg') && !f.startsWith('rw.'));
      if (dmgFile) sourceDir = macosDir;
    } catch {
      // macos directory might not exist
    }
  }
  
  if (dmgFile && sourceDir) {
    const oldPath = join(sourceDir, dmgFile);
    const newPath = join(sourceDir, `${productName}-v${version}.dmg`);
    await rename(oldPath, newPath);
    console.log(`✓ Renamed ${dmgFile} to ${productName}-v${version}.dmg`);
    console.log(`  Location: ${sourceDir}`);
  } else {
    console.log('No DMG file found to rename');
  }
} catch (error) {
  console.error('Error renaming DMG:', error);
  process.exit(1);
}

