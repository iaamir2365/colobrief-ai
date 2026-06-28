"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Cell, CartesianGrid } from "recharts";
import type { SymptomLog } from "@/types/symptom";

interface SeverityDistributionProps {
  symptoms: SymptomLog[];
  isLoading: boolean;
}

type SeverityBucket = "Mild" | "Moderate" | "High" | "Severe";

const SEVERITY_BUCKETS: {
  key: SeverityBucket;
  label: string;
  range: string;
  color: string;
  className: string;
  bgClassName: string;
  min: number;
  max: number;
}[] = [
  { key: "Mild", label: "Mild", range: "0–10", color: "#10b981", className: "text-emerald-600 dark:text-emerald-400", bgClassName: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300", min: 0, max: 10 },
  { key: "Moderate", label: "Moderate", range: "11–20", color: "#f59e0b", className: "text-amber-600 dark:text-amber-400", bgClassName: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300", min: 11, max: 20 },
  { key: "High", label: "High", range: "21–30", color: "#f97316", className: "text-orange-600 dark:text-orange-400", bgClassName: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300", min: 21, max: 30 },
  { key: "Severe", label: "Severe", range: "30+", color: "#f43f5e", className: "text-rose-600 dark:text-rose-400", bgClassName: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300", min: 31, max: Infinity },
];

const chartConfig: ChartConfig = {
  days: {
    label: "Days",
    color: "#10b981",
  },
  mild: { label: "Mild (0–10)", color: "#10b981" },
  moderate: { label: "Moderate (11–20)", color: "#f59e0b" },
  high: { label: "High (21–30)", color: "#f97316" },
  severe: { label: "Severe (30+)", color: "#f43f5e" },
};

function calcSeverityScore(s: SymptomLog): number {
  return (
    s.painLevel * 2 +
    s.stoolFrequency +
    s.stressLevel * 0.5 +
    (s.bloodInStool ? 5 : 0) +
    s.urgencyLevel * 1.5
  );
}

export default function SeverityDistribution({
  symptoms,
  isLoading,
}: SeverityDistributionProps) {
  const data = useMemo(() => {
    if (symptoms.length === 0) return null;

    const scores = symptoms.map((s) => calcSeverityScore(s));

    const buckets = SEVERITY_BUCKETS.map((b) => {
      const count = scores.filter((sc) => sc >= b.min && sc <= b.max).length;
      return { ...b, count };
    });

    const totalDays = scores.length;
    const mostCommon = buckets.reduce(
      (prev, curr) => (curr.count > prev.count ? curr : prev),
      buckets[0],
    );
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    return { buckets, totalDays, mostCommon, avgScore };
  }, [symptoms]);

  if (isLoading) {
    return (
      <Card className="rounded-xl border-0 shadow-sm">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-52" />
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <Skeleton className="h-50 rounded-lg" />
          <div className="flex justify-center">
            <Skeleton className="h-5 w-28 rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="rounded-xl border-0 shadow-sm card-premium">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-teal-500" />
            Symptom Severity Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted/50 p-3 mb-3">
              <BarChart3 className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="max-w-70 text-sm text-muted-foreground">
              No symptom data yet. Start logging to see your severity distribution.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.buckets.map((b) => ({
    name: b.label,
    range: b.range,
    days: b.count,
    fill: b.color,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.26 }}
    >
      <Card className="rounded-xl border-0 shadow-sm card-premium">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-teal-500" />
              Symptom Severity Distribution
            </CardTitle>
            {data.mostCommon.count > 0 && (
              <Badge className={`text-xs ${data.mostCommon.bgClassName}`}>
                {data.mostCommon.label}: {data.mostCommon.count} day{data.mostCommon.count !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Composite score per day (avg: {data.avgScore.toFixed(1)})
          </p>
        </CardHeader>

        <CardContent className="pt-0 space-y-3">
          <div className="w-full min-w-0">
            <ChartContainer config={chartConfig} className="h-47.5 w-full max-w-full min-w-0 sm:h-50">
            <BarChart data={chartData} barCategoryGap="20%" margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="range"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                interval={0}
                minTickGap={12}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                fontSize={11}
                width={26}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <span className="font-semibold">
                        {value as number} day{(value as number) !== 1 ? "s" : ""}
                      </span>
                    )}
                  />
                }
              />
              <Bar dataKey="days" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.fill}
                    className="transition-opacity hover:opacity-80"
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
          </div>

          {/* Count labels on top of bars — rendered as a visual summary */}
          <div className="grid grid-cols-2 gap-3 px-2 sm:grid-cols-4">
            {data.buckets.map((b, i) => (
              <motion.div
                key={b.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="flex flex-col items-center gap-0.5"
              >
                <span className={`text-sm font-bold ${b.className}`}>
                  {b.count}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {b.label}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Formula hint */}
          <div className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              Score = pain×2 + stool freq + stress×0.5 + blood(+5) + urgency×1.5
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
