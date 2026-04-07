document.addEventListener("DOMContentLoaded", async () => {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const msg = chrome.i18n.getMessage(el.dataset.i18n);
    if (msg) el.textContent = msg;
  });

  const urlText = document.getElementById("currentUrl");
  const copyBtn = document.getElementById("copyBtn");
  const copyBtnText = document.getElementById("copyText");
  const copyIcon = document.getElementById("copyIcon");

  const msgUnavailable = chrome.i18n.getMessage("popupUrlUnavailable");
  const msgError = chrome.i18n.getMessage("popupUrlError");
  const msgCopyBtn = chrome.i18n.getMessage("popupCopyBtn");
  const msgCopied = chrome.i18n.getMessage("popupCopied");

  const shortcutDisplay = document.getElementById("shortcutDisplay");
  const changeShortcutBtn = document.getElementById("changeShortcutBtn");

  // ── Detect Chrome theme color from the active tab ──
  applyBrowserTheme();

  // ── Fetch actual shortcut ──
  if (chrome.commands && chrome.commands.getAll) {
    chrome.commands.getAll((commands) => {
      const copyCommand = commands.find((c) => c.name === "copy-url");
      if (copyCommand && copyCommand.shortcut) {
        const keys = copyCommand.shortcut.split("+");
        const formattedKeys = keys.map((key) => {
          let displayKey = key.trim();
          const lower = displayKey.toLowerCase();
          if (lower === "shift") displayKey = "⇧";
          else if (lower === "command" || lower === "meta" || lower === "⌘") displayKey = "⌘";
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

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab?.url) {
      urlText.textContent = tab.url;
    } else {
      urlText.textContent = msgUnavailable;
    }
  } catch (err) {
    urlText.textContent = msgError;
  }

  copyBtn.addEventListener("click", async () => {
    const url = urlText.textContent;

    if (!url || url === msgUnavailable || url === msgError) return;

    try {
      await navigator.clipboard.writeText(url);
      showCopiedState();
    } catch (err) {
      const textarea = document.createElement("textarea");
      textarea.value = url;
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

// ── Theme detection ──
// Chrome doesn't expose a theme API, so we inject a script into the active tab
// to sample CSS system colors (which reflect the Chrome theme), then use those
// colors to dynamically style the popup.

async function applyBrowserTheme() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    // Can't inject into chrome:// pages or edge cases
    if (!tab?.id || !tab.url || tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://")) {
      return;
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: sampleBrowserColors,
    });

    if (results && results[0] && results[0].result) {
      applyThemeColors(results[0].result);
    }
  } catch (e) {
    // Silently fail — fallback to CSS defaults
    console.debug("Fast Copy: Could not detect browser theme, using defaults.", e);
  }
}

// This function runs inside the active tab's context.
// It creates a temporary element to read CSS system colors that reflect the Chrome theme.
function sampleBrowserColors() {
  const probe = document.createElement("div");
  probe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;pointer-events:none;";
  document.body.appendChild(probe);

  function getColor(cssColor) {
    probe.style.color = cssColor;
    const computed = getComputedStyle(probe).color;
    return computed;
  }

  // Read CSS system colors — these adapt to Chrome's active theme
  const colors = {
    // "Canvas" = background of the browser content area (reflects theme bg)
    canvas: getColor("Canvas"),
    // "CanvasText" = text on the canvas
    canvasText: getColor("CanvasText"),
    // "ButtonFace" = toolbar-like surfaces
    buttonFace: getColor("ButtonFace"),
    // "ButtonText" = text on buttons/toolbar
    buttonText: getColor("ButtonText"),
    // "Highlight" = accent/selection color (reflects theme accent)
    highlight: getColor("Highlight"),
    // "HighlightText" = text on accent surfaces
    highlightText: getColor("HighlightText"),
    // "LinkText" = link color
    linkText: getColor("LinkText"),
  };

  probe.remove();
  return colors;
}

function applyThemeColors(colors) {
  const root = document.documentElement;

  // Parse an rgb/rgba string to components
  function parseRGB(str) {
    const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return null;
    return { r: parseInt(m[1]), g: parseInt(m[2]), b: parseInt(m[3]) };
  }

  // Calculate relative luminance (0 = black, 1 = white)
  function luminance(r, g, b) {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  // Shift a color (darken/lighten)
  function shiftColor(rgb, amount) {
    return {
      r: Math.min(255, Math.max(0, rgb.r + amount)),
      g: Math.min(255, Math.max(0, rgb.g + amount)),
      b: Math.min(255, Math.max(0, rgb.b + amount)),
    };
  }

  function toHex(rgb) {
    return (
      "#" +
      [rgb.r, rgb.g, rgb.b]
        .map((c) => c.toString(16).padStart(2, "0"))
        .join("")
    );
  }

  function toRGBA(rgb, alpha) {
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  }

  // Generate a darker/lighter variant of a color
  function deriveSecondaryAccent(rgb) {
    const lum = luminance(rgb.r, rgb.g, rgb.b);
    // Mix with a complementary direction
    return shiftColor(rgb, lum > 0.5 ? -60 : 40);
  }

  const highlight = parseRGB(colors.highlight);
  const canvas = parseRGB(colors.canvas);
  const canvasText = parseRGB(colors.canvasText);
  const buttonFace = parseRGB(colors.buttonFace);

  if (!highlight || !canvas) return;

  // Determine if the theme is dark based on Canvas luminance
  const canvasLum = luminance(canvas.r, canvas.g, canvas.b);
  const isDark = canvasLum < 0.4;

  // Check if the highlight color is actually chromatic (not gray)
  const highlightIsChromatic =
    Math.abs(highlight.r - highlight.g) > 15 ||
    Math.abs(highlight.g - highlight.b) > 15 ||
    Math.abs(highlight.r - highlight.b) > 15;

  // Only override accent if the highlight color is actually a custom color (not default blue/gray)
  if (highlightIsChromatic) {
    const accent = highlight;
    const accentSecondary = deriveSecondaryAccent(accent);

    root.style.setProperty("--accent", toHex(accent));
    root.style.setProperty("--accent-secondary", toHex(accentSecondary));
    root.style.setProperty("--accent-shadow", toRGBA(accent, 0.25));
    root.style.setProperty("--accent-shadow-hover", toRGBA(accent, 0.4));
    root.style.setProperty("--card-border-hover", toRGBA(accent, 0.3));
  }

  // Apply background based on detected theme surface color
  if (isDark) {
    const bg1 = shiftColor(canvas, -10);
    const bg2 = canvas;
    const bg3 = shiftColor(canvas, 15);

    root.style.setProperty("--bg-gradient-1", toHex(bg1));
    root.style.setProperty("--bg-gradient-2", toHex(bg2));
    root.style.setProperty("--bg-gradient-3", toHex(bg3));
    root.style.setProperty("--text-primary", "#e0e0e0");
    root.style.setProperty("--text-secondary", "#8b8ba3");
    root.style.setProperty("--text-heading", "#ffffff");
    root.style.setProperty("--url-text", "#c8c8e0");
    root.style.setProperty("--card-bg", "rgba(255, 255, 255, 0.06)");
    root.style.setProperty("--card-border", "rgba(255, 255, 255, 0.08)");
    root.style.setProperty("--card-bg-hover", "rgba(255, 255, 255, 0.08)");
    root.style.setProperty("--kbd-bg", "rgba(255, 255, 255, 0.08)");
    root.style.setProperty("--kbd-border", "rgba(255, 255, 255, 0.12)");
    root.style.setProperty("--kbd-text", "#8b8ba3");
    root.style.setProperty("--hint-text", "#5a5a7a");
  } else {
    const bg1 = shiftColor(canvas, -8);
    const bg2 = shiftColor(canvas, -15);
    const bg3 = shiftColor(canvas, 5);

    root.style.setProperty("--bg-gradient-1", toHex(bg1));
    root.style.setProperty("--bg-gradient-2", toHex(bg2));
    root.style.setProperty("--bg-gradient-3", toHex(bg3));
    root.style.setProperty("--text-primary", "#1a1a2e");
    root.style.setProperty("--text-secondary", "#5a5a7a");
    root.style.setProperty("--text-heading", "#1a1a2e");
    root.style.setProperty("--url-text", "#3a3a5a");
    root.style.setProperty("--card-bg", "rgba(0, 0, 0, 0.04)");
    root.style.setProperty("--card-border", "rgba(0, 0, 0, 0.08)");
    root.style.setProperty("--card-bg-hover", "rgba(0, 0, 0, 0.06)");
    root.style.setProperty("--kbd-bg", "rgba(0, 0, 0, 0.06)");
    root.style.setProperty("--kbd-border", "rgba(0, 0, 0, 0.1)");
    root.style.setProperty("--kbd-text", "#5a5a7a");
    root.style.setProperty("--hint-text", "#8b8ba3");
  }

  // If canvasText is chromatic (custom theme text color), use it
  if (canvasText) {
    const textIsChromatic =
      Math.abs(canvasText.r - canvasText.g) > 10 ||
      Math.abs(canvasText.g - canvasText.b) > 10;
    if (textIsChromatic) {
      root.style.setProperty("--text-heading", toHex(canvasText));
    }
  }
}
