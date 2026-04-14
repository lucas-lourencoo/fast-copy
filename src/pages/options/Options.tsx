import { useState, useCallback } from "react";
import { useChromeI18n } from "../../hooks/useChromeI18n";
import { useTheme } from "../../hooks/useTheme";
import type { UrlRule } from "../../shared";
import "../../styles/options.css";

export function Options() {
  useTheme();

  const titleLabel = useChromeI18n("optionsTitle", "URL Rules");
  const subtitleLabel = useChromeI18n("optionsSubtitle", "Define regex patterns to extract specific parts of URLs per domain");
  const addRuleLabel = useChromeI18n("addRule", "Add Rule");
  const editRuleLabel = useChromeI18n("editRule", "Edit");
  const saveRuleLabel = useChromeI18n("saveRule", "Save");
  const cancelLabel = useChromeI18n("cancelEdit", "Cancel");
  const deleteRuleLabel = useChromeI18n("deleteRule", "Delete");
  const domainLabel = useChromeI18n("rulesDomain", "Domain");
  const labelLabel = useChromeI18n("rulesLabel", "Label");
  const regexLabel = useChromeI18n("rulesRegex", "Regex Pattern");
  const domainPlaceholder = useChromeI18n("rulesDomainPlaceholder", "e.g. github.com");
  const labelPlaceholder = useChromeI18n("rulesLabelPlaceholder", "e.g. User/Repo");
  const regexPlaceholder = useChromeI18n("rulesRegexPlaceholder", "e.g. github\\.com\\/([^\\/]+\\/[^\\/]+)");
  const testLabel = useChromeI18n("testRegex", "Test");
  const testUrlPlaceholder = useChromeI18n("testUrlPlaceholder", "Paste a URL to test your regex...");
  const noRulesMsg = useChromeI18n("noRules", "No rules yet. Without rules, the full URL is always copied.");
  const fieldRequiredMsg = useChromeI18n("fieldRequired", "This field is required");
  const domainInvalidMsg = useChromeI18n("domainInvalid", "Enter a valid domain (e.g. github.com)");
  const regexInvalidMsg = useChromeI18n("regexInvalid", "Invalid regex pattern");
  const regexDuplicateMsg = useChromeI18n("regexDuplicate", "This regex pattern already exists");
  const rulesTitle = useChromeI18n("rulesTitle", "Rules");
  const enabledLabel = useChromeI18n("ruleEnabled", "Enabled");
  const disabledLabel = useChromeI18n("ruleDisabled", "Disabled");
  const toastRuleAdded = useChromeI18n("toastRuleAdded", "Rule added!");
  const toastRuleUpdated = useChromeI18n("toastRuleUpdated", "Rule updated!");
  const toastRuleDeleted = useChromeI18n("toastRuleDeleted", "Rule deleted");
  const testResultLabel = useChromeI18n("testResult", "Result:");
  const noMatchLabel = useChromeI18n("noMatch", "No match — full URL will be copied");

  const [rules, setRules] = useState<UrlRule[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inputDomain, setInputDomain] = useState("");
  const [inputLabel, setInputLabel] = useState("");
  const [inputRegex, setInputRegex] = useState("");
  const [domainError, setDomainError] = useState("");
  const [regexError, setRegexError] = useState("");
  const [testUrl, setTestUrl] = useState("");
  const [testResult, setTestResult] = useState<{ type: "match" | "no-match"; label: string; value: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);

  const loadRules = useCallback(async () => {
    if (typeof chrome === "undefined" || !chrome.storage) {
      setLoaded(true);
      return;
    }
    const { urlRules = [] } = (await chrome.storage.sync.get("urlRules")) as { urlRules: UrlRule[] };
    setRules(urlRules);
    setLoaded(true);
  }, []);

  useState(() => { loadRules(); });

  const saveRulesToStorage = useCallback(async (newRules: UrlRule[]) => {
    if (typeof chrome === "undefined" || !chrome.storage) return;
    await chrome.storage.sync.set({ urlRules: newRules });
  }, []);

  const showToast = useCallback((message: string, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  function isValidRegex(pattern: string): boolean {
    try { new RegExp(pattern); return true; } catch { return false; }
  }

  function isValidDomain(domain: string): boolean {
    if (domain === "localhost") return true;
    try {
      const parsed = new URL("https://" + domain);
      return parsed.hostname === domain && domain.includes(".");
    } catch { return false; }
  }

  const handleSave = useCallback(async () => {
    const domain = inputDomain.trim();
    const label = inputLabel.trim();
    const regex = inputRegex.trim();
    let hasError = false;

    if (!domain) { setDomainError(fieldRequiredMsg); hasError = true; }
    else if (!isValidDomain(domain)) { setDomainError(domainInvalidMsg); hasError = true; }
    else setDomainError("");

    if (!regex) { setRegexError(fieldRequiredMsg); hasError = true; }
    else if (!isValidRegex(regex)) { setRegexError(regexInvalidMsg); hasError = true; }
    else if (rules.some((r) => r.regex === regex && r.id !== editingId)) {
      setRegexError(regexDuplicateMsg); hasError = true;
    } else setRegexError("");

    if (hasError) return;

    let newRules: UrlRule[];
    const isEditing = !!editingId;

    if (editingId) {
      newRules = rules.map((r) =>
        r.id === editingId ? { ...r, domain, label, regex } : r,
      );
    } else {
      const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
      newRules = [...rules, { id, domain, regex, label, enabled: true }];
    }

    setRules(newRules);
    await saveRulesToStorage(newRules);
    cancelEdit();
    showToast(isEditing ? toastRuleUpdated : toastRuleAdded, "success");
  }, [inputDomain, inputLabel, inputRegex, editingId, rules, fieldRequiredMsg, domainInvalidMsg, regexInvalidMsg, regexDuplicateMsg, saveRulesToStorage, showToast, toastRuleUpdated, toastRuleAdded]);

  const startEdit = useCallback((id: string) => {
    const rule = rules.find((r) => r.id === id);
    if (!rule) return;
    setEditingId(id);
    setInputDomain(rule.domain);
    setInputLabel(rule.label || "");
    setInputRegex(rule.regex);
    setDomainError("");
    setRegexError("");
  }, [rules]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setInputDomain("");
    setInputLabel("");
    setInputRegex("");
    setDomainError("");
    setRegexError("");
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    const deleted = rules.find((r) => r.id === id);
    const newRules = rules.filter((r) => r.id !== id);
    setRules(newRules);
    await saveRulesToStorage(newRules);
    showToast(deleted ? `${toastRuleDeleted}: ${deleted.domain}` : toastRuleDeleted, "deleted");
  }, [rules, saveRulesToStorage, showToast, toastRuleDeleted]);

  const handleToggle = useCallback(async (id: string, enabled: boolean) => {
    const newRules = rules.map((r) => (r.id === id ? { ...r, enabled } : r));
    setRules(newRules);
    await saveRulesToStorage(newRules);
  }, [rules, saveRulesToStorage]);

  const handleTestUrl = useCallback((url: string) => {
    setTestUrl(url);
    if (!url.trim()) { setTestResult(null); return; }
    let hostname: string;
    try { hostname = new URL(url).hostname; } catch { setTestResult(null); return; }

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
  }, [rules, testResultLabel, noMatchLabel]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
  }, [handleSave]);

  if (!loaded) return null;

  return (
    <>
      {toast && (
        <div className={`options-toast visible ${toast.type}`}>
          {toast.type === "success" ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="container">
        <div className="page-header">
          <div className="page-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </div>
          <h1>{titleLabel}</h1>
          <p>{subtitleLabel}</p>
        </div>

        <div className="add-rule-form" id="ruleForm">
          <div className="form-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>{editingId ? editRuleLabel : addRuleLabel}</span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{domainLabel} <span className="required-star">*</span></label>
              <input type="text" className={`form-input${domainError ? " error" : ""}`} value={inputDomain} onChange={(e) => { setInputDomain(e.target.value); setDomainError(""); }} onKeyDown={handleKeyDown} maxLength={253} placeholder={domainPlaceholder} />
              {domainError && (
                <span className="form-error visible">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  <span>{domainError}</span>
                </span>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">{labelLabel}</label>
              <input type="text" className="form-input" value={inputLabel} onChange={(e) => setInputLabel(e.target.value)} onKeyDown={handleKeyDown} maxLength={50} placeholder={labelPlaceholder} />
            </div>
          </div>

          <div className="form-row single">
            <div className="form-group">
              <label className="form-label">{regexLabel} <span className="required-star">*</span></label>
              <input type="text" className={`form-input regex-input${regexError ? " error" : ""}`} value={inputRegex} onChange={(e) => { setInputRegex(e.target.value); setRegexError(""); }} onKeyDown={handleKeyDown} maxLength={500} placeholder={regexPlaceholder} />
              {regexError && (
                <span className="form-error visible">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  <span>{regexError}</span>
                </span>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button className="btn btn-primary" onClick={handleSave}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>{editingId ? saveRuleLabel : addRuleLabel}</span>
            </button>
            {editingId && (
              <button className="btn btn-secondary" onClick={cancelEdit}>
                <span>{cancelLabel}</span>
              </button>
            )}
          </div>
        </div>

        <div className="test-section">
          <div className="form-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
            <span>{testLabel}</span>
          </div>
          <div className="form-group">
            <input type="text" className="form-input" value={testUrl} onChange={(e) => handleTestUrl(e.target.value)} placeholder={testUrlPlaceholder} />
          </div>
          {testResult && (
            <div className={`test-result visible ${testResult.type}`}>
              <div className="test-result-label">{testResult.label}</div>
              <div className="test-result-value">{testResult.value}</div>
            </div>
          )}
        </div>

        <div className="rules-section">
          <div className="rules-section-title">{rulesTitle}</div>
          <div id="rulesList">
            {rules.length === 0 ? (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
                <div key={rule.id} className={`rule-card${rule.enabled ? "" : " disabled"}`} data-id={rule.id}>
                  <div className="rule-card-header">
                    <div className="rule-card-info">
                      <span className="rule-domain">{rule.domain}</span>
                      {rule.label && <span className="rule-label-badge">{rule.label}</span>}
                    </div>
                    <div className="rule-card-actions">
                      <label className="toggle" title={rule.enabled ? enabledLabel : disabledLabel}>
                        <input type="checkbox" checked={rule.enabled} onChange={(e) => handleToggle(rule.id, e.target.checked)} />
                        <span className="toggle-slider"></span>
                      </label>
                      <button className="rule-action-btn" title={editRuleLabel} onClick={() => startEdit(rule.id)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button className="rule-action-btn delete" title={deleteRuleLabel} onClick={() => handleDelete(rule.id)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="rule-regex">{rule.regex}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="page-footer">
          Fast Copy v1.5 —{" "}
          <a href="https://github.com/lucas-lourencoo" target="_blank" rel="noopener">Lucas Lourenço</a>
        </div>
      </div>
    </>
  );
}
