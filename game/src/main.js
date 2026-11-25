// Saffron Rush — main loop: title, play, level transitions and game over.
// URL params: ?shot=mid|late|plate&seed=N stage a deterministic scene for screenshots.

import { COLS, RECIPES, TILE, TUNING, VIEW_H, VIEW_W, recipesForLevel } from './config.js';
import { Input } from './input.js';
import { levelInfo, LEVELS } from './levels.js';
import { moveChef } from './movement.js';
import { OrderBoard } from './orderBoard.js';
import { PlateRack } from './plates.js';
import { drawItem, drawPlate, drawTitle, render } from './render.js';
import { mulberry32 } from './rng.js';
import { Scorekeeper } from './scoring.js';
import { Sfx } from './sfx.js';
import { nextId, World } from './world.js';

const canvas = document.getElementById('game');
canvas.width = VIEW_W;
canvas.height = VIEW_H;
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(location.search);
const shotMode = params.get('shot');
const seed = Number(params.get('seed') ?? Date.now()) >>> 0;
const rng = mulberry32(seed);

let input = new Input();
let sfx = new Sfx();
let world, board, rack, score, clock, t = 0;
let screen = 'title'; // title | play | over | win

function startGame() {
  world = new World(1);
  board = new OrderBoard(1, rng);
  rack = new PlateRack();
  score = new Scorekeeper();
  clock = 300 * 60; // 5 minutes of service
  screen = 'play';
  sfx.resume();
  sfx.startMusic();
}

function nextLevel() {
  const lv = score.level;
  world.level = lv;
  board = new OrderBoard(lv, rng);
  board.spawnTimer = 120;
  clock = 300 * 60;
  world.flash(levelInfo(lv).name + '!');
  sfx.levelUp();
}

// Stage a deterministic scene for the screenshot harness.
function stageShot(mode) {
  startGame();
  screen = 'play';
  sfx.stopMusic();
  if (mode === 'mid') {
    // dish mid-assembly: chopped tomato on board, chef holding dough, one order up
    const b = findFirst('s');
    world.placeItem(b.col, b.row, { id: nextId(), ing: 'tomato', state: 'chopped' });
    world.progress.set(world.key(b.col, b.row), { ticks: 20, target: TUNING.chopTicks, kind: 'chop' });
    world.chef.held = { id: nextId(), ing: 'cheese', state: 'raw' };
    world.chef.x = 4 * TILE; world.chef.y = 3 * TILE;
    board.orders.push({ id: 'demo', recipe: RECIPES[0], ticksLeft: 1100, total: 1500 });
    board.orders.push({ id: 'demo2', recipe: RECIPES[2], ticksLeft: 500, total: 1500 });
    clock = 237 * 60;
    t = 40;
  } else if (mode === 'late') {
    // service rush: three orders, cooking pan
    const p = findFirst('p');
    world.placeItem(p.col, p.row, { id: nextId(), ing: 'mushroom', state: 'cooked' });
    const c = findFirst('c');
    world.placeItem(c.col, c.row, { id: nextId(), ing: 'onion', state: 'chopped' });
    board.orders.push({ id: 'd1', recipe: RECIPES[1], ticksLeft: 900, total: 1500 });
    board.orders.push({ id: 'd2', recipe: RECIPES[2], ticksLeft: 420, total: 1500 });
    board.orders.push({ id: 'd3', recipe: RECIPES[4], ticksLeft: 1300, total: 1500 });
    world.chef.held = { id: nextId(), ing: 'basil', state: 'raw' };
    clock = 96 * 60;
    t = 90;
  } else if (mode === 'plate') {
    // a finished plate on the counter ready to serve
    const c = findFirst('c');
    const plate = rack.newPlate();
    plate.contents = ['dough:cooked', 'tomato:chopped', 'cheese:chopped'];
    world.placeItem(c.col, c.row, plate);
    const b = findFirst('s');
    world.placeItem(b.col, b.row, { id: nextId(), ing: 'onion', state: 'chopped' });
    board.orders.push({ id: 'd1', recipe: RECIPES[4], ticksLeft: 1200, total: 1500 });
    world.chef.x = 2 * TILE; world.chef.y = 8 * TILE;
    clock = 210 * 60;
    t = 12;
  }
}

function findFirst(ch) {
  for (let r = 0; r < MAP_ROWS; r++) {
    const line = MAP_LINES[r];
    const c = line.indexOf(ch);
    if (c !== -1) return { col: c, row: r };
  }
  return { col: 1, row: 1 };
}
import { MAP as MAP_LINES } from './kitchenMap.js';
const MAP_ROWS = MAP_LINES.length;

let last = performance.now();
let chopNoiseAt = 0;

function frame(now) {
  const dt = Math.min(50, now - last);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}

function update(dt) {
  t += dt;
  if (screen !== 'play') {
    if (input.consumeInteract()) { startGame(); }
    if (input.consumePause()) input.consumePause();
    return;
  }
  if (input.consumePause()) {
    world.paused = !world.paused;
    if (world.paused) sfx.stopMusic(); else sfx.startMusic();
  }
  if (world.paused || world.over) return;

  clock -= dt / 16.67;
  if (clock <= 0) { endGame(); return; }

  const { dx, dy } = input.axis();
  const speed = TUNING.chefSpeed * (dt / 16.67);
  moveChef(world, dx * speed, dy * speed);

  // chopping sound while a chop progresses near the chef
  const spot = world.facingTile();
  if (spot && world.progress.get(world.key(spot.col, spot.row))?.kind === 'chop') {
    if (t - chopNoiseAt > 300) { sfx.chop(); chopNoiseAt = t; }
  }

  if (input.consumeInteract()) {
    const before = world.chef.held;
    world.interact(board, rack, sfx);
    // When the chef walks up holding a plate, an interact on an ingredient tile
    // first picks the ingredient up (replacing the plate in the world's logic),
    // so catch that case: put the picked ingredient on the plate instead and
    // give the plate back.
    if (before?.plate && world.chef.held && !world.chef.held.plate) {
      before.contents.push(`${world.chef.held.ing}:${world.chef.held.state}`);
      world.chef.held = before;
      sfx.put();
    }
    // Also stack items from a counter tile onto a held plate in one press.
    if (world.chef.held?.plate) {
      const near = world.facingTile();
      if (near) {
        const it = world.itemAt(near.col, near.row);
        if (it && !it.plate) {
          world.chef.held.contents.push(`${it.ing}:${it.state}`);
          world.takeItem(near.col, near.row);
        }
      }
    }
  }
  if (input.consumeDrop()) world.dropHeld();

  world.update(rack);
  const expired = board.update(t);
  if (expired.length) {
    world.combo = 0;
    world.lives -= expired.length;
    world.flash('Order missed! The customer left.');
    sfx.wrong();
    if (world.lives <= 0) { endGame(); return; }
  }

  // sync level progression from the board's served count
  if (board.servedCount > score.servedInLevel) {
    score.servedInLevel = board.servedCount;
    if (score.servedInLevel >= LEVELS[score.level - 1].goal) {
      score.level += 1;
      score.servedInLevel = 0;
      nextLevel();
    }
  }
}

function endGame() {
  screen = 'over';
  sfx.stopMusic();
  sfx.gameOver();
}

function draw() {
  ctx.fillStyle = '#171310';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  if (screen === 'title') {
    // draw the kitchen behind the title for flavor
    if (world) render(ctx, { world, orderBoard: board, clock, t, level: 1, levelName: 'Saffron Rush' });
    drawTitle(ctx, 'Saffron Rush', 'Cook the orders before they leave!  SPACE/E: interact · Q: drop · P: pause · arrows to move');
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('Press SPACE to start the shift', VIEW_W / 2, VIEW_H / 2 + 44);
    return;
  }
  render(ctx, { world, orderBoard: board, clock, t, level: score.level, levelName: levelInfo(score.level).name });
  if (world.paused) {
    drawTitle(ctx, 'Paused', 'Press P to return to the kitchen');
  }
  if (screen === 'over') {
    drawTitle(ctx, 'Shift Over', `Final score ${world.score} — served ${score.totalServed} dishes. Press SPACE for a new shift.`);
  }
}

// Boot: staged screenshot mode or the title screen.
if (shotMode) {
  stageShot(shotMode);
  screen = 'play';
  draw();
  window.__shotReady = true;
} else {
  startGame();
  screen = 'title';
  sfx.stopMusic();
  draw();
  requestAnimationFrame(frame);
}
