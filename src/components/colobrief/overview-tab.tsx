"use client";

import { useMemo } from "react";
import { useAnimatedNumber } from "@/hooks/use-animated-number";
import { motion } from "framer-motion";
import {
  Activity,
  UtensilsCrossed,
  Brain,
  FileText,
  Pill,
  Droplets,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  CalendarDays,
  Trophy,
  ShieldAlert,
  Flame,
} from "lucide-react";
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
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
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
  stressLevel: {
    label: "Stress Level",
    color: "#f59e0b",
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

const scatterConfig: ChartConfig = {
  scatter: { label: "Pain vs Stress", color: "#0d9488" },
};

function getStoolEmoji(type: number): string {
  if (type <= 2) return "🪨";
  if (type <= 4) return "✅";
  if (type <= 6) return "⚠️";
  return "🚨";
}

function CircularGauge({ value, max = 10, size = 48, strokeWidth = 4, color = "#0d9488" }: { value: number; max?: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(value / max, 1) * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/30" />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={circumference - progress} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
    </svg>
  );
}

interface MetricCardData {
  label: string;
  value: string;
  rawValue: number;
  suffix: string;
  decimals: number;
  icon: React.ComponentType<{ className?: string }>;
  prev: number | null | undefined;
  color: string;
  bgColor: string;
  borderColor: string;
  sparklineColor: string;
  sparkData: number[];
  gaugeMax?: number;
  gaugeColor?: string;
}

interface OverviewTabProps {
  symptoms: SymptomLog[];
  isLoading: boolean;
}

function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return <Minus className="h-4 w-4 text-muted-foreground" />;
  const diff = current - previous;
  if (Math.abs(diff) < 0.5) return <Minus className="h-4 w-4 text-muted-foreground" />;
  if (diff < 0) return <TrendingDown className="h-4 w-4 text-emerald-500" />;
  return <TrendingUp className="h-4 w-4 text-rose-500" />;
}

function MiniSparkline({ dataPoints, color }: { dataPoints: number[]; color: string }) {
  if (dataPoints.length === 0) return null;
  const max = Math.max(...dataPoints, 1);
  return (
    <div className="flex items-end gap-[3px] h-6 mt-2">
      {dataPoints.slice(-5).map((val, i) => {
        const height = Math.max(Math.round((val / max) * 24), 2);
        return (
          <div
            key={i}
            className="w-[6px] rounded-sm opacity-60"
            style={{
              height: `${height}px`,
              backgroundColor: color,
            }}
          />
        );
      })}
    </div>
  );
}

function AnimatedMetricCard({ card, index }: { card: MetricCardData; index: number }) {
  const animatedValue = useAnimatedNumber(card.rawValue);
  const displayValue = card.decimals > 0
    ? animatedValue.toFixed(card.decimals)
    : String(Math.round(animatedValue));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className={`rounded-xl border-0 shadow-sm border-l-4 ${card.borderColor} hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 hover:border-teal-200 dark:hover:border-teal-800`}>
        <CardContent className="p-5 relative">
          {card.gaugeMax && (
            <div className="absolute top-2 right-2">
              <CircularGauge value={card.rawValue} max={card.gaugeMax} color={card.gaugeColor} />
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className={`rounded-lg p-2.5 ${card.bgColor}`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            {card.prev !== null && (
              <TrendIndicator current={card.rawValue} previous={card.prev!} />
            )}
          </div>
          <div className="mt-3">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="text-2xl font-bold mt-0.5">
              {displayValue}<span className="text-base font-medium text-muted-foreground ml-0.5">{card.suffix}</span>
            </p>
          </div>
          {card.sparkData.length > 0 && (
            <MiniSparkline dataPoints={card.sparkData} color={card.sparklineColor} />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function OverviewTab({ symptoms, isLoading }: OverviewTabProps) {
  const sevenDaysAgo = useMemo(() => subDays(new Date(), 7), []);
  const threeDaysAgo = useMemo(() => subDays(new Date(), 3), []);

  const metrics = useMemo(() => {
    if (!symptoms.length) return null;
    const recent = symptoms.filter((s) => isAfter(parseISO(s.date), sevenDaysAgo));
    const older = symptoms.filter((s) => {
      const d = parseISO(s.date);
      return isAfter(d, subDays(sevenDaysAgo, 7)) && !isAfter(d, sevenDaysAgo);
    });

    const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
    const avgOld = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

    // Medication adherence: % of days with medication logged
    const medAdherence = symptoms.length
      ? (symptoms.filter((s) => s.medicationTaken && s.medicationTaken.trim() !== "").length / symptoms.length) * 100
      : 0;
    // Blood incidents: count of days with bloodInStool=true
    const bloodIncidents = symptoms.filter((s) => s.bloodInStool).length;

    return {
      avgPain: avg(recent.map((s) => s.painLevel)),
      prevPain: avgOld(older.map((s) => s.painLevel)),
      avgStool: avg(recent.map((s) => s.stoolFrequency)),
      prevStool: avgOld(older.map((s) => s.stoolFrequency)),
      avgStress: avg(recent.map((s) => s.stressLevel)),
      prevStress: avgOld(older.map((s) => s.stressLevel)),
      totalLogs: symptoms.length,
      medAdherence,
      bloodIncidents,
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
        stressLevel: s.stressLevel,
        bloodInStool: s.bloodInStool,
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

  const mostCommonStoolType = useMemo(() => {
    if (!stoolTypeDistribution.length) return null;
    return stoolTypeDistribution.reduce((best, cur) => (cur.value > best.value ? cur : best));
  }, [stoolTypeDistribution]);

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

  // Flare Risk Alert: 3-day rolling average of pain
  const flareAlert = useMemo(() => {
    const last3 = symptoms
      .filter((s) => isAfter(parseISO(s.date), threeDaysAgo))
      .map((s) => s.painLevel);
    if (last3.length === 0) return null;
    const avg = last3.reduce((a, b) => a + b, 0) / last3.length;
    if (avg > 6) return { level: "high" as const, avg };
    if (avg >= 4) return { level: "moderate" as const, avg };
    return { level: "stable" as const, avg };
  }, [symptoms, threeDaysAgo]);

  // Weekly Insights
  const weeklyInsights = useMemo(() => {
    if (symptoms.length < 2) return null;
    const sorted = [...symptoms].sort((a, b) => a.date.localeCompare(b.date));
    const mid = Math.ceil(sorted.length / 2);
    const firstHalf = sorted.slice(0, mid);
    const secondHalf = sorted.slice(mid);

    const avg = (arr: SymptomLog[], key: "painLevel" | "stressLevel" | "stoolFrequency") =>
      arr.length ? arr.reduce((sum, s) => sum + s[key], 0) / arr.length : 0;

    // Most improved metric (biggest decrease from first half to second half)
    const improvements = [
      { name: "Pain", diff: avg(firstHalf, "painLevel") - avg(secondHalf, "painLevel") },
      { name: "Stress", diff: avg(firstHalf, "stressLevel") - avg(secondHalf, "stressLevel") },
      { name: "Stool Freq", diff: avg(firstHalf, "stoolFrequency") - avg(secondHalf, "stoolFrequency") },
    ];
    const mostImproved = improvements.reduce((best, cur) => (cur.diff > best.diff ? cur : best), improvements[0]);

    // Worst & best days (pain*2 + stress)
    let worstDay: { date: string; score: number } | null = null;
    let bestDay: { date: string; score: number } | null = null;
    sorted.forEach((s) => {
      const score = s.painLevel * 2 + s.stressLevel;
      if (!worstDay || score > worstDay.score) worstDay = { date: s.date, score };
      if (!bestDay || score < bestDay.score) bestDay = { date: s.date, score };
    });

    // Top trigger
    const triggerMap: Record<string, number> = {};
    symptoms.forEach((s) => s.triggers.forEach((t) => { triggerMap[t] = (triggerMap[t] || 0) + 1; }));
    const topTrigger = Object.entries(triggerMap).sort(([, a], [, b]) => b - a)[0];

    return {
      mostImproved: mostImproved.diff > 0 ? mostImproved.name : null,
      worstDay: worstDay ? format(parseISO(worstDay.date), "MMM d") : "—",
      bestDay: bestDay ? format(parseISO(bestDay.date), "MMM d") : "—",
      topTrigger: topTrigger ? topTrigger[0] : "None",
    };
  }, [symptoms]);

  // Sparkline data for each metric
  const sparklineData = useMemo(() => {
    const sorted = [...symptoms].sort((a, b) => a.date.localeCompare(b.date));
    return {
      pain: sorted.slice(-5).map((s) => s.painLevel),
      stool: sorted.slice(-5).map((s) => s.stoolFrequency),
      stress: sorted.slice(-5).map((s) => s.stressLevel),
    };
  }, [symptoms]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
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
        className="flex flex-col items-center justify-center py-20 text-center max-w-lg mx-auto"
      >
        <div className="animate-gradient-bg rounded-2xl p-8 mb-6">
          <div className="relative">
            <Activity className="h-14 w-14 text-teal-600 mx-auto" />
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-amber-400 rounded-full animate-bounce" />
            <div className="absolute -bottom-1 -left-1 h-3 w-3 bg-rose-400 rounded-full animate-bounce [animation-delay:0.15s]" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">Welcome to ColoBrief AI</h3>
        <p className="text-muted-foreground mb-6">
          Start tracking your Ulcerative Colitis symptoms to unlock personalized insights, 
          trend analysis, and clinical handouts for your doctor.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
          {[
            { icon: "🎤", title: "Voice Log", desc: "Speak your symptoms naturally" },
            { icon: "✨", title: "AI Extract", desc: "AI parses your notes into data" },
            { icon: "📊", title: "Live Charts", desc: "See trends as you log" },
          ].map((tip) => (
            <div key={tip.title} className="rounded-lg border bg-card p-3 text-center">
              <span className="text-2xl">{tip.icon}</span>
              <p className="text-sm font-medium mt-1">{tip.title}</p>
              <p className="text-xs text-muted-foreground">{tip.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-6">
          Click <strong>"Load Demo Data"</strong> in the sidebar to explore with sample data
        </p>
      </motion.div>
    );
  }

  const metricCards = [
    {
      label: "Avg Pain Level",
      value: metrics ? `${metrics.avgPain.toFixed(1)}` : "—",
      rawValue: metrics?.avgPain ?? 0,
      suffix: "/10",
      decimals: 1,
      icon: Activity,
      prev: metrics?.prevPain,
      color: "text-rose-500",
      bgColor: "bg-rose-50",
      borderColor: "border-l-rose-400",
      sparklineColor: "#f43f5e",
      sparkData: sparklineData.pain,
      gaugeMax: 10,
      gaugeColor: "#f43f5e",
    },
    {
      label: "Avg Stool Frequency",
      value: metrics ? `${metrics.avgStool.toFixed(1)}` : "—",
      rawValue: metrics?.avgStool ?? 0,
      suffix: "/day",
      decimals: 1,
      icon: UtensilsCrossed,
      prev: metrics?.prevStool,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      borderColor: "border-l-teal-400",
      sparklineColor: "#0d9488",
      sparkData: sparklineData.stool,
    },
    {
      label: "Avg Stress Level",
      value: metrics ? `${metrics.avgStress.toFixed(1)}` : "—",
      rawValue: metrics?.avgStress ?? 0,
      suffix: "/10",
      decimals: 1,
      icon: Brain,
      prev: metrics?.prevStress,
      color: "text-amber-500",
      bgColor: "bg-amber-50",
      borderColor: "border-l-amber-400",
      sparklineColor: "#f59e0b",
      sparkData: sparklineData.stress,
      gaugeMax: 10,
      gaugeColor: "#f59e0b",
    },
    {
      label: "Total Logs",
      value: String(symptoms.length),
      rawValue: symptoms.length,
      suffix: "",
      decimals: 0,
      icon: FileText,
      prev: null,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      borderColor: "border-l-teal-400",
      sparklineColor: "#0d9488",
      sparkData: [],
    },
    {
      label: "Medication Adherence",
      value: metrics ? `${metrics.medAdherence.toFixed(0)}` : "—",
      rawValue: metrics?.medAdherence ?? 0,
      suffix: "%",
      decimals: 0,
      icon: Pill,
      prev: null,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      borderColor: "border-l-teal-400",
      sparklineColor: "#0d9488",
      sparkData: [],
      gaugeMax: 100,
      gaugeColor: "#0d9488",
    },
    {
      label: "Blood Incidents",
      value: String(metrics?.bloodIncidents ?? 0),
      rawValue: metrics?.bloodIncidents ?? 0,
      suffix: " days",
      decimals: 0,
      icon: Droplets,
      prev: null,
      color: "text-rose-500",
      bgColor: "bg-rose-50",
      borderColor: "border-l-rose-400",
      sparklineColor: "#ef4444",
      sparkData: [],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Flare Risk Alert Banner */}
      {flareAlert && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {flareAlert.level === "high" && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-semibold text-rose-800 text-sm">High Flare Risk</h4>
                <p className="text-rose-700 text-sm mt-0.5">
                  Your average pain level over the last 3 days is {flareAlert.avg.toFixed(1)}/10. Consider contacting your healthcare provider.
                </p>
              </div>
            </div>
          )}
          {flareAlert.level === "moderate" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-semibold text-amber-800 text-sm">Moderate Symptoms</h4>
                <p className="text-amber-700 text-sm mt-0.5">
                  Your recent pain levels are elevated. Continue monitoring and consider dietary adjustments.
                </p>
              </div>
            </div>
          )}
          {flareAlert.level === "stable" && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-semibold text-emerald-800 text-sm">Symptoms Stable</h4>
                <p className="text-emerald-700 text-sm mt-0.5">
                  Your recent readings look good. Keep up the great self-management!
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metricCards.map((card, i) => (
          <AnimatedMetricCard key={card.label} card={card} index={i} />
        ))}
      </div>

      {/* Weekly Insights */}
      {weeklyInsights && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <Card className="rounded-xl border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                Weekly Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-lg bg-emerald-50 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs text-muted-foreground">Most Improved</span>
                  </div>
                  <p className="text-sm font-semibold text-emerald-800">
                    {weeklyInsights.mostImproved || "No change yet"}
                  </p>
                </div>
                <div className="rounded-lg bg-rose-50 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldAlert className="h-4 w-4 text-rose-500" />
                    <span className="text-xs text-muted-foreground">Worst Day</span>
                  </div>
                  <p className="text-sm font-semibold text-rose-800">{weeklyInsights.worstDay}</p>
                </div>
                <div className="rounded-lg bg-teal-50 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-teal-600" />
                    <span className="text-xs text-muted-foreground">Best Day</span>
                  </div>
                  <p className="text-sm font-semibold text-teal-800">{weeklyInsights.bestDay}</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Flame className="h-4 w-4 text-amber-500" />
                    <span className="text-xs text-muted-foreground">Top Trigger</span>
                  </div>
                  <p className="text-sm font-semibold text-amber-800">{weeklyInsights.topTrigger}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

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
            <ChartContainer config={lineChartConfig} className="h-[320px] w-full">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="roseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="stressGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-stressLevel)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--color-stressLevel)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                {/* Area fills */}
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="stoolFrequency"
                  stroke="none"
                  fill="url(#tealGradient)"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="painLevel"
                  stroke="none"
                  fill="url(#roseGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="stressLevel"
                  stroke="var(--color-stressLevel)"
                  fill="url(#stressGradient)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  yAxisId="right"
                  dot={false}
                />
                {/* Lines on top */}
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="stoolFrequency"
                  stroke="var(--color-stoolFrequency)"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  dot={{ r: 4, fill: "var(--color-stoolFrequency)" }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="painLevel"
                  stroke="var(--color-painLevel)"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  dot={{ r: 4, fill: "var(--color-painLevel)" }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="stressLevel"
                  stroke="var(--color-stressLevel)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  dot={false}
                  activeDot={{ r: 5 }}
                />
                {/* Blood indicator dots rendered via custom activeDot on pain line */}
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                <div className="rounded-lg bg-muted/40 p-3 space-y-3">
                  {triggerCounts.map((t) => (
                    <div key={t.trigger} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm mb-1">
                          <span className="h-2 w-2 rounded-full bg-teal-500 shrink-0" />
                          <span className="font-bold">{t.count}</span>
                          <span className="font-medium truncate text-muted-foreground">{t.trigger}</span>
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

        {/* Pain-Stress Correlation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="rounded-xl border-0 shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Pain vs Stress Correlation</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {symptoms.length >= 2 ? (
                <ChartContainer config={scatterConfig} className="h-[200px] w-full">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="stressLevel" name="Stress" type="number" domain={[0, 10]} tick={{ fontSize: 11 }} className="fill-muted-foreground" label={{ value: "Stress →", position: "bottom", fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                    <YAxis dataKey="painLevel" name="Pain" type="number" domain={[0, 10]} tick={{ fontSize: 11 }} className="fill-muted-foreground" label={{ value: "Pain ↑", angle: -90, position: "insideLeft", fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Scatter data={symptoms.map(s => ({ x: s.stressLevel, y: s.painLevel, date: format(parseISO(s.date), "MMM d") }))} fill="var(--color-scatter)">
                      {symptoms.map((s, i) => (
                        <Cell key={i} fill={s.painLevel > 6 ? "#f43f5e" : s.painLevel > 3 ? "#f59e0b" : "#10b981"} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ChartContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Need at least 2 data points.</p>
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
                  <div className="relative">
                    <ChartContainer config={pieChartConfig} className="h-[200px] w-[200px] shrink-0">
                      <PieChart>
                        <defs>
                          <filter id="donutShadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
                          </filter>
                        </defs>
                        <Pie
                          data={stoolTypeDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={85}
                          dataKey="value"
                          nameKey="type"
                          stroke="none"
                          filter="url(#donutShadow)"
                        >
                          {stoolTypeDistribution.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ChartContainer>
                    {/* Center label */}
                    {mostCommonStoolType && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold text-foreground">Type {mostCommonStoolType.type}</span>
                        <span className="text-xs text-muted-foreground">Most Common</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 min-w-0">
                    {stoolTypeDistribution.map((entry) => (
                      <div key={entry.type} className="flex items-center gap-2 text-sm">
                        <div
                          className="h-3 w-3 rounded-sm shrink-0"
                          style={{ backgroundColor: entry.fill }}
                        />
                        <span className="text-muted-foreground truncate">{getStoolEmoji(entry.type)} Type {entry.type}</span>
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