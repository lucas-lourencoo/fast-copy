# AGENTS.md — Fast Copy

## Visão Geral

Extensão Chrome (Manifest V3) que copia a URL da aba ativa para o clipboard via atalho `Ctrl+⇧+C` (todas as plataformas).

## Arquitetura

```
manifest.json      → Configuração da extensão, permissões e declarações
background.js      → Service worker: escuta comandos, executa cópia
popup.html/js      → UI do popup (exibe URL, botão de cópia, atalho configurado)
welcome.html/js    → Página de boas-vindas exibida na instalação
_locales/          → i18n (en, pt, pt_BR)
icons/             → Ícones da extensão (16, 48, 128)
```

## Fluxo Principal

1. Usuário pressiona o atalho configurado
2. `background.js` captura o `chrome.commands.onCommand`
3. Executa `chrome.scripting.executeScript` na aba ativa (permissão `activeTab`)
4. Copia a URL para o clipboard e exibe toast de confirmação

## Convenções

- **Vanilla JS** puro, sem bundler nem frameworks
- Strings de UI via `chrome.i18n` (chaves em `_locales/`)
- Sem dependências externas
- Licença MIT

## Pontos de Atenção

- Permissões mínimas: `activeTab`, `clipboardWrite`, `scripting`, `storage`
- O atalho global não requer `<all_urls>`, facilitando o processo de revisão na Chrome Web Store
