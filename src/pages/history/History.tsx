import { useState, useEffect, useCallback } from "react";
import { browser } from "../../lib/browser-api";
import { HISTORY_KEY, type CopyHistoryEntry } from "../../lib/shared";
import { HistoryHeader } from "../../components/history/HistoryHeader";
import { HistoryItem } from "../../components/history/HistoryItem";
import { EmptyState } from "../../components/history/EmptyState";
import "../../styles/global.css";

export function History() {
  const [entries, setEntries] = useState<CopyHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    try {
      const result = await browser.storage.local.get(HISTORY_KEY);
      const history =
        (result[HISTORY_KEY] as CopyHistoryEntry[] | undefined) || [];
      setEntries(history);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleClear = useCallback(async () => {
    try {
      await browser.storage.local.set({ [HISTORY_KEY]: [] });
      setEntries([]);
    } catch {}
  }, []);

  if (loading) return null;

  return (
    <div className="w-[400px] min-h-[300px] font-['Inter',ui-sans-serif,system-ui,sans-serif] bg-[linear-gradient(145deg,#f0f0f5,#e8e8f0,#f5f5fa)] dark:bg-[linear-gradient(145deg,#0f0c29,#1a1a3e,#24243e)] text-[#1a1a2e] dark:text-[#e0e0e0] transition-[background,color] duration-300">
      <div className="p-5">
        <HistoryHeader onClear={handleClear} showClear={entries.length > 0} />
        {entries.length > 0 ? (
          <div className="flex flex-col gap-2" id="historyList">
            {entries.map((entry, index) => (
              <HistoryItem key={entry.timestamp} entry={entry} index={index} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}
