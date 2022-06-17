export const minToSec = (min: number) => min * 60;

export const formatTime = (sec: number) => {
  const min = Math.floor(sec / 60);
  const secs = sec % 60;
  return `${min}:${secs < 10 ? "0" : ""}${secs}`;
};

export const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
