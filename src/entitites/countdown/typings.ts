import { IntervalType } from "./constants";

export type CountdownStartPayload = {
  interval: number;
  type: IntervalType;
};

export type CountdownEndPayload = {
  elapsedTime: number;
};

export type CountdownStopPayload = {
  save?: boolean;
};
