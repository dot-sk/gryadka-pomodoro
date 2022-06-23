import { sample } from "effector";
import { countdownModel } from "../../entitites/countdown";
import dingSoundMp3 from "./ding.mp3";
import { settingsModel } from "../../entitites/settings";

const dingAudio = new Audio(dingSoundMp3);

const willDing = sample({
  source: countdownModel.events.end,
  filter: settingsModel.$settings.map((settings) => settings.sound),
});

willDing.watch(() => {
  dingAudio.play();
});
