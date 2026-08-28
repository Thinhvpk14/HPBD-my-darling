import { createEngine } from "./engine.js?v=12";
import { passwordStage } from "./stages/password-guess.js?v=12";
import { colorRingsStage } from "./stages/color-rings.js?v=12";

const { start, api } = createEngine({
  stages: [
    passwordStage,
    colorRingsStage,
  ],
});

window.HBD = api;
document.getElementById("app-version").textContent = `v${window.APP_VERSION}`;
start();
