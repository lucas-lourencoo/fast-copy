# AGENTS.md — Fast Copy

## Visão Geral

Extensão cross-browser (Chrome + Firefox, Manifest V3) que copia a URL da aba ativa para o clipboard via atalho `Ctrl+⇧+U` (todas as plataformas). Inclui histórico das últimas 10 cópias acessível via `Ctrl+⇧+Y`.

## Arquitetura

```
src/
  browser-api.ts     → Camada de abstração: exporta `browser` via webextension-polyfill
  background.ts      → Service worker: escuta comandos, aplica regras regex, executa cópia, gerencia histórico
  popup.html/ts      → UI do popup (exibe URL, preview do regex match, botão de cópia)
  options.html/ts    → Página de opções: CRUD de regras regex por domínio
  welcome.html/ts    → Página de boas-vindas exibida na instalação
  history.html/ts    → Página do histórico de cópias (últimas 10 URLs)
  styles/            → CSS modular por página
public/
  _locales/          → i18n (en, pt, pt_BR)
  icons/             → Ícones da extensão (16, 48, 128)
  manifests/
    chrome.json      → Manifest V3 específico para Chrome (service_worker)
    firefox.json     → Manifest V3 específico para Firefox (scripts, browser_specific_settings)
dist-chrome/         → Output do build Chrome (Vite)
dist-firefox/        → Output do build Firefox (Vite)
```

## Fluxo Principal

1. Usuário pressiona o atalho configurado (`Ctrl+Shift+U` / `Cmd+Shift+U`)
2. `background.ts` captura o `browser.commands.onCommand` (via polyfill)
3. Carrega regras de `browser.storage.sync`, aplica regex no domínio correspondente
4. Executa `browser.scripting.executeScript` na aba ativa (permissão `activeTab`)
5. Copia a URL (ou trecho extraído) para o clipboard e exibe toast de confirmação
6. Salva a entrada no histórico (`browser.storage.local`, máximo 10 itens)

## Fluxo do Histórico

1. Usuário pressiona `Ctrl+Shift+Y` / `Cmd+Shift+Y`
2. `background.ts` injeta overlay via `browser.scripting.executeScript`
3. O overlay carrega as entradas de `browser.storage.local` e renderiza a lista
4. Cada item pode ser re-copiado individualmente; botão "Limpar" apaga o histórico

## Convenções

- **TypeScript** + **React** compilado por **Vite**
- Cross-browser via `webextension-polyfill` — todas as chamadas usam `browser.*` (nunca `chrome.*` diretamente)
- Build: `npm run build:chrome` / `npm run build:firefox` — Typecheck: `npm run typecheck` — Dev watch: `npm run dev`
- Variável de ambiente `TARGET_BROWSER` (chrome | firefox) controla o build; `vite.config.ts` copia o manifest correto de `public/manifests/`
- Strings de UI via `browser.i18n` (chaves em `public/_locales/`)
- devDependencies: vite, typescript, @types/chrome, webextension-polyfill, cross-env; sem dependências de runtime além do polyfill
- **Sem comentários no código** — o código deve ser autoexplicativo; comentários inline e de bloco não devem ser adicionados
- **Versionamento obrigatório** — toda alteração de feature deve incluir o bump de `version` nos manifests (`public/manifests/chrome.json`, `public/manifests/firefox.json`) **e** `package.json` (seguindo SemVer: patch para correções, minor para novas features, major para breaking changes)
- Licença MIT

## Pontos de Atenção

- Permissões mínimas: `activeTab`, `clipboardWrite`, `scripting`, `storage`
- O atalho global não requer `<all_urls>`, facilitando o processo de revisão nas lojas
- `dist-chrome/` para Chrome (`Load Unpacked`) e `dist-firefox/` para Firefox (`Load Temporary Add-on`)
- **i18n obrigatório** — toda string visível ao usuário usa `browser.i18n.getMessage()`. Os fallbacks no código só servem para debug; o texto real vem de `public/_locales/{en,pt,pt_BR}/messages.json`. Ao alterar qualquer texto de UI, **sempre atualizar os 3 arquivos de locale**, não apenas o fallback no código
- **Firefox:** o `gecko.id` (`fast-copy@lucaslourencoo`) em `public/manifests/firefox.json` deve corresponder ao registrado no AMO
- **Firefox:** `data_collection_permissions` em `browser_specific_settings.gecko` usa `{ "required": ["none"] }` para extensões sem coleta de dados
