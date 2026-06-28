"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SymptomLog } from "@/types/symptom";
import { format, addDays, getDay, parseISO, startOfDay } from "date-fns";

interface SymptomForecastProps {
  symptoms: SymptomLog[];
  isLoading: boolean;
}

interface DayForecast {
  dayName: string;
  date: string;
  avgPain: number;
  avgStool: number;
  avgStress: number;
  flareRisk: number;
  color: string;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getRiskColor(risk: number): string {
  if (risk > 60) return "#f43f5e";
  if (risk >= 30) return "#f59e0b";
  return "#10b981";
}

function getRiskLabel(risk: number): string {
  if (risk > 60) return "High";
  if (risk >= 30) return "Moderate";
  return "Low";
}

export default function SymptomForecast({ symptoms, isLoading }: SymptomForecastProps) {
  const forecast = useMemo<DayForecast[]>(() => {
    if (symptoms.length < 5) return [];

    // Group by day of week (0=Sun ... 6=Sat)
    const dayGroups: Record<number, { pain: number[]; stool: number[]; stress: number[]; total: number }> = {
      0: { pain: [], stool: [], stress: [], total: 0 },
      1: { pain: [], stool: [], stress: [], total: 0 },
      2: { pain: [], stool: [], stress: [], total: 0 },
      3: { pain: [], stool: [], stress: [], total: 0 },
      4: { pain: [], stool: [], stress: [], total: 0 },
      5: { pain: [], stool: [], stress: [], total: 0 },
      6: { pain: [], stool: [], stress: [], total: 0 },
    };

    for (const log of symptoms) {
      const dayOfWeek = getDay(parseISO(log.date));
      dayGroups[dayOfWeek].pain.push(log.painLevel);
      dayGroups[dayOfWeek].stool.push(log.stoolFrequency);
      dayGroups[dayOfWeek].stress.push(log.stressLevel);
      dayGroups[dayOfWeek].total += 1;
    }

    // Build 7-day forecast starting from today
    const today = startOfDay(new Date());
    const days: DayForecast[] = [];

    for (let i = 0; i < 7; i++) {
      const date = addDays(today, i);
      const dow = getDay(date);
      const group = dayGroups[dow];

      if (group.total === 0) {
        // No data for this day — use overall average
        const allPain = symptoms.map(s => s.painLevel);
        const allStool = symptoms.map(s => s.stoolFrequency);
        const allStress = symptoms.map(s => s.stressLevel);
        const avgPain = allPain.reduce((a, b) => a + b, 0) / allPain.length;
        const avgStool = allStool.reduce((a, b) => a + b, 0) / allStool.length;
        const avgStress = allStress.reduce((a, b) => a + b, 0) / allStress.length;
        const flareHighCount = symptoms.filter(s => s.painLevel > 5).length;
        const flareRisk = (flareHighCount / symptoms.length) * 100;

        days.push({
          dayName: DAY_LABELS[dow],
          date: format(date, "MMM d"),
          avgPain: Math.round(avgPain * 10) / 10,
          avgStool: Math.round(avgStool * 10) / 10,
          avgStress: Math.round(avgStress * 10) / 10,
          flareRisk: Math.round(flareRisk),
          color: getRiskColor(flareRisk),
        });
      } else {
        const avgPain = group.pain.reduce((a, b) => a + b, 0) / group.pain.length;
        const avgStool = group.stool.reduce((a, b) => a + b, 0) / group.stool.length;
        const avgStress = group.stress.reduce((a, b) => a + b, 0) / group.stress.length;
        const flareHighCount = group.pain.filter(p => p > 5).length;
        const flareRisk = (flareHighCount / group.total) * 100;

        days.push({
          dayName: DAY_LABELS[dow],
          date: format(date, "MMM d"),
          avgPain: Math.round(avgPain * 10) / 10,
          avgStool: Math.round(avgStool * 10) / 10,
          avgStress: Math.round(avgStress * 10) / 10,
          flareRisk: Math.round(flareRisk),
          color: getRiskColor(flareRisk),
        });
      }
    }

    return days;
  }, [symptoms]);

  if (isLoading) {
    return (
      <div className="relative left-1/2 w-[calc(100dvw-2rem)] min-w-0 max-w-[calc(100dvw-2rem)] -translate-x-1/2 overflow-hidden box-border sm:left-auto sm:mx-auto sm:w-full sm:max-w-full sm:translate-x-0">
        <Card className="mx-auto w-full min-w-0 max-w-full overflow-hidden rounded-xl box-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-teal-600" />
              <Skeleton className="h-5 w-48" />
            </CardTitle>
          </CardHeader>
          <CardContent className="min-w-0 max-w-full overflow-hidden px-3 sm:px-6">
            <div className="grid w-full min-w-0 max-w-full grid-cols-1 justify-items-center gap-2 min-[420px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="w-full min-w-0 max-w-full space-y-2 overflow-hidden">
                  <Skeleton className="h-4 w-10 mx-auto" />
                  <Skeleton className="h-3 w-14 mx-auto" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-3 w-8 mx-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (symptoms.length < 5) {
    return (
      <div className="relative left-1/2 w-[calc(100dvw-2rem)] min-w-0 max-w-[calc(100dvw-2rem)] -translate-x-1/2 overflow-hidden box-border sm:left-auto sm:mx-auto sm:w-full sm:max-w-full sm:translate-x-0">
        <Card className="mx-auto w-full min-w-0 max-w-full overflow-hidden rounded-xl box-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-teal-600" />
              7-Day Symptom Forecast
            </CardTitle>
          </CardHeader>
          <CardContent className="min-w-0 max-w-full overflow-hidden px-3 sm:px-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CalendarClock className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                Need at least 5 logged days to generate a forecast.
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Keep logging daily for better predictions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

 return (
  <motion.div
    className="relative left-1/2 w-[calc(100dvw-2rem)] min-w-0 max-w-[calc(100dvw-2rem)] -translate-x-1/2 overflow-hidden box-border sm:left-auto sm:mx-auto sm:w-full sm:max-w-full sm:translate-x-0"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <Card className="mx-auto w-full min-w-0 max-w-full overflow-hidden rounded-xl box-border">
      <CardHeader className="pb-2 min-w-0 max-w-full overflow-hidden">
        <CardTitle className="flex min-w-0 items-center gap-2 text-base font-semibold">
          <CalendarClock className="h-4 w-4 shrink-0 text-teal-600" />
          <span className="min-w-0 truncate">7-Day Symptom Forecast</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0 w-full min-w-0 max-w-full overflow-hidden px-2 sm:px-4">
        <div className="grid w-full min-w-0 max-w-full grid-cols-1 justify-items-center gap-3 min-[520px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
          {forecast.map((day, i) => (
            <motion.div
              key={`${day.dayName}-${day.date}`}
              className={`mx-auto w-full min-w-0 max-w-full rounded-lg border bg-card p-3 text-center space-y-2 overflow-hidden box-border hover-lift transition-shadow ${
                i === 0
                  ? "ring-2 ring-primary/50 shadow-md shadow-primary/10 border-primary/30"
                  : ""
              }`}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.06, duration: 0.4, ease: "easeOut" }}
            >
              <p className="truncate text-[10px] font-semibold text-foreground">
                {day.dayName}
              </p>

              <p
                className={`truncate text-[9px] ${
                  i === 0 ? "text-primary font-medium" : "text-muted-foreground"
                }`}
              >
                {day.date}
                {i === 0 ? " •" : ""}
              </p>

              <div className="relative mx-auto h-1.5 w-full min-w-0 overflow-hidden rounded-full bg-muted/60">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ backgroundColor: day.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(day.flareRisk, 8)}%` }}
                  transition={{
                    delay: i * 0.06 + 0.2,
                    duration: 0.6,
                    ease: "easeOut",
                  }}
                />
              </div>

              <div className="flex min-w-0 items-center justify-center gap-1 overflow-hidden">
                <div
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: day.color }}
                />
                <span
                  className="truncate text-[8px] font-medium"
                  style={{ color: day.color }}
                >
                  {getRiskLabel(day.flareRisk)}
                </span>
              </div>

              <div className="min-w-0 overflow-hidden">
                <p className="truncate text-base font-bold leading-none text-foreground">
                  {day.avgPain}
                </p>
                <p className="truncate text-[8px] text-muted-foreground mt-0.5">
                  avg pain
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="mt-3 text-center text-[11px] text-muted-foreground/60">
          Based on historical patterns by day of week. Not a medical prediction.
        </p>
      </CardContent>
    </Card>
  </motion.div>
);
}
