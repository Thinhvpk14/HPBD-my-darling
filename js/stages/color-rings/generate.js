import { COLOR_KEYS } from "./colors.js?v=12";

export function rotateColors(colors, turns) {
  const n = colors.length;
  const k = ((turns % n) + n) % n;
  return colors.map((_, i) => colors[(i - k + n) % n]);
}

export function isMatch(center, rotation, ring) {
  const rotated = rotateColors(center, rotation);
  return rotated.every((color, i) => color === ring[i]);
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle(items) {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function rotationBudget(level) {
  if (level <= 5) return null;
  if (level <= 15) return null;
  return Math.max(8, 16 - Math.floor((level - 16) / 3));
}

export function generateLevel(level) {
  const center = shuffle(COLOR_KEYS);
  const needed = [];

  for (let i = 0; i < 5; i += 1) {
    if (level === 1 && i === 0) {
      needed.push(pick([1, 2]));
      continue;
    }
    if (level <= 5) {
      needed.push(pick(i < 2 ? [1] : [0, 1, 2]));
      continue;
    }
    needed.push(pick([0, 1, 2]));
  }

  if (needed.every((turn) => turn === 0)) needed[1] = 1;

  return {
    level,
    center,
    rings: needed.map((turn) => rotateColors(center, turn)),
    needed,
    hideFuture: level >= 16,
    rotationLimit: rotationBudget(level),
  };
}
