"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Flame,
  Trophy,
  Zap,
  CalendarDays,
} from "lucide-react";
import { format, subDays, startOfWeek, isToday, parseISO, differenceInDays } from "date-fns";
import type { SymptomLog } from "@/types/symptom";

interface StreakCounterProps {
  symptoms: SymptomLog[];
}

export default function StreakCounter({ symptoms }: StreakCounterProps) {
  const stats = useMemo(() => {
    // 1. Get all unique dates, sorted descending
    const uniqueDates = Array.from(
      new Set(symptoms.map((s) => s.date))
    ).sort((a, b) => b.localeCompare(a));

    // 2. Calculate current streak
    let currentStreak = 0;
    if (uniqueDates.length > 0) {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const yesterdayStr = format(subDays(new Date(), 1), "yyyy-MM-dd");
      const mostRecent = uniqueDates[0];

      // Start from today or yesterday
      let startDate: string | null = null;
      if (mostRecent === todayStr || mostRecent === yesterdayStr) {
        startDate = mostRecent;
      }

      if (startDate) {
        let checkDate = parseISO(startDate);
        const dateSet = new Set(uniqueDates);

        while (dateSet.has(format(checkDate, "yyyy-MM-dd"))) {
          currentStreak++;
          checkDate = subDays(checkDate, 1);
        }
      }
    }

    // 3. Total unique days logged
    const totalDays = uniqueDates.length;

    // 4. Current week's log count (Mon–Sun)
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekDates = new Set(
      uniqueDates.filter((d) => {
        const date = parseISO(d);
        return date >= weekStart && date <= new Date();
      })
    );
    const thisWeekCount = weekDates.size;

    // 5. Best streak ever
    let bestStreak = 0;
    if (uniqueDates.length > 0) {
      // Sort ascending for streak calculation
      const sortedAsc = [...uniqueDates].sort((a, b) => a.localeCompare(b));
      let tempStreak = 1;
      for (let i = 1; i < sortedAsc.length; i++) {
        const prevDate = parseISO(sortedAsc[i - 1]);
        const currDate = parseISO(sortedAsc[i]);
        if (differenceInDays(currDate, prevDate) === 1) {
          tempStreak++;
        } else {
          bestStreak = Math.max(bestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      bestStreak = Math.max(bestStreak, tempStreak);
    }

    return { currentStreak, totalDays, thisWeekCount, bestStreak };
  }, [symptoms]);

  // Determine badge level
  const badge = useMemo(() => {
    if (stats.currentStreak >= 14) return { label: "Champion!", tier: "champion" as const };
    if (stats.currentStreak >= 7) return { label: "Consistent!", tier: "consistent" as const };
    if (stats.currentStreak >= 3) return { label: "On fire!", tier: "on-fire" as const };
    return null;
  }, [stats.currentStreak]);

  // Zero streak state
  if (stats.currentStreak === 0) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200/60 dark:border-amber-800/40 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-rose-950/20 p-3 px-4">
        <div className="flex items-center gap-2.5">
          <div className="rounded-full bg-amber-100 dark:bg-amber-900/40 p-1.5">
            <Flame className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Start your streak today!
          </p>
        </div>
        <span className="text-xs text-muted-foreground">
          Log symptoms to begin
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200/60 dark:border-amber-800/40 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-rose-950/20 p-3 px-4">
      {/* Left: Flame icon */}
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-orange-100 dark:bg-orange-900/40 p-1.5">
          <Flame className="h-5 w-5 text-orange-500 dark:text-orange-400 animate-pulse-soft" />
        </div>

        {/* Center: Streak number */}
        <div className="flex items-baseline gap-1.5">
          <motion.span
            key={stats.currentStreak}
            initial={{ scale: 1.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="text-2xl font-bold text-amber-800 dark:text-amber-200 tabular-nums"
          >
            {stats.currentStreak}
          </motion.span>
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
            day streak
          </span>
        </div>
      </div>

      {/* Right: Badge + stats */}
      <div className="flex items-center gap-3">
        {badge && (
          <motion.div
            key={badge.tier}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            {badge.tier === "champion" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
                <Trophy className="h-3 w-3" />
                {badge.label}
              </span>
            )}
            {badge.tier === "consistent" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/60 dark:to-orange-900/60 border border-amber-300/60 dark:border-amber-700/40 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                <Trophy className="h-3 w-3" />
                {badge.label}
              </span>
            )}
            {badge.tier === "on-fire" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 dark:bg-orange-900/50 border border-orange-200/60 dark:border-orange-700/40 px-2.5 py-0.5 text-[11px] font-bold text-orange-700 dark:text-orange-300">
                <Zap className="h-3 w-3" />
                {badge.label}
              </span>
            )}
          </motion.div>
        )}

        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            This week: {stats.thisWeekCount}/7
          </span>
          <span>Best: {stats.bestStreak} days</span>
        </div>
      </div>
    </div>
  );
}