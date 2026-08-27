const LENGTH = 5;

const historyEl = document.getElementById("history");
const emptyHintEl = document.getElementById("empty-hint");
const slotsEl = document.getElementById("slots");
const keypadEl = document.getElementById("keypad");
const formEl = document.getElementById("guess-form");
const randomBtn = document.getElementById("random-btn");
const newGameBtn = document.getElementById("new-game-btn");
const submitBtn = document.getElementById("submit-btn");
const statusEl = document.getElementById("status");
const winModal = document.getElementById("win-modal");
const winText = document.getElementById("win-text");
const winCode = document.getElementById("win-code");
const replayBtn = document.getElementById("replay-btn");

let secret = [];
let attempts = 0;
let won = false;
let activeIndex = 0;

function hasUniqueDigits(digits) {
  return new Set(digits).size === digits.length;
}

function randomCode() {
  const pool = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, LENGTH);
}

function codeFromUrl() {
  const raw = new URLSearchParams(location.search).get("secret") || "";
  const digits = raw.replace(/\D/g, "").slice(0, LENGTH).split("");
  if (digits.length !== LENGTH || !hasUniqueDigits(digits)) return null;
  return digits;
}

function evaluateGuess(guess) {
  const marks = Array(LENGTH).fill("absent");
  const unused = {};

  for (let i = 0; i < LENGTH; i += 1) {
    if (guess[i] === secret[i]) {
      marks[i] = "correct";
    } else {
      unused[secret[i]] = (unused[secret[i]] || 0) + 1;
    }
  }

  for (let i = 0; i < LENGTH; i += 1) {
    if (marks[i] === "correct") continue;
    if (unused[guess[i]] > 0) {
      marks[i] = "present";
      unused[guess[i]] -= 1;
    }
  }

  const greens = marks.filter((mark) => mark === "correct").length;
  return { marks, greens };
}

function createSlots() {
  slotsEl.innerHTML = "";
  for (let i = 0; i < LENGTH; i += 1) {
    const input = document.createElement("input");
    input.className = "slot";
    input.type = "text";
    input.inputMode = "numeric";
    input.maxLength = 1;
    input.dataset.index = String(i);
    input.setAttribute("aria-label", `Chữ số ${i + 1}`);
    input.addEventListener("focus", () => {
      activeIndex = i;
      input.select();
    });
    input.addEventListener("input", onSlotInput);
    input.addEventListener("keydown", onSlotKeydown);
    input.addEventListener("paste", onPaste);
    slotsEl.appendChild(input);
  }
}

function slots() {
  return [...slotsEl.querySelectorAll(".slot")];
}

function fillRandom() {
  const code = randomCode();
  slots().forEach((slot, index) => {
    slot.value = code[index];
  });
  activeIndex = LENGTH - 1;
}

function currentGuess() {
  return slots().map((slot) => slot.value);
}

function isCompleteGuess(guess) {
  return guess.length === LENGTH && guess.every((digit) => /^\d$/.test(digit));
}

function otherValues(exceptIndex) {
  return slots()
    .map((slot, index) => (index === exceptIndex ? "" : slot.value))
    .filter(Boolean);
}

function applyDigit(index, digit) {
  if (!/^\d$/.test(digit)) return false;
  if (otherValues(index).includes(digit)) {
    statusEl.textContent = "Mỗi chữ số chỉ được dùng một lần.";
    return false;
  }
  slots()[index].value = digit;
  return true;
}

function onSlotInput(event) {
  const index = Number(event.target.dataset.index);
  const digit = event.target.value.replace(/\D/g, "").slice(-1);
  event.target.value = "";
  if (!digit) return;
  if (!applyDigit(index, digit)) return;
  if (activeIndex < LENGTH - 1) {
    activeIndex += 1;
    slots()[activeIndex].focus();
  }
}

function onSlotKeydown(event) {
  const index = Number(event.target.dataset.index);
  if (event.key === "Backspace" && !event.target.value && index > 0) {
    slots()[index - 1].focus();
  }
  if (event.key === "ArrowLeft" && index > 0) {
    slots()[index - 1].focus();
  }
  if (event.key === "ArrowRight" && index < LENGTH - 1) {
    slots()[index + 1].focus();
  }
}

function onPaste(event) {
  event.preventDefault();
  const text = (event.clipboardData.getData("text") || "").replace(/\D/g, "");
  if (!text) return;
  const start = Number(event.target.dataset.index);
  const values = currentGuess();
  for (let i = start; i < LENGTH; i += 1) values[i] = "";
  const used = new Set(values.filter(Boolean));
  let offset = 0;
  for (let i = 0; i < text.length && start + offset < LENGTH; i += 1) {
    const digit = text[i];
    if (used.has(digit)) continue;
    used.add(digit);
    values[start + offset] = digit;
    offset += 1;
  }
  slots().forEach((slot, index) => {
    slot.value = values[index] || "";
  });
}

function renderHistoryRow(guess, marks, greens) {
  const row = document.createElement("div");
  row.className = "guess-row";

  const tiles = document.createElement("div");
  tiles.className = "tiles";
  guess.forEach((digit, index) => {
    const tile = document.createElement("div");
    tile.className = `tile ${marks[index]}`;
    tile.textContent = digit;
    tile.style.animationDelay = `${index * 40}ms`;
    tiles.appendChild(tile);
  });

  const note = document.createElement("div");
  note.className = "note";
  note.textContent = `${greens} đúng vị trí`;

  row.append(tiles, note);
  historyEl.prepend(row);
}

function createKeypad() {
  keypadEl.innerHTML = "";
  for (let n = 0; n <= 9; n += 1) {
    const key = document.createElement("button");
    key.type = "button";
    key.className = "key";
    key.textContent = String(n);
    key.addEventListener("click", () => {
      if (won) return;
      if (!applyDigit(activeIndex, String(n))) return;
      if (activeIndex < LENGTH - 1) activeIndex += 1;
      slots()[activeIndex].focus();
    });
    keypadEl.appendChild(key);
  }

  const del = document.createElement("button");
  del.type = "button";
  del.className = "key key-wide";
  del.textContent = "Xóa";
  del.addEventListener("click", () => {
    if (won) return;
    const current = slots()[activeIndex];
    if (current.value) {
      current.value = "";
    } else if (activeIndex > 0) {
      activeIndex -= 1;
      slots()[activeIndex].value = "";
    }
    slots()[activeIndex].focus();
  });
  keypadEl.appendChild(del);
}

function setPlaying(enabled) {
  submitBtn.disabled = !enabled;
  randomBtn.disabled = !enabled;
  slots().forEach((slot) => {
    slot.disabled = !enabled;
  });
}

function submitGuess(event) {
  event.preventDefault();
  if (won) return;

  const guess = currentGuess();
  if (!isCompleteGuess(guess)) {
    statusEl.textContent = `Hãy điền đủ ${LENGTH} chữ số.`;
    return;
  }
  if (!hasUniqueDigits(guess)) {
    statusEl.textContent = "Dãy số không được trùng chữ số.";
    return;
  }

  const { marks, greens } = evaluateGuess(guess);
  attempts += 1;
  emptyHintEl.hidden = true;
  renderHistoryRow(guess, marks, greens);
  statusEl.textContent = `Lần ${attempts} · ${greens}/${LENGTH} đúng vị trí`;

  if (greens === LENGTH) {
    won = true;
    setPlaying(false);
    winText.textContent = `Bạn đã tìm ra mật khẩu sau ${attempts} lần đoán.`;
    winCode.innerHTML = secret.map((digit) => `<span>${digit}</span>`).join("");
    winModal.hidden = false;
    return;
  }

  slots()[0].focus();
}

function newGame() {
  secret = codeFromUrl() || randomCode();
  attempts = 0;
  won = false;
  activeIndex = 0;
  historyEl.innerHTML = "";
  emptyHintEl.hidden = false;
  winModal.hidden = true;
  createSlots();
  setPlaying(true);
  fillRandom();
  statusEl.textContent = `Lần 1 · ${LENGTH} số ngẫu nhiên đã sẵn sàng`;
  slots()[0].focus();
}

formEl.addEventListener("submit", submitGuess);
randomBtn.addEventListener("click", () => {
  fillRandom();
  slots()[0].focus();
});
newGameBtn.addEventListener("click", newGame);
replayBtn.addEventListener("click", newGame);

createKeypad();
newGame();
