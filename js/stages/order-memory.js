import { createAudio } from "./color-rings/audio.js?v=57";
import { WORDS } from "./word-memory/logic.js?v=57";
import { ROUNDS, GOAL, pickSequence, scramble, isSameOrder } from "./order-memory/logic.js?v=57";

export const orderMemoryStage = {
  id: "order-memory",
  title: "Sắp đúng thứ tự",
  lede: "Nhìn chuỗi đồ, nhớ thứ tự, rồi xếp lại. Mỗi vòng dài hơn một chút.",
  templateId: "tpl-order-memory",
  mount(root, ctx) {
    const startScreen = root.querySelector("[data-start]");
    const playScreen = root.querySelector("[data-play]");
    const winScreen = root.querySelector("[data-win]");
    const playBtn = root.querySelector("[data-play-btn]");
    const progressEl = root.querySelector("[data-progress]");
    const hintEl = root.querySelector("[data-hint]");
    const slotsEl = root.querySelector("[data-slots]");
    const poolEl = root.querySelector("[data-pool]");
    const replayWin = root.querySelector("[data-replay-win]");
    const nextBtn = root.querySelector("[data-next]");

    const audio = createAudio();
    let roundIndex = 0;
    let sequence = [];
    let placed = [];
    let pool = [];
    let phase = "preview";
    let busy = false;
    let ended = false;
    let stageCleared = false;
    let previewTid = 0;

    function show(screen) {
      startScreen.hidden = screen !== "start";
      playScreen.hidden = screen !== "play";
      winScreen.hidden = screen !== "win";
    }

    function clearPreview() {
      if (previewTid) clearTimeout(previewTid);
      previewTid = 0;
    }

    function renderSlots() {
      slotsEl.innerHTML = "";
      slotsEl.classList.toggle("is-preview", phase === "preview");
      sequence.forEach((word, index) => {
        const slot = document.createElement("button");
        slot.type = "button";
        slot.className = "om-slot";
        const filled = phase === "preview" ? word : placed[index];
        if (filled) {
          slot.classList.add("is-filled");
          slot.innerHTML = `<span class="om-num">${index + 1}</span><span>${filled}</span>`;
        } else {
          slot.innerHTML = `<span class="om-num">${index + 1}</span><span class="om-placeholder">—</span>`;
        }
        slot.disabled = phase !== "arrange" || !filled;
        slot.addEventListener("click", () => unplace(index));
        slotsEl.appendChild(slot);
      });
    }

    function renderPool() {
      poolEl.innerHTML = "";
      poolEl.hidden = phase === "preview";
      pool.forEach((word, index) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "om-chip";
        chip.textContent = word;
        chip.disabled = phase !== "arrange";
        chip.addEventListener("click", () => place(index));
        poolEl.appendChild(chip);
      });
    }

    function paint() {
      progressEl.textContent = `${roundIndex} / ${GOAL}`;
      renderSlots();
      renderPool();
    }

    function unplace(index) {
      if (ended || busy || phase !== "arrange" || !placed[index]) return;
      pool.push(placed[index]);
      placed[index] = null;
      const kept = placed.filter(Boolean);
      placed = [...kept, ...Array(sequence.length - kept.length).fill(null)];
      slotsEl.classList.remove("is-bad", "is-ok");
      paint();
    }

    function place(poolIndex) {
      if (ended || busy || phase !== "arrange") return;
      const empty = placed.findIndex((word) => word == null);
      if (empty === -1) return;
      placed[empty] = pool[poolIndex];
      pool.splice(poolIndex, 1);
      paint();
      if (placed.every(Boolean)) check();
    }

    function check() {
      if (!isSameOrder(placed, sequence)) {
        audio.wrong();
        hintEl.textContent = "Chưa đúng — bấm ô để đặt lại";
        slotsEl.classList.remove("is-ok");
        slotsEl.classList.add("is-bad");
        return;
      }
      audio.match();
      slotsEl.classList.remove("is-bad");
      slotsEl.classList.add("is-ok");
      roundIndex += 1;
      progressEl.textContent = `${roundIndex} / ${GOAL}`;
      if (roundIndex >= GOAL) {
        finish();
        return;
      }
      busy = true;
      hintEl.textContent = "Đúng!";
      setTimeout(() => {
        busy = false;
        startRound();
      }, 520);
    }

    function beginArrange() {
      if (ended) return;
      phase = "arrange";
      pool = scramble(sequence);
      placed = Array(sequence.length).fill(null);
      hintEl.textContent = "Xếp lại đúng thứ tự";
      paint();
    }

    function startRound() {
      if (ended) return;
      clearPreview();
      const spec = ROUNDS[roundIndex];
      sequence = pickSequence(WORDS, spec.length);
      placed = [...sequence];
      pool = [];
      phase = "preview";
      busy = false;
      hintEl.textContent = "Nhớ thứ tự này";
      slotsEl.classList.remove("is-bad", "is-ok");
      paint();
      previewTid = setTimeout(beginArrange, spec.previewMs);
    }

    function finish() {
      if (ended) return;
      ended = true;
      busy = true;
      clearPreview();
      audio.complete();
      show("win");
      if (!stageCleared) {
        stageCleared = true;
        ctx.onComplete({ rounds: GOAL });
        nextBtn.hidden = false;
        nextBtn.onclick = () => ctx.openMap();
      }
    }

    function startGame() {
      clearPreview();
      roundIndex = 0;
      ended = false;
      busy = false;
      show("play");
      startRound();
    }

    playBtn.addEventListener("click", () => {
      audio.unlock();
      audio.click();
      startGame();
    });
    replayWin.addEventListener("click", () => {
      audio.click();
      startGame();
    });
    [playBtn, replayWin, nextBtn].forEach((btn) => {
      btn.addEventListener("pointerdown", () => btn.classList.add("is-press"));
      btn.addEventListener("pointerup", () => btn.classList.remove("is-press"));
      btn.addEventListener("pointerleave", () => btn.classList.remove("is-press"));
    });

    show("start");
    return () => {
      ended = true;
      clearPreview();
    };
  },
};
