document.addEventListener("DOMContentLoaded", async () => {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const msg = chrome.i18n.getMessage(el.dataset.i18n);
    if (msg) el.textContent = msg;
  });

  const urlText = document.getElementById("currentUrl");
  const copyBtn = document.getElementById("copyBtn");
  const copyBtnText = document.getElementById("copyText");
  const copyIcon = document.getElementById("copyIcon");
  const matchPreview = document.getElementById("matchPreview");
  const matchPreviewText = document.getElementById("matchPreviewText");
  const matchRuleName = document.getElementById("matchRuleName");
  const noMatchSpacer = document.getElementById("noMatchSpacer");
  const openOptionsBtn = document.getElementById("openOptionsBtn");

  const msgUnavailable = chrome.i18n.getMessage("popupUrlUnavailable");
  const msgError = chrome.i18n.getMessage("popupUrlError");
  const msgCopyBtn = chrome.i18n.getMessage("popupCopyBtn");
  const msgCopied = chrome.i18n.getMessage("popupCopied");

  const shortcutDisplay = document.getElementById("shortcutDisplay");
  const changeShortcutBtn = document.getElementById("changeShortcutBtn");

  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.body.classList.add(isDark ? "theme-dark" : "theme-light");

  if (chrome.commands && chrome.commands.getAll) {
    chrome.commands.getAll((commands) => {
      const copyCommand = commands.find((c) => c.name === "copy-url");
      if (copyCommand && copyCommand.shortcut) {
        const keys = copyCommand.shortcut.split("+");
        const formattedKeys = keys.map((key) => {
          let displayKey = key.trim();
          const lower = displayKey.toLowerCase();
          if (lower === "shift") displayKey = "⇧";
          else if (lower === "command" || lower === "meta" || lower === "⌘")
            displayKey = "⌘";
          else if (lower === "ctrl" || lower === "control") displayKey = "Ctrl";
          return `<kbd>${displayKey}</kbd>`;
        });
        shortcutDisplay.innerHTML = formattedKeys.join(" + ");
      }
    });
  }

  if (changeShortcutBtn) {
    changeShortcutBtn.addEventListener("click", () => {
      chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
    });
  }

  if (openOptionsBtn) {
    openOptionsBtn.title = chrome.i18n.getMessage("openOptions") || "URL Rules";
    openOptionsBtn.addEventListener("click", () => {
      chrome.runtime.openOptionsPage();
    });
  }

  let textToCopy = "";

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab?.url) {
      urlText.textContent = tab.url;
      textToCopy = tab.url;

      const result = await applyUrlRules(tab.url);
      if (result.isPartial) {
        textToCopy = result.text;
        matchPreviewText.textContent = result.text;
        if (result.label) {
          matchRuleName.textContent = result.label;
        }
        matchPreview.classList.add("visible");
        noMatchSpacer.style.display = "none";
      } else {
        noMatchSpacer.style.display = "block";
      }
    } else {
      urlText.textContent = msgUnavailable;
    }
  } catch (err) {
    urlText.textContent = msgError;
  }

  copyBtn.addEventListener("click", async () => {
    if (!textToCopy || textToCopy === msgUnavailable || textToCopy === msgError)
      return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      showCopiedState();
    } catch (err) {
      const textarea = document.createElement("textarea");
      textarea.value = textToCopy;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      showCopiedState();
    }
  });

  function showCopiedState() {
    copyBtn.classList.add("copied");
    copyBtnText.textContent = msgCopied;
    copyIcon.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';

    setTimeout(() => {
      copyBtn.classList.remove("copied");
      copyBtnText.textContent = msgCopyBtn;
      copyIcon.innerHTML = `
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      `;
    }, 2000);
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
          return { text: match[1], isPartial: true, label: rule.label };
        }
      } catch (e) {}
    }

    return { text: url, isPartial: false };
  } catch (e) {
    return { text: url, isPartial: false };
  }
}
