import { createEngine } from "./engine.js?v=10";
import { passwordStage } from "./stages/password-guess.js?v=10";
import { comingSoonStage } from "./stages/coming-soon.js?v=10";

const { start, api } = createEngine({
  stages: [
    passwordStage,
    comingSoonStage,
  ],
});

window.HBD = api;
start();
