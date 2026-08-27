import { createEngine } from "./engine.js?v=7";
import { passwordStage } from "./stages/password-guess.js?v=7";
import { comingSoonStage } from "./stages/coming-soon.js?v=7";

const { start, api } = createEngine({
  stages: [
    passwordStage,
    comingSoonStage,
  ],
});

window.HBD = api;
start();
