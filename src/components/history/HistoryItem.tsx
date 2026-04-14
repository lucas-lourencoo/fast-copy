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
    <div className="history-item" data-index={index}>
      <div className="history-item-top">
        <span className="history-time">{time}</span>
        {entry.isPartial && <span className="badge-partial">regex</span>}
      </div>
      <div className="history-copied-text" title={entry.copiedText}>
        {displayText}
      </div>
      <div className="history-source-url" title={entry.url}>
        {displayUrl}
      </div>
      <button
        className={`history-copy-btn${copied ? " copied" : ""}`}
        onClick={handleCopy}
      >
        {copied ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        )}
      </button>
    </div>
  );
}
