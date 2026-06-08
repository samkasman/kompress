import {
  readdir,
  mkdir,
  unlink,
  rm,
  symlink,
  cp,
  writeFile,
} from 'fs/promises';
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

  try {
    await unlink(dmgPath);
  } catch {
    /* doesn't exist */
  }

  // 1. Sign bundled FFmpeg binary first (innermost → outermost)
  const ffmpegBin = join(appPath, 'Contents/MacOS/ffmpeg');
  console.log('Signing FFmpeg...');
  run(
    `codesign --force --options runtime --timestamp --sign "${SIGN_IDENTITY}" "${ffmpegBin}"`
  );
  console.log('✓ FFmpeg signed');

  // 2. Sign app bundle with hardened runtime + entitlements
  console.log('Signing app bundle...');
  run(
    `codesign --force --options runtime --timestamp --entitlements "${entitlementsPath}" --sign "${SIGN_IDENTITY}" "${appPath}"`
  );
  console.log('✓ App signed');

  // 3. Create DMG with Applications symlink for drag-to-install
  console.log('Creating DMG...');
  const stagingDir = join(tmpdir(), `kompress-dmg-${Date.now()}`);
  await mkdir(stagingDir, { recursive: true });
  try {
    await cp(appPath, join(stagingDir, `${productName}.app`), {
      recursive: true,
    });
    await symlink('/Applications', join(stagingDir, 'Applications'));
    run(
      `hdiutil create -volname "${productName}" -srcfolder "${stagingDir}" -ov -format UDZO "${dmgPath}"`
    );
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
  run(
    `xcrun notarytool submit "${dmgPath}" --keychain-profile "${NOTARY_PROFILE}" --wait`
  );
  console.log('✓ Notarized');

  // 6. Staple ticket to DMG so it works offline
  console.log('Stapling DMG...');
  run(`xcrun stapler staple "${dmgPath}"`);

  // 7-10. Updater artifacts: notarize the standalone .app, staple it, tar it,
  //       minisign the tar, write latest.json. The updater downloads
  //       .app.tar.gz — it MUST be the fully signed + notarized + stapled
  //       .app, not the unsigned tauri-build output, or users will end up
  //       launching a binary Gatekeeper trusts but with no notarization
  //       ticket on the auto-updated files.
  if (!process.env.TAURI_SIGNING_PRIVATE_KEY) {
    console.warn(
      '\n⚠ TAURI_SIGNING_PRIVATE_KEY not set — skipping updater artifacts.\n' +
        "  Users on this version won't see in-app update prompts for future\n" +
        '  releases. See README "Auto-updater" for one-time key generation.'
    );
    process.exit(0);
  }

  console.log('\nNotarizing standalone .app for updater...');
  const appZip = join(tmpdir(), `kompress-app-${Date.now()}.zip`);
  run(`ditto -c -k --keepParent "${appPath}" "${appZip}"`);
  run(
    `xcrun notarytool submit "${appZip}" --keychain-profile "${NOTARY_PROFILE}" --wait`
  );
  await unlink(appZip);
  console.log('✓ .app notarized');

  console.log('Stapling .app...');
  run(`xcrun stapler staple "${appPath}"`);
  console.log('✓ .app stapled');

  // Tar the stapled .app exactly the way Tauri's updater expects it.
  const tarPath = join(
    releasesDir,
    `${productName}-v${version}-${arch}.app.tar.gz`
  );
  try {
    await unlink(tarPath);
  } catch {
    /* doesn't exist */
  }
  console.log('Tarring stapled .app...');
  run(`tar -czf "${tarPath}" -C "${dirname(appPath)}" "${productName}.app"`);

  // Minisign the tar. Tauri's signer CLI reads TAURI_SIGNING_PRIVATE_KEY
  // (the key content) and TAURI_SIGNING_PRIVATE_KEY_PASSWORD (the passphrase).
  console.log('Minisigning updater tarball...');
  run(
    `npx --no-install @tauri-apps/cli signer sign --private-key "$TAURI_SIGNING_PRIVATE_KEY" "${tarPath}"`
  );
  const sigPath = `${tarPath}.sig`;
  const signature = (await readFile(sigPath, 'utf-8')).trim();

  // Build the latest.json manifest. Tauri updater reads this from
  // https://github.com/.../releases/latest/download/latest.json — GitHub
  // auto-redirects /latest to whichever tag is marked "latest", so no
  // hosting setup needed.
  const downloadUrl = `https://github.com/samkasman/kompress/releases/download/v${version}/${productName}-v${version}-${arch}.app.tar.gz`;
  const manifest = {
    version: `v${version}`,
    notes: `kompress v${version} — see CHANGELOG.md for details.`,
    pub_date: new Date().toISOString(),
    platforms: {
      'darwin-aarch64': {
        signature,
        url: downloadUrl,
      },
    },
  };
  const manifestPath = join(releasesDir, 'latest.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

  console.log(`\n✓ Done`);
  console.log(`  releases/${productName}-v${version}-${arch}.dmg`);
  console.log(`  releases/${productName}-v${version}-${arch}.app.tar.gz`);
  console.log(`  releases/${productName}-v${version}-${arch}.app.tar.gz.sig`);
  console.log(`  releases/latest.json\n`);
} catch (error) {
  console.error('✗ Error:', error.message);
  process.exit(1);
}
