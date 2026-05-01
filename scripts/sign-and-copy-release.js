import { readdir, copyFile, mkdir } from 'fs/promises';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execSync } from 'child_process';
import { join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const configPath = join(rootDir, 'src-tauri/tauri.conf.json');
const releasesDir = join(rootDir, 'releases');

const possiblePaths = [
  'src-tauri/target/aarch64-apple-darwin/release/bundle',
  'src-tauri/target/x86_64-apple-darwin/release/bundle',
  'src-tauri/target/release/bundle',
];

try {
  const config = JSON.parse(await readFile(configPath, 'utf-8'));
  const version = config.version;
  const productName = config.productName || 'kompress';

  await mkdir(releasesDir, { recursive: true });

  let appPath = null;
  let dmgFile = null;
  let sourceDir = null;

  // Find .app bundle
  for (const basePath of possiblePaths) {
    const macosDir = join(rootDir, basePath, 'macos');
    try {
      const files = await readdir(macosDir);
      const appBundle = files.find((f) => f.endsWith('.app'));
      if (appBundle) {
        appPath = join(macosDir, appBundle);
        break;
      }
    } catch {
      // Directory doesn't exist
    }
  }

  // Find DMG
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
        // Directory doesn't exist
      }
    }
    if (dmgFile) break;
  }

  // Ad-hoc sign the app and recreate DMG
  if (appPath) {
    try {
      console.log('Signing app bundle...');
      execSync(`codesign --force --deep --sign - "${appPath}"`, {
        stdio: 'inherit',
      });
      console.log('✓ App signed');

      // Determine architecture from path or filename
      let arch = 'aarch64';
      if (appPath.includes('x86_64')) arch = 'x86_64';
      else if (dmgFile) {
        const archMatch = dmgFile.match(/_([a-z0-9_]+)\.dmg$/);
        if (archMatch) arch = archMatch[1];
      }

      const dmgPath = join(
        releasesDir,
        `${productName}-v${version}-${arch}.dmg`
      );

      // Remove old DMG if it exists
      try {
        const { unlink } = await import('fs/promises');
        await unlink(dmgPath);
      } catch {
        // Doesn't exist, that's fine
      }

      console.log('Creating DMG with signed app...');
      execSync(
        `hdiutil create -volname "${productName}" -srcfolder "${appPath}" -ov -format UDZO "${dmgPath}"`,
        { stdio: 'inherit' }
      );
      console.log(
        `✓ Created signed DMG: releases/${productName}-v${version}-${arch}.dmg`
      );
    } catch (error) {
      console.warn(
        '⚠ Failed to sign/recreate DMG, copying existing:',
        error.message
      );
      // Fall back to copying existing DMG
      if (dmgFile && sourceDir) {
        const archMatch = dmgFile.match(/_([a-z0-9_]+)\.dmg$/);
        const arch = archMatch ? archMatch[1] : 'unknown';
        const sourcePath = join(sourceDir, dmgFile);
        const destPath = join(
          releasesDir,
          `${productName}-v${version}-${arch}.dmg`
        );
        await copyFile(sourcePath, destPath);
        console.log(
          `✓ Copied to releases/${productName}-v${version}-${arch}.dmg`
        );
      }
    }
  } else if (dmgFile && sourceDir) {
    // No app found, just copy existing DMG
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
    console.log('⚠ No app bundle or DMG found');
  }
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
