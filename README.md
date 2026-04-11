<div align="center">

# Fast Copy

<img src="icons/icon128.png" width="80" alt="Fast Copy Icon" />

**Uma extensão Chrome minimalista para copiar URLs via atalho.**

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Install-4285F4?logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/bbbgfepehfgaopbfeccedcmcfijofbfn)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-success.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

</div>

## 📌 O que é?

**Fast Copy** é uma extensão incrivelmente leve para o Google Chrome que permite copiar a URL da aba atual diretamente para sua área de transferência com um simples atalho de teclado, sem precisar clicar na barra de endereços.

Ao copiar, a extensão exibe um discreto e elegante toast de confirmação ("Link Copiado!") no topo da página.

## ✨ Funcionalidades

- **Atalho Universal:** Use `Ctrl + Shift + C` (ou `MacCtrl + Shift + C` no macOS) em qualquer aba.
- **Feedback Visual Elegante:** Exibe uma notificação flutuante e temporária confirmando a cópia.
- **Popup Rápido:** Mostra a URL atual com um botão de cópia rápido ao clicar no ícone da extensão.
- **Leve e Segura:** Construída com Manifest V3, garantindo performance e permissões estritas (apenas escuta a aba atual e acessa o clipboard localmente).

## 🚀 Como instalar

### Chrome Web Store (Recomendado)

Instale diretamente pela [Chrome Web Store](https://chromewebstore.google.com/detail/bbbgfepehfgaopbfeccedcmcfijofbfn).

### Modo Desenvolvedor

1. Clone este repositório:
   ```bash
   git clone https://github.com/lucaslourenco/fast-copy.git
   ```
2. Abra `chrome://extensions/`
3. Ative o **Modo do Desenvolvedor** (canto superior direito).
4. Clique em **Carregar sem compactação** e selecione a pasta `fast-copy`.

## ⌨️ Como Usar

- **No Windows/Linux:** Pressione `Ctrl + Shift + C`
- **No macOS:** Pressione `Ctrl + Shift + C` (A tecla _Control_ física do Mac)

Após o uso, você verá uma notificação "Link Copiado!" no topo central da tela, e o link já estará na sua área de transferência.

Se os atalhos não estiverem funcionando porque entram em conflito com outra extensão, você pode alterar o atalho padrão do Fast Copy acessando `chrome://extensions/shortcuts`.

## 🛠 Tecnologias

- HTML5 / CSS3 (Design minimalista Glassmorphic)
- Vanilla JavaScript
- Chrome Extensions API (Manifest V3)

## 🔒 Privacidade

O **Fast Copy** respeita sua privacidade e opera de forma 100% local. Para mais detalhes, leia nossa [Política de Privacidade](PRIVACY.md).

## 📄 Licença

Distribuído sob a licença MIT. Sinta-se à vontade para utilizar, modificar e distribuir o código.
