import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { IpcChannels } from "../ipcWorld/constants";

interface LiquidGlassContextValue {
  isLiquidGlassEnabled: boolean;
}

const LiquidGlassContext = createContext<LiquidGlassContextValue>({
  isLiquidGlassEnabled: false,
});

export const useLiquidGlass = () => useContext(LiquidGlassContext);

interface LiquidGlassProviderProps {
  children: ReactNode;
}

export const LiquidGlassProvider: React.FC<LiquidGlassProviderProps> = ({ children }) => {
  const [isLiquidGlassEnabled, setIsLiquidGlassEnabled] = useState(false);

  useEffect(() => {
    const ipcWorld = (window as any).ipcWorld;
    if (!ipcWorld) return;

    ipcWorld.on(IpcChannels["liquid-glass-state"], (_: any, enabled: boolean) => {
      setIsLiquidGlassEnabled(enabled);
    });
  }, []);

  return (
    <LiquidGlassContext.Provider value={{ isLiquidGlassEnabled }}>
      {children}
    </LiquidGlassContext.Provider>
  );
};
