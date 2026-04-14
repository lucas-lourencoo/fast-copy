import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  root: "src",
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup.html"),
        options: resolve(__dirname, "src/options.html"),
        welcome: resolve(__dirname, "src/welcome.html"),
        history: resolve(__dirname, "src/history.html"),
        background: resolve(__dirname, "src/background.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
  publicDir: resolve(__dirname, "public"),
});
