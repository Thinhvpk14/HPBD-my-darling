const STORAGE_KEY = "hbd.progress.v1";

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

  const root = document.getElementById("stage-root");
  const navEl = document.getElementById("stage-nav");
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
    url.searchParams.delete("debug");
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

  function goTo(id) {
    const stage = stageById(id);
    if (!stage || !isUnlocked(id)) return false;
    if (typeof unmount === "function") unmount();
    unmount = null;
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
      progress,
      onComplete(result = {}) {
        return complete(result);
      },
      goTo,
    });
    renderNav();
    return true;
  }

  function complete(result = {}) {
    if (!progress.cleared.includes(currentId)) {
      progress.cleared.push(currentId);
    }
    progress.results[currentId] = result;
    save();
    renderNav();
    return nextStage(currentId);
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

  return { start };
}
