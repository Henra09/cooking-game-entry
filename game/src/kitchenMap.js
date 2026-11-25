// The kitchen map: a grid of tiles. Sources give ingredients, stations process them,
// the plate rack hands out clean plates, and the pass is where finished dishes go.
// legend: # wall, . floor, c counter (plain), s cutting board, p pan, w plate rack, d delivery pass
export const MAP = [
  '################',
  '#..............#',
  '#.ss....pp....d#',
  '#.sc...........#',
  '#..............#',
  '#.t.m.o..b.che.#',
  '#..............#',
  '#..............#',
  '#.c.........w..#',
  '#..............#',
  '################',
];

// Which map cell (col,row) each feature occupies, derived from MAP.
export function findTiles(kind) {
  const out = [];
  MAP.forEach((row, r) => {
    row.split('').forEach((ch, c) => {
      if (ch === kind) out.push({ col: c, row: r });
    });
  });
  return out;
}

export const IS_SOLID = (ch) => ch === '#' || ch !== '.';
// Anything that is not floor blocks movement.
export function blocks(ch) {
  return ch !== '.';
}

// Station tiles keyed by letter: the grid letters and what each does.
export const TILE_KIND = {
  '#': 'wall',
  '.': 'floor',
  c: 'counter',
  s: 'board',
  p: 'pan',
  w: 'rack',
  d: 'pass',
};

// Sources: lowercase ingredient letter -> ingredient id (row 5 of the map).
export const SOURCE_TILE = {
  t: 'tomato',
  m: 'mushroom',
  o: 'onion',
  b: 'basil',
  h: 'cheese',
  e: 'dough',
};

// Precomputed station lists (import-time, cheap).
export const COUNTERS = findTiles('c');
export const BOARDS = findTiles('s');
export const PANS = findTiles('p');
export const RACKS = findTiles('w');
export const PASSES = findTiles('d');
