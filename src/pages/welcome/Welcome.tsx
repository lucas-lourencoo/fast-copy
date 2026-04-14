import { useState, useEffect, useCallback, useRef } from "react";
import { useChromeI18n } from "../../hooks/useChromeI18n";
import { applyI18nToRef } from "../../hooks/useChromeI18n";
import "../../styles/global.css";

const TOTAL_STEPS = 5;

function ShortcutKeys({
  id,
  defaultKeys,
  animationStyle,
}: {
  id?: string;
  defaultKeys: string[];
  animationStyle?: string;
}) {
  return (
    <div
      className="flex items-center gap-2 justify-center mt-6"
      id={id}
      style={animationStyle ? { animation: animationStyle } : undefined}
    >
      {defaultKeys.map((key, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && (
            <span className="text-base text-[#555] font-normal select-none">
              +
            </span>
          )}
          <span className="inline-flex items-center justify-center min-w-[48px] h-11 px-[14px] rounded-lg bg-[linear-gradient(180deg,#2a2a45_0%,#1e1e35_100%)] border border-[rgba(255,255,255,0.1)] border-b-[3px] border-b-[rgba(0,0,0,0.4)] text-[14px] font-semibold text-[#c8c8e0] shadow-[0_2px_8px_rgba(0,0,0,0.3)] select-none">
            {key}
          </span>
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
  const [saveButtonLabel, setSaveButtonLabel] = useState<"save" | "next">(
    "save",
  );
  const [shortcutKeys, setShortcutKeys] = useState(["Ctrl", "Shift", "U"]);
  const [historyKeys, setHistoryKeys] = useState(["Ctrl", "Shift", "Y"]);

  const welcomeBadge = useChromeI18n("welcomeBadge", "Installation complete");
  const welcomeTitle = useChromeI18n(
    "welcomeTitle",
    "Thanks for installing Fast Copy!",
  );
  const welcomeSubtitle = useChromeI18n(
    "welcomeSubtitle",
    "Instantly copy the URL of any tab with a simple keyboard shortcut. Fast, lightweight, and hassle-free.",
  );
  const stepLabels = [
    useChromeI18n("onboardStep1Label", "Welcome"),
    useChromeI18n("onboardStep2Label", "Shortcut"),
    useChromeI18n("onboardStep3Label", "URL Rules"),
    useChromeI18n("onboardStep4Label", "History"),
    useChromeI18n("onboardStep5Label", "Done"),
  ];
  const shortcutEyebrow = useChromeI18n("onboardShortcutEyebrow", "Step 2");
  const shortcutTitle = useChromeI18n(
    "onboardShortcutTitle",
    "Your shortcut is ready",
  );
  const shortcutDesc = useChromeI18n(
    "onboardShortcutDesc",
    "Press this combination on any page to instantly copy its URL to your clipboard.",
  );
  const toastMsg = useChromeI18n("toastMessage", "Link Copied!");
  const changeShortcutLabel = useChromeI18n(
    "changeShortcut",
    "Change shortcut",
  );
  const regexEyebrow = useChromeI18n("onboardRegexEyebrow", "Step 3");
  const regexTitle = useChromeI18n("onboardRegexTitle", "Smart URL Extraction");
  const regexDesc = useChromeI18n(
    "onboardRegexDesc",
    "Create regex rules to automatically extract only the part of the URL you need — like repo names, ticket IDs, or order numbers.",
  );
  const demoLabel = useChromeI18n(
    "welcomeRegexDemoLabel",
    "Example: GitHub Repository",
  );
  const copiedLabel = useChromeI18n("welcomeRegexCopied", "Copied");
  const quickRuleTitle = useChromeI18n(
    "onboardQuickRuleTitle",
    "Add your first rule (optional)",
  );
  const domainLabel = useChromeI18n("rulesDomain", "Domain");
  const regexLabel = useChromeI18n("rulesRegex", "Regex Pattern");
  const domainInvalidLabel = useChromeI18n(
    "domainInvalid",
    "Enter a valid domain",
  );
  const regexInvalidLabel = useChromeI18n("regexInvalid", "Invalid regex");
  const skipLabel = useChromeI18n("onboardSkipRule", "Skip for now");
  const addRuleLabel = useChromeI18n("addRule", "Add Rule");
  const nextLabel = useChromeI18n("onboardNext", "Next");
  const ruleSavedMsg = useChromeI18n(
    "onboardRuleSaved",
    "Rule saved! You can manage your rules anytime in the extension options.",
  );
  const historyEyebrow = useChromeI18n("onboardHistoryEyebrow", "Step 4");
  const historyTitle = useChromeI18n("onboardHistoryTitle", "Copy History");
  const historyDesc = useChromeI18n(
    "onboardHistoryDesc",
    "Access your last 10 copied links instantly. Navigate with arrow keys, press Enter to select and paste.",
  );
  const hTitle = useChromeI18n("historyTitle", "Copy History");
  const allSetTitle = useChromeI18n("onboardAllSetTitle", "All set!");
  const allSetDesc = useChromeI18n(
    "onboardAllSetDesc",
    "Fast Copy is ready to use. Press your shortcut on any tab and the URL is instantly in your clipboard.",
  );
  const donateCta = useChromeI18n("donateCta", "Enjoying Fast Copy?");
  const donateDesc = useChromeI18n(
    "donateDesc",
    "This extension is free and open-source. If it saves you time every day, consider buying me a coffee!",
  );
  const donateBtn = useChromeI18n("donateBtn", "Buy me a coffee");
  const backLabel = useChromeI18n("onboardBack", "Back");
  const footerLabel = useChromeI18n(
    "welcomeFooter",
    "Made with ♥ by Lucas Lourenço",
  );

  useEffect(() => {
    if (
      typeof chrome === "undefined" ||
      !chrome.commands ||
      !chrome.commands.getAll
    )
      return;
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
    return /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$/.test(
      val.trim(),
    );
  }

  function isRegexValid(val: string): boolean {
    try {
      new RegExp(val.trim());
      return val.trim().length > 0;
    } catch {
      return false;
    }
  }

  const handleSaveQuickRule = useCallback(() => {
    if (ruleSaved) {
      goNext();
      return;
    }

    const dVal = quickDomain.trim();
    const rVal = quickRegex.trim();
    let valid = true;

    setQuickDomainError(false);
    setQuickRegexError(false);

    if (!dVal || !isDomainValid(dVal)) {
      setQuickDomainError(true);
      valid = false;
    }
    if (!rVal || !isRegexValid(rVal)) {
      setQuickRegexError(true);
      valid = false;
    }
    if (!valid) return;

    if (typeof chrome === "undefined" || !chrome.storage) {
      goNext();
      return;
    }

    chrome.storage.sync.get(["urlRules"], (result) => {
      const rules = (result.urlRules as Array<Record<string, unknown>>) || [];
      rules.push({
        id: Date.now().toString(),
        domain: dVal,
        regex: rVal,
        label: "",
        enabled: true,
      });
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

  const inputBase =
    "w-full px-3 py-[9px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg text-[#e0e0e8] font-mono text-[13px] transition-all duration-200 outline-none placeholder-[#44445a] focus:border-[rgba(102,126,234,0.4)] focus:bg-[rgba(102,126,234,0.05)]";
  const inputErrorCls = "border-[rgba(239,68,68,0.5)]";

  return (
    <>
      <div className="relative min-h-screen overflow-hidden bg-[#0d0d12]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-[30%] -left-[20%] w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle,rgba(102,126,234,0.08)_0%,transparent_70%)] blur-3xl" />
          <div className="absolute -bottom-[20%] -right-[15%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(118,75,162,0.07)_0%,transparent_70%)] blur-3xl" />
          <div className="absolute top-[40%] left-[60%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(56,239,125,0.04)_0%,transparent_70%)] blur-3xl" />
        </div>
        <main
          className="relative z-[1] w-full max-w-[680px] flex flex-col items-center px-6 pt-12 pb-8 mx-auto text-[#e0e0e8] font-['Inter',ui-sans-serif,system-ui,sans-serif]"
          ref={wizardRef}
        >
          {/* ── Progress bar ── */}
          <nav className="flex items-start w-full mb-14" id="progressBar">
            {stepLabels.map((label, i) => {
              const isDone = i < currentStep;
              const isActive = i === currentStep;
              const lineDone = i < currentStep;
              return (
                <div key={i} className="contents" data-step={i}>
                  <div className="flex flex-col items-center gap-[6px] shrink-0 w-[72px]">
                    <div
                      className={`w-[38px] h-[38px] rounded-full border-2 flex items-center justify-center text-[13px] font-bold transition-all duration-[350ms] ${
                        isDone
                          ? "bg-gradient-to-br from-[#667eea] to-[#764ba2] border-transparent text-white shadow-[0_4px_16px_rgba(102,126,234,0.25)]"
                          : isActive
                            ? "border-[#667eea] bg-[rgba(102,126,234,0.12)] text-[#a8b4f0] shadow-[0_0_0_4px_rgba(102,126,234,0.12)]"
                            : "border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] text-[#555570]"
                      }`}
                    >
                      {isDone ? (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      ) : i === 4 ? (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span
                      className={`text-[11px] font-medium whitespace-nowrap transition-colors duration-[350ms] ${
                        isDone
                          ? "text-[#667eea]"
                          : isActive
                            ? "text-[#a8b4f0]"
                            : "text-[#555570]"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  {i < stepLabels.length - 1 && (
                    <div className="flex-1 pt-[18px]">
                      <div
                        className="w-full h-[2px] rounded-full transition-[background] duration-[400ms]"
                        style={{
                          background: lineDone
                            ? "linear-gradient(90deg, #667eea, #764ba2)"
                            : "rgba(255, 255, 255, 0.08)",
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* ── Step content ── */}
          <div className="flex-1 flex flex-col">
            {/* ── Step 1: Welcome ── */}
            {currentStep === 0 && (
              <div
                className="flex flex-col items-center text-center w-full"
                id="screen-0"
                style={{ animation: "fadeSlideIn 0.4s ease" }}
              >
                <div
                  className="w-20 h-20 rounded-[20px] bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center mb-8 shadow-[0_8px_40px_rgba(102,126,234,0.35)]"
                  style={{ animation: "float 3s ease-in-out infinite" }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-10 h-10 text-white"
                  >
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                  </svg>
                </div>

                <div className="inline-flex items-center gap-[6px] px-[14px] py-[6px] rounded-full bg-[rgba(56,239,125,0.1)] border border-[rgba(56,239,125,0.25)] text-[#38ef7d] text-[12px] font-semibold tracking-[0.5px] mb-6">
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
                  <span>{welcomeBadge}</span>
                </div>

                <h1 className="gradient-text text-[38px] font-extrabold leading-[1.15] tracking-[-1.5px] mb-4 max-w-[480px]">
                  {welcomeTitle}
                </h1>

                <p className="text-[17px] text-[#8888a0] leading-[1.6] max-w-[460px]">
                  {welcomeSubtitle}
                </p>
              </div>
            )}

            {/* ── Step 2: Shortcut ── */}
            {currentStep === 1 && (
              <div
                className="flex flex-col items-center text-center w-full"
                id="screen-1"
                style={{ animation: "fadeSlideIn 0.4s ease" }}
              >
                <p className="text-[12px] uppercase tracking-[2px] text-[#667eea] font-semibold mb-3">
                  {shortcutEyebrow}
                </p>
                <h2 className="gradient-text text-[26px] font-extrabold tracking-[-0.8px] mb-[10px]">
                  {shortcutTitle}
                </h2>
                <p className="text-[15px] text-[#8888a0] leading-[1.6] mb-10 max-w-[420px]">
                  {shortcutDesc}
                </p>

                {/* Browser mockup */}
                <div className="w-full rounded-2xl bg-[#1a1a2e] border border-[rgba(255,255,255,0.06)] overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.5),0_4px_20px_rgba(0,0,0,0.3)] mb-7">
                  <div className="flex items-center gap-3 px-[18px] py-[14px] bg-[#161625] border-b border-[rgba(255,255,255,0.05)]">
                    <div className="flex gap-[7px]">
                      <span className="w-3 h-3 rounded-full bg-[#ff5f57]"></span>
                      <span className="w-3 h-3 rounded-full bg-[#febc2e]"></span>
                      <span className="w-3 h-3 rounded-full bg-[#28c840]"></span>
                    </div>
                    <div className="flex-1 flex items-center gap-2 px-[14px] py-2 rounded-lg bg-[rgba(255,255,255,0.06)] text-[#7a7a96] text-[13px]">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-[14px] h-[14px] text-[#555] shrink-0"
                      >
                        <rect
                          x="3"
                          y="11"
                          width="18"
                          height="11"
                          rx="2"
                          ry="2"
                        ></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                      https://example.com/my-page
                    </div>
                  </div>
                  <div
                    className="relative flex flex-col items-center justify-center gap-6 h-[240px] px-6"
                    style={{
                      background:
                        "radial-gradient(ellipse at 50% 80%, #1e1e38 0%, #0d0d12 70%)",
                    }}
                  >
                    <div
                      className="absolute flex items-center gap-2 px-5 py-[10px] bg-[#e4f4f1] text-[#1a2b2a] text-[14px] font-medium rounded-full shadow-[0_8px_40px_rgba(0,0,0,0.22),0_2px_10px_rgba(0,0,0,0.12)] border-2 border-[rgba(42,124,111,0.25)]"
                      style={{
                        animation: "toast-cycle 5s ease-in-out infinite",
                        left: "50%",
                        top: 16,
                      }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-4 h-4 shrink-0"
                      >
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                      </svg>
                      <span>{toastMsg}</span>
                    </div>

                    <ShortcutKeys
                      id="demoShortcutKeys"
                      defaultKeys={shortcutKeys}
                      animationStyle="pulse-shortcut 5s ease-in-out infinite"
                    />
                  </div>
                </div>

                <button
                  className="inline-flex items-center gap-2 px-5 py-[10px] rounded-[10px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[#a8a8c0] text-[13px] font-medium cursor-pointer transition-all duration-200 hover:bg-[rgba(255,255,255,0.09)] hover:text-white hover:border-[rgba(102,126,234,0.3)]"
                  id="changeShortcutWelcomeBtn"
                  onClick={handleChangeShortcut}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-[15px] h-[15px]"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  <span>{changeShortcutLabel}</span>
                </button>
              </div>
            )}

            {/* ── Step 3: Regex ── */}
            {currentStep === 2 && (
              <div
                className="flex flex-col items-center text-center w-full"
                id="screen-2"
                style={{ animation: "fadeSlideIn 0.4s ease" }}
              >
                <p className="text-[12px] uppercase tracking-[2px] text-[#667eea] font-semibold mb-3">
                  {regexEyebrow}
                </p>
                <h2 className="gradient-text text-[26px] font-extrabold tracking-[-0.8px] mb-[10px]">
                  {regexTitle}
                </h2>
                <p className="text-[14px] text-[#8888a0] leading-[1.5] mb-6 max-w-[420px]">
                  {regexDesc}
                </p>

                {/* Regex demo card */}
                <div className="w-full bg-[#1a1a2e] rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.5),0_4px_20px_rgba(0,0,0,0.3)] mb-4">
                  <div className="flex items-center gap-[10px] px-[18px] py-[14px] bg-[#161625] border-b border-[rgba(255,255,255,0.05)]">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4 text-[#764ba2] shrink-0"
                    >
                      <polyline points="16 18 22 12 16 6"></polyline>
                      <polyline points="8 6 2 12 8 18"></polyline>
                    </svg>
                    <span className="text-[13px] font-semibold text-[#a8b4f0]">
                      {demoLabel}
                    </span>
                  </div>
                  <div
                    className="px-4 py-3 flex flex-col gap-3 text-left"
                    style={{
                      background:
                        "radial-gradient(ellipse at 50% 80%, #1e1e38 0%, #0d0d12 70%)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] uppercase tracking-[1.5px] text-[#555570] font-semibold min-w-[64px] shrink-0">
                        URL
                      </span>
                      <div className="flex-1 font-mono text-[13px] px-[14px] py-[10px] rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-[#7a7a96] whitespace-nowrap overflow-hidden text-ellipsis">
                        https://github.com/
                        <span className="text-[#a8b4f0] font-semibold">
                          facebook/react
                        </span>
                        /issues/12345
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-[76px] px-3 py-2 rounded-lg bg-[rgba(118,75,162,0.1)] border border-[rgba(118,75,162,0.2)] font-mono text-[12px] text-[#b89cdb]">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-[14px] h-[14px] text-[#764ba2] shrink-0"
                      >
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.3-4.3"></path>
                      </svg>
                      {"github\\.com\\/([^\\/]+\\/[^\\/]+)"}
                    </div>

                    <div
                      className="flex items-center justify-center py-1"
                      style={{
                        animation: "arrow-pulse 2s ease-in-out infinite",
                      }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#38ef7d"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-5 h-5"
                      >
                        <path d="M12 5v14"></path>
                        <path d="m19 12-7 7-7-7"></path>
                      </svg>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] uppercase tracking-[1.5px] text-[#555570] font-semibold min-w-[64px] shrink-0">
                        {copiedLabel}
                      </span>
                      <div
                        className="flex-1 font-mono text-[13px] font-semibold text-[#38ef7d] px-[14px] py-[10px] rounded-lg bg-[rgba(56,239,125,0.06)] border border-[rgba(56,239,125,0.15)]"
                        style={{
                          animation: "result-glow 3s ease-in-out infinite",
                        }}
                      >
                        facebook/react
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick rule form */}
                <div className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)] rounded-[14px] px-4 py-3 text-left">
                  <h3 className="flex items-center gap-2 text-[13px] font-semibold text-[#c0c0d8] mb-3">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-[15px] h-[15px] text-[#764ba2]"
                    >
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                    </svg>
                    <span>{quickRuleTitle}</span>
                  </h3>
                  <div className="grid grid-cols-[1fr_2fr] gap-[10px] mb-[10px] max-sm:grid-cols-1">
                    <div className="flex flex-col gap-[5px]">
                      <label className="text-[11px] font-semibold uppercase tracking-[1px] text-[#555570]">
                        {domainLabel}
                      </label>
                      <input
                        type="text"
                        id="quickDomain"
                        className={`${inputBase} ${quickDomainError ? inputErrorCls : ""}`}
                        placeholder="github.com"
                        value={quickDomain}
                        onChange={(e) => {
                          setQuickDomain(e.target.value);
                          setQuickDomainError(false);
                        }}
                      />
                      {quickDomainError && (
                        <span className="text-[11px] text-[#f87171]">
                          {domainInvalidLabel}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-[5px]">
                      <label className="text-[11px] font-semibold uppercase tracking-[1px] text-[#555570]">
                        {regexLabel}
                      </label>
                      <input
                        type="text"
                        id="quickRegex"
                        className={`${inputBase} ${quickRegexError ? inputErrorCls : ""}`}
                        placeholder={`github\\.com\\/([^\\/]+\\/[^\\/]+)`}
                        value={quickRegex}
                        onChange={(e) => {
                          setQuickRegex(e.target.value);
                          setQuickRegexError(false);
                        }}
                      />
                      {quickRegexError && (
                        <span className="text-[11px] text-[#f87171]">
                          {regexInvalidLabel}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <button
                      className="text-[12px] text-[#44445a] bg-transparent border-none cursor-pointer transition-colors duration-200 hover:text-[#8888a0] font-[inherit]"
                      id="skipRuleBtn"
                      onClick={goNext}
                    >
                      {skipLabel}
                    </button>
                    <button
                      className="inline-flex items-center gap-[7px] px-[18px] py-[9px] rounded-lg bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white text-[13px] font-semibold border-none cursor-pointer transition-all duration-200 shadow-[0_4px_20px_rgba(102,126,234,0.25)] hover:-translate-y-px hover:shadow-[0_6px_24px_rgba(102,126,234,0.4)]"
                      id="saveQuickRuleBtn"
                      onClick={handleSaveQuickRule}
                    >
                      {saveButtonLabel === "save" ? (
                        <>
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
                          <span>{addRuleLabel}</span>
                        </>
                      ) : (
                        <>
                          <span>{nextLabel}</span>
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-[14px] h-[14px]"
                          >
                            <path d="m9 18 6-6-6-6"></path>
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                  {savedMsgVisible && (
                    <div
                      className="mt-1 flex items-center gap-2 px-[14px] py-[10px] rounded-lg bg-[rgba(56,239,125,0.08)] border border-[rgba(56,239,125,0.2)] text-[13px] text-[#38ef7d] font-medium"
                      id="ruleSavedMsg"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-[15px] h-[15px] shrink-0"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      <span>{ruleSavedMsg}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Step 4: History ── */}
            {currentStep === 3 && (
              <div
                className="flex flex-col items-center text-center w-full"
                id="screen-3"
                style={{ animation: "fadeSlideIn 0.4s ease" }}
              >
                <p className="text-[12px] uppercase tracking-[2px] text-[#667eea] font-semibold mb-3">
                  {historyEyebrow}
                </p>
                <h2 className="gradient-text text-[26px] font-extrabold tracking-[-0.8px] mb-[10px]">
                  {historyTitle}
                </h2>
                <p className="text-[15px] text-[#8888a0] leading-[1.6] mb-10 max-w-[420px]">
                  {historyDesc}
                </p>

                {/* Browser mockup with history overlay */}
                <div className="w-full rounded-2xl bg-[#1a1a2e] border border-[rgba(255,255,255,0.06)] overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.5),0_4px_20px_rgba(0,0,0,0.3)] mb-4">
                  <div className="flex items-center gap-3 px-[18px] py-[14px] bg-[#161625] border-b border-[rgba(255,255,255,0.05)]">
                    <div className="flex gap-[7px]">
                      <span className="w-3 h-3 rounded-full bg-[#ff5f57]"></span>
                      <span className="w-3 h-3 rounded-full bg-[#febc2e]"></span>
                      <span className="w-3 h-3 rounded-full bg-[#28c840]"></span>
                    </div>
                    <div className="flex-1 flex items-center gap-2 px-[14px] py-2 rounded-lg bg-[rgba(255,255,255,0.06)] text-[#7a7a96] text-[13px]">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-[14px] h-[14px] text-[#555] shrink-0"
                      >
                        <rect
                          x="3"
                          y="11"
                          width="18"
                          height="11"
                          rx="2"
                          ry="2"
                        ></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                      https://github.com/facebook/react
                    </div>
                  </div>
                  <div className="relative overflow-hidden h-[280px]">
                    <div
                      className="absolute inset-0 bg-[rgba(0,0,0,0.5)] flex items-start justify-center p-3"
                      style={{
                        animation:
                          "history-overlay-cycle 6s ease-in-out infinite",
                      }}
                    >
                      <div
                        className="w-full max-w-[300px] bg-[#1e1e2e] rounded-xl border border-[rgba(255,255,255,0.06)] shadow-[0_10px_40px_rgba(0,0,0,0.35),0_2px_12px_rgba(0,0,0,0.2)] overflow-hidden"
                        style={{
                          animation: "historySlideIn 0.5s ease 0.3s both",
                        }}
                      >
                        <div className="flex items-center justify-between px-3 py-[10px] border-b border-[rgba(255,255,255,0.05)]">
                          <div className="flex items-center gap-[6px]">
                            <div className="w-5 h-5 rounded-[5px] bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center">
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-[11px] h-[11px] text-white"
                              >
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                              </svg>
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-[0.5px] text-[rgba(255,255,255,0.4)]">
                              {hTitle}
                            </span>
                          </div>
                        </div>
                        <div className="p-[6px] flex flex-col gap-[2px]">
                          {[
                            {
                              i: 1,
                              text: "facebook/react",
                              meta: "github.com · Just now",
                              badge: true,
                              active: true,
                            },
                            {
                              i: 2,
                              text: "https://docs.google.com/spreadsh…",
                              meta: "docs.google.com · 3m",
                              badge: false,
                              active: false,
                            },
                            {
                              i: 3,
                              text: "https://stackoverflow.com/q/123…",
                              meta: "stackoverflow.com · 12m",
                              badge: false,
                              active: false,
                            },
                            {
                              i: 4,
                              text: "https://figma.com/file/abc123…",
                              meta: "figma.com · 1h",
                              badge: false,
                              active: false,
                            },
                          ].map((item) => (
                            <div
                              key={item.i}
                              className={`flex items-center gap-2 px-2 py-[7px] rounded-md ${item.active ? "bg-[rgba(102,126,234,0.1)]" : ""}`}
                            >
                              <span
                                className={`text-[9px] font-bold w-4 h-4 rounded-[3px] flex items-center justify-center shrink-0 ${
                                  item.active
                                    ? "bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white"
                                    : "bg-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.8)] opacity-50"
                                }`}
                              >
                                {item.i}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="text-[11px] font-medium text-[rgba(255,255,255,0.85)] truncate">
                                  {item.text}
                                </div>
                                <div className="text-[9px] text-[rgba(255,255,255,0.3)] mt-px">
                                  {item.meta}
                                </div>
                              </div>
                              {item.badge && (
                                <span className="text-[7px] uppercase tracking-[0.5px] font-bold px-1 py-px rounded-[3px] bg-[rgba(99,102,241,0.12)] text-[#818cf8] shrink-0">
                                  regex
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="px-[10px] py-[5px] text-center text-[9px] text-[rgba(255,255,255,0.2)] border-t border-[rgba(255,255,255,0.04)]">
                          ↑↓ navigate · Enter to select ·{" "}
                          <kbd className="inline-block px-[3px] rounded-[2px] bg-[rgba(255,255,255,0.08)] font-[inherit] text-[8px]">
                            Esc
                          </kbd>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <ShortcutKeys
                  id="demoHistoryKeys"
                  defaultKeys={historyKeys}
                  animationStyle="pulse-shortcut-history 6s ease-in-out infinite"
                />
              </div>
            )}

            {/* ── Step 5: All set ── */}
            {currentStep === 4 && (
              <div
                className="flex flex-col items-center text-center w-full"
                id="screen-4"
                style={{ animation: "fadeSlideIn 0.4s ease" }}
              >
                <div
                  className="w-[88px] h-[88px] rounded-full bg-gradient-to-br from-[#38ef7d] to-[#11998e] flex items-center justify-center mb-7 shadow-[0_8px_40px_rgba(56,239,125,0.3)]"
                  style={{
                    animation:
                      "pop-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-11 h-11 text-white"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>

                <h2 className="gradient-text text-[32px] font-extrabold tracking-[-1px] mb-[10px]">
                  {allSetTitle}
                </h2>
                <p className="text-[16px] text-[#8888a0] leading-[1.6] max-w-[400px] mb-9">
                  {allSetDesc}
                </p>

                {/* Donate card */}
                <div className="w-full max-w-[420px] bg-[rgba(255,189,46,0.06)] border border-[rgba(255,189,46,0.18)] rounded-[18px] px-7 py-6 flex flex-col items-center gap-3 transition-all duration-[250ms] hover:bg-[rgba(255,189,46,0.1)] hover:border-[rgba(255,189,46,0.3)] hover:-translate-y-[2px] hover:shadow-[0_16px_48px_rgba(255,189,46,0.1)]">
                  <div
                    className="text-4xl leading-none"
                    style={{ animation: "float 3s ease-in-out infinite" }}
                  >
                    ☕
                  </div>
                  <div className="text-[16px] font-bold text-[#f0d060] tracking-[-0.3px]">
                    {donateCta}
                  </div>
                  <p className="text-[13px] text-[#6a6a82] leading-[1.6] text-center max-w-[300px]">
                    {donateDesc}
                  </p>
                  <a
                    className="inline-flex items-center gap-[7px] px-[22px] py-[10px] rounded-full bg-[linear-gradient(135deg,#f0c030_0%,#e8a010_100%)] text-[#1a0f00] text-[14px] font-bold no-underline transition-all duration-200 shadow-[0_4px_20px_rgba(240,192,48,0.3)] hover:-translate-y-[2px] hover:scale-[1.03] hover:shadow-[0_8px_32px_rgba(240,192,48,0.45)]"
                    href="https://ko-fi.com/lucaslourencoo"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402C1 3.763 4.068 2 6.5 2c1.868 0 3.535.912 4.5 2.316C12 2.91 13.668 2 15.5 2 17.932 2 21 3.762 21 7.191c0 4.105-5.37 8.863-11 14.402z" />
                    </svg>
                    {donateBtn}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* ── Navigation ── */}
          <div className="flex items-center justify-between w-full mt-10">
            <button
              className="inline-flex items-center gap-2 px-[22px] py-[11px] rounded-[10px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[#6a6a82] text-[14px] font-semibold cursor-pointer transition-all duration-200 hover:bg-[rgba(255,255,255,0.09)] hover:text-[#a8a8c0] disabled:opacity-0 disabled:pointer-events-none"
              id="btnBack"
              disabled={currentStep === 0}
              onClick={goBack}
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
                <path d="m15 18-6-6 6-6"></path>
              </svg>
              <span>{backLabel}</span>
            </button>
            <span
              className="text-[13px] text-[#44445a] font-medium"
              id="stepIndicator"
            >
              {currentStep + 1} / {TOTAL_STEPS}
            </span>
            <button
              className="inline-flex items-center gap-2 px-[22px] py-[11px] rounded-[10px] bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white text-[14px] font-semibold border-none cursor-pointer transition-all duration-200 shadow-[0_4px_20px_rgba(102,126,234,0.3)] hover:-translate-y-px hover:shadow-[0_6px_28px_rgba(102,126,234,0.45)] disabled:opacity-0 disabled:pointer-events-none"
              id="btnNext"
              disabled={currentStep >= TOTAL_STEPS - 1}
              onClick={goNext}
            >
              <span>{nextLabel}</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <path d="m9 18 6-6-6-6"></path>
              </svg>
            </button>
          </div>

          <footer className="w-full mt-12 pt-5 text-center text-[12px] text-[#33334a] border-t border-[rgba(255,255,255,0.04)]">
            Fast Copy v1.6.0 — {footerLabel}
          </footer>
        </main>
      </div>
    </>
  );
}
