"use client";

interface MarketDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function MarketDatePicker({ value, onChange, className = '' }: MarketDatePickerProps) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 ${className}`.trim()}>
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        Market Date
      </div>
      <input
        type="date"
        className="cursor-pointer rounded-md border border-slate-200 bg-transparent px-3 py-2 font-medium outline-none focus:ring-2 focus:ring-[#10b981] dark:border-slate-600"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
