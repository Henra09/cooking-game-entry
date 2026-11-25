// World state: the chef, items on counters/stations, plates, station timers.
// An "item" is { ing, state, id } or a { plate, contents: [...] } object.
// Station slots hold at most one item each.

import { TILE } from './config.js';
import { MAP, SOURCE_TILE, TILE_KIND } from './kitchenMap.js';
import { STATES, TUNING } from './config.js';

export let uid = 0;
export const nextId = () => ++uid;

export class World {
  constructor(level) {
    this.level = level;
    this.chef = { x: 7.5 * TILE, y: 8.5 * TILE, dir: 0, held: null }; // pixel center
    // Items sitting on top of a tile, keyed "col,row".
    this.slots = new Map();
    // Per-station progress, keyed "col,row".
    this.progress = new Map(); // { ticks, target, kind }
    this.score = 0;
    this.lives = TUNING.lives;
    this.combo = 0;
    this.elapsed = 0;
    this.paused = false;
    this.over = false;
    this.banner = null; // { text, ticks }
  }

  tileAt(col, row) {
    if (row < 0 || row >= MAP.length) return '#';
    const line = MAP[row];
    return col < 0 || col >= line.length ? '#' : line[col];
  }

  key(col, row) { return col + ',' + row; }

  itemAt(col, row) { return this.slots.get(this.key(col, row)) ?? null; }

  placeItem(col, row, item) { this.slots.set(this.key(col, row), item); }

  takeItem(col, row) {
    const k = this.key(col, row);
    const item = this.slots.get(k) ?? null;
    this.slots.delete(k);
    this.progress.delete(k);
    return item;
  }

  // Interactable tile in front of the chef (based on facing), else the one underfoot-adjacent.
  facingTile() {
    const cx = Math.floor(this.chef.x / TILE);
    const cy = Math.floor(this.chef.y / TILE);
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [dx, dy] of dirs) {
      const t = this.tileAt(cx + dx, cy + dy);
      if (TILE_KIND[t] && TILE_KIND[t] !== 'wall') return { col: cx + dx, row: cy + dy, kind: TILE_KIND[t], ch: t };
    }
    return null;
  }

  // Take from a source tile, or put down/take from stations. Returns a message.
  interact(orderBoard, plates, sfx) {
    const spot = this.facingTile();
    if (!spot) return;
    const { col, row, kind, ch } = spot;

    if (kind === 'counter' || kind === 'rack' || kind === 'pass' || kind === 'board' || kind === 'pan') {
      const there = this.itemAt(col, row);
      if (this.chef.held) {
        // Rack turns held goods into a clean plate when empty-handed items are put? No:
        // rack gives plates. Putting a plate rack item down is not allowed.
        if (there) {
          // Swap
          this.placeItem(col, row, this.chef.held);
          this.chef.held = there;
          sfx.swap();
          return;
        }
        if (kind === 'pass') { this.serve(spot, orderBoard, sfx); return; }
        if (kind === 'pan' && this.chef.held.state === STATES.COOK) {
          // cooked items cannot go back into the pan
          this.flash('Cooked food stays out of the pan!');
          sfx.deny();
          return;
        }
        this.placeItem(col, row, this.chef.held);
        this.chef.held = null;
        if (kind === 'pan') {
          this.progress.set(this.key(col, row), { ticks: 0, target: TUNING.cookTicks, kind: 'cook' });
          sfx.sizzle();
        }
        sfx.put();
        return;
      }
      // empty hands: pick up
      if (there) {
        this.chef.held = this.takeItem(col, row);
        sfx.pick();
        return;
      }
      if (kind === 'rack') {
        this.chef.held = plates.newPlate();
        sfx.pick();
        return;
      }
      if (SOURCE_TILE[ch]) {
        this.chef.held = { id: nextId(), ing: SOURCE_TILE[ch], state: STATES.RAW };
        sfx.pick();
        return;
      }
    }
    sfx.deny();
  }

  // Drop held item on the nearest free counter (Q key).
  dropHeld() {
    if (!this.chef.held) return;
    const cx = Math.floor(this.chef.x / TILE);
    const cy = Math.floor(this.chef.y / TILE);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [0, 0]]) {
      const ch = this.tileAt(cx + dx, cy + dy);
      const kind = TILE_KIND[ch];
      if ((kind === 'counter' || kind === 'board') && !this.itemAt(cx + dx, cy + dy)) {
        if (kind === 'board' && this.chef.held.state === STATES.COOK) continue;
        this.placeItem(cx + dx, cy + dy, this.chef.held);
        if (kind === 'board' && this.chef.held.state === STATES.RAW) {
          this.progress.set(this.key(cx + dx, cy + dy), { ticks: 0, target: TUNING.chopTicks, kind: 'chop' });
        }
        this.chef.held = null;
        return true;
      }
    }
    return false;
  }

  // Try to serve the held plate at the pass.
  serve(spot, orderBoard, sfx) {
    const plate = this.chef.held;
    if (!plate || !plate.plate) { this.flash('Bring a plate to the pass!'); sfx.deny(); return; }
    const result = orderBoard.judge(plate.contents, this.elapsed);
    if (result.ok) {
      this.score += result.points + (this.combo > 1 ? this.combo * 10 : 0);
      this.combo += 1;
      this.flash(`Served ${result.name}! +${result.points}${this.combo > 1 ? ` (combo x${this.combo})` : ''}`);
      sfx.serve();
    } else if (result.reason === 'wrong') {
      this.combo = 0;
      this.lives -= 1;
      this.flash(`Wrong dish! -1 life`);
      sfx.wrong();
    } else {
      sfx.deny();
    }
    this.chef.held = null;
    if (this.lives <= 0) this.over = true;
  }

  flash(text) { this.banner = { text, ticks: 110 }; }

  // Advance chopping/cooking timers, burn check.
  update(plates) {
    if (this.paused || this.over) return;
    this.elapsed += 1;
    if (this.banner && --this.banner.ticks <= 0) this.banner = null;

    for (const [k, p] of this.progress) {
      p.ticks += 1;
      const [col, row] = k.split(',').map(Number);
      const item = this.itemAt(col, row);
      if (!item) { this.progress.delete(k); continue; }
      if (p.kind === 'chop' && p.ticks >= p.target) {
        item.state = STATES.CHOP;
        this.progress.delete(k);
      } else if (p.kind === 'cook' && p.ticks >= p.target && item.state !== STATES.COOK) {
        item.state = STATES.COOK;
      } else if (p.kind === 'cook' && item.state === STATES.COOK && p.ticks >= TUNING.burnTicks) {
        // burnt: item is destroyed
        this.takeItem(col, row);
        this.flash('Burnt! In the bin it goes.');
        plates.dirtySmoke?.();
      }
    }
  }
}
