import { useState, useEffect, useCallback } from "react";
import {
  applyUrlRules,
  HISTORY_KEY,
  HISTORY_MAX,
  type CopyHistoryEntry,
} from "../../shared";
import { useChromeI18n } from "../../hooks/useChromeI18n";
import { useTheme } from "../../hooks/useTheme";
import "../../styles/popup.css";

export function Popup() {
  useTheme();

  const popupTitle = useChromeI18n("popupTitle", "Fast Copy");
  const popupSubtitle = useChromeI18n("popupSubtitle", "Copy URLs in one click");
  const urlLabel = useChromeI18n("popupUrlLabel", "Current URL");
  const copyLabel = useChromeI18n("popupCopyLabel", "Will copy");
  const msgUnavailable = useChromeI18n("popupUrlUnavailable", "URL unavailable");
  const msgError = useChromeI18n("popupUrlError", "Error loading URL");
  const msgCopyBtn = useChromeI18n("popupCopyBtn", "Copy URL");
  const msgCopied = useChromeI18n("popupCopied", "Copied!");
  const shortcutHintLabel = useChromeI18n("shortcutHint", "Shortcut:");
  const changeShortcutLabel = useChromeI18n("changeShortcut", "Change shortcut");
  const openOptionsLabel = useChromeI18n("openOptions", "URL Rules");
  const donateLabel = useChromeI18n("donateBtn", "Buy me a coffee ☕");

  const [currentUrl, setCurrentUrl] = useState("Loading...");
  const [textToCopy, setTextToCopy] = useState("");
  const [currentTabUrl, setCurrentTabUrl] = useState("");
  const [isPartialCopy, setIsPartialCopy] = useState(false);
  const [matchText, setMatchText] = useState("");
  const [matchRuleName, setMatchRuleName] = useState("");
  const [showMatch, setShowMatch] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shortcutKeys, setShortcutKeys] = useState<string[]>(["Ctrl", "⇧", "U"]);

  useEffect(() => {
    (async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.url) {
          setCurrentUrl(tab.url);
          setTextToCopy(tab.url);
          setCurrentTabUrl(tab.url);

          const result = await applyUrlRules(tab.url);
          if (result.isPartial) {
            setTextToCopy(result.text);
            setIsPartialCopy(true);
            setMatchText(result.text);
            if (result.label) setMatchRuleName(result.label);
            setShowMatch(true);
          }
        } else {
          setCurrentUrl(msgUnavailable);
        }
      } catch {
        setCurrentUrl(msgError);
      }
    })();
  }, [msgUnavailable, msgError]);

  useEffect(() => {
    if (chrome.commands && chrome.commands.getAll) {
      chrome.commands.getAll((commands) => {
        const copyCommand = commands.find((c) => c.name === "copy-url");
        if (copyCommand?.shortcut) {
          const keys = copyCommand.shortcut.split("+").map((key) => {
            const k = key.trim().toLowerCase();
            if (k === "shift") return "⇧";
            if (k === "command" || k === "meta" || k === "⌘") return "⌘";
            if (k === "ctrl" || k === "control") return "Ctrl";
            return key.trim();
          });
          setShortcutKeys(keys);
        }
      });
    }
  }, []);

  const handleCopy = useCallback(async () => {
    if (!textToCopy || textToCopy === msgUnavailable || textToCopy === msgError) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = textToCopy;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    try {
      const result = await chrome.storage.local.get([HISTORY_KEY]);
      const history: CopyHistoryEntry[] =
        (result[HISTORY_KEY] as CopyHistoryEntry[] | undefined) || [];
      history.unshift({
        url: currentTabUrl,
        copiedText: textToCopy,
        isPartial: isPartialCopy,
        timestamp: Date.now(),
      });
      if (history.length > HISTORY_MAX) history.length = HISTORY_MAX;
      await chrome.storage.local.set({ [HISTORY_KEY]: history });
    } catch (_err) {
      console.error("[Fast Copy] popup: failed to save history", _err);
    }
  }, [textToCopy, currentTabUrl, isPartialCopy, msgUnavailable, msgError]);

  const handleOpenOptions = useCallback(() => {
    chrome.runtime.openOptionsPage();
  }, []);

  const handleChangeShortcut = useCallback(() => {
    chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
  }, []);

  return (
    <div className="container">
      <div className="header">
        <div className="header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
        </div>
        <div className="header-text">
          <h1>{popupTitle}</h1>
          <p>{popupSubtitle}</p>
        </div>
        <div className="header-actions">
          <button className="icon-btn" id="openOptionsBtn" title={openOptionsLabel} onClick={handleOpenOptions}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        </div>
      </div>

      <div className="url-display">
        <div className="url-label">{urlLabel}</div>
        <div className="url-text" id="currentUrl">{currentUrl}</div>
      </div>

      {showMatch ? (
        <div className="match-preview visible" id="matchPreview">
          <div className="match-preview-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>{copyLabel}</span>
          </div>
          <div className="match-preview-text" id="matchPreviewText">{matchText}</div>
          {matchRuleName && <div className="match-rule-name" id="matchRuleName">{matchRuleName}</div>}
        </div>
      ) : (
        <div className="no-match-spacer" id="noMatchSpacer"></div>
      )}

      <button
        className={`copy-btn${copied ? " copied" : ""}`}
        id="copyBtn"
        onClick={handleCopy}
      >
        {copied ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        ) : (
          <svg id="copyIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        )}
        <span id="copyText">{copied ? msgCopied : msgCopyBtn}</span>
      </button>

      <div className="donate-section">
        <a
          className="donate-btn"
          id="donateBtn"
          href="https://ko-fi.com/lucaslourencoo"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402C1 3.763 4.068 2 6.5 2c1.868 0 3.535.912 4.5 2.316C12 2.91 13.668 2 15.5 2 17.932 2 21 3.762 21 7.191c0 4.105-5.37 8.863-11 14.402z"/>
          </svg>
          {donateLabel}
        </a>
      </div>

      <a className="change-shortcut-link" id="changeShortcutBtn" onClick={handleChangeShortcut}>
        {changeShortcutLabel}
      </a>

      <div className="shortcut-hint">
        <span>{shortcutHintLabel}</span>{" "}
        <span id="shortcutDisplay">
          {shortcutKeys.map((key, i) => (
            <span key={i}>
              {i > 0 && " + "}
              <kbd>{key}</kbd>
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}
