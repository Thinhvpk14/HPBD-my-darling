const DOOR_T = [0.02, 0.26, 0.5, 0.74];
const GIRL_T = [0, 0.2, 0.44, 0.68, 0.94];
const TREASURE_T = 0.98;

const PAUSE_MS = 700;
const WALK_MS = 1600;

function clampIndex(index, max) {
  return Math.max(0, Math.min(index, max));
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - (2 - 2 * t) * (2 - 2 * t) / 2;
}

export function bindJourney({
  mapEl,
  girlEl,
  bubbleEl,
  fabEl,
  stages,
  isUnlocked,
  isCleared,
  onEnter,
  onOpenMap,
}) {
  const gates = [...mapEl.querySelectorAll("[data-stage]")];
  const treasureEl = mapEl.querySelector("#map-treasure");
  const trail = mapEl.querySelector(".journey-path path");
  let walkTimer = 0;
  let walkClearTimer = 0;
  let walkRaf = 0;

  function pathPoint(t) {
    const len = trail.getTotalLength();
    const pt = trail.getPointAtLength(len * Math.max(0, Math.min(1, t)));
    return { x: pt.x, y: pt.y };
  }

  function girlT(index) {
    return GIRL_T[clampIndex(index, GIRL_T.length - 1)];
  }

  function allStagesCleared() {
    return stages.every((stage) => isCleared(stage.id));
  }

  function paint() {
    gates.forEach((gate, index) => {
      const id = stages[index]?.id;
      const unlocked = isUnlocked(id);
      const cleared = isCleared(id);
      gate.disabled = !unlocked;
      gate.classList.toggle("is-locked", !unlocked);
      gate.classList.toggle("is-open", unlocked && !cleared);
      gate.classList.toggle("is-cleared", cleared);
      const pt = pathPoint(DOOR_T[index] ?? 1);
      gate.style.setProperty("--x", `${pt.x}%`);
      gate.style.setProperty("--y", `${pt.y}%`);
    });
    if (treasureEl) {
      const pt = pathPoint(TREASURE_T);
      treasureEl.style.setProperty("--x", `${pt.x}%`);
      treasureEl.style.setProperty("--y", `${pt.y}%`);
      treasureEl.classList.toggle("is-reached", allStagesCleared());
    }
  }

  function setBubble(index) {
    if (allStagesCleared() && index >= stages.length) {
      bubbleEl.textContent = "Kho báu đang khóa.";
      return;
    }
    bubbleEl.textContent = "Mở cửa này nha~";
  }

  function setGirlAt(t, walk) {
    const pt = pathPoint(t);
    girlEl.classList.toggle("is-walk", Boolean(walk));
    girlEl.style.setProperty("--x", `${pt.x}%`);
    girlEl.style.setProperty("--y", `${pt.y}%`);
  }

  function currentIndex() {
    const cleared = stages.filter((stage) => isCleared(stage.id)).length;
    return Math.min(cleared, stages.length);
  }

  function cancelWalk() {
    window.clearTimeout(walkTimer);
    window.clearTimeout(walkClearTimer);
    window.cancelAnimationFrame(walkRaf);
    girlEl.classList.remove("is-walk");
  }

  function snapTo(index) {
    girlEl.classList.add("is-snap");
    girlEl.classList.remove("is-walk");
    setGirlAt(girlT(index), false);
    void girlEl.offsetWidth;
  }

  function walkTo(fromIndex, toIndex, done) {
    const fromT = girlT(fromIndex);
    const toT = girlT(toIndex);
    const duration = Math.max(900, WALK_MS * Math.abs(toT - fromT) / 0.32);
    const start = performance.now();
    girlEl.classList.add("is-snap", "is-walk");

    function frame(now) {
      const p = Math.min(1, (now - start) / duration);
      setGirlAt(fromT + (toT - fromT) * easeInOut(p), true);
      if (p < 1) {
        walkRaf = window.requestAnimationFrame(frame);
        return;
      }
      girlEl.classList.remove("is-walk");
      done();
    }

    walkRaf = window.requestAnimationFrame(frame);
  }

  function show({ fromIndex } = {}) {
    paint();
    cancelWalk();
    const target = currentIndex();
    const startAt = Number.isInteger(fromIndex) ? fromIndex : target;
    const shouldWalk = Number.isInteger(fromIndex) && fromIndex !== target;

    snapTo(startAt);
    if (!shouldWalk) {
      girlEl.classList.remove("is-snap");
      setBubble(target);
      fabEl.hidden = true;
      return;
    }

    bubbleEl.textContent = "Xong rồi!";
    fabEl.hidden = true;

    walkTimer = window.setTimeout(() => {
      bubbleEl.textContent = target >= stages.length ? "Đi tới kho báu nha~" : "Đi cửa tiếp theo nha~";
      walkTo(startAt, target, () => setBubble(target));
    }, PAUSE_MS);
  }

  gates.forEach((gate) => {
    gate.addEventListener("click", () => {
      if (gate.disabled) return;
      cancelWalk();
      onEnter(gate.dataset.stage);
    });
  });

  treasureEl?.addEventListener("click", () => {
    bubbleEl.textContent = "Kho báu đang khóa.";
  });

  fabEl.addEventListener("click", () => onOpenMap());

  paint();
  return {
    show,
    hide() {
      cancelWalk();
      fabEl.hidden = false;
    },
    paint,
  };
}
