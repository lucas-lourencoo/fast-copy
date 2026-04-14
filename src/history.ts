import { HISTORY_KEY, type CopyHistoryEntry } from "./shared";

document.addEventListener("DOMContentLoaded", async () => {
  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.body.classList.add(isDark ? "theme-dark" : "theme-light");

  applyI18n();
  await renderHistory();

  const clearBtn = document.getElementById("clearBtn")!;
  clearBtn.addEventListener("click", async () => {
    await chrome.storage.local.set({ [HISTORY_KEY]: [] });
    await renderHistory();
  });
});

function applyI18n(): void {
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    const msg = chrome.i18n.getMessage(el.dataset.i18n!);
    if (msg) el.textContent = msg;
  });
}

async function renderHistory(): Promise<void> {
  const list = document.getElementById("historyList")!;
  const emptyState = document.getElementById("emptyState")!;
  const clearBtn = document.getElementById("clearBtn")!;

  const { copyHistory = [] } = (await chrome.storage.local.get(HISTORY_KEY)) as {
    copyHistory: CopyHistoryEntry[];
  };

  if (copyHistory.length === 0) {
    list.innerHTML = "";
    emptyState.style.display = "flex";
    clearBtn.style.display = "none";
    return;
  }

  emptyState.style.display = "none";
  clearBtn.style.display = "inline-flex";

  list.innerHTML = copyHistory
    .map((entry, index) => {
      const time = formatTimeAgo(entry.timestamp);
      const displayUrl = truncate(entry.url, 60);
      const displayText = truncate(entry.copiedText, 50);
      const badge = entry.isPartial ? `<span class="badge-partial">regex</span>` : "";

      return `
      <div class="history-item" data-index="${index}">
        <div class="history-item-top">
          <span class="history-time">${time}</span>
          ${badge}
        </div>
        <div class="history-copied-text" title="${escapeAttr(entry.copiedText)}">
          ${escapeHtml(displayText)}
        </div>
        <div class="history-source-url" title="${escapeAttr(entry.url)}">
          ${escapeHtml(displayUrl)}
        </div>
        <button class="history-copy-btn" data-copy="${escapeAttr(entry.copiedText)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
      </div>
    `;
    })
    .join("");

  list.querySelectorAll<HTMLButtonElement>(".history-copy-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const text = btn.getAttribute("data-copy")!;
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      btn.classList.add("copied");
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
      setTimeout(() => {
        btn.classList.remove("copied");
        btn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        `;
      }, 1500);
    });
  });
}

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return chrome.i18n.getMessage("historyJustNow") || "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
