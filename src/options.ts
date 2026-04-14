import { type UrlRule } from "./shared";

document.addEventListener("DOMContentLoaded", async () => {
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    const msg = chrome.i18n.getMessage(el.dataset.i18n!);
    if (!msg) return;
    const star = el.querySelector(".required-star");
    if (star) {
      el.firstChild
        ? (el.firstChild.textContent = msg)
        : el.prepend(document.createTextNode(msg));
    } else {
      el.textContent = msg;
    }
  });
  document
    .querySelectorAll<HTMLInputElement>("[data-i18n-placeholder]")
    .forEach((el) => {
      const msg = chrome.i18n.getMessage(el.dataset.i18nPlaceholder!);
      if (msg) el.placeholder = msg;
    });

  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (!isDark) document.body.classList.add("theme-light");

  const inputDomain = document.getElementById("inputDomain") as HTMLInputElement;
  const inputLabel = document.getElementById("inputLabel") as HTMLInputElement;
  const inputRegex = document.getElementById("inputRegex") as HTMLInputElement;
  const regexError = document.getElementById("regexError")!;
  const domainError = document.getElementById("domainError")!;
  const saveBtn = document.getElementById("saveBtn")!;
  const saveBtnText = document.getElementById("saveBtnText")!;
  const cancelBtn = document.getElementById("cancelBtn") as HTMLElement;
  const formTitle = document.getElementById("formTitle")!;
  const rulesList = document.getElementById("rulesList")!;
  const testUrl = document.getElementById("testUrl") as HTMLInputElement;
  const testResult = document.getElementById("testResult")!;
  const testResultLabel = document.getElementById("testResultLabel")!;
  const testResultValue = document.getElementById("testResultValue")!;

  const optionsToast = document.getElementById("optionsToast")!;
  const toastIcon = document.getElementById("toastIcon")!;
  const toastText = document.getElementById("toastText")!;

  let editingId: string | null = null;
  let rules: UrlRule[] = [];
  let toastTimer: ReturnType<typeof setTimeout> | null = null;

  function showToast(message: string, type = "success"): void {
    if (toastTimer) clearTimeout(toastTimer);

    toastText.textContent = message;
    optionsToast.className = `options-toast ${type}`;

    if (type === "success") {
      toastIcon.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';
    } else {
      toastIcon.innerHTML =
        '<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>';
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        optionsToast.classList.add("visible");
      });
    });

    toastTimer = setTimeout(() => {
      optionsToast.classList.remove("visible");
    }, 2500);
  }

  async function loadRules(): Promise<void> {
    const { urlRules = [] } = (await chrome.storage.sync.get("urlRules")) as {
      urlRules: UrlRule[];
    };
    rules = urlRules;
    renderRules();
  }

  async function saveRules(): Promise<void> {
    await chrome.storage.sync.set({ urlRules: rules });
  }

  function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  function isValidRegex(pattern: string): boolean {
    try {
      new RegExp(pattern);
      return true;
    } catch (_e) {
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

  function isDuplicateRegex(regex: string, excludeId: string | null = null): boolean {
    return rules.some((r) => r.regex === regex && r.id !== excludeId);
  }

  function setFieldError(input: HTMLInputElement, errorEl: HTMLElement, message?: string): void {
    input.classList.add("error");
    if (message) {
      const span = errorEl.querySelector("span");
      if (span) span.textContent = message;
    }
    errorEl.classList.add("visible");
  }

  function clearFieldError(input: HTMLInputElement, errorEl: HTMLElement): void {
    input.classList.remove("error");
    errorEl.classList.remove("visible");
  }

  function renderRules(): void {
    if (rules.length === 0) {
      const noRulesMsg =
        chrome.i18n.getMessage("noRules") ||
        "No rules yet. Without rules, the full URL is always copied.";
      rulesList.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <div>${noRulesMsg}</div>
        </div>
      `;
      return;
    }

    const editLabel = chrome.i18n.getMessage("editRule") || "Edit";
    const deleteLabel = chrome.i18n.getMessage("deleteRule") || "Delete";
    const enabledLabel = chrome.i18n.getMessage("ruleEnabled") || "Enabled";
    const disabledLabel = chrome.i18n.getMessage("ruleDisabled") || "Disabled";

    rulesList.innerHTML = rules
      .map(
        (rule) => `
      <div class="rule-card ${rule.enabled ? "" : "disabled"}" data-id="${rule.id}">
        <div class="rule-card-header">
          <div class="rule-card-info">
            <span class="rule-domain">${escapeHtml(rule.domain)}</span>
            ${rule.label ? `<span class="rule-label-badge">${escapeHtml(rule.label)}</span>` : ""}
          </div>
          <div class="rule-card-actions">
            <label class="toggle" title="${rule.enabled ? enabledLabel : disabledLabel}">
              <input type="checkbox" ${rule.enabled ? "checked" : ""} data-toggle-id="${rule.id}" />
              <span class="toggle-slider"></span>
            </label>
            <button class="rule-action-btn" data-edit-id="${rule.id}" title="${editLabel}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="rule-action-btn delete" data-delete-id="${rule.id}" title="${deleteLabel}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
        <div class="rule-regex">${escapeHtml(rule.regex)}</div>
      </div>
    `
      )
      .join("");

    rulesList.querySelectorAll<HTMLInputElement>("[data-toggle-id]").forEach((el) => {
      el.addEventListener("change", async (e) => {
        const target = e.target as HTMLInputElement;
        const id = target.getAttribute("data-toggle-id");
        const rule = rules.find((r) => r.id === id);
        if (rule) {
          rule.enabled = target.checked;
          await saveRules();
          renderRules();
        }
      });
    });

    rulesList.querySelectorAll<HTMLButtonElement>("[data-edit-id]").forEach((el) => {
      el.addEventListener("click", () => {
        const id = el.getAttribute("data-edit-id")!;
        startEdit(id);
      });
    });

    rulesList.querySelectorAll<HTMLButtonElement>("[data-delete-id]").forEach((el) => {
      el.addEventListener("click", async () => {
        const id = el.getAttribute("data-delete-id")!;
        const deleted = rules.find((r) => r.id === id);
        rules = rules.filter((r) => r.id !== id);
        await saveRules();
        renderRules();

        const msg = chrome.i18n.getMessage("toastRuleDeleted") || "Rule deleted";
        showToast(deleted ? `${msg}: ${deleted.domain}` : msg, "deleted");
      });
    });
  }

  function startEdit(id: string): void {
    const rule = rules.find((r) => r.id === id);
    if (!rule) return;

    editingId = id;
    inputDomain.value = rule.domain;
    inputLabel.value = rule.label || "";
    inputRegex.value = rule.regex;

    formTitle.textContent = chrome.i18n.getMessage("editRule") || "Edit";
    saveBtnText.textContent = chrome.i18n.getMessage("saveRule") || "Save";
    cancelBtn.style.display = "inline-flex";

    inputDomain.focus();
  }

  function cancelEdit(): void {
    editingId = null;
    inputDomain.value = "";
    inputLabel.value = "";
    inputRegex.value = "";
    clearFieldError(inputDomain, domainError);
    clearFieldError(inputRegex, regexError);

    formTitle.textContent = chrome.i18n.getMessage("addRule") || "Add Rule";
    saveBtnText.textContent = chrome.i18n.getMessage("addRule") || "Add Rule";
    cancelBtn.style.display = "none";
  }

  saveBtn.addEventListener("click", async () => {
    const domain = inputDomain.value.trim();
    const label = inputLabel.value.trim();
    const regex = inputRegex.value.trim();

    let hasError = false;

    if (!domain) {
      const msg = chrome.i18n.getMessage("fieldRequired") || "This field is required";
      setFieldError(inputDomain, domainError, msg);
      hasError = true;
    } else if (!isValidDomain(domain)) {
      const msg =
        chrome.i18n.getMessage("domainInvalid") || "Enter a valid domain (e.g. github.com)";
      setFieldError(inputDomain, domainError, msg);
      hasError = true;
    } else {
      clearFieldError(inputDomain, domainError);
    }

    if (!regex) {
      const msg = chrome.i18n.getMessage("fieldRequired") || "This field is required";
      setFieldError(inputRegex, regexError, msg);
      hasError = true;
    } else if (!isValidRegex(regex)) {
      const msg = chrome.i18n.getMessage("regexInvalid") || "Invalid regex pattern";
      setFieldError(inputRegex, regexError, msg);
      hasError = true;
    } else if (isDuplicateRegex(regex, editingId)) {
      const msg =
        chrome.i18n.getMessage("regexDuplicate") || "This regex pattern already exists";
      setFieldError(inputRegex, regexError, msg);
      hasError = true;
    } else {
      clearFieldError(inputRegex, regexError);
    }

    if (hasError) return;

    if (editingId) {
      const rule = rules.find((r) => r.id === editingId);
      if (rule) {
        rule.domain = domain;
        rule.label = label;
        rule.regex = regex;
      }
    } else {
      rules.push({
        id: generateId(),
        domain,
        regex,
        label,
        enabled: true,
      });
    }

    const isEditing = !!editingId;
    await saveRules();
    renderRules();
    cancelEdit();

    const toastMsg = isEditing
      ? chrome.i18n.getMessage("toastRuleUpdated") || "Rule updated!"
      : chrome.i18n.getMessage("toastRuleAdded") || "Rule added!";
    showToast(toastMsg, "success");
  });

  cancelBtn.addEventListener("click", cancelEdit);

  [inputDomain, inputLabel, inputRegex].forEach((el) => {
    el.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") saveBtn.click();
    });
  });

  inputDomain.addEventListener("input", () => {
    const val = inputDomain.value.trim();
    if (!val) return;
    if (!isValidDomain(val)) {
      const msg =
        chrome.i18n.getMessage("domainInvalid") || "Enter a valid domain (e.g. github.com)";
      setFieldError(inputDomain, domainError, msg);
    } else {
      clearFieldError(inputDomain, domainError);
    }
  });

  inputRegex.addEventListener("input", () => {
    const val = inputRegex.value.trim();
    if (!val) return;
    if (!isValidRegex(val)) {
      const msg = chrome.i18n.getMessage("regexInvalid") || "Invalid regex pattern";
      setFieldError(inputRegex, regexError, msg);
    } else {
      clearFieldError(inputRegex, regexError);
    }
  });

  testUrl.addEventListener("input", () => {
    const url = testUrl.value.trim();
    if (!url) {
      testResult.classList.remove("visible");
      return;
    }

    let hostname: string;
    try {
      hostname = new URL(url).hostname;
    } catch (_e) {
      testResult.classList.remove("visible");
      return;
    }

    let matched = false;
    for (const rule of rules) {
      if (!rule.enabled) continue;
      if (!hostname.includes(rule.domain)) continue;

      try {
        const regex = new RegExp(rule.regex);
        const match = url.match(regex);
        if (match && match[1]) {
          testResultLabel.textContent =
            (chrome.i18n.getMessage("testResult") || "Result:") +
            (rule.label ? ` (${rule.label})` : "");
          testResultValue.textContent = match[1];
          testResult.className = "test-result visible match";
          matched = true;
          break;
        }
      } catch (_e) {}
    }

    if (!matched) {
      testResultLabel.textContent =
        chrome.i18n.getMessage("noMatch") || "No match — full URL will be copied";
      testResultValue.textContent = url;
      testResult.className = "test-result visible no-match";
    }
  });

  function escapeHtml(str: string): string {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  await loadRules();
});
