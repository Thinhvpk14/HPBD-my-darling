import { createEngine } from "./engine.js?v=43";
import { passwordStage } from "./stages/password-guess.js?v=43";
import { colorRingsStage } from "./stages/color-rings.js?v=43";
import { wordMemoryStage } from "./stages/word-memory.js?v=43";
import { orderMemoryStage } from "./stages/order-memory.js?v=43";

const { start } = createEngine({
  stages: [
    passwordStage,
    colorRingsStage,
    wordMemoryStage,
    orderMemoryStage,
  ],
});

document.getElementById("app-version").textContent = `v${window.APP_VERSION}`;
start();
