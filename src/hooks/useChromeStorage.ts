import { useState, useEffect, useCallback } from "react";

type StorageArea = "sync" | "local";

export function useChromeStorage<T>(
  key: string,
  defaultValue: T,
  area: StorageArea = "sync",
): [T, (value: T) => Promise<void>, boolean] {
  const [data, setData] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.storage) {
      setLoading(false);
      return;
    }

    const storage = area === "sync" ? chrome.storage.sync : chrome.storage.local;

    storage.get(key, (result) => {
      if (result[key] !== undefined) {
        setData(result[key] as T);
      }
      setLoading(false);
    });

    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string,
    ) => {
      if (areaName === area && changes[key]) {
        setData(changes[key].newValue as T);
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [key, area]);

  const setValue = useCallback(
    async (value: T) => {
      if (typeof chrome === "undefined" || !chrome.storage) return;
      const storage = area === "sync" ? chrome.storage.sync : chrome.storage.local;
      await storage.set({ [key]: value });
      setData(value);
    },
    [key, area],
  );

  return [data, setValue, loading];
}
