document.addEventListener("DOMContentLoaded", async () => {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const msg = chrome.i18n.getMessage(el.dataset.i18n);
    if (msg) el.textContent = msg;
  });

  const urlText = document.getElementById("currentUrl");
  const copyBtn = document.getElementById("copyBtn");
  const copyBtnText = document.getElementById("copyText");
  const copyIcon = document.getElementById("copyIcon");

  const msgUnavailable = chrome.i18n.getMessage("popupUrlUnavailable");
  const msgError = chrome.i18n.getMessage("popupUrlError");
  const msgCopyBtn = chrome.i18n.getMessage("popupCopyBtn");
  const msgCopied = chrome.i18n.getMessage("popupCopied");

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab?.url) {
      urlText.textContent = tab.url;
    } else {
      urlText.textContent = msgUnavailable;
    }
  } catch (err) {
    urlText.textContent = msgError;
  }

  copyBtn.addEventListener("click", async () => {
    const url = urlText.textContent;

    if (!url || url === msgUnavailable || url === msgError) return;

    try {
      await navigator.clipboard.writeText(url);
      showCopiedState();
    } catch (err) {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      showCopiedState();
    }
  });

  function showCopiedState() {
    copyBtn.classList.add("copied");
    copyBtnText.textContent = msgCopied;
    copyIcon.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';

    setTimeout(() => {
      copyBtn.classList.remove("copied");
      copyBtnText.textContent = msgCopyBtn;
      copyIcon.innerHTML = `
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      `;
    }, 2000);
  }
});
