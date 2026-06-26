"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO, subDays } from "date-fns";
import type { SymptomLog } from "@/types/symptom";

interface SymptomTimelineProps {
  symptoms: SymptomLog[];
  isLoading: boolean;
}

type SeverityLevel = "mild" | "moderate" | "elevated" | "severe";

function getSeverity(log: SymptomLog): SeverityLevel {
  const score =
    log.painLevel * 2 +
    log.stoolFrequency +
    log.stressLevel * 0.5 +
    (log.bloodInStool ? 5 : 0);
  if (score <= 10) return "mild";
  if (score <= 20) return "moderate";
  if (score <= 30) return "elevated";
  return "severe";
}

const SEVERITY_CONFIG: Record<
  SeverityLevel,
  { color: string; bg: string; ring: string; label: string }
> = {
  mild: {
    color: "bg-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    ring: "ring-emerald-500/30",
    label: "Mild",
  },
  moderate: {
    color: "bg-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    ring: "ring-amber-500/30",
    label: "Moderate",
  },
  elevated: {
    color: "bg-orange-500",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    ring: "ring-orange-500/30",
    label: "Elevated",
  },
  severe: {
    color: "bg-rose-500",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    ring: "ring-rose-500/30",
    label: "Severe",
  },
};

function MiniBar({ value, max = 10, colorClass }: { value: number; max?: number; colorClass: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full h-1.5 rounded-full bg-muted/50 overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${colorClass}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
}

function TimelineItem({
  log,
  index,
  isLast,
}: {
  log: SymptomLog;
  index: number;
  isLast: boolean;
}) {
  const severity = getSeverity(log);
  const config = SEVERITY_CONFIG[severity];

  const dateStr = format(parseISO(log.date), "EEE, MMM d");
  const displayTriggers = (log.triggers ?? []).slice(0, 3);
  const notesPreview = log.notes
    ? log.notes.length > 60
      ? log.notes.slice(0, 60) + "..."
      : log.notes
    : null;

  return (
    <motion.div
      className="relative flex gap-4"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
    >
      {/* Timeline line + node */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className={`w-3.5 h-3.5 rounded-full ${config.color} ring-4 ring-background z-10 shrink-0 shadow-sm`}
        />
        {!isLast && (
          <div className="w-0.5 flex-1 bg-border min-h-[24px]" />
        )}
      </div>

      {/* Content card */}
      <div
        className={`flex-1 rounded-lg ${config.bg} p-3 mb-3 border border-transparent hover:border-border/50 transition-colors`}
      >
        {/* Date row */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-foreground">
            {dateStr}
          </span>
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${config.color} text-white`}
          >
            {config.label}
          </span>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          {/* Pain */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Pain</span>
              <span className="text-xs font-medium tabular-nums">
                {log.painLevel}/10
              </span>
            </div>
            <MiniBar
              value={log.painLevel}
              colorClass={
                log.painLevel <= 3
                  ? "bg-emerald-500"
                  : log.painLevel <= 6
                    ? "bg-amber-500"
                    : "bg-rose-500"
              }
            />
          </div>

          {/* Stress */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Stress</span>
              <span className="text-xs font-medium tabular-nums">
                {log.stressLevel}/10
              </span>
            </div>
            <MiniBar
              value={log.stressLevel}
              colorClass={
                log.stressLevel <= 3
                  ? "bg-emerald-500"
                  : log.stressLevel <= 6
                    ? "bg-amber-500"
                    : "bg-rose-500"
              }
            />
          </div>
        </div>

        {/* Stool info row */}
        <div className="flex items-center gap-3 mt-2.5 text-xs text-muted-foreground">
          <span>
            Stool:{" "}
            <span className="font-medium text-foreground">
              {log.stoolFrequency}x
            </span>{" "}
            / Type{" "}
            <span className="font-medium text-foreground">
              {log.stoolType}
            </span>
          </span>
          {log.bloodInStool && (
            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span className="font-medium">Blood</span>
            </span>
          )}
        </div>

        {/* Triggers */}
        {displayTriggers.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {displayTriggers.map((trigger) => (
              <Badge
                key={trigger}
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-5 font-medium"
              >
                {trigger}
              </Badge>
            ))}
          </div>
        )}

        {/* Notes preview */}
        {notesPreview && (
          <p className="text-xs text-muted-foreground mt-2 italic leading-relaxed">
            &ldquo;{notesPreview}&rdquo;
          </p>
        )}
      </div>
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <Card className="rounded-xl border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-5 w-48" />
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 mb-4">
            <div className="flex flex-col items-center">
              <Skeleton className="w-3.5 h-3.5 rounded-full" />
              {i < 4 && <Skeleton className="w-0.5 flex-1 min-h-[24px]" />}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-14 rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-5 w-full rounded" />
                <Skeleton className="h-5 w-full rounded" />
              </div>
              <Skeleton className="h-3.5 w-36" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function SymptomTimeline({
  symptoms,
  isLoading,
}: SymptomTimelineProps) {
  const recentLogs = useMemo(() => {
    if (!symptoms || symptoms.length === 0) return [];

    const sevenDaysAgo = subDays(new Date(), 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const filtered = symptoms
      .filter((s) => {
        const d = parseISO(s.date);
        return d >= sevenDaysAgo;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return filtered.slice(0, 7);
  }, [symptoms]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="rounded-xl border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-teal-600" />
            Recent Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {recentLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                No symptom logs yet
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Start logging your symptoms to see your activity timeline here.
              </p>
            </div>
          ) : (
            <div className="max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
              {recentLogs.map((log, i) => (
                <TimelineItem
                  key={log.id}
                  log={log}
                  index={i}
                  isLast={i === recentLogs.length - 1}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}