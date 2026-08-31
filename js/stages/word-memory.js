import { createAudio } from "./color-rings/audio.js?v=46";
import { GOAL, DURATION_MS, createRound } from "./word-memory/logic.js?v=46";

export const wordMemoryStage = {
  id: "word-memory",
  title: "Từ mới hay cũ?",
  lede: "Trong 30 giây, chọn đúng 20 lần: từ mới, hay đã xuất hiện.",
  templateId: "tpl-word-memory",
  mount(root, ctx) {
    const startScreen = root.querySelector("[data-start]");
    const playScreen = root.querySelector("[data-play]");
    const winScreen = root.querySelector("[data-win]");
    const failScreen = root.querySelector("[data-fail]");
    const playBtn = root.querySelector("[data-play-btn]");
    const newBtn = root.querySelector("[data-new]");
    const oldBtn = root.querySelector("[data-old]");
    const wordEl = root.querySelector("[data-word]");
    const scoreEl = root.querySelector("[data-score]");
    const clockEl = root.querySelector("[data-clock]");
    const fillEl = root.querySelector("[data-timer-fill]");
    const feedbackEl = root.querySelector("[data-feedback]");
    const stageEl = root.querySelector("[data-stage]");
    const failScore = root.querySelector("[data-fail-score]");
    const replayWin = root.querySelector("[data-replay-win]");
    const replayFail = root.querySelector("[data-replay-fail]");
    const nextBtn = root.querySelector("[data-next]");
    const controlsEl = root.querySelector(".wm-controls");

    const audio = createAudio();
    let round = null;
    let card = null;
    let score = 0;
    let ended = false;
    let startedAt = 0;
    let tickId = 0;
    let stageCleared = false;
    let busy = false;
    let swapped = false;

    function setFeedback(text, kind) {
      feedbackEl.textContent = text;
      feedbackEl.classList.remove("is-on", "is-ok", "is-bad");
      if (!text) return;
      feedbackEl.classList.add("is-on", kind === "ok" ? "is-ok" : "is-bad");
    }

    function show(screen) {
      startScreen.hidden = screen !== "start";
      playScreen.hidden = screen !== "play";
      winScreen.hidden = screen !== "win";
      failScreen.hidden = screen !== "fail";
    }

    function paintClock(remainMs) {
      const sec = Math.max(0, remainMs / 1000);
      clockEl.textContent = `${sec.toFixed(1)}s`;
      const ratio = Math.max(0, remainMs / DURATION_MS);
      fillEl.style.transform = `scaleX(${ratio})`;
      fillEl.classList.toggle("is-low", remainMs <= 5000);
    }

    function stopTick() {
      if (tickId) cancelAnimationFrame(tickId);
      tickId = 0;
    }

    function tick() {
      if (ended) return;
      const remain = DURATION_MS - (performance.now() - startedAt);
      paintClock(remain);
      if (remain <= 0) {
        lose();
        return;
      }
      tickId = requestAnimationFrame(tick);
    }

    function dealCard() {
      card = round.deal();
      wordEl.textContent = card.word;
      wordEl.classList.remove("is-pop");
      void wordEl.offsetWidth;
      wordEl.classList.add("is-pop");
    }

    function finish(ok) {
      if (ended) return;
      ended = true;
      busy = true;
      stopTick();
      paintClock(ok ? Math.max(0, DURATION_MS - (performance.now() - startedAt)) : 0);
      if (ok) {
        audio.complete();
        show("win");
        if (!stageCleared) {
          stageCleared = true;
          const next = ctx.onComplete({ score });
          nextBtn.hidden = !next;
          nextBtn.onclick = () => {
            if (next) ctx.goTo(next.id);
          };
        }
        return;
      }
      audio.wrong();
      failScore.textContent = `${score} / ${GOAL}`;
      show("fail");
    }

    function win() {
      finish(true);
    }

    function lose() {
      finish(false);
    }

    function layoutButtons() {
      controlsEl.classList.toggle("is-swap", swapped);
    }

    function startGame() {
      stopTick();
      round = createRound();
      score = 0;
      ended = false;
      busy = false;
      swapped = false;
      layoutButtons();
      scoreEl.textContent = `0 / ${GOAL}`;
      setFeedback("", "ok");
      show("play");
      dealCard();
      startedAt = performance.now();
      paintClock(DURATION_MS);
      tick();
    }

    function answer(claimAppeared) {
      if (ended || busy || !card) return;
      busy = true;
      const correct = card.appeared === claimAppeared;
      round.commit(card.word);
      if (correct) {
        score += 1;
        scoreEl.textContent = `${score} / ${GOAL}`;
        audio.click();
        setFeedback("Đúng", "ok");
        stageEl.classList.remove("is-bad");
        stageEl.classList.add("is-ok");
        swapped = !swapped;
        layoutButtons();
        if (score >= GOAL) {
          win();
          return;
        }
      } else {
        audio.wrong();
        setFeedback("Sai", "bad");
        stageEl.classList.remove("is-ok");
        stageEl.classList.add("is-bad");
      }
      dealCard();
      busy = false;
    }

    playBtn.addEventListener("click", () => {
      audio.unlock();
      audio.click();
      startGame();
    });
    newBtn.addEventListener("click", () => answer(false));
    oldBtn.addEventListener("click", () => answer(true));
    replayWin.addEventListener("click", () => {
      audio.click();
      startGame();
    });
    replayFail.addEventListener("click", () => {
      audio.click();
      startGame();
    });

    [playBtn, newBtn, oldBtn, replayWin, replayFail, nextBtn].forEach((btn) => {
      btn.addEventListener("pointerdown", () => btn.classList.add("is-press"));
      btn.addEventListener("pointerup", () => btn.classList.remove("is-press"));
      btn.addEventListener("pointerleave", () => btn.classList.remove("is-press"));
    });

    show("start");
    return () => {
      ended = true;
      stopTick();
    };
  },
};
