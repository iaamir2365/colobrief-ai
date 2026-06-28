"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  UtensilsCrossed,
  Brain,
  Droplets,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnimatedNumber } from "@/hooks/use-animated-number";
import type { SymptomLog } from "@/types/symptom";
import { subDays, startOfDay, isAfter, isBefore, parseISO, startOfWeek, endOfWeek, addDays } from "date-fns";

interface WeeklyProgressSummaryProps {
  symptoms: SymptomLog[];
  isLoading: boolean;
}

interface MetricRow {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  thisWeek: number;
  lastWeek: number;
  change: number;
  max: number;
  suffix: string;
  decimals: number;
  // lower is better for these metrics
  lowerIsBetter: boolean;
}

function TrendArrow({ change, lowerIsBetter }: { change: number; lowerIsBetter: boolean }) {
  if (Math.abs(change) < 0.5) {
    return <Minus className="h-4 w-4 text-amber-500" />;
  }
  const improved = lowerIsBetter ? change < 0 : change > 0;
  if (improved) {
    return <TrendingDown className="h-4 w-4 text-emerald-500" />;
  }
  return <TrendingUp className="h-4 w-4 text-rose-500" />;
}

function ChangeBadge({ change, lowerIsBetter }: { change: number; lowerIsBetter: boolean }) {
  if (Math.abs(change) < 0.5) {
    return (
      <span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
        0.0
      </span>
    );
  }
  const improved = lowerIsBetter ? change < 0 : change > 0;
  const sign = change > 0 ? "+" : "";
  return (
    <span
      className={`text-xs font-semibold flex items-center gap-0.5 ${
        improved
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-rose-600 dark:text-rose-400"
      }`}
    >
      {improved ? (
        <ArrowDownRight className="h-3 w-3" />
      ) : (
        <ArrowUpRight className="h-3 w-3" />
      )}
      {sign}{change.toFixed(1)}
    </span>
  );
}

function MiniProgressBar({
  thisWeek,
  lastWeek,
  max,
  lowerIsBetter,
}: {
  thisWeek: number;
  lastWeek: number;
  max: number;
  lowerIsBetter: boolean;
}) {
  const thisPct = Math.min((thisWeek / max) * 100, 100);
  const lastPct = Math.min((lastWeek / max) * 100, 100);

  const thisColor = lowerIsBetter
    ? thisPct < lastPct
      ? "bg-emerald-500"
      : thisPct > lastPct
      ? "bg-rose-500"
      : "bg-amber-500"
    : thisPct > lastPct
    ? "bg-emerald-500"
    : thisPct < lastPct
    ? "bg-rose-500"
    : "bg-amber-500";

  const lastColor = "bg-muted-foreground/20";

  return (
    <div className="flex w-20 shrink-0 flex-col gap-1 sm:w-24">
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${thisPct}%`,
            background: `linear-gradient(90deg, ${thisColor === 'bg-emerald-500' ? '#10b981' : thisColor === 'bg-rose-500' ? '#f43f5e' : '#f59e0b'}, ${thisColor === 'bg-emerald-500' ? '#34d399' : thisColor === 'bg-rose-500' ? '#fb7185' : '#fbbf24'})`,
          }}
        />
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${lastColor} transition-all duration-700 ease-out`}
          style={{ width: `${lastPct}%` }}
        />
      </div>
    </div>
  );
}

function MetricRowDisplay({ metric, index }: { metric: MetricRow; index: number }) {
  const animatedValue = useAnimatedNumber(metric.thisWeek);
  const displayValue =
    metric.decimals > 0
      ? animatedValue.toFixed(metric.decimals)
      : String(Math.round(animatedValue));

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.08 * index, duration: 0.35 }}
      className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 border-b border-border/50 py-3 last:border-0 sm:flex sm:items-center"
    >
      <div className="rounded-lg bg-muted/60 p-2 shrink-0">
        <metric.icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 sm:flex sm:flex-1 sm:items-center sm:gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground leading-tight">{metric.name}</p>
          <p className="mt-0.5 text-lg font-bold leading-tight">
          {displayValue}
            <span className="ml-0.5 text-xs font-medium text-muted-foreground">
            {metric.suffix}
            </span>
          </p>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 sm:mt-0 sm:ml-auto sm:justify-end">
          <MiniProgressBar
            thisWeek={metric.thisWeek}
            lastWeek={metric.lastWeek}
            max={metric.max}
            lowerIsBetter={metric.lowerIsBetter}
          />
          <div className="flex shrink-0 flex-col items-end gap-0.5">
            <TrendArrow change={metric.change} lowerIsBetter={metric.lowerIsBetter} />
            <ChangeBadge change={metric.change} lowerIsBetter={metric.lowerIsBetter} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function WeeklyProgressSummary({
  symptoms,
  isLoading,
}: WeeklyProgressSummaryProps) {
  const { rows, overallStatus, thisWeekCount, lastWeekCount } = useMemo(() => {
    if (symptoms.length === 0) {
      return { rows: [], overallStatus: null, thisWeekCount: 0, lastWeekCount: 0 };
    }

    const now = startOfDay(new Date());

    // Determine this week (Mon–Sun) — if today is before Thursday, use last 7 days instead
    let thisWeekStart: Date;
    let thisWeekEnd: Date;
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
    // If we're early in the week (Mon-Wed), use rolling 7 days for more data
    if (dayOfWeek >= 1 && dayOfWeek <= 3) {
      thisWeekEnd = now;
      thisWeekStart = subDays(now, 6);
    } else {
      thisWeekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
      thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday
    }

    const lastWeekStart = subDays(thisWeekStart, 7);
    const lastWeekEnd = subDays(thisWeekStart, 1);

    const inRange = (s: SymptomLog, start: Date, end: Date) => {
      const d = startOfDay(parseISO(s.date));
      return (isAfter(d, subDays(start, 1)) || d.getTime() === start.getTime()) &&
        (isBefore(d, addDays(end, 1)) || d.getTime() === end.getTime());
    };

    const thisWeekLogs = symptoms.filter((s) => inRange(s, thisWeekStart, thisWeekEnd));
    const lastWeekLogs = symptoms.filter((s) => inRange(s, lastWeekStart, lastWeekEnd));

    const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

    const thisAvgPain = avg(thisWeekLogs.map((s) => s.painLevel));
    const lastAvgPain = avg(lastWeekLogs.map((s) => s.painLevel));
    const thisAvgStool = avg(thisWeekLogs.map((s) => s.stoolFrequency));
    const lastAvgStool = avg(lastWeekLogs.map((s) => s.stoolFrequency));
    const thisAvgStress = avg(thisWeekLogs.map((s) => s.stressLevel));
    const lastAvgStress = avg(lastWeekLogs.map((s) => s.stressLevel));
    const thisBloodDays = thisWeekLogs.filter((s) => s.bloodInStool).length;
    const lastBloodDays = lastWeekLogs.filter((s) => s.bloodInStool).length;

    const rows: MetricRow[] = [
      {
        name: "Pain Level",
        icon: Activity,
        thisWeek: thisAvgPain,
        lastWeek: lastAvgPain,
        change: thisAvgPain - lastAvgPain,
        max: 10,
        suffix: "/10",
        decimals: 1,
        lowerIsBetter: true,
      },
      {
        name: "Stool Frequency",
        icon: UtensilsCrossed,
        thisWeek: thisAvgStool,
        lastWeek: lastAvgStool,
        change: thisAvgStool - lastAvgStool,
        max: 15,
        suffix: "/day",
        decimals: 1,
        lowerIsBetter: true,
      },
      {
        name: "Stress Level",
        icon: Brain,
        thisWeek: thisAvgStress,
        lastWeek: lastAvgStress,
        change: thisAvgStress - lastAvgStress,
        max: 10,
        suffix: "/10",
        decimals: 1,
        lowerIsBetter: true,
      },
      {
        name: "Blood Days",
        icon: Droplets,
        thisWeek: thisBloodDays,
        lastWeek: lastBloodDays,
        change: thisBloodDays - lastBloodDays,
        max: 7,
        suffix: " days",
        decimals: 0,
        lowerIsBetter: true,
      },
    ];

    // Overall status: weighted average of normalized changes
    // Normalize each change relative to its max, then weight: pain 2x, stool 1.5x, stress 1.5x, blood 2x
    const weights = [2, 1.5, 1.5, 2];
    const maxes = [10, 15, 10, 7];
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    const weightedChange = rows.reduce((sum, row, i) => {
      const normalized = row.change / maxes[i];
      return sum + normalized * weights[i];
    }, 0) / totalWeight;

    let overallStatus: "Improving" | "Stable" | "Worsening";
    if (weightedChange < -0.03) {
      overallStatus = "Improving";
    } else if (weightedChange > 0.03) {
      overallStatus = "Worsening";
    } else {
      overallStatus = "Stable";
    }

    return {
      rows,
      overallStatus,
      thisWeekCount: thisWeekLogs.length,
      lastWeekCount: lastWeekLogs.length,
    };
  }, [symptoms]);

  if (isLoading) {
    return (
      <Card className="rounded-xl border-0 shadow-sm">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-12" />
              </div>
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-10" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const totalDataPoints = thisWeekCount + lastWeekCount;
  const hasEnoughData = totalDataPoints >= 5;

  if (!hasEnoughData) {
    return (
      <Card className="rounded-xl border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-teal-600" />
            Weekly Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="rounded-full bg-muted/60 p-3 mb-3">
              <TrendingUp className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Need at least 5 days of logs to show weekly comparison.
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Currently: {totalDataPoints} day{totalDataPoints !== 1 ? "s" : ""} across the last 2 weeks
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusConfig = {
    Improving: {
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      border: "border-emerald-200 dark:border-emerald-800/50",
    },
    Stable: {
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      border: "border-amber-200 dark:border-amber-800/50",
    },
    Worsening: {
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-950/30",
      border: "border-rose-200 dark:border-rose-800/50",
    },
  };

  const status = statusConfig[overallStatus!];

  return (
    <Card className="rounded-xl border-0 shadow-sm card-premium">
      <CardHeader className="pb-2">
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-teal-600" />
            Weekly Progress
          </CardTitle>
          <div
            className={`inline-flex items-center gap-1.5 self-start rounded-full border px-2.5 py-0.5 text-xs font-semibold ${status.bg} ${status.color} ${status.border} badge-refined sm:self-auto`}
          >
            {overallStatus === "Improving" && (
              <TrendingDown className="h-3 w-3" />
            )}
            {overallStatus === "Worsening" && (
              <TrendingUp className="h-3 w-3" />
            )}
            {overallStatus === "Stable" && (
              <Minus className="h-3 w-3" />
            )}
            {overallStatus}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          This week ({thisWeekCount} logs) vs last week ({lastWeekCount} logs)
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div>
          {rows.map((row: MetricRow, i: number) => (
            <MetricRowDisplay key={row.name} metric={row} index={i} />
          ))}
        </div>
        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/40 pt-2">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-3 rounded-full bg-muted-foreground/60" />
            <span className="text-[10px] text-muted-foreground">This week</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-3 rounded-full bg-muted-foreground/20" />
            <span className="text-[10px] text-muted-foreground">Last week</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
