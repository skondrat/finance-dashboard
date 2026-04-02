"use client";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface MonthNavigatorProps {
  year: number;
  month: number; // 1-12
  onPrev: () => void;
  onNext: () => void;
  isNextDisabled: boolean;
}

export function MonthNavigator({
  year,
  month,
  onPrev,
  onNext,
  isNextDisabled,
}: MonthNavigatorProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onPrev}
        className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container-high transition-colors"
        aria-label="Previous month"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <span className="font-mono text-sm text-on-surface min-w-[140px] text-center">
        {MONTH_NAMES[month - 1]} {year}
      </span>

      <button
        onClick={onNext}
        disabled={isNextDisabled}
        className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-30 disabled:pointer-events-none"
        aria-label="Next month"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}
