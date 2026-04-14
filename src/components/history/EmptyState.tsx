import { useChromeI18n } from "../../hooks/useChromeI18n";

export function EmptyState() {
  const msg = useChromeI18n(
    "historyEmpty",
    "No copies yet. Use the shortcut to copy a URL and it will appear here.",
  );

  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-5 text-center gap-3 text-[#8b8ba3] dark:text-[#5a5a7a]"
      id="emptyState"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-10 h-10 stroke-[1.2] opacity-50"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
      </svg>
      <p className="text-[13px] leading-[1.5] max-w-[240px]">{msg}</p>
    </div>
  );
}
