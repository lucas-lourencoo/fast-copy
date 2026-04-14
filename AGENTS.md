# AGENTS.md — Fast Copy

## Visão Geral

Extensão Chrome (Manifest V3) que copia a URL da aba ativa para o clipboard via atalho `Ctrl+⇧+U` (todas as plataformas). Inclui histórico das últimas 10 cópias acessível via `Ctrl+⇧+Y`.

## Arquitetura

```
src/
  manifest.json      → (em public/) Configuração da extensão, permissões e declarações
  background.ts      → Service worker: escuta comandos, aplica regras regex, executa cópia, gerencia histórico
  popup.html/ts      → UI do popup (exibe URL, preview do regex match, botão de cópia)
  options.html/ts    → Página de opções: CRUD de regras regex por domínio
  welcome.html/ts    → Página de boas-vindas exibida na instalação
  history.html/ts    → Página do histórico de cópias (últimas 10 URLs)
  styles/            → CSS modular por página
public/
  _locales/          → i18n (en, pt, pt_BR)
  icons/             → Ícones da extensão (16, 48, 128)
  manifest.json      → Manifest V3 copiado para dist/
dist/                → Output do build (Vite), carregado no Chrome via Load Unpacked
```

## Fluxo Principal

1. Usuário pressiona o atalho configurado (`Ctrl+Shift+U` / `Cmd+Shift+U`)
2. `background.ts` captura o `chrome.commands.onCommand`
3. Carrega regras de `chrome.storage.sync`, aplica regex no domínio correspondente
4. Executa `chrome.scripting.executeScript` na aba ativa (permissão `activeTab`)
5. Copia a URL (ou trecho extraído) para o clipboard e exibe toast de confirmação
6. Salva a entrada no histórico (`chrome.storage.local`, máximo 10 itens)

## Fluxo do Histórico

1. Usuário pressiona `Ctrl+Shift+Y` / `Cmd+Shift+Y`
2. `background.ts` abre uma janela popup via `chrome.windows.create`
3. `history.ts` carrega as entradas de `chrome.storage.local` e renderiza a lista
4. Cada item pode ser re-copiado individualmente; botão "Limpar" apaga o histórico

## Convenções

- **TypeScript** compilado por **Vite** (output em `dist/`)
- Build: `npm run build` — Typecheck: `npm run typecheck` — Dev watch: `npm run dev`
- Strings de UI via `chrome.i18n` (chaves em `public/_locales/`)
- Apenas devDependencies (vite, typescript, @types/chrome); sem dependências de runtime
- **Sem comentários no código** — o código deve ser autoexplicativo; comentários inline e de bloco não devem ser adicionados
- **Versionamento obrigatório** — toda alteração de feature deve incluir o bump de `version` em `manifest.json` **e** `package.json` (seguindo SemVer: patch para correções, minor para novas features, major para breaking changes)
- Licença MIT

## Pontos de Atenção

- Permissões mínimas: `activeTab`, `clipboardWrite`, `scripting`, `storage`
- O atalho global não requer `<all_urls>`, facilitando o processo de revisão na Chrome Web Store
- O diretório `dist/` é o que deve ser carregado no Chrome (`Load Unpacked`)
- **i18n obrigatório** — toda string visível ao usuário usa `chrome.i18n.getMessage()`. Os fallbacks no código só servem para debug; o texto real vem de `public/_locales/{en,pt,pt_BR}/messages.json`. Ao alterar qualquer texto de UI, **sempre atualizar os 3 arquivos de locale**, não apenas o fallback no código
