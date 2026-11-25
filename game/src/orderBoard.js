// Order board: customers' orders with patience timers. Serves plates, spawns orders.
import { RECIPES, recipesForLevel, TUNING } from './config.js';

export class OrderBoard {
  constructor(level, rng) {
    this.level = level;
    this.rng = rng;
    this.orders = [];
    this.menu = recipesForLevel(level);
    this.spawnTimer = 180; // first order comes fast
    this.servedCount = 0;
    this.pointsScale = 1 + (level - 1) * 0.25;
  }

  patience() {
    return Math.max(TUNING.orderMinTicks, TUNING.orderBaseTicks - (this.level - 1) * 120);
  }

  spawnInterval() {
    const t = TUNING.spawnEvery - (this.level - 1) * 40;
    return Math.max(TUNING.spawnMin, t) + Math.floor(this.rng() * 160);
  }

  update(ticks) {
    this.spawnTimer -= 1;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = this.spawnInterval();
      if (this.orders.length < 4) this.orders.push(this.newOrder());
    }
    for (const o of this.orders) o.ticksLeft -= 1;
    const expired = this.orders.filter((o) => o.ticksLeft <= 0);
    this.orders = this.orders.filter((o) => o.ticksLeft > 0);
    return expired;
  }

  newOrder() {
    const recipe = this.menu[Math.floor(this.rng() * this.menu.length)];
    return { id: Math.random().toString(36).slice(2), recipe, ticksLeft: this.patience(), total: this.patience() };
  }

  // Judge a plate's contents against open orders. Best exact match wins.
  judge(contents, now) {
    const need = [...contents].sort().join('|');
    for (const o of this.orders) {
      const want = [...o.recipe.items].sort().join('|');
      if (need === want) {
        const frac = o.ticksLeft / o.total;
        const base = Math.round((100 + o.recipe.items.length * 40) * this.pointsScale);
        const bonus = frac > 0.6 ? TUNING.tipsPerfect : frac > 0.3 ? 50 : 0;
        this.orders = this.orders.filter((x) => x !== o);
        this.servedCount += 1;
        return { ok: true, name: o.recipe.name, points: base + bonus, tip: bonus };
      }
    }
    if (contents.length === 0) return { ok: false, reason: 'empty' };
    return { ok: false, reason: 'wrong' };
  }

  openCount() { return this.orders.length; }
}
