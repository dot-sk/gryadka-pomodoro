export enum CountdownState {
  INITIAL = "initial",
  RUNNING = "running",
  PAUSED = "paused",
  SUCCESS = "success",
}

export enum IntervalType {
  INITIAL = "initial",
  WORK = "work",
  REST = "rest",
}

export const IntervalTypes: string[] = [
  IntervalType.WORK,
  IntervalType.REST,
  IntervalType.INITIAL,
];

export const IntervalTypeEmoji: Record<IntervalType, string> = {
  initial: "",
  work: "🧑🏻‍💻",
  rest: "🌴",
};
