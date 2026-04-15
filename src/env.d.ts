/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TARGET_BROWSER: "chrome" | "firefox";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
