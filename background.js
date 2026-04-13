// Fast Copy - Background Service Worker

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.tabs.create({ url: chrome.runtime.getURL("welcome.html") });
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "copy-url") {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    await handleCopyUrl(tab);
  }
});

async function applyUrlRules(url) {
  try {
    const { urlRules = [] } = await chrome.storage.sync.get("urlRules");
    if (!urlRules.length) return { text: url, isPartial: false };

    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    for (const rule of urlRules) {
      if (!rule.enabled) continue;

      if (!hostname.includes(rule.domain)) continue;

      try {
        const regex = new RegExp(rule.regex);
        const match = url.match(regex);
        if (match && match[1]) {
          return { text: match[1], isPartial: true };
        }
      } catch (e) {
        console.warn("Fast Copy: Invalid regex in rule:", rule.label, e);
      }
    }

    return { text: url, isPartial: false };
  } catch (e) {
    console.error("Fast Copy: Error applying URL rules:", e);
    return { text: url, isPartial: false };
  }
}

async function handleCopyUrl(tab) {
  try {
    if (!tab?.url) {
      console.warn("Fast Copy: No active tab or URL found.");
      return;
    }

    const { text, isPartial } = await applyUrlRules(tab.url);

    let toastMessage;
    if (isPartial) {
      toastMessage = chrome.i18n.getMessage("toastMessagePartial");
    } else {
      const { urlRules = [] } = await chrome.storage.sync.get("urlRules");
      const hostname = new URL(tab.url).hostname;
      const hasRulesForDomain = urlRules.some(
        (r) => r.enabled && hostname.includes(r.domain),
      );
      if (hasRulesForDomain) {
        toastMessage = chrome.i18n.getMessage("toastMessageFallback");
      } else {
        toastMessage = chrome.i18n.getMessage("toastMessage");
      }
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: copyAndNotify,
      args: [text, toastMessage, isPartial],
    });
  } catch (error) {
    console.error("Fast Copy: Error copying URL:", error);
  }
}

function copyAndNotify(textToCopy, toastMsg, isPartial) {
  function showToast() {
    const existing = document.getElementById("fast-copy-toast");
    if (existing) existing.remove();

    const accentColor = isPartial ? "#6366f1" : "#2a7c6f";
    const bgColor = isPartial ? "#eef0ff" : "#e4f4f1";
    const borderColor = isPartial
      ? "rgba(99, 102, 241, 0.25)"
      : "rgba(42, 124, 111, 0.25)";

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
        background: ${bgColor};
        color: #1a2b2a;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        border-radius: 50px;
        box-shadow: 0 8px 40px rgba(0, 0, 0, 0.22), 0 2px 10px rgba(0, 0, 0, 0.12);
        border: 2px solid ${borderColor};
        opacity: 0;
        transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: none;
        white-space: nowrap;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${accentColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          ${
            isPartial
              ? '<polyline points="20 6 9 17 4 12"></polyline>'
              : '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>'
          }
        </svg>
        ${toastMsg}
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
    .writeText(textToCopy)
    .then(() => showToast())
    .catch(() => {
      const textarea = document.createElement("textarea");
      textarea.value = textToCopy;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      showToast();
    });
}
