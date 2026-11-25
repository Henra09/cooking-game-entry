// Levels: pace, menu breadth and score goals per level. Reaching the goal starts the next level.
import { recipesForLevel } from './config.js';

export const LEVELS = [
  { goal: 3,  name: 'Morning Prep' },
  { goal: 4,  name: 'Lunch Line' },
  { goal: 5,  name: 'Market Rush' },
  { goal: 6,  name: 'Festival Night' },
  { goal: 8,  name: 'Chef Challenge' },
  { goal: 10, name: 'Grand Banquet' },
];

export function levelInfo(level) {
  const idx = Math.min(level - 1, LEVELS.length - 1);
  return { ...LEVELS[idx], level };
}

// Orders still needed this level (served count within the level).
export function remaining(level, servedInLevel) {
  return Math.max(0, levelInfo(level).goal - servedInLevel);
}

// Public helper other modules use to build the level menu.
export function menuFor(level) {
  return recipesForLevel(level);
}
