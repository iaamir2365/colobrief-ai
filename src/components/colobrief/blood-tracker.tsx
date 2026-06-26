"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Droplets, CalendarDays, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { SymptomLog } from "@/types/symptom";
import { subDays, parseISO, isAfter, isBefore, format, differenceInDays } from "date-fns";

interface BloodTrackerProps {
  symptoms: SymptomLog[];
  isLoading: boolean;
}

export default function BloodTracker({ symptoms, isLoading }: BloodTrackerProps) {
  const analysis = useMemo(() => {
    if (symptoms.length === 0) return null;

    const sorted = [...symptoms].sort((a, b) => a.date.localeCompare(b.date));

    const totalDays = sorted.length;
    const bloodDays = sorted.filter((s) => s.bloodInStool).length;
    const bloodPct = (bloodDays / totalDays) * 100;

    // Recent 7 days
    const sevenDaysAgo = subDays(new Date(), 7);
    const recent7 = sorted.filter((s) => isAfter(parseISO(s.date), sevenDaysAgo) || s.date === format(sevenDaysAgo, "yyyy-MM-dd"));
    const recentBloodDays = recent7.filter((s) => s.bloodInStool).length;
    const recentBloodPct = recent7.length ? (recentBloodDays / recent7.length) * 100 : 0;

    // Previous 7 days
    const fourteenDaysAgo = subDays(new Date(), 14);
    const prev7 = sorted.filter((s) => {
      const d = parseISO(s.date);
      return (isAfter(d, fourteenDaysAgo) || d.toISOString().slice(0, 10) === fourteenDaysAgo.toISOString().slice(0, 10))
        && isBefore(d, sevenDaysAgo);
    });
    const prevBloodDays = prev7.filter((s) => s.bloodInStool).length;
    const prevBloodPct = prev7.length ? (prevBloodDays / prev7.length) * 100 : 0;

    // Consecutive blood days (current streak)
    let consecutiveBloodDays = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const checkDate = subDays(today, i);
      const dateStr = format(checkDate, "yyyy-MM-dd");
      const log = sorted.find((s) => s.date === dateStr);
      if (log && log.bloodInStool) {
        consecutiveBloodDays++;
      } else if (i > 0) {
        break;
      }
    }

    // Days since last blood
    const lastBloodLog = sorted.filter((s) => s.bloodInStool).sort((a, b) => b.date.localeCompare(a.date))[0];
    const daysSinceLastBlood = lastBloodLog
      ? differenceInDays(new Date(), parseISO(lastBloodLog.date))
      : null;

    // Pain on blood days vs non-blood days
    const bloodDayPain = sorted.filter((s) => s.bloodInStool).map((s) => s.painLevel);
    const noBloodDayPain = sorted.filter((s) => !s.bloodInStool).map((s) => s.painLevel);
    const avgBloodPain = bloodDayPain.length ? bloodDayPain.reduce((a, b) => a + b, 0) / bloodDayPain.length : 0;
    const avgNoBloodPain = noBloodDayPain.length ? noBloodDayPain.reduce((a, b) => a + b, 0) / noBloodDayPain.length : 0;

    // Trend
    const trend = recentBloodPct - prevBloodPct;

    // Build timeline (last 14 days)
    const timeline = sorted.slice(-14).map((s) => ({
      date: s.date,
      hasBlood: s.bloodInStool,
      painLevel: s.painLevel,
      stoolType: s.stoolType,
    }));

    // Severity assessment
    const severity = bloodPct > 50 ? "severe" as const : bloodPct > 25 ? "elevated" as const : bloodPct > 10 ? "mild" as const : "minimal" as const;

    return {
      totalDays,
      bloodDays,
      bloodPct,
      recent7: { days: recent7.length, bloodDays: recentBloodDays, bloodPct: recentBloodPct },
      prev7: { days: prev7.length, bloodDays: prevBloodDays, bloodPct: prevBloodPct },
      consecutiveBloodDays,
      daysSinceLastBlood,
      avgBloodPain,
      avgNoBloodPain,
      trend,
      timeline,
      severity,
      lastBloodDate: lastBloodLog?.date ? format(parseISO(lastBloodLog.date), "MMM d") : null,
    };
  }, [symptoms]);

  if (isLoading) {
    return (
      <Card className="rounded-xl border-0 shadow-sm">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-44" />
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <Skeleton className="h-20 rounded-lg" />
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-12 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className="rounded-xl border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Droplets className="h-4 w-4 text-rose-500" />
            Blood in Stool Tracker
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted/50 p-3 mb-3">
              <Droplets className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground max-w-[280px]">
              No symptom data yet. Start logging to track blood in stool patterns.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const severityConfig = {
    severe: { color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/30", label: "Severe" },
    elevated: { color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/30", label: "Elevated" },
    mild: { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30", label: "Mild" },
    minimal: { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30", label: "Minimal" },
  };

  const sev = severityConfig[analysis.severity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.28 }}
    >
      <Card className="rounded-xl border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Droplets className="h-4 w-4 text-rose-500" />
              Blood in Stool Tracker
            </CardTitle>
            <Badge
              variant={analysis.severity === "severe" || analysis.severity === "elevated" ? "destructive" : "secondary"}
              className={`text-xs ${analysis.severity === "minimal" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" : ""}`}
            >
              {sev.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-4">
          {/* Main stats row */}
          <div className="grid grid-cols-3 gap-3">
            {/* Overall percentage */}
            <div className={`rounded-lg ${sev.bg} p-3 text-center`}>
              <p className={`text-2xl font-bold ${sev.color}`}>{analysis.bloodPct.toFixed(0)}%</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">of all days</p>
            </div>

            {/* This week */}
            <div className="rounded-lg bg-muted/40 p-3 text-center">
              <p className="text-2xl font-bold text-foreground">
                {analysis.recent7.bloodDays}<span className="text-sm font-normal text-muted-foreground">/{analysis.recent7.days}</span>
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">this week</p>
            </div>

            {/* Days since last */}
            <div className="rounded-lg bg-muted/40 p-3 text-center">
              <p className="text-2xl font-bold text-foreground">
                {analysis.daysSinceLastBlood !== null ? analysis.daysSinceLastBlood : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">days since last</p>
            </div>
          </div>

          {/* Trend comparison */}
          {analysis.prev7.days > 0 && (
            <div className="flex items-center justify-between text-sm rounded-lg bg-muted/30 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Weekly Trend:</span>
                <span className="font-medium">
                  {analysis.prev7.bloodPct.toFixed(0)}% → {analysis.recent7.bloodPct.toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center gap-1">
                {Math.abs(analysis.trend) < 5 ? (
                  <Minus className="h-4 w-4 text-amber-500" />
                ) : analysis.trend > 0 ? (
                  <TrendingUp className="h-4 w-4 text-rose-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-emerald-500" />
                )}
                <span
                  className={`text-xs font-semibold ${
                    analysis.trend > 5
                      ? "text-rose-600 dark:text-rose-400"
                      : analysis.trend < -5
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {analysis.trend > 0 ? "+" : ""}{analysis.trend.toFixed(0)}pp
                </span>
              </div>
            </div>
          )}

          {/* Pain comparison */}
          {analysis.avgBloodPain > 0 && (
            <div className="flex items-center gap-4 text-xs">
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Avg pain on blood days</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">{analysis.avgBloodPain.toFixed(1)}/10</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full bg-rose-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(analysis.avgBloodPain / 10) * 100}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Avg pain w/o blood</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{analysis.avgNoBloodPain.toFixed(1)}/10</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full bg-emerald-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(analysis.avgNoBloodPain / 10) * 100}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 14-day visual timeline */}
          {analysis.timeline.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">14-Day Timeline</p>
              <div className="flex gap-1.5 items-end">
                {analysis.timeline.map((entry, i) => {
                  const barH = Math.max(20, (entry.painLevel / 10) * 48);
                  const bloodLabel = entry.hasBlood ? "Blood detected" : "No blood";
                  const dateLabel = format(parseISO(entry.date), "MMM d");
                  const tipText = dateLabel + ": " + bloodLabel + " (Pain: " + entry.painLevel + "/10)";
                  const barClass = entry.hasBlood
                    ? "bg-rose-500 dark:bg-rose-400"
                    : "bg-emerald-200 dark:bg-emerald-900/50";
                  return (
                    <motion.div
                      key={entry.date}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: i * 0.04, duration: 0.3 }}
                      className="flex-1 flex flex-col items-center gap-1"
                      style={{ transformOrigin: "bottom" }}
                    >
                      <div
                        className={"w-full rounded-t-sm transition-colors " + barClass}
                        style={{ height: barH + "px" }}
                        title={tipText}
                      ></div>
                      <span className="text-[9px] text-muted-foreground/60">
                        {format(parseISO(entry.date), "d")}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <div className="h-2.5 w-2.5 rounded-sm bg-rose-500" />
                  Blood detected
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <div className="h-2.5 w-2.5 rounded-sm bg-emerald-200 dark:bg-emerald-900/50" />
                  No blood
                </div>
                <span className="text-[10px] text-muted-foreground/50 ml-auto">
                  Bar height = pain level
                </span>
              </div>
            </div>
          )}

          {/* Consecutive days alert */}
          {analysis.consecutiveBloodDays >= 2 && (
            <div className="rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-800/40 p-3 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-rose-800 dark:text-rose-300">
                  {analysis.consecutiveBloodDays} consecutive day{analysis.consecutiveBloodDays > 1 ? "s" : ""} with blood
                </p>
                <p className="text-xs text-rose-600/70 dark:text-rose-400/70 mt-0.5">
                  This may indicate an active flare. Please contact your healthcare provider.
                </p>
              </div>
            </div>
          )}

          {/* All-clear message */}
          {analysis.daysSinceLastBlood !== null && analysis.daysSinceLastBlood >= 7 && analysis.bloodPct < 15 && (
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 p-3 flex items-start gap-2.5">
              <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  Blood-free for {analysis.daysSinceLastBlood} days
                </p>
                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">
                  Great progress! Keep up your current management plan.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}