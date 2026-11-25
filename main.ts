// Hands Saffron Rush in: copies the game's static files and the screenshots of it
// playing into the output directory, then writes the dossier the judge reads with
// the vendored make.fun library. Outside the grader, MAKEFUN_OUTPUT_DIR stands in
// for /output. Before building the dossier it re-checks every scorer cap (file
// counts, bytes, path length, screenshot count and size) so an entry that would
// be refused at the gate fails here, loudly, instead.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const CAPS = {
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
  screenshot_max: 4,
  screenshot_max_bytes: 262144,
};

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// Walk game/ once, collecting entries, bytes and any too-long path.
const gameRoot = join(out, 'game');
let gameEntries = 0;
let gameBytes = 0;
const offenders = [];
const walk = (dir, rel = '') => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const relPath = rel ? rel + sep + name : name;
    const stats = statSync(full);
    gameEntries += 1;
    if (Buffer.byteLength(relPath, 'utf8') > CAPS.game_path_max_bytes) offenders.push(relPath);
    if (stats.isDirectory()) walk(full, relPath);
    else gameBytes += stats.size;
  }
};
walk(gameRoot);
if (gameEntries > CAPS.game_max_files) throw new Error(`game/ holds ${gameEntries} entries, over the ${CAPS.game_max_files} cap`);
if (gameBytes > CAPS.game_max_bytes) throw new Error(`game/ is ${gameBytes} bytes, over the 48 MiB cap`);
if (offenders.length) throw new Error(`paths over ${CAPS.game_path_max_bytes} bytes: ${offenders.join(', ')}`);

// Screenshots: 3 or 4 whole PNG/JPEG files, each under its byte cap.
const shotsDir = join(out, 'screenshots');
const shots = existsSync(shotsDir) ? readdirSync(shotsDir).filter((n) => !n.startsWith('.')) : [];
if (shots.length < 3 || shots.length > CAPS.screenshot_max) {
  throw new Error(`screenshots/ holds ${shots.length} images, need 3 or 4`);
}
for (const name of shots) {
  const size = statSync(join(shotsDir, name)).size;
  if (size > CAPS.screenshot_max_bytes) throw new Error(`screenshot ${name} is ${size} bytes, over the ${CAPS.screenshot_max_bytes} cap`);
}

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: CAPS.screenshot_max, max_bytes: CAPS.screenshot_max_bytes },
    game_max_files: CAPS.game_max_files,
    game_max_bytes: CAPS.game_max_bytes,
    game_path_max_bytes: CAPS.game_path_max_bytes,
  }),
);
const dossierBytes = statSync(join(out, 'dossier.json')).size;
console.log(`dossier written (${dossierBytes} bytes): game/ ${gameEntries} entries, ${gameBytes} bytes, ${shots.length} screenshots`);
