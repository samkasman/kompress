import { readdir, mkdir, unlink, rm, symlink, cp } from 'fs/promises';
import { tmpdir } from 'os';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const SIGN_IDENTITY = 'Developer ID Application: Sam Kasman (WC8RY44BN7)';
const NOTARY_PROFILE = 'kompress-notary';

const configPath = join(rootDir, 'src-tauri/tauri.conf.json');
const entitlementsPath = join(rootDir, 'src-tauri/entitlements.plist');
const releasesDir = join(rootDir, 'releases');

const possiblePaths = [
  'src-tauri/target/aarch64-apple-darwin/release/bundle',
  'src-tauri/target/x86_64-apple-darwin/release/bundle',
  'src-tauri/target/release/bundle',
];

function run(cmd) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

try {
  const config = JSON.parse(await readFile(configPath, 'utf-8'));
  const version = config.version;
  const productName = config.productName || 'kompress';

  await mkdir(releasesDir, { recursive: true });

  // Find .app bundle
  let appPath = null;
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

  if (!appPath) {
    console.error('✗ No .app bundle found');
    process.exit(1);
  }

  const arch = appPath.includes('x86_64') ? 'x86_64' : 'aarch64';
  const dmgPath = join(releasesDir, `${productName}-v${version}-${arch}.dmg`);

  try { await unlink(dmgPath); } catch { /* doesn't exist */ }

  // 1. Sign bundled FFmpeg binary first (innermost → outermost)
  const ffmpegBin = join(appPath, 'Contents/MacOS/ffmpeg');
  console.log('Signing FFmpeg...');
  run(`codesign --force --options runtime --timestamp --sign "${SIGN_IDENTITY}" "${ffmpegBin}"`);
  console.log('✓ FFmpeg signed');

  // 2. Sign app bundle with hardened runtime + entitlements
  console.log('Signing app bundle...');
  run(`codesign --force --options runtime --timestamp --entitlements "${entitlementsPath}" --sign "${SIGN_IDENTITY}" "${appPath}"`);
  console.log('✓ App signed');

  // 3. Create DMG with Applications symlink for drag-to-install
  console.log('Creating DMG...');
  const stagingDir = join(tmpdir(), `kompress-dmg-${Date.now()}`);
  await mkdir(stagingDir, { recursive: true });
  try {
    await cp(appPath, join(stagingDir, `${productName}.app`), { recursive: true });
    await symlink('/Applications', join(stagingDir, 'Applications'));
    run(`hdiutil create -volname "${productName}" -srcfolder "${stagingDir}" -ov -format UDZO "${dmgPath}"`);
  } finally {
    await rm(stagingDir, { recursive: true, force: true });
  }
  console.log('✓ DMG created');

  // 4. Sign DMG
  console.log('Signing DMG...');
  run(`codesign --force --timestamp --sign "${SIGN_IDENTITY}" "${dmgPath}"`);
  console.log('✓ DMG signed');

  // 5. Notarize (submits to Apple and waits for approval)
  console.log('Notarizing — this takes a minute...');
  run(`xcrun notarytool submit "${dmgPath}" --keychain-profile "${NOTARY_PROFILE}" --wait`);
  console.log('✓ Notarized');

  // 6. Staple ticket to DMG so it works offline
  console.log('Stapling...');
  run(`xcrun stapler staple "${dmgPath}"`);
  console.log(`\n✓ Done: releases/${productName}-v${version}-${arch}.dmg\n`);

} catch (error) {
  console.error('✗ Error:', error.message);
  process.exit(1);
}
