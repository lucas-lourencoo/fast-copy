// Fast Copy URL - Content Script
// Intercepts Cmd+Shift+C (Mac) / Ctrl+Shift+C (Win/Linux) to prevent DevTools
// and triggers the copy URL action instead.

document.addEventListener(
  "keydown",
  (e) => {
    const isMac = navigator.platform.toUpperCase().includes("MAC");
    const modifier = isMac ? e.metaKey : e.ctrlKey;

    if (modifier && e.shiftKey && e.code === "KeyC") {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      chrome.runtime.sendMessage({ action: "copy-url" });
    }
  },
  true,
);
