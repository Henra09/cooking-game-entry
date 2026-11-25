// Plates: clean plate rack, assembled dish tracking.
import { nextId } from './world.js';

export class PlateRack {
  constructor() {
    this.dirty = 0; // cosmetic counter of burnt bins
  }

  // A plate starts empty; contents fill as items are put on it.
  newPlate() {
    return { id: nextId(), plate: true, contents: [] };
  }

  dirtySmoke() {
    this.dirty += 1;
  }
}

// Add an item onto a plate or merge plates. Returns true when it landed.
export function putOnPlate(held, target) {
  if (!target || !target.plate) return false;
  if (held.plate) {
    // merging two plates
    target.contents.push(...held.contents);
    return true;
  }
  target.contents.push(`${held.ing}:${held.state}`);
  return true;
}
