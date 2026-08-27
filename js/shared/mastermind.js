export function shuffle(items) {
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

export function uniqueDigitCode(length) {
  return shuffle(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]).slice(0, length);
}

export function hasUniqueDigits(digits) {
  return new Set(digits).size === digits.length;
}

export function hasDuplicateDigits(guess) {
  const filled = guess.filter((digit) => /^\d$/.test(digit));
  return filled.length !== new Set(filled).size;
}

export function evaluateGuess(secret, guess) {
  const length = secret.length;
  const marks = Array(length).fill("absent");
  const unused = {};

  for (let i = 0; i < length; i += 1) {
    if (guess[i] === secret[i]) {
      marks[i] = "correct";
    } else {
      unused[secret[i]] = (unused[secret[i]] || 0) + 1;
    }
  }

  for (let i = 0; i < length; i += 1) {
    if (marks[i] === "correct") continue;
    if (unused[guess[i]] > 0) {
      marks[i] = "present";
      unused[guess[i]] -= 1;
    }
  }

  return {
    marks,
    greens: marks.filter((mark) => mark === "correct").length,
  };
}
