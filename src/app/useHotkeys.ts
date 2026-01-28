import { useEffect } from "react";
import { events as appEvents } from "./model";
import { countdownModel } from "../entitites/countdown";

export const useHotkeys = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+1 или Ctrl+1 - переход на таймер
      if ((e.metaKey || e.ctrlKey) && e.key === "1") {
        e.preventDefault();
        appEvents.navigateToTimer();
      }
      // Cmd+2 или Ctrl+2 - переход на статистику
      else if ((e.metaKey || e.ctrlKey) && e.key === "2") {
        e.preventDefault();
        appEvents.navigateToStats();
      }
      // Space - старт/пауза
      else if (e.code === "Space" && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        countdownModel.events.togglePlayPause();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
};
