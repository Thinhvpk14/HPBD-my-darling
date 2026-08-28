const COLOR_KEYS = ["red", "blue", "yellow"];

function isMatch(colors, rotation, ring, slots) {
  const n = ring.length;
  return colors.every((color, i) => ring[(rotation + slots[i]) % n] === color);
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

function growingSlots(count, n) {
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
  const pool = lengthPool(n, false);
  const len = pick(pool.length ? pool : [2, 3]);
  const color = pick(COLOR_KEYS);
  for (let k = 0; k < len; k += 1) {
    const index = (start + k) % n;
    if (locked.has(index) || ring[index] != null) break;
    ring[index] = color;
  }
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

const RING_COUNT = 10;

function segmentCount(level) {
  if (level <= 1) return 18;
  if (level <= 4) return 24;
  return 30;
}

function generateLevel(level) {
  const n = segmentCount(level);
  const needed = [];
  for (let i = 0; i < RING_COUNT; i += 1) {
    if (level === 1 && i === 0) needed.push(pick([1, n - 1]));
    else if (level <= 2 && i < 2) needed.push(pick([...Array(n).keys()].filter((t) => t !== 0)));
    else needed.push(Math.floor(Math.random() * n));
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
  return { hubs, rings, needed, segments: n };
}

const three = growingSlots(3, 12);
if (JSON.stringify(three) !== JSON.stringify([0, 4, 8])) throw new Error("base slots");
const four = growingSlots(4, 12);
if (four.length !== 4 || !three.every((slot) => four.includes(slot))) {
  throw new Error("slots should grow");
}

const center = ["red", "blue", "yellow"];
const aligned = Array(12).fill(null);
aligned[0] = "red";
aligned[4] = "blue";
aligned[8] = "yellow";
if (!isMatch(center, 0, aligned, [0, 4, 8])) throw new Error("identity arc match");
if (isMatch(center, 1, aligned, [0, 4, 8])) throw new Error("one-step should miss");

function runLengths(ring) {
  const n = ring.length;
  const lengths = [];
  let i = 0;
  while (i < n) {
    if (ring[i] == null) {
      i += 1;
      continue;
    }
    let j = i + 1;
    while (j < n && ring[j] === ring[i]) j += 1;
    lengths.push(j - i);
    i = j;
  }
  return lengths;
}

function avg(values) {
  return values.reduce((sum, value) => sum + value, 0) / (values.length || 1);
}

let innerRuns = 0;
let outerRuns = 0;
let samples = 0;

for (let level = 1; level <= 20; level += 1) {
  for (let n = 0; n < 8; n += 1) {
    const puzzle = generateLevel(level);
    if (puzzle.segments % 3 !== 0) throw new Error(`segments not /3 L${level}`);
    if (puzzle.rings.length !== RING_COUNT) throw new Error(`ring count L${level}`);
    puzzle.hubs.forEach((hub, index) => {
      if (hub.colors.length !== 3 + index) throw new Error(`dot count L${level} ring ${index}`);
      if (hub.slots.length !== hub.colors.length) throw new Error(`slot count L${level} ring ${index}`);
      if (index > 0) {
        const prev = puzzle.hubs[index - 1];
        if (!prev.slots.every((slot) => hub.slots.includes(slot))) {
          throw new Error(`slots not growing L${level} ring ${index}`);
        }
        if (!prev.colors.every((color, i) => hub.colors[i] === color)) {
          throw new Error(`colors not growing L${level} ring ${index}`);
        }
      }
    });
    puzzle.rings.forEach((ring, index) => {
      const hub = puzzle.hubs[index];
      if (!ring.some((cell) => cell == null)) throw new Error(`no gaps L${level} ring ${index}`);
      const solved = [...Array(puzzle.segments).keys()].filter((rot) =>
        isMatch(hub.colors, rot, ring, hub.slots)
      );
      if (!solved.length) throw new Error(`unsolvable L${level} ring ${index}`);
      if (!isMatch(hub.colors, puzzle.needed[index], ring, hub.slots)) {
        throw new Error(`needed mismatch L${level} ring ${index}`);
      }
      if (solved.length !== 1) throw new Error(`extra solutions L${level} ring ${index}`);
    });
    if (level === 1 && puzzle.needed[0] === 0) throw new Error("tutorial ring already matched");
    if (level === 1 && ![1, puzzle.segments - 1].includes(puzzle.needed[0])) {
      throw new Error("tutorial should be one step");
    }
    innerRuns += avg(runLengths(puzzle.rings[0]));
    outerRuns += avg(runLengths(puzzle.rings[1]));
    samples += 1;
  }
}

if (innerRuns / samples < 2) throw new Error("start ring arcs too short");
if (outerRuns / samples < 1.8) throw new Error("next ring should look like start");

console.log("same-style rings, expanding hub, uniquely solvable");
