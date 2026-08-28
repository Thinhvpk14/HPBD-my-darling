import { createEngine } from "./engine.js?v=36";
import { passwordStage } from "./stages/password-guess.js?v=36";
import { colorRingsStage } from "./stages/color-rings.js?v=36";

const { start } = createEngine({
  stages: [
    passwordStage,
    colorRingsStage,
  ],
});

document.getElementById("app-version").textContent = `v${window.APP_VERSION}`;
start();
