"use client";

import { CalendarDays } from 'lucide-react';

interface MarketDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  compact?: boolean;
}

export default function MarketDatePicker({
  value,
  onChange,
  className = '',
  compact = false,
}: MarketDatePickerProps) {
  const containerClassName = compact
    ? 'flex items-center gap-3 rounded-lg border border-slate-200/80 bg-slate-50/90 px-3 py-2'
    : 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm';

  return (
    <div
      className={`${containerClassName} ${className}`.trim()}
    >
      {compact ? (
        <div className="flex items-center gap-2 whitespace-nowrap text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          <CalendarDays size={14} className="text-[#10b981]" />
          Market Date
        </div>
      ) : (
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Market Date
        </div>
      )}
      <input
        type="date"
        className={`cursor-pointer rounded-md font-medium outline-none focus:ring-2 focus:ring-[#10b981] ${
          compact
            ? 'min-w-[150px] border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm'
            : 'border border-slate-200 bg-transparent px-3 py-2'
        }`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
