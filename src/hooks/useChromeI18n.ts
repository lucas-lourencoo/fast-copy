import { useState, useEffect } from "react";
import { browser } from "../lib/browser-api";

export function useBrowserI18n(key: string, fallback: string): string {
  const [value, setValue] = useState(fallback);

  useEffect(() => {
    try {
      const msg = browser.i18n.getMessage(key);
      if (msg) setValue(msg);
    } catch {
      setValue(fallback);
    }
  }, [key, fallback]);

  return value;
}

export { useBrowserI18n as useChromeI18n };

export function applyI18nToRef(
  _ref: React.RefObject<HTMLElement | null>,
): void {}
