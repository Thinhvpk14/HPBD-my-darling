function rotateColors(colors, turns) {
  const n = colors.length;
  const k = ((turns % n) + n) % n;
  return colors.map((_, i) => colors[(i - k + n) % n]);
}

function isMatch(center, rotation, ring) {
  return rotateColors(center, rotation).every((color, i) => color === ring[i]);
}

const center = ["red", "blue", "yellow"];
if (!isMatch(center, 0, center)) throw new Error("identity");
if (isMatch(center, 0, ["red", "yellow", "blue"])) throw new Error("reverse should fail");

function shuffle(items) {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function generateLevel(level) {
  const COLOR_KEYS = ["red", "blue", "yellow"];
  const center = shuffle(COLOR_KEYS);
  const needed = [];
  for (let i = 0; i < 5; i += 1) {
    if (level === 1 && i === 0) needed.push([1, 2][Math.floor(Math.random() * 2)]);
    else if (level <= 5) needed.push(i < 2 ? 1 : Math.floor(Math.random() * 3));
    else needed.push(Math.floor(Math.random() * 3));
  }
  if (needed.every((turn) => turn === 0)) needed[1] = 1;
  return {
    center,
    rings: needed.map((turn) => rotateColors(center, turn)),
    needed,
  };
}

for (let level = 1; level <= 20; level += 1) {
  for (let n = 0; n < 8; n += 1) {
    const puzzle = generateLevel(level);
    puzzle.rings.forEach((ring, index) => {
      const solved = [0, 1, 2].some((rot) => isMatch(puzzle.center, rot, ring));
      if (!solved) throw new Error(`unsolvable L${level} ring ${index}`);
      if (!isMatch(puzzle.center, puzzle.needed[index], ring)) {
        throw new Error(`needed mismatch L${level} ring ${index}`);
      }
    });
    if (level === 1 && puzzle.needed[0] === 0) throw new Error("tutorial ring already matched");
  }
}

console.log("levels always solvable");
