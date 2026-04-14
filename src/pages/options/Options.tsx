import { useState, useCallback } from "react";
import { useChromeI18n } from "../../hooks/useChromeI18n";
import type { UrlRule } from "../../shared";
import "../../styles/global.css";

export function Options() {
  const titleLabel = useChromeI18n("optionsTitle", "URL Rules");
  const subtitleLabel = useChromeI18n(
    "optionsSubtitle",
    "Define regex patterns to extract specific parts of URLs per domain",
  );
  const addRuleLabel = useChromeI18n("addRule", "Add Rule");
  const editRuleLabel = useChromeI18n("editRule", "Edit");
  const saveRuleLabel = useChromeI18n("saveRule", "Save");
  const cancelLabel = useChromeI18n("cancelEdit", "Cancel");
  const deleteRuleLabel = useChromeI18n("deleteRule", "Delete");
  const domainLabel = useChromeI18n("rulesDomain", "Domain");
  const labelLabel = useChromeI18n("rulesLabel", "Label");
  const regexLabel = useChromeI18n("rulesRegex", "Regex Pattern");
  const domainPlaceholder = useChromeI18n(
    "rulesDomainPlaceholder",
    "e.g. github.com",
  );
  const labelPlaceholder = useChromeI18n(
    "rulesLabelPlaceholder",
    "e.g. User/Repo",
  );
  const regexPlaceholder = useChromeI18n(
    "rulesRegexPlaceholder",
    "e.g. github\\.com\\/([^\\/]+\\/[^\\/]+)",
  );
  const testLabel = useChromeI18n("testRegex", "Test");
  const testUrlPlaceholder = useChromeI18n(
    "testUrlPlaceholder",
    "Paste a URL to test your regex...",
  );
  const noRulesMsg = useChromeI18n(
    "noRules",
    "No rules yet. Without rules, the full URL is always copied.",
  );
  const fieldRequiredMsg = useChromeI18n(
    "fieldRequired",
    "This field is required",
  );
  const domainInvalidMsg = useChromeI18n(
    "domainInvalid",
    "Enter a valid domain (e.g. github.com)",
  );
  const regexInvalidMsg = useChromeI18n(
    "regexInvalid",
    "Invalid regex pattern",
  );
  const regexDuplicateMsg = useChromeI18n(
    "regexDuplicate",
    "This regex pattern already exists",
  );
  const rulesTitle = useChromeI18n("rulesTitle", "Rules");
  const enabledLabel = useChromeI18n("ruleEnabled", "Enabled");
  const disabledLabel = useChromeI18n("ruleDisabled", "Disabled");
  const toastRuleAdded = useChromeI18n("toastRuleAdded", "Rule added!");
  const toastRuleUpdated = useChromeI18n("toastRuleUpdated", "Rule updated!");
  const toastRuleDeleted = useChromeI18n("toastRuleDeleted", "Rule deleted");
  const testResultLabel = useChromeI18n("testResult", "Result:");
  const noMatchLabel = useChromeI18n(
    "noMatch",
    "No match — full URL will be copied",
  );

  const [rules, setRules] = useState<UrlRule[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inputDomain, setInputDomain] = useState("");
  const [inputLabel, setInputLabel] = useState("");
  const [inputRegex, setInputRegex] = useState("");
  const [domainError, setDomainError] = useState("");
  const [regexError, setRegexError] = useState("");
  const [testUrl, setTestUrl] = useState("");
  const [testResult, setTestResult] = useState<{
    type: "match" | "no-match";
    label: string;
    value: string;
  } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(
    null,
  );

  const loadRules = useCallback(async () => {
    if (typeof chrome === "undefined" || !chrome.storage) {
      setLoaded(true);
      return;
    }
    const { urlRules = [] } = (await chrome.storage.sync.get("urlRules")) as {
      urlRules: UrlRule[];
    };
    setRules(urlRules);
    setLoaded(true);
  }, []);

  useState(() => {
    loadRules();
  });

  const saveRulesToStorage = useCallback(async (newRules: UrlRule[]) => {
    if (typeof chrome === "undefined" || !chrome.storage) return;
    await chrome.storage.sync.set({ urlRules: newRules });
  }, []);

  const showToast = useCallback((message: string, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  function isValidRegex(pattern: string): boolean {
    try {
      new RegExp(pattern);
      return true;
    } catch {
      return false;
    }
  }

  function isValidDomain(domain: string): boolean {
    if (domain === "localhost") return true;
    try {
      const parsed = new URL("https://" + domain);
      return parsed.hostname === domain && domain.includes(".");
    } catch {
      return false;
    }
  }

  const handleSave = useCallback(async () => {
    const domain = inputDomain.trim();
    const label = inputLabel.trim();
    const regex = inputRegex.trim();
    let hasError = false;

    if (!domain) {
      setDomainError(fieldRequiredMsg);
      hasError = true;
    } else if (!isValidDomain(domain)) {
      setDomainError(domainInvalidMsg);
      hasError = true;
    } else setDomainError("");

    if (!regex) {
      setRegexError(fieldRequiredMsg);
      hasError = true;
    } else if (!isValidRegex(regex)) {
      setRegexError(regexInvalidMsg);
      hasError = true;
    } else if (rules.some((r) => r.regex === regex && r.id !== editingId)) {
      setRegexError(regexDuplicateMsg);
      hasError = true;
    } else setRegexError("");

    if (hasError) return;

    let newRules: UrlRule[];
    const isEditing = !!editingId;

    if (editingId) {
      newRules = rules.map((r) =>
        r.id === editingId ? { ...r, domain, label, regex } : r,
      );
    } else {
      const id =
        Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
      newRules = [...rules, { id, domain, regex, label, enabled: true }];
    }

    setRules(newRules);
    await saveRulesToStorage(newRules);
    cancelEdit();
    showToast(isEditing ? toastRuleUpdated : toastRuleAdded, "success");
  }, [
    inputDomain,
    inputLabel,
    inputRegex,
    editingId,
    rules,
    fieldRequiredMsg,
    domainInvalidMsg,
    regexInvalidMsg,
    regexDuplicateMsg,
    saveRulesToStorage,
    showToast,
    toastRuleUpdated,
    toastRuleAdded,
  ]);

  const startEdit = useCallback(
    (id: string) => {
      const rule = rules.find((r) => r.id === id);
      if (!rule) return;
      setEditingId(id);
      setInputDomain(rule.domain);
      setInputLabel(rule.label || "");
      setInputRegex(rule.regex);
      setDomainError("");
      setRegexError("");
    },
    [rules],
  );

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setInputDomain("");
    setInputLabel("");
    setInputRegex("");
    setDomainError("");
    setRegexError("");
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      const deleted = rules.find((r) => r.id === id);
      const newRules = rules.filter((r) => r.id !== id);
      setRules(newRules);
      await saveRulesToStorage(newRules);
      showToast(
        deleted ? `${toastRuleDeleted}: ${deleted.domain}` : toastRuleDeleted,
        "deleted",
      );
    },
    [rules, saveRulesToStorage, showToast, toastRuleDeleted],
  );

  const handleToggle = useCallback(
    async (id: string, enabled: boolean) => {
      const newRules = rules.map((r) => (r.id === id ? { ...r, enabled } : r));
      setRules(newRules);
      await saveRulesToStorage(newRules);
    },
    [rules, saveRulesToStorage],
  );

  const handleTestUrl = useCallback(
    (url: string) => {
      setTestUrl(url);
      if (!url.trim()) {
        setTestResult(null);
        return;
      }
      let hostname: string;
      try {
        hostname = new URL(url).hostname;
      } catch {
        setTestResult(null);
        return;
      }

      for (const rule of rules) {
        if (!rule.enabled) continue;
        if (!hostname.includes(rule.domain)) continue;
        try {
          const regex = new RegExp(rule.regex);
          const match = url.match(regex);
          if (match && match[1]) {
            setTestResult({
              type: "match",
              label: testResultLabel + (rule.label ? ` (${rule.label})` : ""),
              value: match[1],
            });
            return;
          }
        } catch {}
      }
      setTestResult({ type: "no-match", label: noMatchLabel, value: url });
    },
    [rules, testResultLabel, noMatchLabel],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSave();
    },
    [handleSave],
  );

  const errorIconSvg = (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-[11px] h-[11px] shrink-0"
    >
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  );

  const inputBase =
    "w-full px-[14px] py-[10px] bg-[rgba(0,0,0,0.04)] dark:bg-[rgba(255,255,255,0.06)] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-lg text-[#1a1a2e] dark:text-[#e0e0e8] font-[inherit] text-[13px] transition-all duration-200 outline-none placeholder-[#8b8ba3] dark:placeholder-[#5a5a70] focus:border-[rgba(102,126,234,0.5)] focus:shadow-[0_0_0_3px_rgba(102,126,234,0.2)] dark:focus:shadow-[0_0_0_3px_rgba(102,126,234,0.25)]";
  const inputError =
    "border-[#e53e3e] dark:border-[#ff5f57] shadow-[0_0_0_3px_rgba(229,62,62,0.06)] dark:shadow-[0_0_0_3px_rgba(255,95,87,0.1)]";

  if (!loaded) return null;

  return (
    <div className="min-h-screen font-['Inter',ui-sans-serif,system-ui,sans-serif] bg-[#f5f5fa] dark:bg-[#0d0d12] text-[#1a1a2e] dark:text-[#e0e0e8] transition-[background,color] duration-300">
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[9999] flex items-center gap-[10px] px-5 py-3 rounded-xl text-[13px] font-semibold shadow-[0_8px_32px_rgba(0,0,0,0.3),0_2px_8px_rgba(0,0,0,0.2)] whitespace-nowrap transition-all duration-300 ${
            toast.type === "success"
              ? "bg-[#1a7a55] text-white"
              : "bg-[#7a1a2e] text-white"
          }`}
        >
          {toast.type === "success" ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="max-w-[680px] mx-auto px-6 pt-12 pb-20">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-[14px] bg-gradient-to-br from-[#667eea] to-[#764ba2] inline-flex items-center justify-center shadow-[0_8px_32px_rgba(102,126,234,0.25)] mb-5">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-7 h-7 text-white"
            >
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </div>
          <h1 className="text-[28px] font-extrabold text-[#1a1a2e] dark:text-white tracking-[-0.8px] mb-2">
            {titleLabel}
          </h1>
          <p className="text-[15px] text-[#5a5a7a] dark:text-[#8888a0] leading-[1.5]">
            {subtitleLabel}
          </p>
        </div>

        <div
          className="bg-[rgba(0,0,0,0.03)] dark:bg-[rgba(255,255,255,0.04)] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-2xl p-6 mb-6"
          id="ruleForm"
        >
          <div className="text-sm font-bold text-[#1a1a2e] dark:text-white mb-4 flex items-center gap-2">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-[18px] h-[18px] text-[#667eea]"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>{editingId ? editRuleLabel : addRuleLabel}</span>
          </div>

          <div className="grid grid-cols-[1fr_2fr] gap-3 mb-3 max-sm:grid-cols-1">
            <div className="flex flex-col gap-[6px]">
              <label className="text-[11px] font-semibold uppercase tracking-[0.8px] text-[#5a5a7a] dark:text-[#8888a0]">
                {domainLabel}{" "}
                <span className="text-[#e53e3e] dark:text-[#ff5f57]">*</span>
              </label>
              <input
                type="text"
                className={`${inputBase} ${domainError ? inputError : ""}`}
                value={inputDomain}
                onChange={(e) => {
                  setInputDomain(e.target.value);
                  setDomainError("");
                }}
                onKeyDown={handleKeyDown}
                maxLength={253}
                placeholder={domainPlaceholder}
              />
              {domainError && (
                <span className="text-[11px] text-[#e53e3e] dark:text-[#ff5f57] flex items-center gap-1">
                  {errorIconSvg}
                  <span>{domainError}</span>
                </span>
              )}
            </div>
            <div className="flex flex-col gap-[6px]">
              <label className="text-[11px] font-semibold uppercase tracking-[0.8px] text-[#5a5a7a] dark:text-[#8888a0]">
                {labelLabel}
              </label>
              <input
                type="text"
                className={inputBase}
                value={inputLabel}
                onChange={(e) => setInputLabel(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={50}
                placeholder={labelPlaceholder}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 mb-3">
            <div className="flex flex-col gap-[6px]">
              <label className="text-[11px] font-semibold uppercase tracking-[0.8px] text-[#5a5a7a] dark:text-[#8888a0]">
                {regexLabel}{" "}
                <span className="text-[#e53e3e] dark:text-[#ff5f57]">*</span>
              </label>
              <input
                type="text"
                className={`${inputBase} font-mono text-xs ${regexError ? inputError : ""}`}
                value={inputRegex}
                onChange={(e) => {
                  setInputRegex(e.target.value);
                  setRegexError("");
                }}
                onKeyDown={handleKeyDown}
                maxLength={500}
                placeholder={regexPlaceholder}
              />
              {regexError && (
                <span className="text-[11px] text-[#e53e3e] dark:text-[#ff5f57] flex items-center gap-1">
                  {errorIconSvg}
                  <span>{regexError}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2 mt-1">
            <button
              className="px-5 py-[10px] border-none rounded-lg font-[inherit] text-[13px] font-semibold cursor-pointer transition-all duration-200 inline-flex items-center gap-[6px] bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white shadow-[0_4px_12px_rgba(102,126,234,0.25)] hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(102,126,234,0.35)]"
              onClick={handleSave}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-[14px] h-[14px]"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>{editingId ? saveRuleLabel : addRuleLabel}</span>
            </button>
            {editingId && (
              <button
                className="px-5 py-[10px] border-none rounded-lg font-[inherit] text-[13px] font-semibold cursor-pointer transition-all duration-200 inline-flex items-center gap-[6px] bg-[rgba(0,0,0,0.04)] dark:bg-[rgba(255,255,255,0.06)] text-[#5a5a7a] dark:text-[#8888a0] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] hover:bg-[rgba(0,0,0,0.06)] dark:hover:bg-[rgba(255,255,255,0.08)] hover:text-[#1a1a2e] dark:hover:text-[#e0e0e8]"
                onClick={cancelEdit}
              >
                <span>{cancelLabel}</span>
              </button>
            )}
          </div>
        </div>

        <div className="bg-[rgba(0,0,0,0.03)] dark:bg-[rgba(255,255,255,0.04)] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-2xl p-6 mb-6">
          <div className="text-sm font-bold text-[#1a1a2e] dark:text-white mb-4 flex items-center gap-2">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-[18px] h-[18px] text-[#667eea]"
            >
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
            <span>{testLabel}</span>
          </div>
          <div className="flex flex-col gap-[6px]">
            <input
              type="text"
              className={inputBase}
              value={testUrl}
              onChange={(e) => handleTestUrl(e.target.value)}
              placeholder={testUrlPlaceholder}
            />
          </div>
          {testResult && (
            <div
              className={`mt-3 px-4 py-3 rounded-[10px] text-[13px] break-all ${
                testResult.type === "match"
                  ? "bg-[rgba(99,102,241,0.08)] dark:bg-[rgba(99,102,241,0.12)] border border-[rgba(99,102,241,0.2)] dark:border-[rgba(99,102,241,0.3)] text-[#4f46e5] dark:text-[#a5b4fc]"
                  : "bg-[rgba(255,189,46,0.08)] border border-[rgba(255,189,46,0.2)] text-[#b8860b] dark:text-[#f0d060]"
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-[0.8px] mb-1">
                {testResult.label}
              </div>
              <div className="font-semibold font-mono text-xs">
                {testResult.value}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8">
          <div className="text-sm font-semibold uppercase tracking-[2px] text-[#5a5a7a] dark:text-[#5a5a70] mb-4 text-center">
            {rulesTitle}
          </div>
          <div id="rulesList">
            {rules.length === 0 ? (
              <div className="text-center py-12 px-6 text-[#8b8ba3] dark:text-[#5a5a70] text-sm leading-[1.6] flex flex-col items-center gap-4">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-12 h-12 opacity-40"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <div>{noRulesMsg}</div>
              </div>
            ) : (
              rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`bg-[rgba(0,0,0,0.03)] dark:bg-[rgba(255,255,255,0.04)] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-[14px] px-5 py-[18px] mb-3 transition-all duration-200 hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-[rgba(255,255,255,0.06)] hover:border-[rgba(102,126,234,0.15)] ${!rule.enabled ? "opacity-50" : ""}`}
                  data-id={rule.id}
                >
                  <div className="flex items-center justify-between mb-[10px]">
                    <div className="flex items-center gap-[10px] flex-1 min-w-0">
                      <span className="text-sm font-bold text-[#1a1a2e] dark:text-white whitespace-nowrap overflow-hidden text-ellipsis">
                        {rule.domain}
                      </span>
                      {rule.label && (
                        <span className="text-[11px] px-2 py-[2px] rounded-full bg-[rgba(102,126,234,0.25)] text-[#667eea] font-semibold whitespace-nowrap">
                          {rule.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-[6px] shrink-0">
                      <label
                        className="relative inline-block w-[38px] h-[22px] shrink-0 cursor-pointer"
                        title={rule.enabled ? enabledLabel : disabledLabel}
                      >
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={rule.enabled}
                          onChange={(e) =>
                            handleToggle(rule.id, e.target.checked)
                          }
                        />
                        <span className="absolute inset-0 bg-[rgba(0,0,0,0.1)] dark:bg-[rgba(255,255,255,0.1)] rounded-full transition-all duration-[250ms] peer-checked:bg-[#667eea] before:content-[''] before:absolute before:w-4 before:h-4 before:left-[3px] before:bottom-[3px] before:bg-white before:rounded-full before:shadow before:transition-all before:duration-[250ms] peer-checked:before:translate-x-4" />
                      </label>
                      <button
                        className="w-[30px] h-[30px] border-none rounded-md bg-transparent text-[#5a5a70] cursor-pointer flex items-center justify-center transition-all duration-150 hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-[rgba(255,255,255,0.06)] hover:text-[#1a1a2e] dark:hover:text-[#e0e0e8]"
                        title={editRuleLabel}
                        onClick={() => startEdit(rule.id)}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-[14px] h-[14px]"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button
                        className="w-[30px] h-[30px] border-none rounded-md bg-transparent text-[#5a5a70] cursor-pointer flex items-center justify-center transition-all duration-150 hover:bg-[rgba(229,62,62,0.06)] dark:hover:bg-[rgba(255,95,87,0.1)] hover:text-[#e53e3e] dark:hover:text-[#ff5f57]"
                        title={deleteRuleLabel}
                        onClick={() => handleDelete(rule.id)}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-[14px] h-[14px]"
                        >
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="font-mono text-xs text-[#5a5a7a] dark:text-[#8888a0] bg-[rgba(0,0,0,0.04)] dark:bg-[rgba(255,255,255,0.06)] px-[10px] py-[6px] rounded-md overflow-x-auto whitespace-nowrap">
                    {rule.regex}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="text-center px-6 py-6 text-xs text-[#5a5a70]">
          Fast Copy v1.6 —{" "}
          <a
            href="https://github.com/lucas-lourencoo"
            target="_blank"
            rel="noopener"
            className="text-[#667eea] no-underline hover:underline"
          >
            Lucas Lourenço
          </a>
        </div>
      </div>
    </div>
  );
}
