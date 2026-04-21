"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getMarketGoalsWithProgress,
  getMetricLabel,
  getMetricShortLabel,
  isAttendancePercentMetric,
  type MarketGoalProgress,
} from "@/lib/api/marketGoals";
import {
  REPORT_NUM_INTRO_MS,
  SmoothCurrencyValue,
  SmoothPercentValue,
  usePrefersReducedMotion,
} from "@/lib/smoothNumbers";

/** Shared reset key so intro count-up runs when the widget data first resolves (matches dashboard stats). */
const GOAL_WIDGET_RESET_KEY = "dashboard-market-goals-widget";

/**
 * Fills from 0% after mount so CSS can animate width (same timing as SmoothCurrencyValue intro).
 */
function AnimatedGoalBar({ pct, over }: { pct: number; over: boolean }) {
  const [widthPct, setWidthPct] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  const target = Math.min(100, pct);

  useEffect(() => {
    let cancelled = false;
    // Two frames: first paints 0%, second commits target so `width` transition runs.
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) {
          setWidthPct(target);
        }
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [target]);

  const durationMs = reducedMotion ? 0 : REPORT_NUM_INTRO_MS;

  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full ${over ? "bg-[#10b981]" : "bg-[#10b981]/90"}`}
        style={{
          width: `${widthPct}%`,
          transition: `width ${durationMs}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
        }}
      />
    </div>
  );
}

function MarketGoalRow({ g }: { g: MarketGoalProgress }) {
  const pct = Math.min(100, g.percentTowardGoal);
  const over = g.percentTowardGoal > 100;
  const isAttendancePct = isAttendancePercentMetric(g.metric);

  return (
    <li className="min-w-0">
      <div className="mb-1 flex min-[400px]:flex-row min-[400px]:items-baseline min-[400px]:justify-between min-[400px]:gap-3 flex-col gap-1">
        <span className="min-w-0 font-semibold break-words text-slate-900">{g.name}</span>
        <span className="shrink-0 text-xs text-slate-500 tabular-nums">
          {g.startDate} → {g.endDate}
        </span>
      </div>
      <p
        className="mb-2 max-w-full text-xs leading-snug break-words text-slate-500"
        title={getMetricLabel(g.metric)}
      >
        {getMetricShortLabel(g.metric)}
      </p>
      <AnimatedGoalBar pct={pct} over={over} />
      <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-slate-700 min-[380px]:grid-cols-[minmax(0,1fr)_auto] min-[380px]:items-baseline min-[380px]:gap-x-4">
        <div className="min-w-0">
          {isAttendancePct ? (
            <>
              <SmoothPercentValue
                value={g.currentValue}
                resetKey={GOAL_WIDGET_RESET_KEY}
                decimals={1}
                className="font-semibold tabular-nums"
              />
              <span className="text-slate-500"> / </span>
              <SmoothPercentValue
                value={g.targetValue}
                resetKey={GOAL_WIDGET_RESET_KEY}
                decimals={1}
                className="tabular-nums"
              />
            </>
          ) : (
            <>
              <SmoothCurrencyValue
                value={g.currentValue}
                resetKey={GOAL_WIDGET_RESET_KEY}
                className="font-semibold tabular-nums inline"
              />
              <span className="text-slate-500"> / </span>
              <SmoothCurrencyValue
                value={g.targetValue}
                resetKey={GOAL_WIDGET_RESET_KEY}
                className="tabular-nums inline"
              />
            </>
          )}
        </div>
        <div
          className={`font-semibold whitespace-normal min-[380px]:whitespace-nowrap min-[380px]:text-right tabular-nums ${
            over ? "text-[#10b981]" : "text-slate-600"
          }`}
        >
          <SmoothPercentValue
            value={g.percentTowardGoal}
            resetKey={GOAL_WIDGET_RESET_KEY}
            decimals={1}
            className="font-semibold"
          />
          {over ? " (target met)" : ""}
        </div>
      </div>
    </li>
  );
}

export default function MarketGoalsWidget() {
  const [goals, setGoals] = useState<MarketGoalProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await getMarketGoalsWithProgress();
        if (!cancelled) {
          setGoals(list.slice(0, 5));
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError("Could not load market goals.");
          setGoals([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow duration-300 animate-slide-up hover-lift">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Market goals</h3>
          <p className="mt-0.5 text-sm text-slate-600">
            Progress toward targets you define for any date range (from vendor transactions).
          </p>
        </div>
        <Link
          href="/goals"
          className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[#10b981] hover:text-[#059669]"
        >
          <span className="material-icons text-lg leading-none">flag</span>
          Set goals
        </Link>
      </div>
      <div className="p-6">
        {loading && (
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <span className="material-icons animate-spin text-lg leading-none">progress_activity</span>
            Loading goals…
          </p>
        )}
        {error && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{error}</p>
        )}
        {!loading && !error && goals.length === 0 && (
          <p className="text-sm text-slate-600">
            No goals yet.{" "}
            <Link href="/goals" className="font-semibold text-[#10b981] hover:underline">
              Create a goal
            </Link>{" "}
            with a date range and target.
          </p>
        )}
        {!loading && goals.length > 0 && (
          <ul className="animate-stagger space-y-5">
            {goals.map((g) => (
              <MarketGoalRow key={g.id} g={g} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
