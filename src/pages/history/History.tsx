import { useState, useEffect, useCallback } from "react";
import { HISTORY_KEY, type CopyHistoryEntry } from "../../shared";
import { useTheme } from "../../hooks/useTheme";
import { HistoryHeader } from "../../components/history/HistoryHeader";
import { HistoryItem } from "../../components/history/HistoryItem";
import { EmptyState } from "../../components/history/EmptyState";
import "../../styles/history.css";

export function History() {
  useTheme();
  const [entries, setEntries] = useState<CopyHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    if (typeof chrome === "undefined" || !chrome.storage) {
      setLoading(false);
      return;
    }
    const result = await chrome.storage.local.get(HISTORY_KEY);
    const history = (result[HISTORY_KEY] as CopyHistoryEntry[] | undefined) || [];
    setEntries(history);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleClear = useCallback(async () => {
    if (typeof chrome === "undefined" || !chrome.storage) return;
    await chrome.storage.local.set({ [HISTORY_KEY]: [] });
    setEntries([]);
  }, []);

  if (loading) return null;

  return (
    <div className="container">
      <HistoryHeader onClear={handleClear} showClear={entries.length > 0} />
      {entries.length > 0 ? (
        <div className="history-list" id="historyList">
          {entries.map((entry, index) => (
            <HistoryItem key={entry.timestamp} entry={entry} index={index} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
