import { COLOR_KEYS } from "./colors.js?v=41";

export const RING_COUNT = 10;

export function segmentCount(level) {
  if (level <= 1) return 18;
  if (level <= 4) return 24;
  return 30;
}

export function stepDegrees(segments) {
  return 360 / segments;
}

export function dotsForRing(ringIndex) {
  return 3 + ringIndex;
}

export function growingSlots(count, n) {
  const slots = [0, Math.round(n / 3) % n, Math.round((2 * n) / 3) % n];
  const used = new Set(slots);
  while (slots.length < count) {
    const sorted = [...slots].sort((a, b) => a - b);
    let bestAt = null;
    let bestSpan = -1;
    for (let i = 0; i < sorted.length; i += 1) {
      const start = sorted[i];
      const end = sorted[(i + 1) % sorted.length] + (i + 1 === sorted.length ? n : 0);
      const span = end - start;
      const mid = (start + Math.floor(span / 2)) % n;
      if (span > bestSpan && !used.has(mid)) {
        bestSpan = span;
        bestAt = mid;
      }
    }
    if (bestAt == null) {
      for (let s = 0; s < n; s += 1) {
        if (!used.has(s)) {
          bestAt = s;
          break;
        }
      }
    }
    if (bestAt == null) break;
    slots.push(bestAt);
    used.add(bestAt);
  }
  return slots.slice(0, count);
}

export function isMatch(colors, rotation, ring, slots) {
  const n = ring.length;
  const marks = slots ?? growingSlots(colors.length, n);
  return colors.every((color, i) => ring[(rotation + marks[i]) % n] === color);
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

function isColorPeriodic(colors, slots, n) {
  for (let shift = 1; shift < n; shift += 1) {
    let periodic = true;
    for (let i = 0; i < slots.length; i += 1) {
      const dest = (slots[i] + shift) % n;
      const j = slots.indexOf(dest);
      if (j === -1 || colors[j] !== colors[i]) {
        periodic = false;
        break;
      }
    }
    if (periodic) return true;
  }
  return false;
}

function nextColor(colors, slots, n) {
  for (const color of shuffle([...COLOR_KEYS])) {
    const trial = [...colors, color];
    if (!isColorPeriodic(trial, slots, n)) return color;
  }
  return pick(COLOR_KEYS);
}

function solutionCells(needed, slots, n) {
  return slots.map((slot) => (needed + slot) % n);
}

function extraRotations(colors, ring, needed, slots) {
  const extras = [];
  for (let rotation = 0; rotation < ring.length; rotation += 1) {
    if (rotation !== needed && isMatch(colors, rotation, ring, slots)) extras.push(rotation);
  }
  return extras;
}

function breakExtraMatches(colors, ring, needed, slots) {
  const locked = new Set(solutionCells(needed, slots, ring.length));
  for (let guard = 0; guard < 64; guard += 1) {
    const extras = extraRotations(colors, ring, needed, slots);
    if (!extras.length) return;
    const unlocked = solutionCells(extras[0], slots, ring.length).filter(
      (index) => !locked.has(index)
    );
    if (!unlocked.length) return;
    const index = pick(unlocked);
    ring[index] = pick([null, ...COLOR_KEYS.filter((color) => color !== ring[index])]);
  }
}

function lengthPool(n, tutorial) {
  const cap = Math.floor(n / 2);
  if (tutorial) return [3, 4, 5].filter((len) => len <= cap);
  return [3, 4, 5].filter((len) => len <= cap && len >= 2);
}

function paintDecoy(ring, n, locked) {
  const start = Math.floor(Math.random() * n);
  const len = pick(lengthPool(n, false));
  const color = pick(COLOR_KEYS);
  for (let k = 0; k < len; k += 1) {
    const index = (start + k) % n;
    if (locked.has(index) || ring[index] != null) break;
    ring[index] = color;
  }
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

function generateRing(colors, n, needed, slots, { tutorial } = {}) {
  const locked = new Set(solutionCells(needed, slots, n));
  const decoys = tutorial ? 0 : n <= 12 ? 2 : 3;
  const pool = lengthPool(n, tutorial);

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const ring = Array(n).fill(null);
    const lengths = shuffle(pool.length ? pool : [2, 3]);
    solutionCells(needed, slots, n).forEach((slot, i) => {
      paintArc(ring, n, slot, colors[i], lengths[i % lengths.length], locked);
    });
    for (let i = 0; i < decoys; i += 1) paintDecoy(ring, n, locked);
    breakExtraMatches(colors, ring, needed, slots);
    const filled = ring.filter(Boolean).length;
    if (
      filled < n &&
      filled >= colors.length &&
      !extraRotations(colors, ring, needed, slots).length &&
      isMatch(colors, needed, ring, slots)
    ) {
      return ring;
    }
  }

  const ring = Array(n).fill(null);
  solutionCells(needed, slots, n).forEach((index, i) => {
    ring[index] = colors[i];
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
  const expected = RING_COUNT * Math.ceil(segments / 3);
  const cut = Math.floor((level - 16) / 3) * 2;
  return Math.max(segments + 4, expected - cut);
}

export function generateLevel(level) {
  const n = segmentCount(level);
  const needed = [];

  for (let i = 0; i < RING_COUNT; i += 1) {
    needed.push(
      pickNeeded(n, {
        near: level === 1 && i === 0,
        avoidZero: level <= 2 && i < 2,
      })
    );
  }

  if (needed.every((turn) => turn === 0)) needed[1] = 1;

  let colors = shuffle(COLOR_KEYS);
  let slots = growingSlots(3, n);
  const hubs = [];
  const rings = [];

  for (let i = 0; i < RING_COUNT; i += 1) {
    if (i > 0) {
      const nextSlots = growingSlots(3 + i, n);
      const added = nextSlots.find((slot) => !slots.includes(slot));
      slots = [...slots, added];
      colors = [...colors, nextColor(colors, slots, n)];
    }
    hubs.push({ colors: [...colors], slots: [...slots] });
    rings.push(
      generateRing(colors, n, needed[i], slots, {
        tutorial: level === 1 && i === 0,
      })
    );
  }

  return {
    level,
    hubs,
    center: hubs[0].colors,
    rings,
    needed,
    segments: n,
    hideFuture: level >= 16,
    rotationLimit: rotationBudget(level, n),
  };
}
