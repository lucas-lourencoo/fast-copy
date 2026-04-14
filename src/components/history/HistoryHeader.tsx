import { useChromeI18n } from "../../hooks/useChromeI18n";

interface HistoryHeaderProps {
  onClear: () => void;
  showClear: boolean;
}

export function HistoryHeader({ onClear, showClear }: HistoryHeaderProps) {
  const title = useChromeI18n("historyTitle", "Copy History");
  const clearLabel = useChromeI18n("historyClear", "Clear");

  return (
    <div className="header">
      <div className="header-left">
        <div className="header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <h1>{title}</h1>
      </div>
      {showClear && (
        <button className="clear-btn" id="clearBtn" onClick={onClear}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          <span>{clearLabel}</span>
        </button>
      )}
    </div>
  );
}
