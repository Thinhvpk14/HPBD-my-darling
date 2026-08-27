const STORAGE_KEY = "hbd.progress.v1";
const DEBUG_KEY = "hbd.debug";

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function createEngine({ stages }) {
  const params = new URLSearchParams(location.search);
  const debugEnabled =
    params.get("debug") === "1" || localStorage.getItem(DEBUG_KEY) === "1";

  const root = document.getElementById("stage-root");
  const navEl = document.getElementById("stage-nav");
  const debugEl = document.getElementById("debug-panel");
  const titleEl = document.getElementById("campaign-title");
  const ledeEl = document.getElementById("campaign-lede");
  const eyebrowEl = document.getElementById("campaign-eyebrow");

  let progress = readJson(STORAGE_KEY, {
    current: stages[0]?.id ?? null,
    cleared: [],
    results: {},
  });
  let currentId = null;
  let unmount = null;
  let debugInfo = () => ({});

  function save() {
    writeJson(STORAGE_KEY, progress);
  }

  function stageById(id) {
    return stages.find((stage) => stage.id === id);
  }

  function stageIndex(id) {
    return stages.findIndex((stage) => stage.id === id);
  }

  function nextStage(id) {
    return stages[stageIndex(id) + 1] ?? null;
  }

  function unlockedIds() {
    if (debugEnabled) return stages.map((stage) => stage.id);
    const ids = new Set([stages[0].id]);
    for (const clearedId of progress.cleared) {
      const following = nextStage(clearedId);
      if (following) ids.add(following.id);
    }
    return [...ids];
  }

  function isUnlocked(id) {
    return unlockedIds().includes(id);
  }

  function setQuery(stageId) {
    const url = new URL(location.href);
    url.searchParams.set("stage", stageId);
    if (debugEnabled) url.searchParams.set("debug", "1");
    history.replaceState(null, "", url);
  }

  function renderNav() {
    navEl.innerHTML = "";
    stages.forEach((stage, index) => {
      const button = document.createElement("button");
      const unlocked = isUnlocked(stage.id);
      const cleared = progress.cleared.includes(stage.id);
      button.type = "button";
      button.className = "stage-pill";
      button.dataset.active = String(stage.id === currentId);
      button.dataset.cleared = String(cleared);
      button.disabled = !unlocked;
      button.textContent = `Màn ${index + 1}`;
      button.title = unlocked ? stage.title : `${stage.title} · chưa mở`;
      button.addEventListener("click", () => {
        if (unlocked) goTo(stage.id);
      });
      navEl.appendChild(button);
    });
  }

  function renderDebug() {
    if (!debugEnabled) {
      debugEl.hidden = true;
      return;
    }
    debugEl.hidden = false;
    const select = debugEl.querySelector("[data-debug-stage]");
    select.innerHTML = stages
      .map(
        (stage) =>
          `<option value="${stage.id}" ${stage.id === currentId ? "selected" : ""}>${stage.title}</option>`
      )
      .join("");
    const info = debugInfo();
    debugEl.querySelector("[data-debug-info]").textContent = JSON.stringify(
      {
        current: currentId,
        cleared: progress.cleared,
        unlocked: unlockedIds(),
        ...info,
      },
      null,
      2
    );
  }

  function goTo(id) {
    const stage = stageById(id);
    if (!stage || !isUnlocked(id)) return false;
    if (typeof unmount === "function") unmount();
    unmount = null;
    debugInfo = () => ({});
    root.innerHTML = "";
    const template = document.getElementById(stage.templateId);
    root.appendChild(template.content.cloneNode(true));
    currentId = id;
    progress.current = id;
    save();
    setQuery(id);
    titleEl.textContent = stage.title;
    ledeEl.textContent = stage.lede;
    eyebrowEl.textContent = `Màn ${stageIndex(id) + 1} / ${stages.length}`;
    unmount = stage.mount(root, {
      debug: debugEnabled,
      progress,
      setDebugInfo(fn) {
        debugInfo = fn;
        renderDebug();
      },
      onComplete(result = {}) {
        return complete(result);
      },
      goTo,
    });
    renderNav();
    renderDebug();
    return true;
  }

  function complete(result = {}) {
    if (!progress.cleared.includes(currentId)) {
      progress.cleared.push(currentId);
    }
    progress.results[currentId] = result;
    save();
    renderNav();
    renderDebug();
    return nextStage(currentId);
  }

  function reset() {
    progress = { current: stages[0].id, cleared: [], results: {} };
    save();
    goTo(stages[0].id);
  }

  function start() {
    const requested = params.get("stage");
    const fallback = progress.current && isUnlocked(progress.current)
      ? progress.current
      : stages[0].id;
    const startId =
      requested && isUnlocked(requested) ? requested : fallback;
    goTo(startId);
  }

  debugEl.querySelector("[data-debug-stage]").addEventListener("change", (event) => {
    goTo(event.target.value);
  });
  debugEl.querySelector("[data-debug-complete]").addEventListener("click", () => {
    const next = complete({ debugSkip: true });
    if (next) goTo(next.id);
  });
  debugEl.querySelector("[data-debug-reset]").addEventListener("click", reset);
  debugEl.querySelector("[data-debug-persist]").checked = localStorage.getItem(DEBUG_KEY) === "1";
  debugEl.querySelector("[data-debug-persist]").addEventListener("change", (event) => {
    if (event.target.checked) localStorage.setItem(DEBUG_KEY, "1");
    else localStorage.removeItem(DEBUG_KEY);
  });

  const api = {
    stages,
    debug: debugEnabled,
    goTo,
    complete,
    reset,
    progress: () => progress,
    unlockedIds,
  };

  return { start, api };
}
