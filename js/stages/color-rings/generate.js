import { COLOR_KEYS } from "./colors.js?v=17";

export function segmentCount(level) {
  if (level <= 1) return 12;
  if (level <= 4) return 18;
  return 24;
}

export function stepDegrees(segments) {
  return 360 / segments;
}

export function isMatch(center, rotation, ring) {
  const n = ring.length;
  const step = n / 3;
  return center.every((color, i) => ring[(rotation + i * step) % n] === color);
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

function solutionSlots(needed, n) {
  const step = n / 3;
  return [0, 1, 2].map((i) => (needed + i * step) % n);
}

function extraRotations(center, ring, needed) {
  const extras = [];
  for (let rotation = 0; rotation < ring.length; rotation += 1) {
    if (rotation !== needed && isMatch(center, rotation, ring)) extras.push(rotation);
  }
  return extras;
}

function breakExtraMatches(center, ring, needed) {
  const locked = new Set(solutionSlots(needed, ring.length));
  for (let guard = 0; guard < 48; guard += 1) {
    const extras = extraRotations(center, ring, needed);
    if (!extras.length) return;
    const rotation = extras[0];
    const unlocked = solutionSlots(rotation, ring.length).filter((index) => !locked.has(index));
    if (!unlocked.length) return;
    const index = pick(unlocked);
    ring[index] = pick([null, ...COLOR_KEYS.filter((color) => color !== ring[index])]);
  }
}

function lengthPool(n) {
  if (n <= 12) return [1, 2, 3];
  if (n <= 18) return [1, 2, 3, 4];
  return [2, 3, 4, 5];
}

function paintArc(ring, n, slot, color, len, locked) {
  const shift = Math.floor(Math.random() * len);
  for (let k = 0; k < len; k += 1) {
    const index = (slot - shift + k + n) % n;
    if (locked.has(index) && index !== slot) continue;
    if (ring[index] != null && index !== slot) continue;
    ring[index] = color;
  }
  ring[slot] = color;
}

function paintDecoy(ring, n, locked) {
  const start = Math.floor(Math.random() * n);
  const len = pick(lengthPool(n));
  const color = pick(COLOR_KEYS);
  for (let k = 0; k < len; k += 1) {
    const index = (start + k) % n;
    if (locked.has(index) || ring[index] != null) break;
    ring[index] = color;
  }
}

function generateRing(center, n, needed, { tutorial } = {}) {
  const locked = new Set(solutionSlots(needed, n));
  const decoys = tutorial ? 0 : n <= 12 ? 2 : 3;

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const ring = Array(n).fill(null);
    const lengths = tutorial ? shuffle([1, 2, 3]) : shuffle(lengthPool(n));
    solutionSlots(needed, n).forEach((slot, i) => {
      paintArc(ring, n, slot, center[i], lengths[i % lengths.length], locked);
    });
    for (let i = 0; i < decoys; i += 1) paintDecoy(ring, n, locked);
    breakExtraMatches(center, ring, needed);
    const filled = ring.filter(Boolean).length;
    if (
      filled < n &&
      filled >= 3 &&
      !extraRotations(center, ring, needed).length &&
      isMatch(center, needed, ring)
    ) {
      return ring;
    }
  }

  const ring = Array(n).fill(null);
  solutionSlots(needed, n).forEach((index, i) => {
    ring[index] = center[i];
  });
  return ring;
}

function pickNeeded(n, { near, avoidZero }) {
  if (near) return pick([1, n - 1]);
  if (avoidZero) {
    const options = [...Array(n).keys()].filter((turn) => turn !== 0);
    return pick(options);
  }
  return Math.floor(Math.random() * n);
}

function rotationBudget(level, segments) {
  if (level < 16) return null;
  const expected = 5 * Math.ceil(segments / 3);
  const cut = Math.floor((level - 16) / 3) * 2;
  return Math.max(segments + 4, expected - cut);
}

export function generateLevel(level) {
  const n = segmentCount(level);
  const center = shuffle(COLOR_KEYS);
  const needed = [];

  for (let i = 0; i < 5; i += 1) {
    needed.push(
      pickNeeded(n, {
        near: level === 1 && i === 0,
        avoidZero: level <= 2 && i < 2,
      })
    );
  }

  if (needed.every((turn) => turn === 0)) needed[1] = 1;

  return {
    level,
    center,
    rings: needed.map((turn, index) =>
      generateRing(center, n, turn, { tutorial: level === 1 && index === 0 })
    ),
    needed,
    segments: n,
    hideFuture: level >= 16,
    rotationLimit: rotationBudget(level, n),
  };
}
