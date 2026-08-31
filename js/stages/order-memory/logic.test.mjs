import { ROUNDS, GOAL, pickSequence, scramble, isSameOrder } from "./logic.js";

const words = ["Nhẫn", "Son môi", "Túi xách", "Cao gót", "Blazer", "Nước hoa"];

if (GOAL !== 5) throw new Error("five rounds");
if (ROUNDS[0].length !== 3 || ROUNDS[4].length !== 6) throw new Error("round lengths");

const seq = pickSequence(words, 4);
if (seq.length !== 4) throw new Error("sequence length");
if (new Set(seq).size !== 4) throw new Error("sequence unique");
if (seq.some((word) => !words.includes(word))) throw new Error("unknown word");

const mixed = scramble(seq);
if (mixed.length !== seq.length) throw new Error("scramble length");
if ([...mixed].sort().join() !== [...seq].sort().join()) throw new Error("scramble members");
if (isSameOrder(mixed, seq)) throw new Error("scramble should differ");
if (!isSameOrder(seq, seq)) throw new Error("identity");
if (isSameOrder(["a"], ["b"])) throw new Error("mismatch");

for (let n = 0; n < 40; n += 1) {
  const next = scramble(["a", "b", "c"]);
  if (isSameOrder(next, ["a", "b", "c"])) throw new Error("rare scramble fail");
}

console.log("order-memory pick, scramble, match ok");
