import { useChromeI18n } from "../../hooks/useChromeI18n";

export function EmptyState() {
  const msg = useChromeI18n(
    "historyEmpty",
    "No copies yet. Use the shortcut to copy a URL and it will appear here.",
  );

  return (
    <div className="empty-state" id="emptyState">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
      </svg>
      <p>{msg}</p>
    </div>
  );
}
