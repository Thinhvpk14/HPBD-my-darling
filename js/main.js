import { createEngine } from "./engine.js?v=41";
import { passwordStage } from "./stages/password-guess.js?v=41";
import { colorRingsStage } from "./stages/color-rings.js?v=41";
import { wordMemoryStage } from "./stages/word-memory.js?v=41";

const { start } = createEngine({
  stages: [
    passwordStage,
    colorRingsStage,
    wordMemoryStage,
  ],
});

document.getElementById("app-version").textContent = `v${window.APP_VERSION}`;
start();
