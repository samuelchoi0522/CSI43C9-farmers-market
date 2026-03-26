"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * How long values ease when the target changes but the reset key does not (e.g. scrubbing a chart).
 */
export const TREND_REPORTED_SMOOTH_MS = 500;

/** First paint after mount only: count from 0 → value (ms). */
export const REPORT_NUM_INTRO_MS = 1000;

/**
 * Multiplier on the logarithmic ease curve. At 1 the curve is subtle; higher exaggerates fast-then-slow.
 */
export const LOG_EASE_EXAGGERATION = 1;

export function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

function easeLogarithmicOut(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const k = (Math.E - 1) * LOG_EASE_EXAGGERATION;
  return Math.log(1 + k * t) / Math.log(1 + k);
}

/**
 * Ease-out toward `target`. When `resetKey` changes, snap. On first mount for this hook instance, ease from 0.
 */
export function useSmoothNumber(
  target: number,
  resetKey: unknown,
  durationMs: number,
  introDurationMs: number,
) {
  const [display, setDisplay] = useState(0);
  const displayRef = useRef(0);
  const rafRef = useRef(0);
  const lastResetKeyRef = useRef<unknown>(undefined);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;

    const prevKey = lastResetKeyRef.current;
    const keyJustInitialized = prevKey === undefined;
    const keyChanged = !keyJustInitialized && prevKey !== resetKey;

    if (keyChanged) {
      lastResetKeyRef.current = resetKey;
      displayRef.current = target;
      queueMicrotask(() => setDisplay(target));
      return;
    }

    if (keyJustInitialized) {
      lastResetKeyRef.current = resetKey;
    }

    const introPass = keyJustInitialized;
    const dur = reducedMotion ? 0 : introPass ? introDurationMs : durationMs;
    const from = introPass ? 0 : displayRef.current;
    const to = target;

    if (dur <= 0 || Math.abs(to - from) < 0.0001) {
      displayRef.current = to;
      queueMicrotask(() => setDisplay(to));
      return;
    }

    const start = performance.now();

    const tick = () => {
      const elapsed = performance.now() - start;
      const t = Math.min(1, elapsed / dur);
      const eased = easeLogarithmicOut(t);
      const next = from + (to - from) * eased;
      displayRef.current = next;
      setDisplay(next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        displayRef.current = to;
        setDisplay(to);
        rafRef.current = 0;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, resetKey, durationMs, introDurationMs, reducedMotion]);

  return display;
}

export function SmoothCurrencyValue({
  value,
  resetKey,
  className,
}: {
  value: number;
  resetKey: unknown;
  className: string;
}) {
  const smooth = useSmoothNumber(value, resetKey, TREND_REPORTED_SMOOTH_MS, REPORT_NUM_INTRO_MS);
  return (
    <span className={className} style={{ fontFeatureSettings: '"tnum"' }}>
      {formatCurrency(smooth)}
    </span>
  );
}

export function SmoothIntegerValue({
  value,
  resetKey,
  className,
}: {
  value: number;
  resetKey: unknown;
  className?: string;
}) {
  const smooth = useSmoothNumber(value, resetKey, TREND_REPORTED_SMOOTH_MS, REPORT_NUM_INTRO_MS);
  return (
    <span className={className} style={{ fontFeatureSettings: '"tnum"' }}>
      {Math.round(smooth)}
    </span>
  );
}
