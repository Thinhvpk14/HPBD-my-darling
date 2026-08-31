export const ROUNDS = [
  { length: 3, previewMs: 2200 },
  { length: 4, previewMs: 2000 },
  { length: 5, previewMs: 1800 },
  { length: 5, previewMs: 1500 },
  { length: 6, previewMs: 1500 },
];

export const GOAL = ROUNDS.length;

export function shuffle(items) {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function pickSequence(words, length) {
  return shuffle(words).slice(0, length);
}

export function scramble(sequence) {
  if (sequence.length < 2) return [...sequence];
  for (let i = 0; i < 32; i += 1) {
    const next = shuffle(sequence);
    if (next.some((word, index) => word !== sequence[index])) return next;
  }
  const next = [...sequence];
  [next[0], next[1]] = [next[1], next[0]];
  return next;
}

export function isSameOrder(placed, sequence) {
  return (
    placed.length === sequence.length &&
    placed.every((word, index) => word === sequence[index])
  );
}
