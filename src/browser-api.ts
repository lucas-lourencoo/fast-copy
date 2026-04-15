import browser from "webextension-polyfill";

export { browser };

export type TargetBrowser = "chrome" | "firefox";

export const TARGET_BROWSER: TargetBrowser =
  (import.meta.env.VITE_TARGET_BROWSER as TargetBrowser) || "chrome";

export function getShortcutsUrl(): string | null {
  if (TARGET_BROWSER === "chrome") {
    return "chrome://extensions/shortcuts";
  }
  return null;
}

export function isChrome(): boolean {
  return TARGET_BROWSER === "chrome";
}

export function isFirefox(): boolean {
  return TARGET_BROWSER === "firefox";
}
