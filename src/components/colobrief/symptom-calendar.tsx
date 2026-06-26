"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  format,
  startOfWeek,
  addDays,
  isToday,
  subDays,
  eachDayOfInterval,
  getDay,
  isAfter,
} from "date-fns";
import type { SymptomLog } from "@/types/symptom";

interface SymptomCalendarProps {
  symptoms: SymptomLog[];
  isLoading: boolean;
}

interface DayData {
  date: Date;
  symptoms: SymptomLog[];
  severity: number;
  hasData: boolean;
}

function getSeverityColor(severity: number, hasData: boolean): string {
  if (!hasData) return "bg-muted/40 dark:bg-muted/20";
  if (severity <= 10) return "bg-emerald-400/70 dark:bg-emerald-500/50";
  if (severity <= 20) return "bg-amber-400/70 dark:bg-amber-500/50";
  if (severity <= 30) return "bg-orange-400/70 dark:bg-orange-500/50";
  return "bg-rose-400/70 dark:bg-rose-500/50";
}

function getSeverityDotColor(severity: number, hasData: boolean): string {
  if (!hasData) return "bg-muted-foreground/20";
  if (severity <= 10) return "bg-emerald-500";
  if (severity <= 20) return "bg-amber-500";
  if (severity <= 30) return "bg-orange-500";
  return "bg-rose-500";
}

function getSeverityLabel(severity: number): string {
  if (severity <= 10) return "Mild";
  if (severity <= 20) return "Moderate";
  if (severity <= 30) return "Elevated";
  return "Severe";
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const LEGEND_ITEMS = [
  { label: "Mild", color: "bg-emerald-400 dark:bg-emerald-500" },
  { label: "Moderate", color: "bg-amber-400 dark:bg-amber-500" },
  { label: "Elevated", color: "bg-orange-400 dark:bg-orange-500" },
  { label: "Severe", color: "bg-rose-400 dark:bg-rose-500" },
  { label: "No Data", color: "bg-muted" },
];

export default function SymptomCalendar({ symptoms, isLoading }: SymptomCalendarProps) {
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);

  const days = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 29);
    const intervalStart = startOfWeek(thirtyDaysAgo, { weekStartsOn: 0 });

    const allDays = eachDayOfInterval({
      start: intervalStart,
      end: addDays(intervalStart, 34), // 5 rows
    });

    // Only keep up to today + a few buffer days for the last row
    const filteredDays = allDays.filter(
      (d) => !isAfter(d, addDays(today, 6)) && !isAfter(subDays(today, 29), addDays(d, 1))
    );

    // Pad to fill complete weeks
    const startDay = getDay(filteredDays[0]);
    const endDay = getDay(filteredDays[filteredDays.length - 1]);
    const totalCells = Math.ceil((startDay + filteredDays.length) / 7) * 7;
    const padEnd = totalCells - startDay - filteredDays.length;

    const padded: (Date | null)[] = [
      ...Array(startDay).fill(null),
      ...filteredDays,
      ...Array(padEnd).fill(null),
    ];

    return padded.map((date): DayData => {
      if (!date) {
        return { date: new Date(), symptoms: [], severity: 0, hasData: false };
      }

      const dayStr = format(date, "yyyy-MM-dd");
      const daySymptoms = symptoms.filter((s) => s.date === dayStr);

      if (daySymptoms.length === 0) {
        return { date, symptoms: [], severity: 0, hasData: false };
      }

      // Average severity across multiple logs for same day
      const totalSeverity = daySymptoms.reduce((sum, s) => {
        return sum + (s.painLevel * 2) + s.stoolFrequency + (s.stressLevel * 0.5) + (s.bloodInStool ? 5 : 0);
      }, 0);

      return {
        date,
        symptoms: daySymptoms,
        severity: Math.round(totalSeverity / daySymptoms.length),
        hasData: true,
      };
    });
  }, [symptoms]);

  if (isLoading) {
    return (
      <Card className="rounded-xl border-0 shadow-sm">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-44" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map(() => (
              <Skeleton key={Math.random()} className="h-4 w-full" />
            ))}
            {[...Array(35)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-md" />
            ))}
          </div>
          <Skeleton className="h-4 w-64 mt-4" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.14 }}
    >
      <Card className="rounded-xl border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
            30-Day Symptom Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Desktop view */}
          <div className="hidden sm:block">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1.5 mb-1.5">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="text-center text-[11px] font-medium text-muted-foreground py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1.5 relative">
              {days.map((dayData, idx) => {
                if (!dayData.hasData && format(dayData.date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")) {
                  // Today but no data
                  return (
                    <div
                      key={idx}
                      className={`aspect-square rounded-md bg-muted/40 dark:bg-muted/20 ring-2 ring-primary/40 flex items-center justify-center`}
                    >
                      <span className="text-xs font-medium text-muted-foreground">
                        {format(dayData.date, "d")}
                      </span>
                    </div>
                  );
                }

                if (!dayData.hasData) {
                  return (
                    <div
                      key={idx}
                      className={`aspect-square rounded-md bg-muted/40 dark:bg-muted/20 flex items-center justify-center ${isToday(dayData.date) ? "ring-2 ring-primary/40" : ""}`}
                    >
                      <span className="text-xs font-medium text-muted-foreground/60">
                        {format(dayData.date, "d")}
                      </span>
                    </div>
                  );
                }

                const today = isToday(dayData.date);

                return (
                  <div
                    key={idx}
                    className="relative group"
                    onMouseEnter={() => setHoveredDay(dayData)}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    <div
                      className={`aspect-square rounded-md ${getSeverityColor(dayData.severity, true)} ${today ? "ring-2 ring-primary/50" : ""} flex flex-col items-center justify-center cursor-default transition-transform hover:scale-105 hover:z-10`}
                    >
                      <span className="text-xs font-bold text-white drop-shadow-sm">
                        {format(dayData.date, "d")}
                      </span>
                      <span className="text-[9px] font-medium text-white/80 drop-shadow-sm">
                        {dayData.severity}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Tooltip */}
              <AnimatePresence>
                {hoveredDay && hoveredDay.hasData && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-50 bg-popover border border-border rounded-lg shadow-lg p-3 pointer-events-none min-w-[180px]"
                    style={{
                      top: `${Math.floor(days.indexOf(hoveredDay) / 7) * (100 / Math.ceil(days.length / 7))}%`,
                      left: `${(days.indexOf(hoveredDay) % 7) * (100 / 7)}%`,
                      transform: "translate(10%, -10%)",
                    }}
                  >
                    <p className="text-xs font-semibold text-foreground mb-1.5">
                      {format(hoveredDay.date, "EEE, MMM d")}
                    </p>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Severity</span>
                        <span className="font-medium text-foreground">{hoveredDay.severity} ({getSeverityLabel(hoveredDay.severity)})</span>
                      </div>
                      {hoveredDay.symptoms.map((s, i) => (
                        <div key={i} className="border-t border-border/50 pt-1 space-y-0.5">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Pain</span>
                            <span className="font-medium">{s.painLevel}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Stool Freq</span>
                            <span className="font-medium">{s.stoolFrequency}/day</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Stress</span>
                            <span className="font-medium">{s.stressLevel}/10</span>
                          </div>
                          {s.bloodInStool && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Blood</span>
                              <span className="font-medium text-rose-500">Yes</span>
                            </div>
                          )}
                          {s.triggers.length > 0 && (
                            <div className="flex justify-between gap-2">
                              <span className="text-muted-foreground shrink-0">Triggers</span>
                              <span className="font-medium text-right truncate">{s.triggers.join(", ")}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile compact view - just colored dots with dates */}
          <div className="sm:hidden space-y-2">
            <div className="grid grid-cols-7 gap-1.5 mb-2">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="text-center text-[10px] font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {days.map((dayData, idx) => {
                const today = isToday(dayData.date);
                return (
                  <div
                    key={idx}
                    className={`relative flex flex-col items-center gap-0.5 py-1 rounded ${today ? "ring-1 ring-primary/40 bg-muted/30" : ""}`}
                    onMouseEnter={() => setHoveredDay(dayData.hasData ? dayData : null)}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    <span className={`text-[10px] ${dayData.hasData ? "font-semibold text-foreground" : "text-muted-foreground/40"}`}>
                      {format(dayData.date, "d")}
                    </span>
                    <div
                      className={`h-3.5 w-3.5 rounded-sm ${getSeverityDotColor(dayData.severity, dayData.hasData)}`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Mobile tooltip */}
            <AnimatePresence>
              {hoveredDay && hoveredDay.hasData && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-muted/40 rounded-lg p-2.5 text-xs overflow-hidden"
                >
                  <p className="font-semibold text-foreground">
                    {format(hoveredDay.date, "EEE, MMM d")} — Severity: {hoveredDay.severity}
                  </p>
                  <p className="text-muted-foreground mt-0.5">
                    Pain {hoveredDay.symptoms[0].painLevel}/10 · Stool {hoveredDay.symptoms[0].stoolFrequency}/day · Stress {hoveredDay.symptoms[0].stressLevel}/10
                    {hoveredDay.symptoms[0].bloodInStool && " · Blood ✓"}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            {LEGEND_ITEMS.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className={`h-2.5 w-2.5 rounded-sm ${item.color}`} />
                <span className="text-[11px] text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}