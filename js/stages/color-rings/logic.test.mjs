function isMatch(center, rotation, ring) {
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

const COLOR_KEYS = ["red", "blue", "yellow"];

function segmentCount(level) {
  if (level <= 1) return 12;
  if (level <= 4) return 18;
  return 24;
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
    const unlocked = solutionSlots(extras[0], ring.length).filter((index) => !locked.has(index));
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

function generateLevel(level) {
  const n = segmentCount(level);
  const center = shuffle(COLOR_KEYS);
  const needed = [];
  for (let i = 0; i < 5; i += 1) {
    if (level === 1 && i === 0) needed.push(pick([1, n - 1]));
    else if (level <= 2 && i < 2) needed.push(pick([...Array(n).keys()].filter((t) => t !== 0)));
    else needed.push(Math.floor(Math.random() * n));
  }
  if (needed.every((turn) => turn === 0)) needed[1] = 1;
  return {
    center,
    rings: needed.map((turn, index) =>
      generateRing(center, n, turn, { tutorial: level === 1 && index === 0 })
    ),
    needed,
    segments: n,
  };
}

const center = ["red", "blue", "yellow"];
const aligned = Array(12).fill(null);
aligned[0] = "red";
aligned[4] = "blue";
aligned[8] = "yellow";
if (!isMatch(center, 0, aligned)) throw new Error("identity arc match");
if (isMatch(center, 1, aligned)) throw new Error("one-step should miss");
if (isMatch(center, 0, ["red", "yellow", "blue", "red", "yellow", "blue", "red", "yellow", "blue"])) {
  throw new Error("wrong spacing should fail");
}

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

for (let level = 1; level <= 20; level += 1) {
  for (let n = 0; n < 8; n += 1) {
    const puzzle = generateLevel(level);
    if (puzzle.segments % 3 !== 0) throw new Error(`segments not /3 L${level}`);
    if (puzzle.rings.some((ring) => ring.length !== puzzle.segments)) {
      throw new Error(`ring length L${level}`);
    }
    puzzle.rings.forEach((ring, index) => {
      if (!ring.some((cell) => cell == null)) throw new Error(`no gaps L${level} ring ${index}`);
      const solved = [...Array(puzzle.segments).keys()].filter((rot) =>
        isMatch(puzzle.center, rot, ring)
      );
      if (!solved.length) throw new Error(`unsolvable L${level} ring ${index}`);
      if (!isMatch(puzzle.center, puzzle.needed[index], ring)) {
        throw new Error(`needed mismatch L${level} ring ${index}`);
      }
      if (solved.length !== 1) throw new Error(`extra solutions L${level} ring ${index}`);
    });
    if (level === 1 && puzzle.needed[0] === 0) throw new Error("tutorial ring already matched");
    if (level === 1 && ![1, puzzle.segments - 1].includes(puzzle.needed[0])) {
      throw new Error("tutorial should be one step");
    }
    if (level === 1) {
      const lengths = new Set(runLengths(puzzle.rings[0]));
      if (lengths.size < 2) throw new Error("tutorial arcs should vary in length");
    }
  }
}

console.log("sparse arcs always uniquely solvable");
