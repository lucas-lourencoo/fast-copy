document.addEventListener("DOMContentLoaded", () => {
  const hasChromeI18n = typeof chrome !== "undefined" && chrome.i18n;

  if (hasChromeI18n) {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const msg = chrome.i18n.getMessage(el.dataset.i18n);
      if (msg) el.textContent = msg;
    });
  }

  const TOTAL_STEPS = 4;
  let currentStep = 0;
  let ruleSaved = false;

  const screens = document.querySelectorAll(".step-screen");
  const progressSteps = document.querySelectorAll(".progress-step");
  const btnBack = document.getElementById("btnBack");
  const btnNext = document.getElementById("btnNext");
  const stepIndicator = document.getElementById("stepIndicator");

  function updateUI() {
    screens.forEach((s, i) => s.classList.toggle("active", i === currentStep));

    progressSteps.forEach((s, i) => {
      s.classList.remove("active", "done");
      if (i < currentStep) s.classList.add("done");
      if (i === currentStep) s.classList.add("active");
    });

    btnBack.disabled = currentStep === 0;
    btnNext.disabled = currentStep === TOTAL_STEPS - 1;
    stepIndicator.textContent = `${currentStep + 1} / ${TOTAL_STEPS}`;

    if (currentStep === TOTAL_STEPS - 1) {
      btnNext.style.display = "none";
    } else {
      btnNext.style.display = "";
    }
  }

  btnBack.addEventListener("click", () => {
    if (currentStep > 0) {
      currentStep--;
      updateUI();
    }
  });

  btnNext.addEventListener("click", () => {
    if (currentStep < TOTAL_STEPS - 1) {
      currentStep++;
      updateUI();
    }
  });

  const skipRuleBtn = document.getElementById("skipRuleBtn");
  if (skipRuleBtn) {
    skipRuleBtn.addEventListener("click", () => {
      currentStep++;
      updateUI();
    });
  }

  const demoShortcutKeys = document.getElementById("demoShortcutKeys");
  if (typeof chrome !== "undefined" && chrome.commands && chrome.commands.getAll) {
    chrome.commands.getAll((commands) => {
      const copyCommand = commands.find((c) => c.name === "copy-url");
      if (copyCommand && copyCommand.shortcut && demoShortcutKeys) {
        const keys = copyCommand.shortcut.split("+");
        demoShortcutKeys.innerHTML = keys
          .map((key, index) => {
            let displayKey = key.trim();
            if (displayKey.toLowerCase() === "shift") displayKey = "Shift";
            let html = `<span class="key">${displayKey}</span>`;
            if (index < keys.length - 1) html += `<span class="key-plus">+</span>`;
            return html;
          })
          .join("");
      }
    });
  }

  const changeShortcutBtn = document.getElementById("changeShortcutWelcomeBtn");
  if (changeShortcutBtn) {
    changeShortcutBtn.addEventListener("click", () => {
      if (typeof chrome !== "undefined" && chrome.tabs) {
        chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
      }
    });
  }

  const quickDomain = document.getElementById("quickDomain");
  const quickRegex = document.getElementById("quickRegex");
  const quickDomainError = document.getElementById("quickDomainError");
  const quickRegexError = document.getElementById("quickRegexError");
  const saveQuickRuleBtn = document.getElementById("saveQuickRuleBtn");
  const ruleSavedMsg = document.getElementById("ruleSavedMsg");

  function isDomainValid(val) {
    return /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$/.test(val.trim());
  }

  function isRegexValid(val) {
    try {
      new RegExp(val.trim());
      return val.trim().length > 0;
    } catch {
      return false;
    }
  }

  if (saveQuickRuleBtn) {
    saveQuickRuleBtn.addEventListener("click", () => {
      if (ruleSaved) {
        currentStep++;
        updateUI();
        return;
      }

      const domainVal = quickDomain.value.trim();
      const regexVal = quickRegex.value.trim();
      let valid = true;

      quickDomainError.classList.remove("visible");
      quickRegexError.classList.remove("visible");
      quickDomain.classList.remove("error");
      quickRegex.classList.remove("error");

      if (!domainVal || !isDomainValid(domainVal)) {
        quickDomainError.classList.add("visible");
        quickDomain.classList.add("error");
        valid = false;
      }

      if (!regexVal || !isRegexValid(regexVal)) {
        quickRegexError.classList.add("visible");
        quickRegex.classList.add("error");
        valid = false;
      }

      if (!valid) return;

      if (typeof chrome === "undefined" || !chrome.storage) {
        currentStep++;
        updateUI();
        return;
      }

      chrome.storage.sync.get(["urlRules"], (result) => {
        const rules = result.urlRules || [];
        rules.push({
          id: Date.now().toString(),
          domain: domainVal,
          regex: regexVal,
          label: "",
          enabled: true,
        });
        chrome.storage.sync.set({ urlRules: rules }, () => {
          ruleSaved = true;
          ruleSavedMsg.classList.add("visible");
          saveQuickRuleBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px">
              <path d="m9 18 6-6-6-6"></path>
            </svg>
          `;
          const nextLabel = chrome.i18n.getMessage("onboardNext") || "Next";
          saveQuickRuleBtn.innerHTML = `<span>${nextLabel}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="m9 18 6-6-6-6"></path></svg>`;
          setTimeout(() => {
            currentStep++;
            updateUI();
          }, 1200);
        });
      });
    });
  }

  updateUI();
});
