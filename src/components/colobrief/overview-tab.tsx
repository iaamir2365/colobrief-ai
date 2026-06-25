"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Activity, UtensilsCrossed, Brain, FileText, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { format, subDays, parseISO, isAfter } from "date-fns";
import type { SymptomLog } from "@/types/symptom";

const BRISTOL_LABELS: Record<number, string> = {
  1: "Type 1: Hard lumps",
  2: "Type 2: Lumpy sausage",
  3: "Type 3: Sausage w/ cracks",
  4: "Type 4: Smooth soft",
  5: "Type 5: Soft blobs",
  6: "Type 6: Mushy",
  7: "Type 7: Watery",
};

const BRISTOL_COLORS = ["#94a3b8", "#a8a29e", "#a3e635", "#34d399", "#fbbf24", "#f97316", "#ef4444"];

const lineChartConfig: ChartConfig = {
  stoolFrequency: {
    label: "Stool Frequency",
    color: "#0d9488",
  },
  painLevel: {
    label: "Pain Level",
    color: "#f43f5e",
  },
};

const pieChartConfig: ChartConfig = {
  type1: { label: "Type 1", color: BRISTOL_COLORS[0] },
  type2: { label: "Type 2", color: BRISTOL_COLORS[1] },
  type3: { label: "Type 3", color: BRISTOL_COLORS[2] },
  type4: { label: "Type 4", color: BRISTOL_COLORS[3] },
  type5: { label: "Type 5", color: BRISTOL_COLORS[4] },
  type6: { label: "Type 6", color: BRISTOL_COLORS[5] },
  type7: { label: "Type 7", color: BRISTOL_COLORS[6] },
};

const barChartConfig: ChartConfig = {
  count: { label: "Occurrences", color: "#0d9488" },
};

interface OverviewTabProps {
  symptoms: SymptomLog[];
  isLoading: boolean;
}

function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return <Minus className="h-4 w-4 text-muted-foreground" />;
  const diff = current - previous;
  if (Math.abs(diff) < 0.5) return <Minus className="h-4 w-4 text-muted-foreground" />;
  if (diff < 0) return <TrendingDown className="h-4 w-4 text-emerald-500" />;
  return <TrendingUp className="h-4 w-4 text-coral-500" />;
}

export default function OverviewTab({ symptoms, isLoading }: OverviewTabProps) {
  const sevenDaysAgo = useMemo(() => subDays(new Date(), 7), []);

  const metrics = useMemo(() => {
    if (!symptoms.length) return null;
    const recent = symptoms.filter((s) => isAfter(parseISO(s.date), sevenDaysAgo));
    const older = symptoms.filter((s) => {
      const d = parseISO(s.date);
      return isAfter(d, subDays(sevenDaysAgo, 7)) && !isAfter(d, sevenDaysAgo);
    });

    const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
    const avgOld = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

    return {
      avgPain: avg(recent.map((s) => s.painLevel)),
      prevPain: avgOld(older.map((s) => s.painLevel)),
      avgStool: avg(recent.map((s) => s.stoolFrequency)),
      prevStool: avgOld(older.map((s) => s.stoolFrequency)),
      avgStress: avg(recent.map((s) => s.stressLevel)),
      prevStress: avgOld(older.map((s) => s.stressLevel)),
      totalLogs: symptoms.length,
    };
  }, [symptoms, sevenDaysAgo]);

  const chartData = useMemo(() => {
    return [...symptoms]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((s) => ({
        date: format(parseISO(s.date), "MMM d"),
        fullDate: s.date,
        stoolFrequency: s.stoolFrequency,
        painLevel: s.painLevel,
      }));
  }, [symptoms]);

  const stoolTypeDistribution = useMemo(() => {
    const counts: Record<number, number> = {};
    symptoms.forEach((s) => {
      const t = Math.round(s.stoolType);
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([type, count]) => ({
        name: BRISTOL_LABELS[Number(type)] || `Type ${type}`,
        value: count,
        fill: BRISTOL_COLORS[Number(type) - 1] || "#94a3b8",
        type: Number(type),
      }));
  }, [symptoms]);

  const triggerCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    symptoms.forEach((s) => {
      s.triggers.forEach((t) => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([trigger, count]) => ({ trigger, count }));
  }, [symptoms]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!symptoms.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="rounded-full bg-teal-50 p-6 mb-6">
          <FileText className="h-10 w-10 text-teal-600" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">No data yet</h3>
        <p className="text-muted-foreground max-w-md">
          Start logging your symptoms to see your personalized dashboard with trends, triggers, and insights.
        </p>
      </motion.div>
    );
  }

  const metricCards = [
    {
      label: "Avg Pain Level",
      value: metrics ? metrics.avgPain.toFixed(1) : "—",
      icon: Activity,
      prev: metrics?.prevPain,
      color: "text-coral-500",
      bgColor: "bg-rose-50",
    },
    {
      label: "Avg Stool Frequency",
      value: metrics ? metrics.avgStool.toFixed(1) : "—",
      icon: UtensilsCrossed,
      prev: metrics?.prevStool,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
    },
    {
      label: "Avg Stress Level",
      value: metrics ? metrics.avgStress.toFixed(1) : "—",
      icon: Brain,
      prev: metrics?.prevStress,
      color: "text-amber-500",
      bgColor: "bg-amber-50",
    },
    {
      label: "Total Logs",
      value: String(symptoms.length),
      icon: FileText,
      prev: null,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="rounded-xl border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className={`rounded-lg p-2.5 ${card.bgColor}`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  {card.prev !== null && (
                    <TrendIndicator current={Number(card.value)} previous={card.prev} />
                  )}
                </div>
                <div className="mt-3">
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-2xl font-bold mt-0.5">{card.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Line Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="rounded-xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Symptom Trends</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ChartContainer config={lineChartConfig} className="h-[300px] w-full">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="stoolFrequency"
                  stroke="var(--color-stoolFrequency)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "var(--color-stoolFrequency)" }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="painLevel"
                  stroke="var(--color-painLevel)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "var(--color-painLevel)" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Most Common Triggers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="rounded-xl border-0 shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Most Common Triggers</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {triggerCounts.length ? (
                <div className="space-y-3">
                  {triggerCounts.map((t) => (
                    <div key={t.trigger} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium truncate">{t.trigger}</span>
                          <span className="text-muted-foreground ml-2">{t.count}×</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-teal-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${(t.count / (triggerCounts[0]?.count || 1)) * 100}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No triggers logged yet.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Stool Type Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="rounded-xl border-0 shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Bristol Stool Type Distribution</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {stoolTypeDistribution.length ? (
                <div className="flex items-center gap-4">
                  <ChartContainer config={pieChartConfig} className="h-[200px] w-[200px] shrink-0">
                    <PieChart>
                      <Pie
                        data={stoolTypeDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={85}
                        dataKey="value"
                        nameKey="type"
                        stroke="none"
                      >
                        {stoolTypeDistribution.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                  <div className="flex flex-col gap-2 min-w-0">
                    {stoolTypeDistribution.map((entry) => (
                      <div key={entry.type} className="flex items-center gap-2 text-sm">
                        <div
                          className="h-3 w-3 rounded-sm shrink-0"
                          style={{ backgroundColor: entry.fill }}
                        />
                        <span className="text-muted-foreground truncate">Type {entry.type}</span>
                        <Badge variant="secondary" className="ml-auto shrink-0 text-xs">
                          {entry.value}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No stool type data yet.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}