import { createEngine } from "./engine.js?v=9";
import { passwordStage } from "./stages/password-guess.js?v=9";
import { comingSoonStage } from "./stages/coming-soon.js?v=9";

const { start, api } = createEngine({
  stages: [
    passwordStage,
    comingSoonStage,
  ],
});

window.HBD = api;
start();
