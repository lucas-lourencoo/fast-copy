# AGENTS.md — Fast Copy URL

## Visão Geral

Extensão Chrome (Manifest V3) que copia a URL da aba ativa para o clipboard via atalho `⌘+⇧+C` (Mac) / `Ctrl+⇧+C` (Win/Linux), substituindo o atalho nativo do DevTools.

## Arquitetura

```
manifest.json      → Configuração da extensão, permissões e declarações
background.js      → Service worker: escuta comandos e mensagens, executa cópia
content.js         → Injected em todas as páginas: intercepta o atalho nativo e envia mensagem ao background
popup.html/js      → UI do popup (exibe URL, botão de cópia, atalho configurado)
welcome.html/js    → Página de boas-vindas exibida na instalação
_locales/          → i18n (en, pt, pt_BR)
icons/             → Ícones da extensão (16, 48, 128)
```

## Fluxo Principal

1. `content.js` intercepta `keydown` na capture phase → bloqueia DevTools
2. Envia `{ action: "copy-url" }` via `chrome.runtime.sendMessage`
3. `background.js` recebe a mensagem → executa `chrome.scripting.executeScript` na aba ativa
4. Copia a URL para o clipboard e exibe toast de confirmação

## Convenções

- **Vanilla JS** puro, sem bundler nem frameworks
- Strings de UI via `chrome.i18n` (chaves em `_locales/`)
- Sem dependências externas
- Licença MIT

## Pontos de Atenção

- `content.js` **não roda** em páginas `chrome://` — nessas, o `chrome.commands` do manifest assume
- O atalho pode ser alterado pelo usuário em `chrome://extensions/shortcuts`
- Permissões mínimas: `activeTab`, `clipboardWrite`, `scripting`
