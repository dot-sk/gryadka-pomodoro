import React from "react";
import compose from "@tinkoff/utils/function/compose";
import { LiquidGlassProvider } from "../../shared/liquidGlass";

const withLiquidGlass = (Component: React.ComponentType) => () => (
  <LiquidGlassProvider>
    <Component />
  </LiquidGlassProvider>
);

export const withProviders = compose(withLiquidGlass);
