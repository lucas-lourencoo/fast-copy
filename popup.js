document.addEventListener("DOMContentLoaded", async () => {
  const urlText = document.getElementById("currentUrl");
  const copyBtn = document.getElementById("copyBtn");
  const copyBtnText = document.getElementById("copyText");
  const copyIcon = document.getElementById("copyIcon");

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab?.url) {
      urlText.textContent = tab.url;
    } else {
      urlText.textContent = "URL não disponível";
    }
  } catch (err) {
    urlText.textContent = "Erro ao obter URL";
  }

  copyBtn.addEventListener("click", async () => {
    const url = urlText.textContent;

    if (!url || url === "URL não disponível" || url === "Erro ao obter URL")
      return;

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
    copyBtnText.textContent = "Copiado!";
    copyIcon.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';

    setTimeout(() => {
      copyBtn.classList.remove("copied");
      copyBtnText.textContent = "Copiar URL";
      copyIcon.innerHTML = `
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      `;
    }, 2000);
  }
});
