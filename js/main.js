import { createEngine } from "./engine.js?v=8";
import { passwordStage } from "./stages/password-guess.js?v=8";
import { comingSoonStage } from "./stages/coming-soon.js?v=8";

const { start, api } = createEngine({
  stages: [
    passwordStage,
    comingSoonStage,
  ],
});

window.HBD = api;
start();
