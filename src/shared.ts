export const HISTORY_KEY = "copyHistory";
export const HISTORY_MAX = 10;

export interface CopyHistoryEntry {
  url: string;
  copiedText: string;
  isPartial: boolean;
  timestamp: number;
}

export interface UrlRule {
  id: string;
  domain: string;
  regex: string;
  label?: string;
  enabled: boolean;
}

export interface UrlRuleResult {
  text: string;
  isPartial: boolean;
  label?: string;
}

export async function applyUrlRules(url: string): Promise<UrlRuleResult> {
  try {
    const { urlRules = [] } = (await chrome.storage.sync.get("urlRules")) as {
      urlRules: UrlRule[];
    };
    if (!urlRules.length) return { text: url, isPartial: false };

    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    for (const rule of urlRules) {
      if (!rule.enabled) continue;
      if (!hostname.includes(rule.domain)) continue;

      try {
        const regex = new RegExp(rule.regex);
        const match = url.match(regex);
        if (match && match[1]) {
          return { text: match[1], isPartial: true, label: rule.label };
        }
      } catch (_e) {
        console.warn("Fast Copy: Invalid regex in rule:", rule.label, _e);
      }
    }

    return { text: url, isPartial: false };
  } catch (e) {
    console.error("Fast Copy: Error applying URL rules:", e);
    return { text: url, isPartial: false };
  }
}
