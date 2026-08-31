import { bindJourney } from "./journey.js?v=57";

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
  const mapEl = document.getElementById("journey-map");
  const girlEl = document.getElementById("map-girl");
  const bubbleEl = document.getElementById("map-bubble");
  const fabEl = document.getElementById("map-fab");

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

  function isCleared(id) {
    return progress.cleared.includes(id);
  }

  function setQuery(stageId) {
    const url = new URL(location.href);
    if (stageId) url.searchParams.set("stage", stageId);
    else url.searchParams.delete("stage");
    url.searchParams.delete("debug");
    history.replaceState(null, "", url);
  }

  function renderNav() {
    navEl.innerHTML = "";
  }

  const journey = bindJourney({
    mapEl,
    girlEl,
    bubbleEl,
    fabEl,
    stages,
    isUnlocked,
    isCleared,
    onEnter(id) {
      goTo(id);
    },
    onOpenMap() {
      showMap({ fromId: currentId });
    },
  });

  function setHero(title, lede, eyebrow) {
    titleEl.textContent = title;
    ledeEl.textContent = lede;
    eyebrowEl.textContent = eyebrow;
  }

  function showMap({ fromId } = {}) {
    if (typeof unmount === "function") unmount();
    unmount = null;
    root.innerHTML = "";
    currentId = null;
    document.body.classList.add("on-map");
    document.body.classList.remove("cr-playing");
    setHero("Hành trình", "Mở từng cửa để tới kho báu. Chạm cửa đang mở để giải đố.", "Bản đồ");
    setQuery("");
    const fromIndex = fromId ? stageIndex(fromId) : undefined;
    journey.show({ fromIndex: fromIndex >= 0 ? fromIndex : undefined });
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
    document.body.classList.remove("on-map");
    journey.hide();
    setHero(stage.title, stage.lede, `Màn ${stageIndex(id) + 1} / ${stages.length}`);
    unmount = stage.mount(root, {
      progress,
      onComplete(result = {}) {
        return complete(result);
      },
      goTo,
      openMap() {
        showMap({ fromId: id });
      },
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
    journey.paint();
    return nextStage(currentId);
  }

  function start() {
    const requested = params.get("stage");
    if (requested && isUnlocked(requested)) {
      goTo(requested);
      return;
    }
    showMap();
  }

  return { start };
}
