// All drawing: floor, walls, counters, stations, items, chef, order board and HUD.
import { MAP, TILE_KIND } from './kitchenMap.js';
import { COLORS, INGREDIENTS, TILE, VIEW_H, VIEW_W } from './config.js';

const ITEM_R = 15;

// Draw one prepared ingredient as a small food token.
export function drawItem(ctx, x, y, item, scale = 1) {
  if (item.plate) return drawPlate(ctx, x, y, item, scale);
  const info = INGREDIENTS[item.ing];
  if (!info) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = info.color;
  if (item.state === 'chopped') {
    // a little pile of pieces
    ctx.fillRect(-9, -7, 7, 6);
    ctx.fillRect(0, -9, 8, 7);
    ctx.fillRect(-4, 1, 8, 6);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-9, -7, 7, 6);
    ctx.strokeRect(0, -9, 8, 7);
  } else if (item.state === 'cooked') {
    ctx.beginPath();
    ctx.arc(0, 0, ITEM_R - 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(90,45,10,0.45)';
    ctx.beginPath();
    ctx.arc(-3, -3, 5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, ITEM_R - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(-4, -5, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  // tiny label
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(info.name.slice(0, 3).toUpperCase(), 0, ITEM_R + 6);
  ctx.restore();
}

export function drawPlate(ctx, x, y, plate, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#f2efe6';
  ctx.beginPath();
  ctx.ellipse(0, 0, 19, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b9b2a4';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  plate.contents.forEach((c, i) => {
    const [ing] = c.split(':');
    const info = INGREDIENTS[ing];
    if (!info) return;
    ctx.fillStyle = info.color;
    const bx = -9 + i * 9;
    ctx.fillRect(bx, -5, 7, 7);
  });
  ctx.restore();
}

// The chef: a small character with a hat, facing dir.
function drawChef(ctx, chef) {
  const { x, y } = chef;
  ctx.save();
  ctx.translate(x, y);
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 16, 16, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // body
  ctx.fillStyle = COLORS.chef;
  ctx.beginPath();
  ctx.roundRect(-13, -12, 26, 26, 8);
  ctx.fill();
  // apron
  ctx.fillStyle = '#e8e2d2';
  ctx.fillRect(-8, -2, 16, 14);
  // head + hat
  ctx.fillStyle = '#e9b98a';
  ctx.beginPath();
  ctx.arc(0, -14, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.chefHat;
  ctx.beginPath();
  ctx.roundRect(-10, -28, 20, 9, 4);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-6, -27, 5, 0, Math.PI * 2);
  ctx.arc(6, -27, 5, 0, Math.PI * 2);
  ctx.arc(0, -31, 6, 0, Math.PI * 2);
  ctx.fill();
  // eyes by facing
  ctx.fillStyle = '#222';
  const ex = chef.dir === 1 ? 3 : chef.dir === -1 ? -3 : 0;
  ctx.fillRect(ex - 3, -16, 2, 3);
  ctx.fillRect(ex + 2, -16, 2, 3);
  ctx.restore();
  // held item floats above
  if (chef.held) drawItem(ctx, x, y - 46, chef.held, 0.9);
}

function drawStation(ctx, kind, px, py, item, prog, t) {
  if (kind === 'board') {
    ctx.fillStyle = '#7a5230';
    ctx.fillRect(px + 5, py + 10, TILE - 10, TILE - 20);
    ctx.strokeStyle = '#5c3d22';
    ctx.strokeRect(px + 5, py + 10, TILE - 10, TILE - 20);
  } else if (kind === 'pan') {
    ctx.fillStyle = '#3a3a42';
    ctx.beginPath();
    ctx.arc(px + TILE / 2, py + TILE / 2, 19, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#232329';
    ctx.beginPath();
    ctx.arc(px + TILE / 2, py + TILE / 2, 14, 0, Math.PI * 2);
    ctx.fill();
    // handle
    ctx.fillStyle = '#2b2b31';
    ctx.fillRect(px + TILE - 12, py + TILE / 2 - 3, 12, 6);
    if (item && item.state === 'cooked') {
      const wig = Math.sin(t / 6) * 2;
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath();
      ctx.arc(px + TILE / 2 + wig, py + TILE / 2, 10, 0, Math.PI * 2);
      ctx.fill();
    }
    if (prog && prog.kind === 'cook' && item && item.state !== 'cooked') {
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      const puff = (t / 8) % 14;
      ctx.beginPath();
      ctx.arc(px + TILE / 2, py + 10 - puff, 4 + puff / 3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'rack') {
    ctx.fillStyle = '#9aa3ad';
    ctx.fillRect(px + 6, py + 12, TILE - 12, TILE - 22);
    ctx.fillStyle = '#7d868f';
    for (let i = 0; i < 3; i++) ctx.fillRect(px + 9 + i * 15, py + 15, 9, TILE - 30);
  } else if (kind === 'pass') {
    ctx.fillStyle = COLORS.accent;
    ctx.fillRect(px + 3, py + 6, TILE - 6, TILE - 12);
    ctx.fillStyle = '#fff6ea';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PASS', px + TILE / 2, py + TILE / 2 + 4);
  } else if (kind === 'counter') {
    ctx.fillStyle = COLORS.counterTop;
    ctx.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
    ctx.strokeStyle = COLORS.counter;
    ctx.strokeRect(px + 3, py + 3, TILE - 6, TILE - 6);
  }
  if (item) drawItem(ctx, px + TILE / 2, py + TILE / 2 - 6, item, 0.85);
  if (prog) {
    const frac = Math.min(1, prog.ticks / prog.target);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(px + 6, py + TILE - 10, TILE - 12, 5);
    ctx.fillStyle = prog.kind === 'chop' ? COLORS.good : COLORS.timer;
    ctx.fillRect(px + 6, py + TILE - 10, (TILE - 12) * frac, 5);
  }
}

// Full kitchen view. state: { world, orderBoard, clock, levelName }
export function render(ctx, state) {
  const { world, orderBoard, t } = state;
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // floor
  for (let r = 0; r < MAP.length; r++) {
    for (let c = 0; c < MAP[r].length; c++) {
      const ch = MAP[r][c];
      const px = c * TILE, py = r * TILE;
      if (ch === '.') {
        ctx.fillStyle = (r + c) % 2 ? COLORS.floorA : COLORS.floorB;
        ctx.fillRect(px, py, TILE, TILE);
      } else if (ch === '#') {
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(px, py + TILE - 8, TILE, 8);
      } else {
        ctx.fillStyle = COLORS.counter;
        ctx.fillRect(px, py, TILE, TILE);
        drawStation(ctx, TILE_KIND[ch], px, py, world.itemAt(c, r), world.progress.get(world.key(c, r)), t);
        // source tiles show their ingredient on the counter edge
        const src = { t: 'tomato', m: 'mushroom', o: 'onion', b: 'basil', h: 'cheese', e: 'dough' }[ch];
        if (src && !world.itemAt(c, r)) {
          ctx.fillStyle = INGREDIENTS[src].color;
          ctx.beginPath();
          ctx.arc(px + TILE / 2, py + TILE / 2 - 4, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.beginPath();
          ctx.arc(px + TILE / 2 - 4, py + TILE / 2 - 8, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  drawChef(ctx, world.chef);

  // banner
  if (world.banner) {
    ctx.fillStyle = 'rgba(20,16,12,0.85)';
    ctx.fillRect(0, TILE * MAP.length - 26, VIEW_W, 26);
    ctx.fillStyle = COLORS.boardInk;
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(world.banner.text, VIEW_W / 2, TILE * MAP.length - 8);
  }

  // top strip: HUD + order board
  drawTop(ctx, state);
}

function drawTop(ctx, state) {
  const { world, orderBoard, clock, levelName } = state;
  const stripH = VIEW_H - TILE * MAP.length;
  const y0 = TILE * MAP.length;
  ctx.fillStyle = COLORS.board;
  ctx.fillRect(0, y0, VIEW_W, stripH);

  // orders as ticket cards
  let x = 12;
  for (const o of orderBoard.orders) {
    const w = 150, h = stripH - 16;
    const frac = o.ticksLeft / o.total;
    ctx.fillStyle = frac < 0.3 ? '#5a2a26' : '#3a3128';
    ctx.beginPath();
    ctx.roundRect(x, y0 + 8, w, h, 6);
    ctx.fill();
    ctx.strokeStyle = frac < 0.3 ? COLORS.bad : COLORS.timer;
    ctx.stroke();
    ctx.fillStyle = COLORS.boardInk;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(o.recipe.name, x + 8, y0 + 24);
    // ingredients wanted
    o.recipe.items.forEach((it, i) => {
      const [ing, st] = it.split(':');
      const info = INGREDIENTS[ing];
      ctx.fillStyle = info.color;
      ctx.beginPath();
      ctx.arc(x + 14 + i * 22, y0 + 40, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = '8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(st === 'chopped' ? 'C' : st === 'cooked' ? 'K' : '•', x + 14 + i * 22, y0 + 43);
    });
    // patience bar
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x + 8, y0 + h - 14, w - 16, 7);
    ctx.fillStyle = frac > 0.5 ? COLORS.good : frac > 0.25 ? COLORS.timer : COLORS.bad;
    ctx.fillRect(x + 8, y0 + h - 14, (w - 16) * frac, 7);
    x += w + 10;
  }

  // HUD right side: timer, score, lives, level
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.boardInk;
  ctx.font = 'bold 16px monospace';
  const secs = Math.max(0, Math.floor(clock / 60));
  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  ctx.fillText(`⏱ ${mm}:${ss}`, VIEW_W - 16, y0 + 24);
  ctx.font = 'bold 14px monospace';
  ctx.fillText(`Score ${world.score}`, VIEW_W - 16, y0 + 44);
  ctx.fillText('♥ '.repeat(Math.max(0, world.lives)).trim() || '—', VIEW_W - 16, y0 + 62);
  ctx.font = '12px sans-serif';
  ctx.fillText(`${levelName} · Lv ${state.level}`, VIEW_W - 16, y0 + stripH - 6);
}

// Title screen text overlay.
export function drawTitle(ctx, title, subtitle) {
  ctx.fillStyle = 'rgba(24,18,14,0.82)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.timer;
  ctx.font = 'bold 54px Georgia, serif';
  ctx.fillText(title, VIEW_W / 2, VIEW_H / 2 - 40);
  ctx.fillStyle = COLORS.boardInk;
  ctx.font = '18px sans-serif';
  ctx.fillText(subtitle, VIEW_W / 2, VIEW_H / 2 + 4);
}
