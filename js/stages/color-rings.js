import { createAudio } from "./color-rings/audio.js?v=46";
import { generateLevel, isMatch, RING_COUNT, stepDegrees } from "./color-rings/generate.js?v=46";
import { burst, drawPuzzle, moveHubToRing } from "./color-rings/render.js?v=46";

export const colorRingsStage = {
  id: "color-rings",
  title: "Khóa ba màu",
  lede: "Xoay chấm giữa khớp màu. Mỗi vòng thêm 1 chấm, cung ngắn và đứt hơn.",
  templateId: "tpl-color-rings",
  mount(root, ctx) {
    const startScreen = root.querySelector("[data-start]");
    const playScreen = root.querySelector("[data-play]");
    const winScreen = root.querySelector("[data-win]");
    const playBtn = root.querySelector("[data-play-btn]");
    const svg = root.querySelector("[data-svg]");
    const sparks = root.querySelector("[data-sparks]");
    const levelEl = root.querySelector("[data-level]");
    const progressEl = root.querySelector("[data-progress]");
    const hintEl = root.querySelector("[data-hint]");
    const feedbackEl = root.querySelector("[data-feedback]");
    const leftBtn = root.querySelector("[data-left]");
    const rightBtn = root.querySelector("[data-right]");
    const unlockBtn = root.querySelector("[data-unlock]");
    const nextBtn = root.querySelector("[data-next-level]");
    const replayBtn = root.querySelector("[data-replay-level]");
    const winTitle = root.querySelector("[data-win-title]");
    const budgetEl = root.querySelector("[data-budget]");

    const audio = createAudio();
    let levelNo = 1;
    let puzzle = null;
    let rotation = 0;
    let active = 0;
    let completed = [];
    let busy = false;
    let tutorialStep = 0;
    let rotatesUsed = 0;
    let stageCleared = false;
    let spin = 0;

    const tutorials = [
      "Xoay chấm giữa cho khớp màu",
      "Mỗi chấm phải trùng cung đang sáng",
      "Bấm MỞ KHÓA",
    ];

    function setFeedback(text) {
      feedbackEl.textContent = text;
      feedbackEl.classList.add("is-on");
      clearTimeout(setFeedback.tid);
      setFeedback.tid = setTimeout(() => feedbackEl.classList.remove("is-on"), 700);
    }

    function hub() {
      return puzzle.hubs[active];
    }

    function matched() {
      const current = hub();
      return isMatch(current.colors, rotation, puzzle.rings[active], current.slots);
    }

    function segmentN() {
      return puzzle?.segments ?? puzzle?.rings?.[0]?.length ?? 12;
    }

    function applyHubRotation(animate) {
      const spinner = svg.querySelector("#cr-spinner");
      if (!spinner) return;
      const deg = `${spin * stepDegrees(segmentN())}deg`;
      spinner.style.setProperty("--rot", deg);
      spinner.style.transition = animate ? "transform 0.034s ease-out" : "none";
      spinner.style.transformOrigin = "100px 100px";
      spinner.style.transform = `rotate(${deg})`;
    }

    function syncHud() {
      levelEl.textContent = `LEVEL ${levelNo}`;
      progressEl.textContent = `${completed.length} / ${RING_COUNT}`;
      if (puzzle.rotationLimit != null) {
        budgetEl.hidden = false;
        budgetEl.textContent = `Xoay: ${rotatesUsed}/${puzzle.rotationLimit}`;
      } else {
        budgetEl.hidden = true;
      }
      if (levelNo === 1 && completed.length === 0 && tutorialStep < tutorials.length) {
        hintEl.textContent = tutorials[tutorialStep];
        hintEl.classList.remove("is-off");
      } else {
        hintEl.classList.add("is-off");
      }
    }

    function render() {
      drawPuzzle(svg, {
        rings: puzzle.rings,
        hub: hub(),
        n: segmentN(),
        active,
        completed,
      });
      if (puzzle.hideFuture) {
        svg.querySelectorAll(".cr-ring").forEach((ring, index) => {
          if (index > active && !completed.includes(index)) {
            ring.classList.add("is-hidden");
          }
        });
      }
      applyHubRotation(false);
      syncHud();
    }

    function settleUnlockedRing(index) {
      const ring = svg.querySelector(`[data-ring="${index}"]`);
      const locked = svg.querySelector("#cr-locked");
      if (!ring || !locked) return;
      const deg = -spin * stepDegrees(segmentN());
      ring.classList.remove("is-unlocking", "is-active", "is-idle", "is-done");
      ring.classList.add("is-locked");
      ring.style.transition = "none";
      ring.style.transformBox = "view-box";
      ring.style.transformOrigin = "100px 100px";
      ring.style.transform = `rotate(${deg}deg)`;
      locked.appendChild(ring);
    }

    function activateRing(index) {
      const ring = svg.querySelector(`[data-ring="${index}"]`);
      ring?.classList.remove("is-idle", "is-hidden", "is-done");
      ring?.classList.add("is-active");
    }

    function startLevel(nextLevel) {
      levelNo = nextLevel;
      puzzle = generateLevel(levelNo);
      rotation = 0;
      active = 0;
      completed = [];
      busy = false;
      spin = 0;
      tutorialStep = levelNo === 1 ? 0 : 99;
      rotatesUsed = 0;
      startScreen.hidden = true;
      winScreen.hidden = true;
      playScreen.hidden = false;
      document.body.classList.add("cr-playing");
      render();
    }

    function rotate(dir) {
      if (busy) return;
      if (puzzle.rotationLimit != null && rotatesUsed >= puzzle.rotationLimit) {
        setFeedback("Hết lượt xoay");
        audio.wrong();
        return;
      }
      audio.unlock();
      audio.rotate();
      const n = segmentN();
      spin += dir;
      rotation = ((spin % n) + n) % n;
      rotatesUsed += 1;
      if (tutorialStep === 0) tutorialStep = 1;
      applyHubRotation(true);
      if (puzzle.rotationLimit != null) {
        budgetEl.textContent = `Xoay: ${rotatesUsed}/${puzzle.rotationLimit}`;
      }
      if (tutorialStep === 1 && matched()) {
        tutorialStep = 2;
        hintEl.textContent = tutorials[2];
      }
    }

    function unlock() {
      if (busy) return;
      audio.unlock();
      audio.click();
      const spinner = svg.querySelector("#cr-spinner");
      if (!matched()) {
        audio.wrong();
        spinner?.classList.remove("is-shake");
        void spinner?.offsetWidth;
        spinner?.classList.add("is-shake");
        setFeedback("Chưa khớp");
        return;
      }

      busy = true;
      audio.match();
      burst(sparks);
      const unlocked = active;
      const ring = svg.querySelector(`[data-ring="${unlocked}"]`);
      ring?.classList.remove("is-active");
      ring?.classList.add("is-locked");
      hintEl.classList.add("is-off");
      setFeedback("Mở khóa!");
      progressEl.textContent = `${completed.length + 1} / ${RING_COUNT}`;

      setTimeout(() => {
        completed.push(unlocked);
        sparks.innerHTML = "";
        settleUnlockedRing(unlocked);
        if (completed.length >= RING_COUNT) {
          moveHubToRing(svg, {
            hub: puzzle.hubs[unlocked],
            n: segmentN(),
            ringIndex: unlocked,
            fromCenter: unlocked === 0,
          });
          audio.complete();
          const winProgress = root.querySelector(".cr-progress-lg");
          if (winProgress) winProgress.textContent = `${RING_COUNT} / ${RING_COUNT}`;
          winTitle.textContent = "LEVEL COMPLETE!";
          winScreen.hidden = false;
          if (!stageCleared) {
            stageCleared = true;
            ctx.onComplete({ level: levelNo });
          }
          busy = false;
          syncHud();
          return;
        }
        const fromCenter = unlocked === 0;
        active += 1;
        tutorialStep = 99;
        activateRing(active);
        moveHubToRing(svg, {
          hub: hub(),
          n: segmentN(),
          ringIndex: unlocked,
          fromCenter,
        });
        syncHud();
        setTimeout(() => {
          busy = false;
        }, 460);
      }, 220);
    }

    playBtn.addEventListener("click", () => {
      audio.unlock();
      audio.click();
      startLevel(1);
    });
    leftBtn.addEventListener("click", () => rotate(-1));
    rightBtn.addEventListener("click", () => rotate(1));
    unlockBtn.addEventListener("click", unlock);
    nextBtn.addEventListener("click", () => {
      audio.click();
      startLevel(levelNo + 1);
    });
    replayBtn.addEventListener("click", () => {
      audio.click();
      startLevel(levelNo);
    });

    [playBtn, leftBtn, rightBtn, unlockBtn, nextBtn, replayBtn].forEach((btn) => {
      btn.addEventListener("pointerdown", () => btn.classList.add("is-press"));
      btn.addEventListener("pointerup", () => btn.classList.remove("is-press"));
      btn.addEventListener("pointerleave", () => btn.classList.remove("is-press"));
    });

    startScreen.hidden = false;
    playScreen.hidden = true;
    winScreen.hidden = true;

    return () => {
      busy = true;
      document.body.classList.remove("cr-playing");
    };
  },
};
