import { COLORS } from "./colors.js?v=39";

const CX = 100;
const CY = 100;
const HUB_R = 12;
const DOT_R = 5.6;
const DOT_DIST = 16.2;
const RING_INNER = 28;
const RING_WIDTH = 6.4;
const RING_GAP = 10;
const LOCKED_STROKE = 2.2;

function ringBand(index) {
  const r0 = RING_INNER + index * (RING_WIDTH + RING_GAP);
  return [r0, r0 + RING_WIDTH];
}

function polar(radius, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [CX + radius * Math.cos(rad), CY + radius * Math.sin(rad)];
}

function arcPath(radius, a0, a1) {
  let sweep = a1 - a0;
  while (sweep < 0) sweep += 360;
  const large = sweep > 180 ? 1 : 0;
  const [x0, y0] = polar(radius, a0);
  const [x1, y1] = polar(radius, a1);
  return `M ${x0} ${y0} A ${radius} ${radius} 0 ${large} 1 ${x1} ${y1}`;
}

function svgEl(name, attrs) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}

function colorRuns(ring) {
  const n = ring.length;
  const gap = ring.findIndex((cell) => cell == null);
  const origin = gap === -1 ? 0 : gap;
  const runs = [];
  let i = 0;
  while (i < n) {
    const color = ring[(origin + i) % n];
    if (color == null) {
      i += 1;
      continue;
    }
    let count = 1;
    while (count + i < n && ring[(origin + i + count) % n] === color) count += 1;
    runs.push({ color, start: (origin + i) % n, count });
    i += count;
  }
  if (
    origin === 0 &&
    ring[0] != null &&
    ring[0] === ring[n - 1] &&
    runs.length >= 2
  ) {
    const last = runs.pop();
    runs[0] = {
      color: runs[0].color,
      start: last.start,
      count: last.count + runs[0].count,
    };
  }
  return runs;
}

function runAngles(start, count, n) {
  const step = 360 / n;
  return [start * step - step / 2, (start + count) * step - step / 2];
}

export function ringMid(index) {
  const [r0, r1] = ringBand(index);
  return (r0 + r1) / 2;
}

function markerDist(ringIndex) {
  if (ringIndex == null) return DOT_DIST;
  return ringMid(ringIndex) + LOCKED_STROKE / 2 + DOT_R;
}

function setDot(el, x, y, r, color) {
  el.setAttribute("cx", String(x));
  el.setAttribute("cy", String(y));
  el.setAttribute("r", String(r ?? DOT_R));
  if (color) el.setAttribute("fill", COLORS[color]);
}

function createDot(x, y, color, extraClass) {
  return svgEl("circle", {
    cx: String(x),
    cy: String(y),
    r: String(DOT_R),
    fill: COLORS[color],
    class: extraClass || "cr-dot",
  });
}

export function drawPuzzle(svg, { rings, hub, n, active, completed }) {
  svg.innerHTML = "";
  const outer = ringBand(rings.length - 1)[1] + 14;
  const pad = 4;
  const origin = CX - outer - pad;
  const size = (outer + pad) * 2;
  svg.setAttribute("viewBox", `${origin} ${origin} ${size} ${size}`);
  const segments = n ?? rings[0].length;
  const step = 360 / segments;

  const defs = svgEl("defs", {});
  defs.innerHTML = `
    <filter id="ring-glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="1.8" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  `;
  svg.appendChild(defs);

  rings.forEach((colors, ringIndex) => {
    const group = svgEl("g", {
      class: "cr-ring",
      "data-ring": String(ringIndex),
    });
    if (completed.includes(ringIndex)) group.classList.add("is-done");
    else if (ringIndex === active) group.classList.add("is-active");
    else group.classList.add("is-idle");

    const [r0, r1] = ringBand(ringIndex);
    const midR = (r0 + r1) / 2;
    const strokeW = r1 - r0;
    group.appendChild(
      svgEl("circle", {
        cx: CX,
        cy: CY,
        r: String(midR),
        class: "cr-track",
        "stroke-width": String(strokeW * 0.92),
      })
    );
    colorRuns(colors).forEach((run) => {
      const [a0, a1] = runAngles(run.start, run.count, segments);
      if (run.count >= segments) {
        group.appendChild(
          svgEl("circle", {
            cx: CX,
            cy: CY,
            r: String(midR),
            fill: "none",
            stroke: COLORS[run.color],
            "stroke-width": String(strokeW),
            class: "cr-dash",
          })
        );
        return;
      }
      group.appendChild(
        svgEl("path", {
          d: arcPath(midR, a0, a1),
          fill: "none",
          stroke: COLORS[run.color],
          "stroke-width": String(strokeW),
          "stroke-linecap": "butt",
          class: "cr-dash",
        })
      );
    });
    svg.appendChild(group);
  });

  paintHub(svg, { hub, n: segments, step });
}

function ensureSpinner(svg) {
  let spinner = svg.querySelector("#cr-spinner");
  if (!spinner) {
    spinner = svgEl("g", { id: "cr-spinner", class: "cr-spinner" });
    svg.appendChild(spinner);
  }
  let locked = svg.querySelector("#cr-locked");
  if (!locked) {
    locked = svgEl("g", { id: "cr-locked" });
    spinner.appendChild(locked);
  }
  let node = svg.querySelector("#cr-hub");
  if (!node) {
    node = svgEl("g", { class: "cr-hub", id: "cr-hub" });
    spinner.appendChild(node);
  }
  return node;
}

export function paintHub(svg, { hub, n, step, ringIndex }) {
  const node = ensureSpinner(svg);
  node.replaceChildren();
  const onRing = ringIndex != null;
  const dist = markerDist(ringIndex);
  const turn = step ?? 360 / n;

  node.appendChild(
    svgEl("circle", {
      cx: CX,
      cy: CY,
      r: String(HUB_R),
      class: "cr-core",
    })
  );
  hub.colors.forEach((color, i) => {
    const [x, y] = polar(dist, hub.slots[i] * turn);
    const className = onRing ? "cr-dot is-on-ring" : "cr-dot";
    node.appendChild(createDot(x, y, color, className));
  });
}

export function moveHubToRing(svg, { hub, n, ringIndex, fromCenter }) {
  const node = svg.querySelector("#cr-hub");
  if (!node) {
    paintHub(svg, { hub, n, ringIndex });
    return;
  }
  const turn = 360 / n;
  const r = DOT_R;
  const dist = markerDist(ringIndex);
  const fromDist = fromCenter || ringIndex <= 0 ? DOT_DIST : markerDist(ringIndex - 1);
  const existing = [...node.querySelectorAll(".cr-dot")];

  hub.colors.forEach((color, i) => {
    const [x, y] = polar(dist, hub.slots[i] * turn);
    let dot = existing[i];
    if (!dot) {
      const [x0, y0] = polar(fromDist, hub.slots[i] * turn);
      dot = createDot(x0, y0, color, "cr-dot is-new is-on-ring");
      node.appendChild(dot);
      requestAnimationFrame(() => {
        setDot(dot, x, y, r, color);
      });
      return;
    }
    dot.classList.remove("is-new");
    dot.classList.add("is-on-ring");
    setDot(dot, x, y, r, color);
  });
  existing.slice(hub.colors.length).forEach((dot) => dot.remove());
}

export function burst(layer) {
  layer.innerHTML = "";
  for (let i = 0; i < 14; i += 1) {
    const spec = document.createElement("span");
    spec.className = "cr-spark";
    const angle = (i / 14) * Math.PI * 2;
    spec.style.setProperty("--dx", `${Math.cos(angle) * 48}px`);
    spec.style.setProperty("--dy", `${Math.sin(angle) * 48}px`);
    spec.style.background = ["#FF4D5A", "#4D8DFF", "#FFD84D"][i % 3];
    layer.appendChild(spec);
  }
}
