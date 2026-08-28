import { createAudio } from "./color-rings/audio.js?v=17";
import { generateLevel, isMatch, stepDegrees } from "./color-rings/generate.js?v=17";
import { burst, drawPuzzle } from "./color-rings/render.js?v=17";

export const colorRingsStage = {
  id: "color-rings",
  title: "Khóa ba màu",
  lede: "Xoay chấm giữa khớp 3 màu, rồi mở từng vòng từ trong ra ngoài.",
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

    const params = new URLSearchParams(location.search);
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
    let rotating = false;

    const tutorials = [
      "Xoay chấm giữa cho khớp màu",
      "Mỗi màu trên chấm phải trùng cung đang sáng",
      "Bấm MỞ KHÓA",
    ];

    function setFeedback(text) {
      feedbackEl.textContent = text;
      feedbackEl.classList.add("is-on");
      clearTimeout(setFeedback.tid);
      setFeedback.tid = setTimeout(() => feedbackEl.classList.remove("is-on"), 700);
    }

    function segmentN() {
      return puzzle?.segments ?? puzzle?.rings?.[0]?.length ?? 12;
    }

    function applyHubRotation(animate) {
      const hub = svg.querySelector("#cr-hub");
      if (!hub) return;
      const deg = `${rotation * stepDegrees(segmentN())}deg`;
      hub.style.setProperty("--rot", deg);
      hub.style.transition = animate ? "transform 0.22s ease-out" : "none";
      hub.style.transformOrigin = "100px 100px";
      hub.style.transform = `rotate(${deg})`;
    }

    function render() {
      drawPuzzle(svg, {
        rings: puzzle.rings,
        center: puzzle.center,
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
      levelEl.textContent = `LEVEL ${levelNo}`;
      progressEl.textContent = `${completed.length} / 5`;
      if (puzzle.rotationLimit != null) {
        budgetEl.hidden = false;
        budgetEl.textContent = `Xoay: ${rotatesUsed}/${puzzle.rotationLimit}`;
      } else {
        budgetEl.hidden = true;
      }
      if (levelNo === 1 && completed.length === 0 && tutorialStep < tutorials.length) {
        hintEl.hidden = false;
        hintEl.textContent = tutorials[tutorialStep];
      } else {
        hintEl.hidden = true;
      }
      ctx.setDebugInfo(() => ({
        level: levelNo,
        rotation,
        segments: segmentN(),
        step: stepDegrees(segmentN()),
        active,
        match: isMatch(puzzle.center, rotation, puzzle.rings[active]),
        needed: puzzle.needed,
      }));
    }

    function startLevel(nextLevel) {
      levelNo = nextLevel;
      puzzle = generateLevel(levelNo);
      rotation = 0;
      active = 0;
      completed = [];
      busy = false;
      rotating = false;
      tutorialStep = levelNo === 1 ? 0 : 99;
      rotatesUsed = 0;
      startScreen.hidden = true;
      winScreen.hidden = true;
      playScreen.hidden = false;
      render();
    }

    function rotate(dir) {
      if (busy || rotating) return;
      if (puzzle.rotationLimit != null && rotatesUsed >= puzzle.rotationLimit) {
        setFeedback("Hết lượt xoay");
        audio.wrong();
        return;
      }
      audio.unlock();
      audio.rotate();
      rotating = true;
      const n = segmentN();
      rotation = (rotation + dir + n) % n;
      rotatesUsed += 1;
      if (tutorialStep === 0) tutorialStep = 1;
      applyHubRotation(true);
      if (puzzle.rotationLimit != null) {
        budgetEl.textContent = `Xoay: ${rotatesUsed}/${puzzle.rotationLimit}`;
      }
      setTimeout(() => {
        rotating = false;
        if (tutorialStep === 1 && isMatch(puzzle.center, rotation, puzzle.rings[active])) {
          tutorialStep = 2;
          hintEl.textContent = tutorials[2];
        }
        ctx.setDebugInfo(() => ({
          level: levelNo,
          rotation,
          segments: n,
          step: stepDegrees(n),
          active,
          match: isMatch(puzzle.center, rotation, puzzle.rings[active]),
          needed: puzzle.needed,
        }));
      }, 240);
    }

    function unlock() {
      if (busy || rotating) return;
      audio.unlock();
      audio.click();
      const hub = svg.querySelector("#cr-hub");
      if (!isMatch(puzzle.center, rotation, puzzle.rings[active])) {
        audio.wrong();
        hub?.classList.remove("is-shake");
        void hub?.offsetWidth;
        hub?.classList.add("is-shake");
        setFeedback("Chưa khớp");
        return;
      }

      busy = true;
      audio.match();
      burst(sparks);
      const ring = svg.querySelector(`[data-ring="${active}"]`);
      ring?.classList.add("is-unlocking");
      hub?.classList.add("is-pulse");
      setFeedback("Mở khóa!");

      setTimeout(() => {
        completed.push(active);
        sparks.innerHTML = "";
        if (completed.length >= 5) {
          audio.complete();
          progressEl.textContent = "5 / 5";
          winTitle.textContent = "LEVEL COMPLETE!";
          winScreen.hidden = false;
          if (!stageCleared) {
            stageCleared = true;
            ctx.onComplete({ level: levelNo });
          }
          busy = false;
          render();
          return;
        }
        active += 1;
        tutorialStep = 99;
        busy = false;
        render();
      }, 520);
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
    ctx.setDebugInfo(() => ({ screen: "start" }));
    if (ctx.debug && params.get("play") === "1") startLevel(1);

    return () => {
      busy = true;
    };
  },
};
