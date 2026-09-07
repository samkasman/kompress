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

const configPath = join(rootDir, 'src-tauri/tauri.conf.json');
const entitlementsPath = join(rootDir, 'src-tauri/entitlements.plist');
const releasesDir = join(rootDir, 'releases');
const pkgPath = join(rootDir, 'package.json');

/**
 * Resolve the codesigning identity:
 *   1. MACOS_SIGN_IDENTITY env var wins.
 *   2. Otherwise auto-detect the unique "Developer ID Application" cert in
 *      the user's keychain. If zero or more than one are present, error.
 * This lets the script work for any maintainer without hand-editing.
 */
function resolveSignIdentity() {
  if (process.env.MACOS_SIGN_IDENTITY) return process.env.MACOS_SIGN_IDENTITY;
  const out = execSync('security find-identity -v -p codesigning', {
    encoding: 'utf-8',
  });
  const matches = [...out.matchAll(/"(Developer ID Application: [^"]+)"/g)].map(
    (m) => m[1]
  );
  if (matches.length === 1) return matches[0];
  if (matches.length === 0) {
    throw new Error(
      'No Developer ID Application certificate found in keychain. ' +
        'Add one via Xcode → Settings → Accounts, or set MACOS_SIGN_IDENTITY.'
    );
  }
  throw new Error(
    `Multiple Developer ID Application certificates found — set MACOS_SIGN_IDENTITY to disambiguate:\n  ${matches.join('\n  ')}`
  );
}

/**
 * Default notary profile is `<productName>-notary` (e.g. `kompress-notary`)
 * unless MACOS_NOTARY_PROFILE overrides. Maintainers create this once via
 * `xcrun notarytool store-credentials <name> --apple-id … --team-id … --password …`.
 */
function resolveNotaryProfile(productName) {
  return process.env.MACOS_NOTARY_PROFILE ?? `${productName}-notary`;
}

/**
 * Parse `owner/repo` from package.json's `repository` field. Used to build
 * the updater download URL without hardcoding the GitHub slug.
 */
function resolveGithubSlug(pkg) {
  const repo = pkg?.repository?.url ?? pkg?.repository;
  if (!repo) return null;
  const match = String(repo).match(
    /github\.com[:/]([^/]+\/[^/.]+?)(?:\.git)?$/
  );
  return match?.[1] ?? null;
}

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
  const pkg = JSON.parse(await readFile(pkgPath, 'utf-8'));
  const version = config.version;
  const productName = config.productName || 'kompress';

  const SIGN_IDENTITY = resolveSignIdentity();
  const NOTARY_PROFILE = resolveNotaryProfile(productName);
  const githubSlug = resolveGithubSlug(pkg);

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
  run(`codesign --verify --deep --strict --verbose=2 "${appPath}"`);
  console.log('✓ App signed');

  // 3. Notarize and staple the .app BEFORE the DMG is built.
  //    Order matters: a ticket stapled to the DMG does NOT transfer to the
  //    .app a user drags out of it. Building the DMG from an un-stapled .app
  //    ships an app that Gatekeeper can only verify online, so a first launch
  //    offline or behind a restrictive network shows the "cannot verify
  //    developer" warning. Stapling here means both distribution paths — the
  //    DMG payload and the updater tarball — carry their own ticket.
  //    This runs unconditionally, even when updater artifacts are skipped.
  console.log('Notarizing .app — this takes a minute...');
  const appZip = join(tmpdir(), `kompress-app-${Date.now()}.zip`);
  run(`ditto -c -k --keepParent "${appPath}" "${appZip}"`);
  run(
    `xcrun notarytool submit "${appZip}" --keychain-profile "${NOTARY_PROFILE}" --wait`
  );
  await unlink(appZip);
  console.log('✓ .app notarized');

  console.log('Stapling .app...');
  run(`xcrun stapler staple "${appPath}"`);
  run(`xcrun stapler validate "${appPath}"`);
  run(`codesign --verify --deep --strict --verbose=2 "${appPath}"`);
  run(`spctl --assess --type execute --verbose=2 "${appPath}"`);
  console.log('✓ .app stapled');

  // 4. Create DMG with Applications symlink for drag-to-install. The .app
  //    staged here is already notarized and stapled.
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

  // 5. Sign DMG
  console.log('Signing DMG...');
  run(`codesign --force --timestamp --sign "${SIGN_IDENTITY}" "${dmgPath}"`);
  console.log('✓ DMG signed');

  // 6. Notarize the DMG (a separate Apple submission from the .app)
  console.log('Notarizing — this takes a minute...');
  run(
    `xcrun notarytool submit "${dmgPath}" --keychain-profile "${NOTARY_PROFILE}" --wait`
  );
  console.log('✓ Notarized');

  // 7. Staple ticket to the DMG so the download verifies offline too
  console.log('Stapling DMG...');
  run(`xcrun stapler staple "${dmgPath}"`);
  run(`xcrun stapler validate "${dmgPath}"`);

  // 8-10. Updater artifacts: tar the already-stapled .app, minisign the tar,
  //       write latest.json. The updater downloads .app.tar.gz — it MUST be
  //       the fully signed + notarized + stapled .app, not the unsigned
  //       tauri-build output, or users will end up launching a binary
  //       Gatekeeper trusts but with no notarization ticket on the
  //       auto-updated files. The .app was stapled in step 3, so this only
  //       needs to package and sign it.
  if (!process.env.TAURI_SIGNING_PRIVATE_KEY) {
    console.warn(
      '\n⚠ TAURI_SIGNING_PRIVATE_KEY not set — skipping updater artifacts.\n' +
        "  Users on this version won't see in-app update prompts for future\n" +
        '  releases. See README "Auto-updater" for one-time key generation.'
    );
    process.exit(0);
  }

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
  run(
    `COPYFILE_DISABLE=1 tar -czf "${tarPath}" -C "${dirname(appPath)}" "${productName}.app"`
  );

  // Verify the archive exactly as the updater will consume it. This catches
  // signatures damaged by packaging or restored filesystem metadata before an
  // invalid updater is uploaded.
  const verifyDir = join(tmpdir(), `kompress-updater-verify-${Date.now()}`);
  await mkdir(verifyDir, { recursive: true });
  try {
    run(`COPYFILE_DISABLE=1 tar -xzf "${tarPath}" -C "${verifyDir}"`);
    const archivedAppPath = join(verifyDir, `${productName}.app`);
    run(`codesign --verify --deep --strict --verbose=2 "${archivedAppPath}"`);
    run(`xcrun stapler validate "${archivedAppPath}"`);
    run(`spctl --assess --type execute --verbose=2 "${archivedAppPath}"`);
  } finally {
    await rm(verifyDir, { recursive: true, force: true });
  }
  console.log('✓ Updater archive verified');

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
  // hosting setup needed. GitHub slug comes from package.json's
  // `repository` field, so forks don't need to hand-edit this script.
  if (!githubSlug) {
    throw new Error(
      'Cannot build updater download URL — package.json needs a `repository` field ' +
        'pointing at the GitHub repo (e.g. "git+https://github.com/owner/name.git").'
    );
  }
  const downloadUrl = `https://github.com/${githubSlug}/releases/download/v${version}/${productName}-v${version}-${arch}.app.tar.gz`;
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
