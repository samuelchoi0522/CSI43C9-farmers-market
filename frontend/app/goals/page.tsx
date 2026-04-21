"use client";

import { useCallback, useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import SidebarNavigation from "../components/SidebarNavigation";
import Button from "../components/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/figma/card";
import { Input } from "../components/figma/input";
import { Label } from "../components/figma/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/figma/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/figma/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/figma/alert-dialog";
import {
  createMarketGoal,
  deleteMarketGoal,
  getMarketGoalsWithProgress,
  getMetricLabel,
  getMetricShortLabel,
  isAttendancePercentMetric,
  MARKET_GOAL_METRIC_OPTIONS,
  updateMarketGoal,
  type MarketGoalInput,
  type MarketGoalMetric,
  type MarketGoalProgress,
} from "@/lib/api/marketGoals";
import { formatCurrency } from "@/lib/smoothNumbers";

function defaultMonthRange() {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth();
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    start: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
    end: `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`,
  };
}

function formatMetricValue(metric: MarketGoalMetric, value: number) {
  if (isAttendancePercentMetric(metric)) {
    return `${value.toFixed(1)}%`;
  }
  return formatCurrency(value);
}

/** Keeps attendance targets in [0, 100] while typing (HTML `max` alone does not block input). */
function clampAttendanceTargetInputString(raw: string): string {
  if (raw === "") return "";
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return raw;
  const c = Math.min(100, Math.max(0, n));
  return c === n ? raw : String(c);
}

/** Dollar targets (sales + token volume): no max; attendance: 0–100 with % suffix. */
function GoalTargetInputNew({
  metric,
  id,
  value,
  onChange,
  placeholder,
}: {
  metric: MarketGoalMetric;
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const attendance = isAttendancePercentMetric(metric);
  return (
    <div className="relative">
      <Input
        id={id}
        type={attendance ? "number" : "text"}
        inputMode="decimal"
        min={attendance ? 0 : undefined}
        max={attendance ? 100 : undefined}
        step={attendance ? 0.1 : undefined}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          const raw = e.target.value;
          if (!attendance) {
            onChange(raw);
            return;
          }
          onChange(clampAttendanceTargetInputString(raw));
        }}
        className="pr-10 tabular-nums"
      />
      <span
        className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-500"
        aria-hidden
      >
        {attendance ? "%" : "$"}
      </span>
    </div>
  );
}

function GoalTargetInputEdit({
  metric,
  value,
  onValueChange,
}: {
  metric: MarketGoalMetric;
  value: number;
  onValueChange: (n: number) => void;
}) {
  const attendance = isAttendancePercentMetric(metric);
  return (
    <div className="relative">
      <Input
        type="number"
        min={0}
        max={attendance ? 100 : undefined}
        step={attendance ? 0.1 : "any"}
        className="pr-10 tabular-nums"
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!Number.isFinite(v)) {
            onValueChange(0);
            return;
          }
          if (attendance) {
            onValueChange(Math.min(100, Math.max(0, v)));
          } else {
            onValueChange(v);
          }
        }}
      />
      <span
        className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-500"
        aria-hidden
      >
        {attendance ? "%" : "$"}
      </span>
    </div>
  );
}

export default function GoalsPage() {
  const { start: defaultStart, end: defaultEnd } = defaultMonthRange();
  const [goals, setGoals] = useState<MarketGoalProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newStart, setNewStart] = useState(defaultStart);
  const [newEnd, setNewEnd] = useState(defaultEnd);
  const [newMetric, setNewMetric] = useState<MarketGoalMetric>("REPORTED_SALES");
  const [newTarget, setNewTarget] = useState("10000");
  const [editing, setEditing] = useState<MarketGoalProgress | null>(null);
  const [deleting, setDeleting] = useState<MarketGoalProgress | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const loadGoals = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getMarketGoalsWithProgress();
      setGoals(list);
    } catch (e) {
      console.error(e);
      toast.error("Could not load goals. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const parseTarget = (s: string) => {
    const n = parseFloat(s.replace(/,/g, "").replace(/%/g, "").replace(/\$/g, "").trim());
    return Number.isFinite(n) ? n : NaN;
  };

  const buildInput = (): MarketGoalInput | null => {
    const targetValue = parseTarget(newTarget);
    if (!newName.trim()) {
      setFormError("Enter a goal name.");
      return null;
    }
    if (newEnd < newStart) {
      setFormError("End date must be on or after the start date.");
      return null;
    }
    if (!Number.isFinite(targetValue) || targetValue <= 0) {
      setFormError("Enter a positive target.");
      return null;
    }
    if (isAttendancePercentMetric(newMetric) && targetValue > 100) {
      setFormError("Attendance target must be at most 100%.");
      return null;
    }
    setFormError(null);
    return {
      name: newName.trim(),
      startDate: newStart,
      endDate: newEnd,
      metric: newMetric,
      targetValue,
    };
  };

  const handleCreate = async () => {
    const input = buildInput();
    if (!input) return;
    try {
      await createMarketGoal(input);
      toast.success(`Goal “${input.name}” created.`);
      setNewName("");
      setNewStart(defaultStart);
      setNewEnd(defaultEnd);
      setNewMetric("REPORTED_SALES");
      setNewTarget("10000");
      await loadGoals();
    } catch (e) {
      console.error(e);
      setFormError("Could not create goal. Check values and try again.");
      toast.error("Could not create goal. Check values and try again.");
    }
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    const targetValue = parseFloat(String(editing.targetValue));
    if (!editing.name.trim() || editing.endDate < editing.startDate || !Number.isFinite(targetValue) || targetValue <= 0) {
      toast.error("Please enter a valid name, date range, and positive target.");
      return;
    }
    if (isAttendancePercentMetric(editing.metric) && targetValue > 100) {
      toast.error("Attendance target must be at most 100%.");
      return;
    }
    const name = editing.name.trim();
    try {
      await updateMarketGoal(editing.id, {
        name,
        startDate: editing.startDate,
        endDate: editing.endDate,
        metric: editing.metric,
        targetValue,
      });
      toast.success(`Goal “${name}” updated.`);
      setEditing(null);
      await loadGoals();
    } catch (e) {
      console.error(e);
      toast.error("Could not update goal. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const label = deleting.name;
    try {
      await deleteMarketGoal(deleting.id);
      toast.success(`Goal “${label}” deleted.`);
      setDeleting(null);
      await loadGoals();
    } catch (e) {
      console.error(e);
      toast.error("Could not delete goal. Please try again.");
    }
  };

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen flex">
      <SidebarNavigation activeItem="Goals" />
      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
        <header className="mb-8">
          <h2 className="text-2xl font-bold">Market goals</h2>
          <p className="text-slate-600 text-sm mt-1">
            Set targets over a date range. Progress uses totals from vendor transactions in that range.
          </p>
        </header>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add a goal</CardTitle>
            <CardDescription>Name it, pick the period, metric, and target amount.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formError && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="goal-name">Name</Label>
                <Input
                  id="goal-name"
                  placeholder="e.g. Spring sales push"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Metric</Label>
                <Select
                  value={newMetric}
                  onValueChange={(v: MarketGoalMetric) => {
                    setNewMetric(v);
                    if (isAttendancePercentMetric(v)) {
                      setNewTarget((prev) => {
                        const n = parseFloat(prev.replace(/,/g, "").replace(/%/g, "").replace(/\$/g, "").trim());
                        if (Number.isFinite(n) && n > 100) return "100";
                        return prev;
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white max-w-[min(100vw-2rem,28rem)]">
                    {MARKET_GOAL_METRIC_OPTIONS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-start">Start date</Label>
                <Input id="goal-start" type="date" value={newStart} onChange={(e) => setNewStart(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-end">End date</Label>
                <Input id="goal-end" type="date" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-target">Target</Label>
                <GoalTargetInputNew
                  id="goal-target"
                  metric={newMetric}
                  value={newTarget}
                  onChange={setNewTarget}
                  placeholder={isAttendancePercentMetric(newMetric) ? "e.g. 85" : "e.g. 50000"}
                />
              </div>
            </div>
            <Button onClick={handleCreate} className="gap-2">
              <span className="material-icons text-lg leading-none">add</span>
              Add goal
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your goals</CardTitle>
            <CardDescription>Current values are computed from all transactions with market dates in range.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Range</TableHead>
                  <TableHead>Metric</TableHead>
                  <TableHead className="text-right">Current</TableHead>
                  <TableHead className="text-right">Target</TableHead>
                  <TableHead className="text-right">Progress</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : goals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No goals yet. Add one above.
                    </TableCell>
                  </TableRow>
                ) : (
                  goals.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium">{g.name}</TableCell>
                      <TableCell className="text-sm text-slate-600 whitespace-nowrap">
                        {g.startDate} → {g.endDate}
                      </TableCell>
                      <TableCell
                        className="text-sm min-w-0 max-w-[14rem] break-words align-top"
                        title={getMetricLabel(g.metric)}
                      >
                        {getMetricShortLabel(g.metric)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatMetricValue(g.metric, g.currentValue)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatMetricValue(g.metric, g.targetValue)}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {g.percentTowardGoal.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditing(g)}>
                            Edit
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => setDeleting(g)}>
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <AlertDialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
          <AlertDialogContent className="bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Edit goal</AlertDialogTitle>
              <AlertDialogDescription>Update the name, dates, metric, or target.</AlertDialogDescription>
            </AlertDialogHeader>
            {editing && (
              <div className="grid gap-3 py-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Start</Label>
                    <Input
                      type="date"
                      value={editing.startDate}
                      onChange={(e) => setEditing({ ...editing, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End</Label>
                    <Input
                      type="date"
                      value={editing.endDate}
                      onChange={(e) => setEditing({ ...editing, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Metric</Label>
                  <Select
                    value={editing.metric}
                    onValueChange={(v: MarketGoalMetric) =>
                      setEditing((prev) =>
                        prev
                          ? {
                              ...prev,
                              metric: v,
                              targetValue: isAttendancePercentMetric(v)
                                ? Math.min(100, prev.targetValue)
                                : prev.targetValue,
                            }
                          : null,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white max-w-[min(100vw-2rem,28rem)]">
                      {MARKET_GOAL_METRIC_OPTIONS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target</Label>
                  <GoalTargetInputEdit
                    metric={editing.metric}
                    value={editing.targetValue}
                    onValueChange={(n) => setEditing({ ...editing, targetValue: n })}
                  />
                </div>
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSaveEdit}
                className="border-0 bg-[#10b981] text-white shadow-sm hover:bg-[#059669] focus-visible:ring-[#10b981]/40"
              >
                Save
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
          <AlertDialogContent className="bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete goal?</AlertDialogTitle>
              <AlertDialogDescription>
                {deleting ? `Remove “${deleting.name}” permanently?` : ""}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Toaster position="top-right" richColors closeButton />
      </main>
    </div>
  );
}
