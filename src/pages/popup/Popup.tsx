import { useState, useEffect, useCallback } from "react";
import {
  applyUrlRules,
  HISTORY_KEY,
  HISTORY_MAX,
  type CopyHistoryEntry,
} from "../../shared";
import { useChromeI18n } from "../../hooks/useChromeI18n";
import "../../styles/global.css";

export function Popup() {
  const popupTitle = useChromeI18n("popupTitle", "Fast Copy");
  const popupSubtitle = useChromeI18n(
    "popupSubtitle",
    "Copy URLs in one click",
  );
  const urlLabel = useChromeI18n("popupUrlLabel", "Current URL");
  const copyLabel = useChromeI18n("popupCopyLabel", "Will copy");
  const msgUnavailable = useChromeI18n(
    "popupUrlUnavailable",
    "URL unavailable",
  );
  const msgError = useChromeI18n("popupUrlError", "Error loading URL");
  const msgCopyBtn = useChromeI18n("popupCopyBtn", "Copy URL");
  const msgCopied = useChromeI18n("popupCopied", "Copied!");
  const shortcutHintLabel = useChromeI18n("shortcutHint", "Shortcut:");
  const changeShortcutLabel = useChromeI18n(
    "changeShortcut",
    "Change shortcut",
  );
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
  const [shortcutKeys, setShortcutKeys] = useState<string[]>([
    "Ctrl",
    "⇧",
    "U",
  ]);

  useEffect(() => {
    (async () => {
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
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
    if (!textToCopy || textToCopy === msgUnavailable || textToCopy === msgError)
      return;

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
    <div className="w-80 overflow-hidden font-['Inter',ui-sans-serif,system-ui,sans-serif] bg-[linear-gradient(145deg,#f0f0f5,#e8e8f0,#f5f5fa)] dark:bg-[linear-gradient(145deg,#0f0c29,#1a1a3e,#24243e)] text-[#1a1a2e] dark:text-[#e0e0e0] transition-[background,color] duration-300">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center shadow-[0_4px_16px_rgba(102,126,234,0.25)] shrink-0">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5 text-white"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-[#1a1a2e] dark:text-white tracking-[-0.3px]">
              {popupTitle}
            </h1>
            <p className="text-[11px] text-[#5a5a7a] dark:text-[#8b8ba3] mt-[2px]">
              {popupSubtitle}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              className="w-8 h-8 border-none rounded-lg bg-[rgba(0,0,0,0.04)] dark:bg-[rgba(255,255,255,0.06)] text-[#5a5a7a] dark:text-[#8b8ba3] cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-[rgba(0,0,0,0.06)] dark:hover:bg-[rgba(255,255,255,0.08)] hover:text-[#667eea]"
              id="openOptionsBtn"
              title={openOptionsLabel}
              onClick={handleOpenOptions}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>
          </div>
        </div>

        <div className="bg-[rgba(0,0,0,0.04)] dark:bg-[rgba(255,255,255,0.06)] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-[10px] px-[14px] py-3 mb-2 transition-all duration-200 hover:bg-[rgba(0,0,0,0.06)] dark:hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(102,126,234,0.25)]">
          <div className="text-[10px] uppercase tracking-[1px] text-[#667eea] font-semibold mb-[6px]">
            {urlLabel}
          </div>
          <div
            className="text-[13px] text-[#3a3a5a] dark:text-[#c8c8e0] break-all leading-[1.4] line-clamp-3"
            id="currentUrl"
          >
            {currentUrl}
          </div>
        </div>

        {showMatch ? (
          <div
            className="bg-[rgba(99,102,241,0.08)] dark:bg-[rgba(99,102,241,0.12)] border border-[rgba(99,102,241,0.2)] dark:border-[rgba(99,102,241,0.3)] rounded-[10px] px-[14px] py-[10px] mb-4"
            id="matchPreview"
          >
            <div className="text-[10px] uppercase tracking-[1px] text-[#4f46e5] dark:text-[#a5b4fc] font-semibold mb-1 flex items-center gap-[5px]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3 h-3"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>{copyLabel}</span>
            </div>
            <div
              className="text-[13px] text-[#4f46e5] dark:text-[#a5b4fc] font-semibold break-all leading-[1.4]"
              id="matchPreviewText"
            >
              {matchText}
            </div>
            {matchRuleName && (
              <div
                className="text-[11px] text-[#5a5a7a] dark:text-[#8b8ba3] mt-1 italic"
                id="matchRuleName"
              >
                {matchRuleName}
              </div>
            )}
          </div>
        ) : (
          <div className="mb-2" id="noMatchSpacer"></div>
        )}

        <button
          className={`w-full py-3 border-none rounded-[10px] text-white text-sm font-semibold cursor-pointer transition-all duration-[250ms] flex items-center justify-center gap-2 tracking-[0.2px] hover:-translate-y-px active:translate-y-0 ${
            copied
              ? "bg-gradient-to-br from-[#11998e] to-[#38ef7d] shadow-[0_4px_16px_rgba(56,239,125,0.25)] hover:shadow-[0_6px_24px_rgba(56,239,125,0.4)]"
              : "bg-gradient-to-br from-[#667eea] to-[#764ba2] shadow-[0_4px_16px_rgba(102,126,234,0.25)] hover:shadow-[0_6px_24px_rgba(102,126,234,0.4)]"
          }`}
          id="copyBtn"
          onClick={handleCopy}
        >
          {copied ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          ) : (
            <svg
              id="copyIcon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          )}
          <span id="copyText">{copied ? msgCopied : msgCopyBtn}</span>
        </button>

        <div className="mt-[14px] pt-[14px] border-t border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)]">
          <a
            className="w-full px-[14px] py-[10px] border border-[rgba(255,189,46,0.3)] rounded-[10px] bg-[rgba(255,189,46,0.08)] text-[#c8900a] dark:text-[#f5c842] text-[13px] font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-[7px] no-underline tracking-[0.1px] hover:bg-[rgba(255,189,46,0.16)] hover:border-[rgba(255,189,46,0.5)] hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(255,189,46,0.15)] dark:hover:bg-[rgba(245,200,66,0.14)] dark:hover:border-[rgba(245,200,66,0.4)] dark:hover:shadow-[0_4px_14px_rgba(245,200,66,0.12)]"
            id="donateBtn"
            href="https://ko-fi.com/lucaslourencoo"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4 shrink-0"
            >
              <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402C1 3.763 4.068 2 6.5 2c1.868 0 3.535.912 4.5 2.316C12 2.91 13.668 2 15.5 2 17.932 2 21 3.762 21 7.191c0 4.105-5.37 8.863-11 14.402z" />
            </svg>
            {donateLabel}
          </a>
        </div>

        <a
          className="block text-center mt-3 text-sm text-[#667eea] no-underline cursor-pointer transition-colors duration-200 hover:text-[#764ba2] hover:underline"
          id="changeShortcutBtn"
          onClick={handleChangeShortcut}
        >
          {changeShortcutLabel}
        </a>

        <div className="text-center mt-4 text-[11px] text-[#5a5a7a] dark:text-[#8b8ba3]">
          <span>{shortcutHintLabel}</span>{" "}
          <span id="shortcutDisplay">
            {shortcutKeys.map((key, i) => (
              <span key={i}>
                {i > 0 && " + "}
                <kbd className="inline-block px-[6px] py-[2px] bg-[rgba(0,0,0,0.06)] dark:bg-[rgba(255,255,255,0.08)] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.12)] rounded font-[inherit] text-[10px] text-[#5a5a7a] dark:text-[#8b8ba3]">
                  {key}
                </kbd>
              </span>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}
