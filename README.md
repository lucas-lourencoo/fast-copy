<div align="center">

# Fast Copy

<img src="public/icons/icon128.png" width="80" alt="Fast Copy Icon" />

**A minimalist Chrome extension to copy URLs via keyboard shortcut.**

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Install-4285F4?logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/bbbgfepehfgaopbfeccedcmcfijofbfn)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-success.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

</div>

## 📌 What is it?

**Fast Copy** is an incredibly lightweight Chrome extension that lets you copy the current tab's URL directly to your clipboard with a simple keyboard shortcut — no need to click the address bar.

When you copy, the extension displays a sleek toast notification ("Link Copied!") at the top of the page.

## ✨ Features

- **Copy Shortcut:** Use `Ctrl+Shift+U` (or `Cmd+Shift+U` on macOS) on any tab to instantly copy the URL.
- **Copy History:** Press `Ctrl+Shift+Y` (or `Cmd+Shift+Y` on macOS) to open an overlay with your last 10 copied URLs. Navigate with `↑↓` keys, press `Enter` to re-copy and paste-in-place.
- **URL Rules (Regex):** Define per-domain regex patterns to extract specific parts of URLs (e.g., copy only `user/repo` from GitHub).
- **Visual Feedback:** Displays a floating, temporary toast confirming each copy.
- **Quick Popup:** Click the extension icon to see the current URL with a one-click copy button.
- **Lightweight & Secure:** Built with Manifest V3 — minimal permissions (`activeTab`, `clipboardWrite`, `scripting`, `storage`).
- **i18n:** Fully localized in English, Portuguese (PT), and Brazilian Portuguese (PT-BR).

## 🚀 Installation

### Chrome Web Store (Recommended)

Install directly from the [Chrome Web Store](https://chromewebstore.google.com/detail/bbbgfepehfgaopbfeccedcmcfijofbfn).

### Developer Mode

1. Clone this repository:
   ```bash
   git clone https://github.com/lucas-lourencoo/fast-copy.git
   cd fast-copy
   ```
2. Install dependencies and build:
   ```bash
   npm install
   npm run build
   ```
3. Open `chrome://extensions/`
4. Enable **Developer Mode** (top right corner).
5. Click **Load unpacked** and select the `dist/` folder.

## ⌨️ How to Use

### Copy URL

- **Windows/Linux:** `Ctrl + Shift + U`
- **macOS:** `Cmd + Shift + U`

A "Link Copied!" toast appears at the top of the page and the link is in your clipboard.

### Copy History

- **Windows/Linux:** `Ctrl + Shift + Y`
- **macOS:** `Cmd + Shift + Y`

Opens a floating overlay on the current page showing your last 10 copied URLs. Use `↑↓` to navigate, `Enter` to select and paste, or `Esc` to close. If you were typing in an input field, the selected URL is automatically pasted at the cursor position.

### URL Rules (Regex)

You can define rules to copy only a specific part of the URL, matched by domain + regex:

1. Click the ⚙️ icon in the popup (or access options via `chrome://extensions`)
2. Add a rule with a domain (e.g., `github.com`) and a regex pattern with a capture group (e.g., `github\.com\/([^\/]+\/[^\/]+)`)
3. When you copy a matching URL, only the first capture group is copied

If shortcuts conflict with another extension, customize them at `chrome://extensions/shortcuts`.

## 🛠 Tech Stack

- **TypeScript** compiled by **Vite** (output in `dist/`)
- Chrome Extensions API (Manifest V3)
- Glassmorphic CSS design
- `chrome.i18n` for localization (`public/_locales/`)

### Development

```bash
npm run dev        # Watch mode (auto-rebuild on change)
npm run build      # Production build (typecheck + bundle)
npm run typecheck  # TypeScript type checking only
```

## 🔒 Privacy

**Fast Copy** respects your privacy and operates 100% locally. For details, read our [Privacy Policy](PRIVACY.md).

## 📄 License

Distributed under the MIT License. Feel free to use, modify, and distribute the code.
