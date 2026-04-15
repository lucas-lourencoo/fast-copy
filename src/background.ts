import { browser } from "./browser-api";
import {
  HISTORY_KEY,
  HISTORY_MAX,
  applyUrlRules,
  type CopyHistoryEntry,
  type UrlRule,
} from "./shared";

browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    browser.tabs.create({ url: browser.runtime.getURL("welcome.html") });
  }
});

browser.runtime.onMessage.addListener((message: unknown) => {
  const msg = message as {
    type: string;
    url: string;
    copiedText: string;
    isPartial: boolean;
  };
  console.log("[Fast Copy] onMessage received:", msg.type, msg);
  if (msg.type === "save-history") {
    return saveToHistoryDirect(msg.url, msg.copiedText, msg.isPartial)
      .then(() => {
        console.log("[Fast Copy] onMessage save-history: OK");
        return { ok: true };
      })
      .catch((err) => {
        console.error("[Fast Copy] onMessage save-history: FAIL", err);
        return { ok: false };
      });
  }
});

browser.commands.onCommand.addListener(async (command) => {
  console.log("[Fast Copy] onCommand fired:", command);

  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];

  if (!tab?.id) {
    console.warn("[Fast Copy] Could not resolve active tab");
    return;
  }

  await browser.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      if ((window as any).__fastCopyMouseTracking) return;
      let lastX = 0;
      let lastY = 0;
      document.addEventListener(
        "mousemove",
        (e: MouseEvent) => {
          lastX = e.clientX;
          lastY = e.clientY;
        },
        true,
      );
      (window as any).__fastCopyGetMousePos = () => ({ x: lastX, y: lastY });
      (window as any).__fastCopyMouseTracking = true;
    },
    ...({ world: "MAIN" } as any),
  });

  if (command === "copy-url") {
    await handleCopyUrl(tab);
  }

  if (command === "show-history") {
    const result = await browser.storage.local.get(HISTORY_KEY);
    const copyHistory: CopyHistoryEntry[] =
      (result[HISTORY_KEY] as CopyHistoryEntry[] | undefined) || [];
    console.log(
      "[Fast Copy] show-history: loaded",
      copyHistory.length,
      "entries",
    );

    const i18n = {
      title: browser.i18n.getMessage("historyTitle") || "Copy History",
      clear: browser.i18n.getMessage("historyClear") || "Clear",
      empty:
        browser.i18n.getMessage("historyEmpty") ||
        "No copies yet. Use the shortcut to copy a URL and it will appear here.",
      justNow: browser.i18n.getMessage("historyJustNow") || "Just now",
      copied: browser.i18n.getMessage("popupCopied") || "Copied!",
      closeHint:
        browser.i18n.getMessage("historyCloseHint") ||
        "↑↓ navigate · Enter to select",
      escHint: "Esc",
    };

    const posResult = await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const getter = (window as any).__fastCopyGetMousePos;
        if (getter) return getter() as { x: number; y: number };
        const hovered = document.querySelectorAll(":hover");
        if (hovered.length > 0) {
          const el = hovered[hovered.length - 1];
          const rect = el.getBoundingClientRect();
          return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          };
        }
        return { x: window.innerWidth / 2, y: window.innerHeight / 3 };
      },
      ...({ world: "MAIN" } as any),
    });

    const mousePos = (posResult[0]?.result as { x: number; y: number }) || {
      x: 400,
      y: 300,
    };

    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: showHistoryOverlay,
      args: [copyHistory, i18n, mousePos],
    });
  }
});

async function saveToHistoryDirect(
  url: string,
  copiedText: string,
  isPartial: boolean,
): Promise<void> {
  const result = await browser.storage.local.get(HISTORY_KEY);
  const copyHistory: CopyHistoryEntry[] =
    (result[HISTORY_KEY] as CopyHistoryEntry[] | undefined) || [];

  const entry: CopyHistoryEntry = {
    url,
    copiedText,
    isPartial,
    timestamp: Date.now(),
  };

  copyHistory.unshift(entry);

  if (copyHistory.length > HISTORY_MAX) {
    copyHistory.length = HISTORY_MAX;
  }

  await browser.storage.local.set({ [HISTORY_KEY]: copyHistory });
}

async function handleCopyUrl(tab: browser.Tabs.Tab): Promise<void> {
  try {
    if (!tab?.url) {
      console.warn(
        "[Fast Copy] No active tab or URL found. tab =",
        JSON.stringify(tab),
      );
      return;
    }

    const { text, isPartial } = await applyUrlRules(tab.url);

    await saveToHistoryDirect(tab.url, text, isPartial);

    let toastMessage: string;
    if (isPartial) {
      toastMessage = browser.i18n.getMessage("toastMessagePartial");
    } else {
      const { urlRules = [] } = (await browser.storage.sync.get(
        "urlRules",
      )) as {
        urlRules: UrlRule[];
      };
      const hostname = new URL(tab.url).hostname;
      const hasRulesForDomain = urlRules.some(
        (r) => r.enabled && hostname.includes(r.domain),
      );
      if (hasRulesForDomain) {
        toastMessage = browser.i18n.getMessage("toastMessageFallback");
      } else {
        toastMessage = browser.i18n.getMessage("toastMessage");
      }
    }

    await browser.scripting.executeScript({
      target: { tabId: tab.id! },
      func: copyAndNotify,
      args: [text, toastMessage, isPartial],
    });
  } catch (error) {
    console.error("Fast Copy: Error copying URL:", error);
  }
}

function showHistoryOverlay(
  entries: {
    url: string;
    copiedText: string;
    isPartial: boolean;
    timestamp: number;
  }[],
  i18n: {
    title: string;
    clear: string;
    empty: string;
    justNow: string;
    copied: string;
    closeHint: string;
    escHint: string;
  },
  mousePos: { x: number; y: number },
): void {
  const EXISTING = document.getElementById("fast-copy-history-root");
  if (EXISTING) {
    EXISTING.remove();
    return;
  }

  let focusedEl = document.activeElement as HTMLElement | null;
  let isInputFocused = false;

  if (focusedEl) {
    if (
      focusedEl.tagName === "INPUT" ||
      focusedEl.tagName === "TEXTAREA" ||
      focusedEl.isContentEditable
    ) {
      isInputFocused = true;
    } else if (focusedEl.tagName === "IFRAME") {
      try {
        const iframeDoc = (focusedEl as HTMLIFrameElement).contentDocument;
        const iframeBody = iframeDoc?.body;
        if (iframeBody?.isContentEditable) {
          focusedEl = iframeBody;
          isInputFocused = true;
        }
      } catch {}
    }
  }

  if (isInputFocused && focusedEl) {
    focusedEl.blur();
  }

  const root = document.createElement("div");
  root.id = "fast-copy-history-root";
  root.setAttribute("tabindex", "-1");
  root.style.cssText =
    "all:initial;position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2147483647;pointer-events:auto;outline:none;";

  const shadow = root.attachShadow({ mode: "open" });

  const panelWidth = 320;
  const panelMaxHeight = 400;

  let posX = mousePos.x;
  let posY = mousePos.y;

  if (posX + panelWidth > window.innerWidth - 12) {
    posX = window.innerWidth - panelWidth - 12;
  }
  if (posX < 12) posX = 12;
  if (posY + panelMaxHeight > window.innerHeight - 12) {
    posY = window.innerHeight - panelMaxHeight - 12;
  }
  if (posY < 12) posY = 12;

  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  const styles = `
    :host { all: initial; }

    .backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.06);
      animation: fadeIn 0.15s ease;
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideIn {
      from { opacity: 0; transform: scale(0.92) translateY(-6px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes itemSlideIn {
      from { opacity: 0; transform: translateX(-8px); }
      to { opacity: 1; transform: translateX(0); }
    }

    .panel {
      position: fixed;
      left: ${posX}px;
      top: ${posY}px;
      width: ${panelWidth}px;
      max-height: ${panelMaxHeight}px;
      border-radius: 12px;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      animation: slideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 20px 60px rgba(0,0,0,0.28), 0 4px 16px rgba(0,0,0,0.15), 0 0 0 1px ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"};
      display: flex;
      flex-direction: column;
      background: ${isDark ? "#1e1e2e" : "#ffffff"};
      color: ${isDark ? "#cdd6f4" : "#1e1e2e"};
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px 8px;
      border-bottom: 1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"};
    }

    .panel-header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .panel-icon {
      width: 24px; height: 24px;
      border-radius: 6px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .panel-icon svg { width: 13px; height: 13px; color: white; }

    .panel-title {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.3px;
      text-transform: uppercase;
      opacity: 0.6;
    }

    .clear-btn {
      border: none; background: none; cursor: pointer;
      color: ${isDark ? "#f38ba8" : "#e64553"};
      font-size: 11px; font-weight: 500;
      padding: 4px 8px; border-radius: 6px;
      transition: background 0.15s;
      display: flex; align-items: center; gap: 4px;
    }
    .clear-btn:hover { background: ${isDark ? "rgba(243,139,168,0.1)" : "rgba(230,69,83,0.08)"}; }
    .clear-btn svg { width: 12px; height: 12px; }

    .items {
      overflow-y: auto;
      max-height: ${panelMaxHeight - 52}px;
      padding: 6px;
      scrollbar-width: thin;
      scrollbar-color: ${isDark ? "rgba(255,255,255,0.12) transparent" : "rgba(0,0,0,0.1) transparent"};
    }

    .item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.12s;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
      color: inherit;
      font-family: inherit;
      opacity: 0;
      animation: itemSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .item:hover, .item.item-active { background: ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}; }
    .item:active { background: ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)"}; }

    .item-content {
      flex: 1; min-width: 0;
    }

    .item-text {
      font-size: 13px;
      font-weight: 500;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-meta {
      font-size: 10px;
      opacity: 0.45;
      margin-top: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-badge {
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 1px 5px;
      border-radius: 3px;
      background: rgba(99, 102, 241, 0.12);
      color: #818cf8;
      font-weight: 700;
      flex-shrink: 0;
    }

    .item-copied {
      font-size: 11px;
      color: #22c55e;
      font-weight: 600;
      flex-shrink: 0;
    }

    .empty {
      padding: 32px 20px;
      text-align: center;
      opacity: 0.4;
      font-size: 12px;
      line-height: 1.6;
    }
    .empty svg { width: 28px; height: 28px; margin-bottom: 8px; stroke-width: 1.2; }

    .shortcut-hint {
      padding: 6px 14px 10px;
      text-align: center;
      font-size: 10px;
      opacity: 0.3;
      border-top: 1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"};
    }
    .shortcut-hint kbd {
      display: inline-block;
      padding: 1px 4px;
      border-radius: 3px;
      background: ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"};
      font-family: inherit;
      font-size: 9px;
    }
  `;

  const formatTime = (ts: number): string => {
    const diff = Date.now() - ts;
    const s = Math.floor(diff / 1000);
    if (s < 60) return i18n.justNow;
    const m = Math.floor(s / 60);
    if (m < 60) return m + "m";
    const h = Math.floor(m / 60);
    if (h < 24) return h + "h";
    return Math.floor(h / 24) + "d";
  };

  const truncate = (str: string, max: number): string =>
    str.length > max ? str.slice(0, max) + "…" : str;

  const escapeHtml = (str: string): string => {
    const div = document.createElement("span");
    div.textContent = str;
    return div.innerHTML;
  };

  let itemsHtml: string;
  if (entries.length === 0) {
    itemsHtml = `
      <div class="empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
        <div>${escapeHtml(i18n.empty)}</div>
      </div>
    `;
  } else {
    itemsHtml = entries
      .map((entry, idx) => {
        const text = truncate(entry.copiedText, 45);
        const source = truncate(entry.url, 40);
        const time = formatTime(entry.timestamp);
        const badge = entry.isPartial
          ? `<span class="item-badge">regex</span>`
          : "";

        return `
        <button class="item" data-idx="${idx}" title="${escapeHtml(entry.copiedText)}" style="animation-delay: ${idx * 35}ms">
          <div class="item-content">
            <div class="item-text">${escapeHtml(text)}</div>
            <div class="item-meta">${escapeHtml(source)} · ${time}</div>
          </div>
          ${badge}
        </button>
      `;
      })
      .join("");
  }

  const html = `
    <style>${styles}</style>
    <div class="backdrop" id="backdrop"></div>
    <div class="panel">
      <div class="panel-header">
        <div class="panel-header-left">
          <div class="panel-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <span class="panel-title">${escapeHtml(i18n.title)}</span>
        </div>
        ${
          entries.length > 0
            ? `
          <button class="clear-btn" id="clearBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            ${escapeHtml(i18n.clear)}
          </button>
        `
            : ""
        }
      </div>
      <div class="items">${itemsHtml}</div>
      ${
        entries.length > 0
          ? `
        <div class="shortcut-hint">
          ${escapeHtml(i18n.closeHint)} · <kbd>${i18n.escHint}</kbd>
        </div>
      `
          : ""
      }
    </div>
  `;

  shadow.innerHTML = html;
  document.body.appendChild(root);
  root.focus();

  const inertedElements: HTMLElement[] = [];
  document.body
    .querySelectorAll<HTMLElement>(":scope > *:not(#fast-copy-history-root)")
    .forEach((el) => {
      if (!el.hasAttribute("inert")) {
        el.setAttribute("inert", "");
        inertedElements.push(el);
      }
    });

  const removeInert = () => {
    inertedElements.forEach((el) => el.removeAttribute("inert"));
  };

  const close = () => {
    document.removeEventListener("keydown", keyHandler, true);
    removeInert();
    root.remove();
  };

  shadow.getElementById("backdrop")!.addEventListener("click", close);

  const allItems = Array.from(
    shadow.querySelectorAll<HTMLButtonElement>(".item"),
  );
  let activeIndex = -1;

  const setActiveItem = (index: number) => {
    allItems.forEach((item) => item.classList.remove("item-active"));
    if (index >= 0 && index < allItems.length) {
      activeIndex = index;
      allItems[activeIndex].classList.add("item-active");
      allItems[activeIndex].scrollIntoView({ block: "nearest" });
    }
  };

  const selectItem = (btn: HTMLButtonElement) => {
    const idx = parseInt(btn.getAttribute("data-idx") || "0");
    const entry = entries[idx];
    if (!entry) return;

    navigator.clipboard.writeText(entry.copiedText).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = entry.copiedText;
      ta.style.cssText = "position:fixed;opacity:0;";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    });

    removeInert();

    if (isInputFocused && focusedEl) {
      const el = focusedEl as HTMLElement;
      if (el.isContentEditable) {
        el.focus();
        document.execCommand("insertText", false, entry.copiedText);
      } else {
        const input = el as HTMLInputElement | HTMLTextAreaElement;
        input.focus();
        const start = input.selectionStart ?? input.value.length;
        const end = input.selectionEnd ?? input.value.length;
        const before = input.value.slice(0, start);
        const after = input.value.slice(end);
        input.value = before + entry.copiedText + after;
        const newCursor = start + entry.copiedText.length;
        input.selectionStart = newCursor;
        input.selectionEnd = newCursor;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }

    const existingBadge = btn.querySelector(".item-badge");
    if (existingBadge) existingBadge.remove();

    const check = document.createElement("span");
    check.className = "item-copied";
    check.textContent = i18n.copied;
    btn.appendChild(check);

    setTimeout(close, 400);
  };

  function keyHandler(e: KeyboardEvent) {
    if (!document.getElementById("fast-copy-history-root")) {
      document.removeEventListener("keydown", keyHandler, true);
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      e.stopImmediatePropagation();
      close();
      return;
    }

    if (allItems.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      e.stopImmediatePropagation();
      const next = activeIndex < allItems.length - 1 ? activeIndex + 1 : 0;
      setActiveItem(next);
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      e.stopImmediatePropagation();
      const prev = activeIndex > 0 ? activeIndex - 1 : allItems.length - 1;
      setActiveItem(prev);
      return;
    }

    if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      e.stopImmediatePropagation();
      selectItem(allItems[activeIndex]);
      return;
    }
  }

  document.addEventListener("keydown", keyHandler, true);

  const clearBtn = shadow.getElementById("clearBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      chrome.storage.local.set({ copyHistory: [] });
      close();
    });
  }

  allItems.forEach((btn) => {
    btn.addEventListener("click", () => selectItem(btn));

    btn.addEventListener("mouseenter", () => {
      const idx = allItems.indexOf(btn);
      if (idx >= 0) setActiveItem(idx);
    });
  });

  if (allItems.length > 0) {
    setActiveItem(0);
  }
}

function copyAndNotify(
  textToCopy: string,
  toastMsg: string,
  isPartial: boolean,
): void {
  function showToast(): void {
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
    const inner = toast.firstElementChild as HTMLElement;

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
