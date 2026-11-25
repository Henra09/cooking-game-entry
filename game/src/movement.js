// Chef movement with tile collision: the chef is a circle that slides along counters.
import { TILE } from './config.js';
import { blocks, MAP } from './kitchenMap.js';

const R = 14; // chef radius in px

function solidAt(px, py) {
  const col = Math.floor(px / TILE);
  const row = Math.floor(py / TILE);
  if (row < 0 || row >= MAP.length) return true;
  const line = MAP[row];
  if (col < 0 || col >= line.length) return true;
  return blocks(line[col]);
}

// Try a move; separate axes so sliding along walls feels smooth.
export function moveChef(world, dx, dy) {
  const c = world.chef;
  if (dx) c.dir = dx > 0 ? 1 : -1;
  // X axis
  let nx = c.x + dx;
  if (!collides(nx, c.y)) c.x = nx;
  // Y axis
  let ny = c.y + dy;
  if (!collides(c.x, ny)) c.y = ny;
  clampToWorld(c);
}

function collides(x, y) {
  for (const [ox, oy] of [[-R, -R], [R, -R], [-R, R], [R, R], [0, 0]]) {
    if (solidAt(x + ox, y + oy)) return true;
  }
  return false;
}

function clampToWorld(c) {
  const maxX = MAP[0].length * TILE - R - 1;
  const maxY = MAP.length * TILE - R - 1;
  c.x = Math.min(maxX, Math.max(R + 1, c.x));
  c.y = Math.min(maxY, Math.max(R + 1, c.y));
}
