import { useState, useCallback } from "react";
import type { CopyHistoryEntry } from "../../shared";

interface HistoryItemProps {
  entry: CopyHistoryEntry;
  index: number;
}

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) {
    if (typeof chrome !== "undefined" && chrome.i18n) {
      return chrome.i18n.getMessage("historyJustNow") || "Just now";
    }
    return "Just now";
  }
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

export function HistoryItem({ entry, index }: HistoryItemProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(entry.copiedText);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = entry.copiedText;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [entry.copiedText]);

  const time = formatTimeAgo(entry.timestamp);
  const displayUrl = truncate(entry.url, 60);
  const displayText = truncate(entry.copiedText, 50);

  return (
    <div
      className="relative bg-[rgba(0,0,0,0.04)] dark:bg-[rgba(255,255,255,0.06)] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-[10px] py-3 pl-[14px] pr-11 transition-all duration-200 hover:bg-[rgba(0,0,0,0.06)] dark:hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(102,126,234,0.2)]"
      data-index={index}
    >
      <div className="flex items-center gap-[6px] mb-1">
        <span className="text-[10px] uppercase tracking-[0.5px] text-[#5a5a7a] dark:text-[#8b8ba3] font-semibold">
          {time}
        </span>
        {entry.isPartial && (
          <span className="text-[9px] uppercase tracking-[0.5px] px-[5px] py-px rounded bg-indigo-500/[0.12] text-[#818cf8] font-bold">
            regex
          </span>
        )}
      </div>
      <div
        className="text-[13px] font-semibold text-[#1a1a2e] dark:text-[#e0e0e0] leading-[1.3] break-all"
        title={entry.copiedText}
      >
        {displayText}
      </div>
      <div
        className="text-[11px] text-[#5a5a7a] dark:text-[#8b8ba3] mt-[3px] break-all leading-[1.3]"
        title={entry.url}
      >
        {displayUrl}
      </div>
      <button
        className={`absolute right-[10px] top-1/2 -translate-y-1/2 w-7 h-7 border-none rounded-md bg-transparent cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-[rgba(0,0,0,0.06)] dark:hover:bg-[rgba(255,255,255,0.08)] hover:text-[#667eea] ${copied ? "text-[#22c55e]" : "text-[#5a5a7a] dark:text-[#8b8ba3]"}`}
        onClick={handleCopy}
      >
        {copied ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-[14px] h-[14px]"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-[14px] h-[14px]"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        )}
      </button>
    </div>
  );
}
