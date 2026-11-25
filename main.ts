// Hands Saffron Rush in: copies the game's static files and the screenshots of it
// playing into the output directory, then writes the dossier the judge reads with
// the vendored make.fun library. Outside the grader, MAKEFUN_OUTPUT_DIR stands in
// for /output; the scorer's own caps are checked here so an over-cap entry fails
// fast at build time instead of at the gate.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// Pre-flight: count what we copied so the caps are met before the dossier is built.
const gameRoot = join(out, 'game');
let gameEntries = 0;
let gameBytes = 0;
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const stats = statSync(full);
    gameEntries += 1;
    if (stats.isDirectory()) walk(full);
    else gameBytes += stats.size;
  }
};
walk(gameRoot);
if (gameEntries > 993) throw new Error(`game/ holds ${gameEntries} entries, over the 993 cap`);
if (gameBytes > 50331648) throw new Error(`game/ is ${gameBytes} bytes, over the 48 MiB cap`);
const shots = existsSync(join(out, 'screenshots')) ? readdirSync(join(out, 'screenshots')) : [];
if (shots.length < 3 || shots.length > 4) throw new Error(`screenshots/ holds ${shots.length} images, need 3 or 4`);

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
console.log(`dossier written: game/ ${gameEntries} entries ${gameBytes} bytes, ${shots.length} screenshots`);
