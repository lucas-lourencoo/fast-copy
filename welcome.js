document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const msg = chrome.i18n.getMessage(el.dataset.i18n);
    if (msg) {
      el.textContent = msg;
    }
  });

  const demoShortcutKeys = document.getElementById("demoShortcutKeys");
  const changeShortcutWelcomeBtn = document.getElementById(
    "changeShortcutWelcomeBtn",
  );

  // Fetch actual shortcut
  if (chrome.commands && chrome.commands.getAll) {
    chrome.commands.getAll((commands) => {
      const copyCommand = commands.find((c) => c.name === "copy-url");
      if (copyCommand && copyCommand.shortcut && demoShortcutKeys) {
        const keys = copyCommand.shortcut.split("+");
        const formattedHTML = keys
          .map((key, index) => {
            let displayKey = key.trim();
            if (displayKey.toLowerCase() === "shift") {
              displayKey = "Shift";
            }

            let html = `<span class="key">${displayKey}</span>`;
            if (index < keys.length - 1) {
              html += `<span class="key-plus">+</span>`;
            }
            return html;
          })
          .join("");

        demoShortcutKeys.innerHTML = formattedHTML;
      }
    });
  }

  if (changeShortcutWelcomeBtn) {
    changeShortcutWelcomeBtn.addEventListener("click", () => {
      chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
    });
  }
});
