"use client";

import { useRef } from 'react';
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
  const inputRef = useRef<HTMLInputElement>(null);
  const containerClassName = compact
    ? 'flex items-center gap-3 rounded-lg border border-slate-200/80 bg-slate-50/90 px-3 py-2'
    : 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm';
  const openPicker = () => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    if (typeof input.showPicker === 'function') {
      input.showPicker();
    }
  };

  return (
    <div
      className={`${containerClassName} ${className}`.trim()}
    >
      {compact ? (
        <div className="whitespace-nowrap text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Market Date</div>
      ) : (
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Market Date
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="date"
          className={`cursor-pointer rounded-md font-medium outline-none focus:ring-2 focus:ring-[#10b981] ${
            compact
              ? 'min-w-[100px] border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm'
              : 'border border-slate-200 bg-transparent px-3 py-2'
          }`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          onClick={openPicker}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#10b981] focus:outline-none focus:ring-2 focus:ring-[#10b981]"
          aria-label="Open date picker"
        >
          <CalendarDays size={14} />
        </button>
      </div>
    </div>
  );
}
