import { useState, useEffect, useCallback, useRef } from "react";
import { useChromeI18n } from "../../hooks/useChromeI18n";
import { applyI18nToRef } from "../../hooks/useChromeI18n";
import "../../styles/welcome.css";

const TOTAL_STEPS = 5;

function ShortcutKeys({ id, defaultKeys }: { id?: string; defaultKeys: string[] }) {
  return (
    <div className="shortcut-keys" id={id}>
      {defaultKeys.map((key, i) => (
        <span key={i}>
          {i > 0 && <span className="key-plus">+</span>}
          <span className="key">{key}</span>
        </span>
      ))}
    </div>
  );
}

export function Welcome() {
  const wizardRef = useRef<HTMLDivElement>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [ruleSaved, setRuleSaved] = useState(false);
  const [quickDomain, setQuickDomain] = useState("");
  const [quickRegex, setQuickRegex] = useState("");
  const [quickDomainError, setQuickDomainError] = useState(false);
  const [quickRegexError, setQuickRegexError] = useState(false);
  const [savedMsgVisible, setSavedMsgVisible] = useState(false);
  const [saveButtonLabel, setSaveButtonLabel] = useState<"save" | "next">("save");
  const [shortcutKeys, setShortcutKeys] = useState(["Ctrl", "Shift", "U"]);
  const [historyKeys, setHistoryKeys] = useState(["Ctrl", "Shift", "Y"]);

  const welcomeBadge = useChromeI18n("welcomeBadge", "Installation complete");
  const welcomeTitle = useChromeI18n("welcomeTitle", "Thanks for installing Fast Copy!");
  const welcomeSubtitle = useChromeI18n("welcomeSubtitle", "Instantly copy the URL of any tab with a simple keyboard shortcut. Fast, lightweight, and hassle-free.");
  const stepLabels = [
    useChromeI18n("onboardStep1Label", "Welcome"),
    useChromeI18n("onboardStep2Label", "Shortcut"),
    useChromeI18n("onboardStep3Label", "URL Rules"),
    useChromeI18n("onboardStep4Label", "History"),
    useChromeI18n("onboardStep5Label", "Done"),
  ];
  const shortcutEyebrow = useChromeI18n("onboardShortcutEyebrow", "Step 2");
  const shortcutTitle = useChromeI18n("onboardShortcutTitle", "Your shortcut is ready");
  const shortcutDesc = useChromeI18n("onboardShortcutDesc", "Press this combination on any page to instantly copy its URL to your clipboard.");
  const toastMsg = useChromeI18n("toastMessage", "Link Copied!");
  const changeShortcutLabel = useChromeI18n("changeShortcut", "Change shortcut");
  const regexEyebrow = useChromeI18n("onboardRegexEyebrow", "Step 3");
  const regexTitle = useChromeI18n("onboardRegexTitle", "Smart URL Extraction");
  const regexDesc = useChromeI18n("onboardRegexDesc", "Create regex rules to automatically extract only the part of the URL you need — like repo names, ticket IDs, or order numbers.");
  const demoLabel = useChromeI18n("welcomeRegexDemoLabel", "Example: GitHub Repository");
  const copiedLabel = useChromeI18n("welcomeRegexCopied", "Copied");
  const quickRuleTitle = useChromeI18n("onboardQuickRuleTitle", "Add your first rule (optional)");
  const domainLabel = useChromeI18n("rulesDomain", "Domain");
  const regexLabel = useChromeI18n("rulesRegex", "Regex Pattern");
  const domainInvalidLabel = useChromeI18n("domainInvalid", "Enter a valid domain");
  const regexInvalidLabel = useChromeI18n("regexInvalid", "Invalid regex");
  const skipLabel = useChromeI18n("onboardSkipRule", "Skip for now");
  const addRuleLabel = useChromeI18n("addRule", "Add Rule");
  const nextLabel = useChromeI18n("onboardNext", "Next");
  const ruleSavedMsg = useChromeI18n("onboardRuleSaved", "Rule saved! You can manage your rules anytime in the extension options.");
  const historyEyebrow = useChromeI18n("onboardHistoryEyebrow", "Step 4");
  const historyTitle = useChromeI18n("onboardHistoryTitle", "Copy History");
  const historyDesc = useChromeI18n("onboardHistoryDesc", "Access your last 10 copied links instantly. Navigate with arrow keys, press Enter to select and paste.");
  const hTitle = useChromeI18n("historyTitle", "Copy History");
  const allSetTitle = useChromeI18n("onboardAllSetTitle", "All set!");
  const allSetDesc = useChromeI18n("onboardAllSetDesc", "Fast Copy is ready to use. Press your shortcut on any tab and the URL is instantly in your clipboard.");
  const donateCta = useChromeI18n("donateCta", "Enjoying Fast Copy?");
  const donateDesc = useChromeI18n("donateDesc", "This extension is free and open-source. If it saves you time every day, consider buying me a coffee!");
  const donateBtn = useChromeI18n("donateBtn", "Buy me a coffee");
  const backLabel = useChromeI18n("onboardBack", "Back");
  const footerLabel = useChromeI18n("welcomeFooter", "Made with ♥ by Lucas Lourenço");

  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.commands || !chrome.commands.getAll) return;
    chrome.commands.getAll((commands) => {
      const copyCmd = commands.find((c) => c.name === "copy-url");
      if (copyCmd?.shortcut) {
        setShortcutKeys(copyCmd.shortcut.split("+").map((k) => k.trim()));
      }
      const histCmd = commands.find((c) => c.name === "show-history");
      if (histCmd?.shortcut) {
        setHistoryKeys(histCmd.shortcut.split("+").map((k) => k.trim()));
      }
    });
  }, []);

  const goBack = useCallback(() => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  const goNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) setCurrentStep((s) => s + 1);
  }, [currentStep]);

  const handleChangeShortcut = useCallback(() => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
    }
  }, []);

  function isDomainValid(val: string): boolean {
    return /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$/.test(val.trim());
  }

  function isRegexValid(val: string): boolean {
    try { new RegExp(val.trim()); return val.trim().length > 0; } catch { return false; }
  }

  const handleSaveQuickRule = useCallback(() => {
    if (ruleSaved) { goNext(); return; }

    const dVal = quickDomain.trim();
    const rVal = quickRegex.trim();
    let valid = true;

    setQuickDomainError(false);
    setQuickRegexError(false);

    if (!dVal || !isDomainValid(dVal)) { setQuickDomainError(true); valid = false; }
    if (!rVal || !isRegexValid(rVal)) { setQuickRegexError(true); valid = false; }
    if (!valid) return;

    if (typeof chrome === "undefined" || !chrome.storage) { goNext(); return; }

    chrome.storage.sync.get(["urlRules"], (result) => {
      const rules = (result.urlRules as Array<Record<string, unknown>>) || [];
      rules.push({ id: Date.now().toString(), domain: dVal, regex: rVal, label: "", enabled: true });
      chrome.storage.sync.set({ urlRules: rules }, () => {
        setRuleSaved(true);
        setSavedMsgVisible(true);
        setSaveButtonLabel("next");
        setTimeout(() => {
          setCurrentStep((s) => s + 1);
        }, 1200);
      });
    });
  }, [quickDomain, quickRegex, ruleSaved, goNext]);

  const stepClasses = (i: number) => {
    const cls = ["progress-step"];
    if (i < currentStep) cls.push("done");
    if (i === currentStep) cls.push("active");
    return cls.join(" ");
  };

  return (
    <>
      <main className="wizard" ref={wizardRef}>
        <nav className="progress-bar" id="progressBar">
          {stepLabels.map((label, i) => (
            <div key={i} className={stepClasses(i)} data-step={i}>
              <div className="step-dot">
                {i === 4 ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}><polyline points="20 6 9 17 4 12"></polyline></svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className="step-label">{label}</span>
            </div>
          ))}
        </nav>

        <section className={`step-screen${currentStep === 0 ? " active" : ""}`} id="screen-0">
          <div className="hero">
            <div className="icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
            </div>
            <div className="badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>{welcomeBadge}</span>
            </div>
            <h1>{welcomeTitle}</h1>
            <p className="subtitle">{welcomeSubtitle}</p>
          </div>
        </section>

        <section className={`step-screen${currentStep === 1 ? " active" : ""}`} id="screen-1">
          <div className="shortcut-screen">
            <p className="screen-eyebrow">{shortcutEyebrow}</p>
            <h2 className="screen-title">{shortcutTitle}</h2>
            <p className="screen-desc">{shortcutDesc}</p>
            <div className="browser-mockup">
              <div className="browser-toolbar">
                <div className="browser-dots"><span></span><span></span><span></span></div>
                <div className="browser-address-bar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  https://example.com/my-page
                </div>
              </div>
              <div className="browser-content">
                <div className="mock-toast">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#2a7c6f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                  </svg>
                  <span>{toastMsg}</span>
                </div>
                <ShortcutKeys id="demoShortcutKeys" defaultKeys={shortcutKeys} />
              </div>
            </div>
            <button className="change-shortcut-btn" id="changeShortcutWelcomeBtn" onClick={handleChangeShortcut}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              <span>{changeShortcutLabel}</span>
            </button>
          </div>
        </section>

        <section className={`step-screen${currentStep === 2 ? " active" : ""}`} id="screen-2">
          <div className="regex-screen">
            <p className="screen-eyebrow">{regexEyebrow}</p>
            <h2 className="screen-title">{regexTitle}</h2>
            <p className="screen-desc">{regexDesc}</p>

            <div className="regex-demo-card">
              <div className="regex-demo-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                <span>{demoLabel}</span>
              </div>
              <div className="regex-demo-body">
                <div className="regex-demo-row">
                  <span className="regex-demo-label">URL</span>
                  <div className="regex-demo-url url-full">
                    https://github.com/<span className="url-highlight">facebook/react</span>/issues/12345
                  </div>
                </div>
                <div className="regex-demo-rule">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                  {"regex: github\\.com\\/([^\\/]+\\/[^\\/]+)"}
                </div>
                <div className="regex-demo-arrow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"></path><path d="m19 12-7 7-7-7"></path></svg>
                </div>
                <div className="regex-demo-row">
                  <span className="regex-demo-label">{copiedLabel}</span>
                  <div className="regex-demo-url url-result">facebook/react</div>
                </div>
              </div>
            </div>

            <div className="quick-rule-form">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                </svg>
                <span>{quickRuleTitle}</span>
              </h3>
              <div className="form-row">
                <div className="form-field">
                  <label>{domainLabel}</label>
                  <input type="text" id="quickDomain" className={quickDomainError ? "error" : ""} placeholder="github.com" value={quickDomain} onChange={(e) => { setQuickDomain(e.target.value); setQuickDomainError(false); }}  />
                  {quickDomainError && <span className="field-error visible">{domainInvalidLabel}</span>}
                </div>
                <div className="form-field">
                  <label>{regexLabel}</label>
                  <input type="text" id="quickRegex" className={quickRegexError ? "error" : ""} placeholder="github\.com\/([^\/]+\/[^\/]+)" value={quickRegex} onChange={(e) => { setQuickRegex(e.target.value); setQuickRegexError(false); }} />
                  {quickRegexError && <span className="field-error visible">{regexInvalidLabel}</span>}
                </div>
              </div>
              <div className="form-actions">
                <button className="form-skip" id="skipRuleBtn" onClick={goNext}>{skipLabel}</button>
                <button className="form-save-btn" id="saveQuickRuleBtn" onClick={handleSaveQuickRule}>
                  {saveButtonLabel === "save" ? (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      <span>{addRuleLabel}</span>
                    </>
                  ) : (
                    <>
                      <span>{nextLabel}</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}><path d="m9 18 6-6-6-6"></path></svg>
                    </>
                  )}
                </button>
              </div>
              {savedMsgVisible && (
                <div className="rule-saved-msg visible" id="ruleSavedMsg">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>{ruleSavedMsg}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className={`step-screen${currentStep === 3 ? " active" : ""}`} id="screen-3">
          <div className="shortcut-screen">
            <p className="screen-eyebrow">{historyEyebrow}</p>
            <h2 className="screen-title">{historyTitle}</h2>
            <p className="screen-desc">{historyDesc}</p>
            <div className="browser-mockup">
              <div className="browser-toolbar">
                <div className="browser-dots"><span></span><span></span><span></span></div>
                <div className="browser-address-bar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  https://github.com/facebook/react
                </div>
              </div>
              <div className="browser-content" style={{ position: "relative", height: 300, overflow: "hidden" }}>
                <div className="history-overlay-animated">
                  <div className="history-demo-mockup" style={{ maxWidth: "100%", animation: "none", borderRadius: 0, border: "none", boxShadow: "none" }}>
                    <div className="history-mock-header">
                      <div className="history-mock-header-left">
                        <div className="history-mock-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        </div>
                        <span className="history-mock-title">{hTitle}</span>
                      </div>
                    </div>
                    <div className="history-mock-items">
                      <div className="history-mock-item"><span className="history-mock-item-index">1</span><div className="history-mock-item-content"><div className="history-mock-item-text">facebook/react</div><div className="history-mock-item-meta">github.com · Just now</div></div><span className="history-mock-item-badge">regex</span></div>
                      <div className="history-mock-item"><span className="history-mock-item-index">2</span><div className="history-mock-item-content"><div className="history-mock-item-text">https://docs.google.com/spreadsh…</div><div className="history-mock-item-meta">docs.google.com · 3m</div></div></div>
                      <div className="history-mock-item"><span className="history-mock-item-index">3</span><div className="history-mock-item-content"><div className="history-mock-item-text">https://stackoverflow.com/q/123…</div><div className="history-mock-item-meta">stackoverflow.com · 12m</div></div></div>
                      <div className="history-mock-item"><span className="history-mock-item-index">4</span><div className="history-mock-item-content"><div className="history-mock-item-text">https://figma.com/file/abc123…</div><div className="history-mock-item-meta">figma.com · 1h</div></div></div>
                    </div>
                    <div className="history-mock-hint">↑↓ navigate · Enter to select · <kbd>Esc</kbd></div>
                  </div>
                </div>
              </div>
            </div>
            <ShortcutKeys id="demoHistoryKeys" defaultKeys={historyKeys} />
          </div>
        </section>

        <section className={`step-screen${currentStep === 4 ? " active" : ""}`} id="screen-4">
          <div className="allset-screen">
            <div className="allset-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h2 className="allset-title">{allSetTitle}</h2>
            <p className="allset-desc">{allSetDesc}</p>
            <div className="donate-card">
              <div className="donate-emoji">☕</div>
              <div className="donate-title">{donateCta}</div>
              <p className="donate-desc">{donateDesc}</p>
              <a className="donate-link" href="https://ko-fi.com/lucaslourencoo" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402C1 3.763 4.068 2 6.5 2c1.868 0 3.535.912 4.5 2.316C12 2.91 13.668 2 15.5 2 17.932 2 21 3.762 21 7.191c0 4.105-5.37 8.863-11 14.402z"/></svg>
                {donateBtn}
              </a>
            </div>
          </div>
        </section>

        <div className="wizard-nav">
          <button className="nav-btn nav-btn-back" id="btnBack" disabled={currentStep === 0} onClick={goBack}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"></path></svg>
            <span>{backLabel}</span>
          </button>
          <span className="nav-step-indicator" id="stepIndicator">{currentStep + 1} / {TOTAL_STEPS}</span>
          <button className="nav-btn nav-btn-next" id="btnNext" disabled={currentStep >= TOTAL_STEPS - 1} onClick={goNext}>
            <span>{nextLabel}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"></path></svg>
          </button>
        </div>
      </main>

      <footer className="wizard-footer">
        Fast Copy v1.5.0 — {footerLabel}
      </footer>
    </>
  );
}
