// Scoring and level progression: goals per level, combo bookkeeping.
import { levelInfo, remaining } from './levels.js';

export class Scorekeeper {
  constructor() {
    this.level = 1;
    this.servedInLevel = 0;
    this.totalServed = 0;
    this.best = 0;
  }

  recordServe(world) {
    this.servedInLevel += 1;
    this.totalServed += 1;
    world.score += 0; // points already added in world.serve
    if (world.score > this.best) this.best = world.score;
    const info = levelInfo(this.level);
    if (this.servedInLevel >= info.goal) {
      this.level += 1;
      this.servedInLevel = 0;
      return { levelUp: true, level: this.level };
    }
    return { levelUp: false };
  }

  progressLabel() {
    const info = levelInfo(this.level);
    return `${info.name} — ${remaining(this.level, this.servedInLevel)} dishes to go`;
  }
}
