<div align="center">

# Fast Copy URL

<img src="icons/icon128.png" width="80" alt="Fast Copy URL Icon" />

**Uma extensão Chrome minimalista para copiar URLs via atalho.**

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-success.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

</div>

## 📌 O que é?

**Fast Copy URL** é uma extensão incrivelmente leve para o Google Chrome que permite copiar a URL da aba atual diretamente para sua área de transferência com um simples atalho de teclado, sem precisar clicar na barra de endereços.

Ao copiar, a extensão exibe um discreto e elegante toast de confirmação ("Link Copiado!") no topo da página.

## ✨ Funcionalidades

- **Atalho Universal:** Use `Ctrl + Shift + C` (ou `MacCtrl + Shift + C` no macOS) em qualquer aba.
- **Feedback Visual Elegante:** Exibe uma notificação flutuante e temporária confirmando a cópia.
- **Popup Rápido:** Mostra a URL atual com um botão de cópia rápido ao clicar no ícone da extensão.
- **Leve e Segura:** Construída com Manifest V3, garantindo performance e permissões estritas (apenas escuta a aba atual e acessa o clipboard localmente).

## 🚀 Como instalar (Modo Desenvolvedor)

Como a extensão ainda foca em uso local/pessoal, você pode instalá-la facilmente pelo Modo Desenvolvedor do Chrome.

1. Faça o clone deste repositório ou baixe o código-fonte:
   ```bash
   git clone https://github.com/lucaslourenco/fast-copy.git
   ```
2. Abra o Google Chrome e navegue até a página de extensões: `chrome://extensions/`
3. Ative o **Modo do Desenvolvedor** (chave seletora no canto superior direito).
4. Clique no botão **Carregar sem compactação** (ou "Load unpacked").
5. Selecione a pasta onde você clonou/baixou este repositório (`fast-copy`).
6. **Pronto!** A extensão está instalada.

## ⌨️ Como Usar

- **No Windows/Linux:** Pressione `Ctrl + Shift + C`
- **No macOS:** Pressione `Ctrl + Shift + C` (A tecla _Control_ física do Mac)

Após o uso, você verá uma notificação "Link Copiado!" no topo central da tela, e o link já estará na sua área de transferência.

Se os atalhos não estiverem funcionando porque entram em conflito com outra extensão, você pode alterar o atalho padrão do Fast Copy URL acessando `chrome://extensions/shortcuts`.

## 🛠 Tecnologias

- HTML5 / CSS3 (Design minimalista Glassmorphic)
- Vanilla JavaScript
- Chrome Extensions API (Manifest V3)

## 📄 Licença

Distribuído sob a licença MIT. Sinta-se à vontade para utilizar, modificar e distribuir o código.
