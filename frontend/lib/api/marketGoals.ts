import { apiRequest } from './client';

export type MarketGoalMetric =
  | 'REPORTED_SALES'
  | 'TOKEN_VOLUME'
  | 'ACTIVE_VENDOR_ATTENDANCE';

export interface MarketGoalProgress {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  metric: MarketGoalMetric;
  targetValue: number;
  currentValue: number;
  percentTowardGoal: number;
}

export interface MarketGoalInput {
  name: string;
  startDate: string;
  endDate: string;
  metric: MarketGoalMetric;
  targetValue: number;
}

export async function getMarketGoalsWithProgress(): Promise<MarketGoalProgress[]> {
  return apiRequest<MarketGoalProgress[]>('/api/market-goals', { method: 'GET' });
}

export async function createMarketGoal(body: MarketGoalInput): Promise<{ id: number } & MarketGoalInput> {
  return apiRequest('/api/market-goals', {
    method: 'POST',
    body: JSON.stringify({
      id: null,
      name: body.name,
      startDate: body.startDate,
      endDate: body.endDate,
      metric: body.metric,
      targetValue: body.targetValue,
    }),
  });
}

export async function updateMarketGoal(
  id: number,
  body: MarketGoalInput,
): Promise<{ id: number } & MarketGoalInput> {
  return apiRequest(`/api/market-goals/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      id,
      name: body.name,
      startDate: body.startDate,
      endDate: body.endDate,
      metric: body.metric,
      targetValue: body.targetValue,
    }),
  });
}

export async function deleteMarketGoal(id: number): Promise<void> {
  return apiRequest<void>(`/api/market-goals/${id}`, { method: 'DELETE' });
}

export const MARKET_GOAL_METRIC_OPTIONS: { value: MarketGoalMetric; label: string }[] = [
  { value: 'REPORTED_SALES', label: 'Total reported sales ($)' },
  { value: 'TOKEN_VOLUME', label: 'Program token volume — SNAP+DUFB+WDFM+voucher ($)' },
  {
    value: 'ACTIVE_VENDOR_ATTENDANCE',
    label:
      'Active vendor attendance rate',
  },
];

/** Full metric description as shown in dropdowns and tooltips. */
export function getMetricLabel(metric: MarketGoalMetric | string): string {
  return MARKET_GOAL_METRIC_OPTIONS.find((m) => m.value === metric)?.label ?? String(metric);
}

/**
 * Shorter label for dense UI (e.g. dashboard widget): drops parentheticals and text after an em dash.
 */
export function getMetricShortLabel(metric: MarketGoalMetric | string): string {
  let s = getMetricLabel(metric);
  const paren = s.indexOf('(');
  if (paren !== -1) {
    s = s.slice(0, paren).trim();
  }
  const em = s.indexOf('—');
  if (em !== -1) {
    s = s.slice(0, em).trim();
  }
  return s;
}

/** Attendance goals use 0–100% for current and target (not currency). */
export function isAttendancePercentMetric(metric: MarketGoalMetric | string): boolean {
  return metric === 'ACTIVE_VENDOR_ATTENDANCE';
}
