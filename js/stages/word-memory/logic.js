export const GOAL = 30;
export const DURATION_MS = 30000;
export const REPEAT_CHANCE = 0.45;

export const WORDS = [
  "Nhẫn",
  "Dây chuyền",
  "Bông tai",
  "Lắc tay",
  "Vòng cổ",
  "Kim cương",
  "Ngọc trai",
  "Charm",
  "Lắc chân",
  "Trâm cài",
  "Son môi",
  "Mascara",
  "Kem nền",
  "Phấn phủ",
  "Nước hoa",
  "Serum",
  "Tẩy trang",
  "Kẻ mắt",
  "Dưỡng môi",
  "Phấn mắt",
  "Túi xách",
  "Cao gót",
  "Blazer",
  "Khăn lụa",
  "Váy liền",
  "Boots",
  "Crop top",
  "Denim",
  "Mắt kính",
  "Thắt lưng",
];

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

export function isAppeared(word, seen) {
  return seen.has(word);
}

export function pickWord(seen, last, words = WORDS) {
  const unseen = words.filter((word) => !seen.has(word));
  const appeared = words.filter((word) => seen.has(word));
  if (!appeared.length) return pick(unseen);
  if (!unseen.length) {
    const pool = appeared.filter((word) => word !== last);
    return pick(pool.length ? pool : appeared);
  }
  if (Math.random() < REPEAT_CHANCE) {
    const pool = appeared.filter((word) => word !== last);
    return pick(pool.length ? pool : appeared);
  }
  return pick(unseen);
}

export function createRound(words = WORDS) {
  const seen = new Set();
  let last = null;
  return {
    deal() {
      const word = pickWord(seen, last, words);
      return { word, appeared: isAppeared(word, seen) };
    },
    commit(word) {
      seen.add(word);
      last = word;
    },
  };
}
