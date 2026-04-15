import { useState, useEffect, useCallback, useRef } from "react";
import { browser } from "../browser-api";

export function useChromeStorage<T>(
  key: string,
  defaultValue: T,
  area: "sync" | "local" = "sync",
): [T, (value: T) => Promise<void>, boolean] {
  const [value, setValue] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const storageArea =
          area === "local" ? browser.storage.local : browser.storage.sync;
        const result = await storageArea.get(key);
        if (mountedRef.current) {
          setValue(
            result[key] !== undefined ? (result[key] as T) : defaultValue,
          );
          setLoading(false);
        }
      } catch {
        if (mountedRef.current) setLoading(false);
      }
    };
    load();
  }, [key, area, defaultValue]);

  useEffect(() => {
    const handler = (
      changes: Record<string, { oldValue?: unknown; newValue?: unknown }>,
      areaName: string,
    ) => {
      if (areaName === area && key in changes && mountedRef.current) {
        setValue(
          changes[key].newValue !== undefined
            ? (changes[key].newValue as T)
            : defaultValue,
        );
      }
    };

    browser.storage.onChanged.addListener(handler);
    return () => browser.storage.onChanged.removeListener(handler);
  }, [key, area, defaultValue]);

  const setStorage = useCallback(
    async (newValue: T) => {
      try {
        const storageArea =
          area === "local" ? browser.storage.local : browser.storage.sync;
        await storageArea.set({ [key]: newValue });
        if (mountedRef.current) setValue(newValue);
      } catch (err) {
        console.error("Fast Copy: Error saving to storage:", err);
      }
    },
    [key, area],
  );

  return [value, setStorage, loading];
}
