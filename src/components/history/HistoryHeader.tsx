import { useChromeI18n } from "../../hooks/useChromeI18n";

interface HistoryHeaderProps {
  onClear: () => void;
  showClear: boolean;
}

export function HistoryHeader({ onClear, showClear }: HistoryHeaderProps) {
  const title = useChromeI18n("historyTitle", "Copy History");
  const clearLabel = useChromeI18n("historyClear", "Clear");

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-[10px]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(102,126,234,0.25)]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-[18px] h-[18px] text-white"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <h1 className="text-[15px] font-bold tracking-[-0.3px] text-[#1a1a2e] dark:text-white">
          {title}
        </h1>
      </div>
      {showClear && (
        <button
          className="flex items-center gap-[5px] px-3 py-[6px] border border-red-500/25 rounded-lg bg-red-500/[0.08] text-red-500 text-xs font-medium cursor-pointer transition-all duration-200 hover:bg-red-500/[0.16] hover:border-red-500/40"
          id="clearBtn"
          onClick={onClear}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-[13px] h-[13px]"
          >
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          <span>{clearLabel}</span>
        </button>
      )}
    </div>
  );
}
