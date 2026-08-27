import {
  evaluateGuess,
  hasDuplicateDigits,
  hasUniqueDigits,
  uniqueDigitCode,
} from "../shared/mastermind.js?v=8";

const LENGTH = 5;

export const passwordStage = {
  id: "password",
  title: "Đoán mật khẩu",
  lede: "Tập trung vào các lần đoán trước và ô nhập phía dưới. Bấm Luật chơi nếu cần.",
  templateId: "tpl-password",
  mount(root, ctx) {
    const historyEl = root.querySelector("[data-history]");
    const emptyHintEl = root.querySelector("[data-empty-hint]");
    const slotsEl = root.querySelector("[data-slots]");
    const keypadEl = root.querySelector("[data-keypad]");
    const formEl = root.querySelector("[data-guess-form]");
    const randomBtn = root.querySelector("[data-random]");
    const newGameBtn = root.querySelector("[data-new-game]");
    const submitBtn = root.querySelector("[data-submit]");
    const statusEl = root.querySelector("[data-status]");
    const winModal = root.querySelector("[data-win-modal]");
    const winText = root.querySelector("[data-win-text]");
    const winCode = root.querySelector("[data-win-code]");
    const replayBtn = root.querySelector("[data-replay]");
    const nextBtn = root.querySelector("[data-next]");
    const rulesBtn = root.querySelector("[data-rules]");
    const rulesModal = root.querySelector("[data-rules-modal]");
    const rulesClose = root.querySelector("[data-rules-close]");

    let secret = [];
    let attempts = 0;
    let won = false;
    let activeIndex = 0;
    let playStatus = "";

    function slots() {
      return [...slotsEl.querySelectorAll(".slot")];
    }

    function currentGuess() {
      return slots().map((slot) => slot.value);
    }

    function isCompleteGuess(guess) {
      return guess.length === LENGTH && guess.every((digit) => /^\d$/.test(digit));
    }

    function setPlayStatus(text) {
      playStatus = text;
      statusEl.textContent = text;
      statusEl.classList.remove("error");
    }

    function syncGuessState() {
      if (won) {
        submitBtn.disabled = true;
        return;
      }
      const duplicate = hasDuplicateDigits(currentGuess());
      submitBtn.disabled = duplicate;
      if (duplicate) {
        statusEl.textContent = "Không được trùng số.";
        statusEl.classList.add("error");
        return;
      }
      statusEl.textContent = playStatus;
      statusEl.classList.remove("error");
    }

    function setPlaying(enabled) {
      randomBtn.disabled = !enabled;
      slots().forEach((slot) => {
        slot.disabled = !enabled;
      });
      if (!enabled) submitBtn.disabled = true;
      else syncGuessState();
    }

    function secretFromUrl() {
      const raw = new URLSearchParams(location.search).get("secret") || "";
      const digits = raw.replace(/\D/g, "").slice(0, LENGTH).split("");
      if (digits.length !== LENGTH || !hasUniqueDigits(digits)) return null;
      return digits;
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
        input.readOnly = matchMedia("(hover: none) and (pointer: coarse)").matches;
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

    function fillRandom() {
      const code = uniqueDigitCode(LENGTH);
      slots().forEach((slot, index) => {
        slot.value = code[index];
      });
      activeIndex = LENGTH - 1;
      syncGuessState();
    }

    function onSlotInput(event) {
      const digit = event.target.value.replace(/\D/g, "").slice(-1);
      event.target.value = digit;
      if (digit && activeIndex < LENGTH - 1) {
        activeIndex += 1;
        slots()[activeIndex].focus();
      }
      syncGuessState();
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
      for (let i = 0; i < text.length && start + i < LENGTH; i += 1) {
        values[start + i] = text[i];
      }
      slots().forEach((slot, index) => {
        slot.value = values[index] || "";
      });
      syncGuessState();
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
      note.textContent = String(greens);
      note.title = `${greens} đúng vị trí`;
      row.append(tiles, note);
      historyEl.append(row);
      row.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }

    function addKey(label, onClick) {
      const key = document.createElement("button");
      key.type = "button";
      key.className = "key";
      key.textContent = label;
      key.addEventListener("click", onClick);
      keypadEl.appendChild(key);
      return key;
    }

    function createKeypad() {
      keypadEl.innerHTML = "";
      const typeDigit = (n) => {
        if (won) return;
        slots()[activeIndex].value = String(n);
        if (activeIndex < LENGTH - 1) activeIndex += 1;
        slots()[activeIndex].focus();
        syncGuessState();
      };
      for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
        addKey(String(n), () => typeDigit(n));
      }
      addKey("Xóa", () => {
        if (won) return;
        const current = slots()[activeIndex];
        if (current.value) current.value = "";
        else if (activeIndex > 0) {
          activeIndex -= 1;
          slots()[activeIndex].value = "";
        }
        slots()[activeIndex].focus();
        syncGuessState();
      });
      addKey("0", () => typeDigit(0));
      keypadEl.appendChild(submitBtn);
    }

    function submitGuess(event) {
      event.preventDefault();
      if (won) return;
      const guess = currentGuess();
      if (!isCompleteGuess(guess)) {
        setPlayStatus(`Hãy điền đủ ${LENGTH} chữ số.`);
        return;
      }
      if (!hasUniqueDigits(guess)) {
        submitBtn.disabled = true;
        statusEl.textContent = "Không được trùng số.";
        statusEl.classList.add("error");
        return;
      }
      const { marks, greens } = evaluateGuess(secret, guess);
      attempts += 1;
      emptyHintEl.hidden = true;
      renderHistoryRow(guess, marks, greens);
      setPlayStatus(`Lần ${attempts} · ${greens}/${LENGTH} đúng vị trí`);
      if (greens === LENGTH) {
        won = true;
        setPlaying(false);
        winText.textContent = `Bạn đã tìm ra mật khẩu sau ${attempts} lần đoán.`;
        winCode.innerHTML = secret.map((digit) => `<span>${digit}</span>`).join("");
        winModal.hidden = false;
        const next = ctx.onComplete({ attempts });
        nextBtn.hidden = !next;
        nextBtn.onclick = () => {
          if (next) ctx.goTo(next.id);
        };
        ctx.setDebugInfo(() => ({ secret: secret.join(""), attempts, won }));
        return;
      }
      slots()[0].focus();
    }

    function newGame() {
      secret = secretFromUrl() || uniqueDigitCode(LENGTH);
      attempts = 0;
      won = false;
      activeIndex = 0;
      historyEl.innerHTML = "";
      emptyHintEl.hidden = false;
      winModal.hidden = true;
      createSlots();
      setPlaying(true);
      fillRandom();
      setPlayStatus(`Lần 1 · ${LENGTH} số ngẫu nhiên`);
      syncGuessState();
      slots()[0].focus();
      ctx.setDebugInfo(() => ({
        secret: ctx.debug ? secret.join("") : "(bật ?debug=1 để xem)",
        attempts,
        won,
      }));
    }

    function openRules() {
      rulesModal.hidden = false;
    }

    function closeRules() {
      rulesModal.hidden = true;
    }

    createKeypad();
    formEl.addEventListener("submit", submitGuess);
    randomBtn.addEventListener("click", () => {
      fillRandom();
      slots()[0].focus();
    });
    newGameBtn.addEventListener("click", () => {
      closeRules();
      newGame();
    });
    replayBtn.addEventListener("click", newGame);
    rulesBtn.addEventListener("click", openRules);
    rulesClose.addEventListener("click", closeRules);
    rulesModal.addEventListener("click", (event) => {
      if (event.target === rulesModal) closeRules();
    });
    newGame();
    return () => {};
  },
};
