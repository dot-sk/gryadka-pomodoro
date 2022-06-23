export enum CountdownState {
  INITIAL = "initial",
  RUNNING = "running",
  PAUSED = "paused",
}

export enum IntervalType {
  INITIAL = "initial",
  WORK = "work",
  REST = "rest",
}

export const IntervalTypeEmoji: Record<IntervalType, string> = {
  initial: "",
  work: "🧑🏻‍💻",
  rest: "🌴",
};
