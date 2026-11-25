// Shared constants for Saffron Rush: tile grid, colors, recipes and tuning.
export const TILE = 56;
export const COLS = 16;
export const ROWS = 11;
export const VIEW_W = COLS * TILE;      // 896
export const VIEW_H = ROWS * TILE + 92; // top band holds HUD + order board

export const COLORS = {
  floorA: '#c9b18f',
  floorB: '#bda583',
  wall: '#4a3327',
  counter: '#8a5a3b',
  counterTop: '#d9d2c5',
  board: '#2b2320',
  boardInk: '#f4e9d8',
  accent: '#e0703a',
  good: '#5fae5a',
  bad: '#c4453c',
  timer: '#e8b64c',
  chef: '#2f6f8f',
  chefHat: '#f5f1e6',
};

// Ingredient catalog: whether it must be chopped, and whether it must be cooked.
export const INGREDIENTS = {
  tomato:   { name: 'Tomato',   color: '#d9483b', chop: true,  cook: false },
  mushroom: { name: 'Mushroom', color: '#b99a7a', chop: true,  cook: true  },
  onion:    { name: 'Onion',    color: '#e8d9b6', chop: true,  cook: false },
  cheese:   { name: 'Cheese',   color: '#f0c64e', chop: true,  cook: false },
  basil:    { name: 'Basil',    color: '#4f8f3f', chop: false, cook: false },
  dough:    { name: 'Dough',    color: '#e9dab8', chop: false, cook: true  },
};

// Prepared-item states.
export const STATES = { RAW: 'raw', CHOP: 'chopped', COOK: 'cooked' };

// Recipes: each order asks for a set of prepared items on one plate.
// An item id is "<ingredient>:<state>".
export const RECIPES = [
  { id: 'garden-salad', name: 'Garden Salad',  items: ['tomato:chopped', 'basil:raw'] },
  { id: 'salsa-dip',    name: 'Salsa Dip',     items: ['tomato:chopped', 'onion:chopped'] },
  { id: 'mush-soup',    name: 'Mushroom Soup', items: ['mushroom:cooked', 'onion:chopped'] },
  { id: 'flatbread',    name: 'Flatbread',     items: ['dough:cooked', 'cheese:chopped'] },
  { id: 'chef-pizza',   name: 'Chef Pizza',    items: ['dough:cooked', 'tomato:chopped', 'cheese:chopped'] },
  { id: 'hearty-stew',  name: 'Hearty Stew',   items: ['mushroom:cooked', 'tomato:chopped', 'basil:raw'] },
];

// Recipes unlocked per level: level 1 uses the first three, later levels add more.
export function recipesForLevel(level) {
  const n = Math.min(3 + Math.floor((level - 1) / 2), RECIPES.length);
  return RECIPES.slice(0, n);
}

export const TUNING = {
  chefSpeed: 3.4,          // px per frame at 60fps
  chopTicks: 45,           // frames to chop
  cookTicks: 160,          // frames to cook in the pan
  burnTicks: 300,          // frames in pan past done before it burns
  orderBaseTicks: 1500,    // order patience at level 1
  orderMinTicks: 700,      // patience floor
  spawnEvery: 560,         // frames between orders at level 1
  spawnMin: 260,
  tipsPerfect: 120,        // tip bonus when more than 60% patience is left
  lives: 3,
};
