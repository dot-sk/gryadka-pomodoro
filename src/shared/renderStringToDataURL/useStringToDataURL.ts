import { useCallback, useEffect, useRef } from "react";
import { renderStringToDataURL } from "./renderStringToDataURL";

export function useStringToDataURL(): (str: string) => string {
  const canvas = useRef(document.createElement("canvas"));
  const render = useCallback(
    (str: string) => renderStringToDataURL(str, 'light', canvas.current),
    []
  );

  useEffect(() => {
    document.body.append(canvas.current);
  }, []);

  return render;
}

