"use client";

const MONTHS = [
  { value: 1, label: "Jan" },
  { value: 2, label: "Feb" },
  { value: 3, label: "Mar" },
  { value: 4, label: "Apr" },
  { value: 5, label: "May" },
  { value: 6, label: "Jun" },
  { value: 7, label: "Jul" },
  { value: 8, label: "Aug" },
  { value: 9, label: "Sep" },
  { value: 10, label: "Oct" },
  { value: 11, label: "Nov" },
  { value: 12, label: "Dec" },
];

const selectClass =
  "rounded-lg border border-on-surface-variant/20 bg-surface-container-lowest px-2 py-1 font-mono text-sm text-on-surface focus:outline-none focus:border-on-surface-variant/40 appearance-none cursor-pointer";

interface NetworthMonthSelectorProps {
  month: number;
  year: number;
  availableYears: number[];
  currentMonth: number;
  currentYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}

export function NetworthMonthSelector({
  month,
  year,
  availableYears,
  currentMonth,
  currentYear,
  onMonthChange,
  onYearChange,
}: NetworthMonthSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <select
        value={month}
        onChange={(e) => onMonthChange(Number(e.target.value))}
        className={selectClass}
      >
        {MONTHS.map((m) => (
          <option
            key={m.value}
            value={m.value}
            disabled={year === currentYear && m.value > currentMonth}
          >
            {m.label}
          </option>
        ))}
      </select>
      <select
        value={year}
        onChange={(e) => onYearChange(Number(e.target.value))}
        className={selectClass}
      >
        {availableYears.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
