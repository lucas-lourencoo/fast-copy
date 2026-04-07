// Fast Copy - Content Script
// Intercepts Cmd+Shift+C (Mac) / Ctrl+Shift+C (Win/Linux) to prevent DevTools
// and triggers the copy URL action instead.

document.addEventListener(
  "keydown",
  (e) => {
    if (e.ctrlKey && e.shiftKey && e.code === "KeyC") {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      chrome.runtime.sendMessage({ action: "copy-url" });
    }
  },
  true,
);
