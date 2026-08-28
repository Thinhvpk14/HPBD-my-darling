import { COLORS } from "./colors.js?v=17";

const CX = 100;
const CY = 100;
const HUB_R = 12;
const DOT_R = 5.6;
const DOT_DIST = 16.2;
const RINGS = [
  [32, 40],
  [46, 54],
  [60, 68],
  [74, 82],
  [88, 96],
];

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

export function drawPuzzle(svg, { rings, center, active, completed }) {
  svg.innerHTML = "";
  svg.setAttribute("viewBox", "-14 -14 228 228");
  const n = rings[0].length;

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

    const [r0, r1] = RINGS[ringIndex];
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
      const [a0, a1] = runAngles(run.start, run.count, n);
      if (run.count >= n) {
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

  const hub = svgEl("g", { class: "cr-hub", id: "cr-hub" });
  center.forEach((_, i) => {
    const angle = i * 120;
    const [x0, y0] = polar(HUB_R + DOT_R, angle);
    const [x1, y1] = polar(100, angle);
    hub.appendChild(
      svgEl("line", {
        x1: String(x0),
        y1: String(y0),
        x2: String(x1),
        y2: String(y1),
        class: "cr-guide",
      })
    );
  });
  hub.appendChild(
    svgEl("circle", {
      cx: CX,
      cy: CY,
      r: String(HUB_R),
      class: "cr-core",
    })
  );
  center.forEach((color, i) => {
    const [x, y] = polar(DOT_DIST, i * 120);
    hub.appendChild(
      svgEl("circle", {
        cx: String(x),
        cy: String(y),
        r: String(DOT_R),
        fill: COLORS[color],
        class: "cr-dot",
      })
    );
  });
  svg.appendChild(hub);
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
