export type CountdownStartPayload = {
  interval: number;
};

export type CountdownEndPayload = {
  elapsedTime: number;
};

export type CountdownStopPayload = {
  save?: boolean;
};
