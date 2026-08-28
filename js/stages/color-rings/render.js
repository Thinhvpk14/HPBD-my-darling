import { COLORS } from "./colors.js?v=12";

const CX = 100;
const CY = 100;
const RINGS = [
  [30, 42],
  [46, 58],
  [62, 74],
  [78, 90],
  [94, 106],
];

function polar(radius, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [CX + radius * Math.cos(rad), CY + radius * Math.sin(rad)];
}

function sectorPath(r0, r1, a0, a1) {
  const [x0, y0] = polar(r1, a0);
  const [x1, y1] = polar(r1, a1);
  const [x2, y2] = polar(r0, a1);
  const [x3, y3] = polar(r0, a0);
  return `M ${x0} ${y0} A ${r1} ${r1} 0 0 1 ${x1} ${y1} L ${x2} ${y2} A ${r0} ${r0} 0 0 0 ${x3} ${y3} Z`;
}

function svgEl(name, attrs) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}

export function drawPuzzle(svg, { rings, center, active, completed }) {
  svg.innerHTML = "";
  svg.setAttribute("viewBox", "-14 -14 228 228");

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
    colors.forEach((color, i) => {
      const a0 = i * 120 - 60;
      const a1 = a0 + 118;
      const path = svgEl("path", {
        d: sectorPath(r0, r1, a0, a1),
        fill: COLORS[color],
        class: "cr-sector",
      });
      group.appendChild(path);
    });
    svg.appendChild(group);
  });

  const hub = svgEl("g", { class: "cr-hub", id: "cr-hub" });
  hub.appendChild(svgEl("circle", { cx: CX, cy: CY, r: "11", class: "cr-core" }));
  center.forEach((color, i) => {
    const angle = i * 120;
    const [x, y] = polar(18, angle);
    const [lx, ly] = polar(11, angle);
    hub.appendChild(
      svgEl("line", {
        x1: CX,
        y1: CY,
        x2: lx,
        y2: ly,
        class: "cr-arm",
      })
    );
    hub.appendChild(
      svgEl("circle", {
        cx: x,
        cy: y,
        r: "6.5",
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
