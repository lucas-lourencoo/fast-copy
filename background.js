// Fast Copy URL - Background Service Worker

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "copy-url") {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab?.url) {
        console.warn("Fast Copy: No active tab or URL found.");
        return;
      }

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: copyAndNotify,
        args: [tab.url],
      });
    } catch (error) {
      console.error("Fast Copy: Error copying URL:", error);
    }
  }
});

function copyAndNotify(url) {
  function showToast() {
    const existing = document.getElementById("fast-copy-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "fast-copy-toast";
    toast.innerHTML = `
      <div style="
        position: fixed;
        top: 8px;
        left: 50%;
        transform: translateX(-50%) translateY(-20px) scale(0.95);
        z-index: 2147483647;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 20px;
        background: #e4f4f1;
        color: #1a2b2a;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        border-radius: 50px;
        box-shadow: 0 8px 40px rgba(0, 0, 0, 0.22), 0 2px 10px rgba(0, 0, 0, 0.12);
        border: 2px solid rgba(42, 124, 111, 0.25);
        opacity: 0;
        transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: none;
        white-space: nowrap;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2a7c6f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
        </svg>
        Link Copiado!
      </div>
    `;

    document.body.appendChild(toast);
    const inner = toast.firstElementChild;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        inner.style.opacity = "1";
        inner.style.transform = "translateX(-50%) translateY(0) scale(1)";
      });
    });

    setTimeout(() => {
      inner.style.opacity = "0";
      inner.style.transform = "translateX(-50%) translateY(-20px) scale(0.95)";
      setTimeout(() => toast.remove(), 350);
    }, 2500);
  }

  navigator.clipboard
    .writeText(url)
    .then(() => showToast())
    .catch(() => {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      showToast();
    });
}
