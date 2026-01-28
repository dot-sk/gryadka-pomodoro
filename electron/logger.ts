import { app } from "electron";
import * as fs from "fs";
import * as path from "path";

const logFile = path.join(app.getPath("userData"), "debug.log");

export function debugLog(msg: string): void {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(logFile, line);
  console.log(msg);
}

export function clearLog(): void {
  try {
    fs.unlinkSync(logFile);
  } catch {
    // File doesn't exist, ignore
  }
}

export function getLogPath(): string {
  return logFile;
}
