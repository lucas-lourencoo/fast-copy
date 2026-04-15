import { resolve } from "path";
import { renameSync, mkdirSync, rmSync, existsSync, copyFileSync } from "fs";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const targetBrowser = process.env.TARGET_BROWSER || "chrome";

function flattenHtmlPlugin(): Plugin {
  return {
    name: "flatten-html",
    closeBundle() {
      const dist = resolve(__dirname, `dist-${targetBrowser}`);
      const pages = resolve(dist, "pages");
      if (!existsSync(pages)) return;

      const entries = ["popup", "options", "welcome", "history"];
      for (const name of entries) {
        const src = resolve(pages, name, "index.html");
        const dest = resolve(dist, `${name}.html`);
        if (existsSync(src)) {
          renameSync(src, dest);
        }
      }
      rmSync(pages, { recursive: true, force: true });
    },
  };
}

function copyManifestPlugin(): Plugin {
  return {
    name: "copy-manifest",
    closeBundle() {
      const dist = resolve(__dirname, `dist-${targetBrowser}`);
      const manifestSrc = resolve(
        __dirname,
        "public",
        "manifests",
        `${targetBrowser}.json`,
      );
      const manifestDest = resolve(dist, "manifest.json");

      if (existsSync(manifestSrc)) {
        copyFileSync(manifestSrc, manifestDest);
      }

      const leakedManifests = resolve(dist, "manifests");
      if (existsSync(leakedManifests)) {
        rmSync(leakedManifests, { recursive: true, force: true });
      }
    },
  };
}

export default defineConfig({
  root: "src",
  define: {
    "import.meta.env.VITE_TARGET_BROWSER": JSON.stringify(targetBrowser),
  },
  plugins: [tailwindcss(), react(), flattenHtmlPlugin(), copyManifestPlugin()],
  build: {
    outDir: resolve(__dirname, `dist-${targetBrowser}`),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/pages/popup/index.html"),
        options: resolve(__dirname, "src/pages/options/index.html"),
        welcome: resolve(__dirname, "src/pages/welcome/index.html"),
        history: resolve(__dirname, "src/pages/history/index.html"),
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
