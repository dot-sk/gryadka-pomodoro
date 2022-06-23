export const minToSec = (min: number) => min * 60;

// function ensure that number is double-digit
export function doubleDigit(number: number) {
  return number < 10 ? `0${number}` : number;
}

// function formats seconds to DD/MM/YYYY
export function formatSecondsDate(seconds: number) {
  const date = new Date(seconds * 1000);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// function format seconds to humans readable format
export function formatSeconds(
  seconds: number,
  { omitEmpty = true, utc = true }: { omitEmpty?: boolean; utc?: boolean } = {}
) {
  const date = new Date(seconds * 1000);

  const hh = utc ? date.getUTCHours() : date.getHours();
  const mm = utc ? date.getUTCMinutes() : date.getMinutes();
  const ss = utc ? date.getUTCSeconds() : date.getSeconds();

  const time = [!omitEmpty || hh > 0 ? hh : null, mm, ss]
    .filter((x): x is number => x !== null)
    .map(doubleDigit)
    .join(":");

  return time;
}

export const formatTime = (ms: number) =>
  formatSeconds(ms / 1000, { omitEmpty: false, utc: false });

// function parses human-readable format to seconds
export function parseSeconds(time: string) {
  const parts = time.split(":").map(Number);

  // if there is NaN in parts, return null
  if (parts.some(isNaN)) {
    return null;
  }

  const [hh, mm, ss] = parts;
  const seconds = hh * 60 * 60 + mm * 60 + ss;
  return seconds;
}

export const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const whenFontsReady = () => document.fonts.ready.then(() => true);
