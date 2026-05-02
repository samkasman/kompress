import { readFile, writeFile, access } from 'fs/promises';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const local = process.argv.includes('--local');

function run(cmd) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: rootDir });
}

function check(cmd) {
  return execSync(cmd, { cwd: rootDir }).toString().trim();
}

// Version comes from tauri.conf.json — single source of truth
const configPath = join(rootDir, 'src-tauri/tauri.conf.json');
const config = JSON.parse(await readFile(configPath, 'utf-8'));
const version = config.version;

console.log(`\nkompress v${version}${local ? ' (local build)' : ''}\n`);

// Sync version into package.json and package-lock.json
const pkgPath = join(rootDir, 'package.json');
const lockPath = join(rootDir, 'package-lock.json');

const pkg = JSON.parse(await readFile(pkgPath, 'utf-8'));
const lock = JSON.parse(await readFile(lockPath, 'utf-8'));

let versionChanged = false;
if (pkg.version !== version) {
  pkg.version = version;
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  versionChanged = true;
}
if (lock.version !== version || lock.packages?.['']?.version !== version) {
  lock.version = version;
  if (lock.packages?.['']) lock.packages[''].version = version;
  await writeFile(lockPath, JSON.stringify(lock, null, 2) + '\n');
  versionChanged = true;
}
if (versionChanged) console.log(`✓ Synced version to package.json and package-lock.json`);

if (!local) {
  // Ensure working tree is clean (aside from version files we just touched)
  const dirty = check('git status --porcelain')
    .split('\n')
    .filter(Boolean)
    .filter((l) => !l.includes('package.json') && !l.includes('package-lock.json') && !l.includes('tauri.conf.json') && !l.includes('scripts/release.js'));
  if (dirty.length > 0) {
    console.error('✗ Uncommitted changes exist — commit or stash them first:\n' + dirty.join('\n'));
    process.exit(1);
  }

  // Check tag doesn't already exist
  const tags = check('git tag').split('\n');
  if (tags.includes(`v${version}`)) {
    console.error(`✗ Tag v${version} already exists. Bump the version in src-tauri/tauri.conf.json.`);
    process.exit(1);
  }
}

// Build + sign + copy DMG (calls sign-and-copy-release.js internally)
run('npm run tauri:build:aarch64');

const dmgPath = join(rootDir, 'releases', `kompress-v${version}-aarch64.dmg`);
try {
  await access(dmgPath);
  console.log(`\n✓ DMG: releases/kompress-v${version}-aarch64.dmg`);
} catch {
  console.error(`✗ Expected DMG not found: ${dmgPath}`);
  process.exit(1);
}

if (local) {
  console.log('\n✓ Local build complete. Run without --local to publish.\n');
  process.exit(0);
}

// Commit version bump, tag, push, release
run(`git add src-tauri/tauri.conf.json package.json package-lock.json scripts/release.js`);

const staged = check('git diff --cached --name-only');
if (staged) run(`git commit -m "Release v${version}"`);

run(`git tag v${version}`);
run(`git push origin HEAD`);
run(`git push origin v${version}`);
run(`gh release create v${version} "${dmgPath}" --title "v${version}" --generate-notes`);

console.log(`\n✓ Released kompress v${version}\n`);
