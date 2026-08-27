import { createEngine } from "./engine.js?v=11";
import { passwordStage } from "./stages/password-guess.js?v=11";
import { comingSoonStage } from "./stages/coming-soon.js?v=11";

const { start, api } = createEngine({
  stages: [
    passwordStage,
    comingSoonStage,
  ],
});

window.HBD = api;
document.getElementById("app-version").textContent = `v${window.APP_VERSION}`;
start();
