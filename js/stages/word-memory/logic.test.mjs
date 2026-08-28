import { WORDS, GOAL, createRound, isAppeared, pickWord } from "./logic.js";

if (WORDS.length !== 30) throw new Error(`dictionary size ${WORDS.length}`);
if (new Set(WORDS).size !== 30) throw new Error("dictionary has duplicates");
if (GOAL !== 30) throw new Error("goal should be 30");

const firstSeen = new Set();
const first = pickWord(firstSeen, null);
if (!WORDS.includes(first)) throw new Error("first pick not in dictionary");
if (isAppeared(first, firstSeen)) throw new Error("first word must be new");

firstSeen.add(first);
if (!isAppeared(first, firstSeen)) throw new Error("seen word should count as appeared");

const later = pickWord(firstSeen, first);
if (!WORDS.includes(later)) throw new Error("later pick not in dictionary");

let newCount = 0;
let oldCount = 0;
for (let n = 0; n < 40; n += 1) {
  const round = createRound();
  for (let i = 0; i < 30; i += 1) {
    const card = round.deal();
    if (!WORDS.includes(card.word)) throw new Error("dealt unknown word");
    if (i === 0 && card.appeared) throw new Error("opening card must be new");
    if (card.appeared) oldCount += 1;
    else newCount += 1;
    round.commit(card.word);
  }
}

if (newCount < 80) throw new Error("too few new words");
if (oldCount < 80) throw new Error("too few repeats");

console.log("word-memory dictionary, deal, and mix ok");
