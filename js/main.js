import { createEngine } from "./engine.js?v=39";
import { passwordStage } from "./stages/password-guess.js?v=39";
import { colorRingsStage } from "./stages/color-rings.js?v=39";

const { start } = createEngine({
  stages: [
    passwordStage,
    colorRingsStage,
  ],
});

document.getElementById("app-version").textContent = `v${window.APP_VERSION}`;
start();
