export function useChromeI18n(key: string, fallback?: string): string {
  if (typeof chrome !== "undefined" && chrome.i18n) {
    return chrome.i18n.getMessage(key) || fallback || key;
  }
  return fallback || key;
}

export function applyI18nToRef(
  ref: React.RefObject<HTMLElement | null>,
): void {
  if (typeof chrome === "undefined" || !chrome.i18n) return;
  const el = ref.current;
  if (!el) return;
  el.querySelectorAll<HTMLElement>("[data-i18n]").forEach((node) => {
    const msg = chrome.i18n.getMessage(node.dataset.i18n!);
    if (msg) node.textContent = msg;
  });
}
