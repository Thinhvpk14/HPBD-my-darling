import { createEngine } from "./engine.js?v=17";
import { passwordStage } from "./stages/password-guess.js?v=17";
import { colorRingsStage } from "./stages/color-rings.js?v=17";

const { start, api } = createEngine({
  stages: [
    passwordStage,
    colorRingsStage,
  ],
});

window.HBD = api;
document.getElementById("app-version").textContent = `v${window.APP_VERSION}`;
start();
