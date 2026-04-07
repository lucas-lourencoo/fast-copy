// ── Preset color palettes ──
// Each entry: [accent, accent-secondary]
const COLOR_PRESETS = [
  { name: "Purple",  accent: "#667eea", secondary: "#764ba2" },
  { name: "Blue",    accent: "#4a90d9", secondary: "#357abd" },
  { name: "Teal",    accent: "#2a9d8f", secondary: "#1a7a6e" },
  { name: "Green",   accent: "#4caf50", secondary: "#2e7d32" },
  { name: "Pink",    accent: "#e91e63", secondary: "#c2185b" },
  { name: "Red",     accent: "#ef5350", secondary: "#c62828" },
  { name: "Orange",  accent: "#ff9800", secondary: "#e65100" },
  { name: "Yellow",  accent: "#fdd835", secondary: "#f9a825" },
  { name: "Gray",    accent: "#78909c", secondary: "#546e7a" },
];

const STORAGE_KEY = "fastcopy_theme";

document.addEventListener("DOMContentLoaded", async () => {
  // ── i18n ──
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

  // ── Apply saved theme immediately ──
  await loadAndApplyTheme();

  // ── Build color swatches ──
  buildColorSwatches();

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

  // ── Load current URL ──
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

  // ── Copy button ──
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

// ── Theme management ──

async function loadAndApplyTheme() {
  // Detect dark/light from OS
  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.body.classList.add(isDark ? "theme-dark" : "theme-light");

  // Load saved accent color
  try {
    const data = await chrome.storage.local.get(STORAGE_KEY);
    const saved = data[STORAGE_KEY];
    if (saved && saved.accent) {
      applyAccentColor(saved.accent, saved.secondary);
    }
  } catch (e) {
    // Use defaults
  }
}

function applyAccentColor(accent, secondary) {
  const root = document.documentElement;
  root.style.setProperty("--accent", accent);
  root.style.setProperty("--accent-secondary", secondary || darkenColor(accent, 30));

  // Generate shadow colors from accent
  const rgb = hexToRGB(accent);
  if (rgb) {
    root.style.setProperty("--accent-shadow", `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`);
    root.style.setProperty("--accent-shadow-hover", `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`);
  }
}

async function saveTheme(accent, secondary) {
  try {
    await chrome.storage.local.set({
      [STORAGE_KEY]: { accent, secondary },
    });
  } catch (e) {
    console.warn("Fast Copy: Could not save theme", e);
  }
}

function buildColorSwatches() {
  const container = document.getElementById("colorSwatches");
  if (!container) return;

  // Get currently saved color to mark as active
  chrome.storage.local.get(STORAGE_KEY, (data) => {
    const saved = data[STORAGE_KEY];
    const savedAccent = saved?.accent || COLOR_PRESETS[0].accent;

    // Create preset swatches
    COLOR_PRESETS.forEach((preset) => {
      const swatch = document.createElement("div");
      swatch.className = "color-swatch";
      swatch.style.background = `linear-gradient(135deg, ${preset.accent}, ${preset.secondary})`;
      swatch.title = preset.name;

      if (preset.accent.toLowerCase() === savedAccent.toLowerCase()) {
        swatch.classList.add("active");
      }

      swatch.addEventListener("click", () => {
        // Remove active from all
        container.querySelectorAll(".color-swatch, .color-custom").forEach((s) => s.classList.remove("active"));
        swatch.classList.add("active");

        applyAccentColor(preset.accent, preset.secondary);
        saveTheme(preset.accent, preset.secondary);
      });

      container.appendChild(swatch);
    });

    // Custom color picker
    const customSwatch = document.createElement("div");
    customSwatch.className = "color-custom";
    customSwatch.title = "Custom";

    const plusIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    plusIcon.setAttribute("viewBox", "0 0 24 24");
    plusIcon.setAttribute("fill", "none");
    plusIcon.setAttribute("stroke", "currentColor");
    plusIcon.setAttribute("stroke-width", "2.5");
    plusIcon.innerHTML = '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>';
    customSwatch.appendChild(plusIcon);

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = savedAccent;
    customSwatch.appendChild(colorInput);

    // Check if saved color is custom (not in presets)
    const isCustom = !COLOR_PRESETS.some(
      (p) => p.accent.toLowerCase() === savedAccent.toLowerCase()
    );
    if (isCustom) {
      customSwatch.classList.add("active");
      customSwatch.style.background = savedAccent;
      customSwatch.style.borderStyle = "solid";
      plusIcon.style.display = "none";
    }

    colorInput.addEventListener("input", (e) => {
      const color = e.target.value;
      const secondary = darkenColor(color, 30);

      container.querySelectorAll(".color-swatch, .color-custom").forEach((s) => s.classList.remove("active"));
      customSwatch.classList.add("active");
      customSwatch.style.background = color;
      customSwatch.style.borderStyle = "solid";
      plusIcon.style.display = "none";

      applyAccentColor(color, secondary);
      saveTheme(color, secondary);
    });

    container.appendChild(customSwatch);
  });
}

// ── Color utilities ──

function hexToRGB(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function darkenColor(hex, amount) {
  const rgb = hexToRGB(hex);
  if (!rgb) return hex;
  const r = Math.max(0, rgb.r - amount);
  const g = Math.max(0, rgb.g - amount);
  const b = Math.max(0, rgb.b - amount);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
