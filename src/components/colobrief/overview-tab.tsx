"use client";

import { useMemo } from "react";
import { useAnimatedNumber } from "@/hooks/use-animated-number";
import { useIsMobile } from "@/hooks/use-mobile";
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
  GitCompareArrows,
  ArrowRight,
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
  ScatterChart,
  Scatter,
  ReferenceLine,
  ZAxis,
} from "recharts";
import { format, subDays, parseISO, isAfter, startOfDay } from "date-fns";
import type { SymptomLog } from "@/types/symptom";
import HealthScoreCard from "@/components/colobrief/health-score-card";
import MedicationTracker from "@/components/colobrief/medication-tracker";
import TriggerCorrelation from "@/components/colobrief/trigger-correlation";
import SymptomCalendar from "@/components/colobrief/symptom-calendar";
import AIInsightsPanel from "@/components/colobrief/ai-insights-panel";
import StreakCounter from "@/components/colobrief/streak-counter";
import WeeklyProgressSummary from "@/components/colobrief/weekly-progress-summary";
import SymptomTimeline from "@/components/colobrief/symptom-timeline";
import EmergencyAlertBanner from "@/components/colobrief/emergency-alert-banner";
import FlareRiskPredictor from "@/components/colobrief/flare-risk-predictor";
import BloodTracker from "@/components/colobrief/blood-tracker";
import SymptomForecast from "@/components/colobrief/symptom-forecast";
import SymptomRadar from "@/components/colobrief/symptom-radar";
import SeverityDistribution from "@/components/colobrief/severity-distribution";
import SymptomInsights from "@/components/colobrief/symptom-insights";


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

const enhancedScatterConfig: ChartConfig = {
  stressLevel: { label: "Stress Level", color: "#14b8a6" },
  painLevel: { label: "Pain Level", color: "#0d9488" },
  trend: { label: "Trend Line", color: "#0d9488" },
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
    <div className="mt-2 flex h-6 items-end gap-[3px]">
      {dataPoints.slice(-5).map((val, i) => {
        const height = Math.max(Math.round((val / max) * 24), 2);
        return (
          <div
            key={i}
            className="w-1.5 rounded-sm opacity-60"
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
  const isMobile = useIsMobile();
  const displayValue = card.decimals > 0
    ? animatedValue.toFixed(card.decimals)
    : String(Math.round(animatedValue));

  return (
    <motion.div
      className="mx-auto w-full min-w-0 max-w-[calc(100vw-1rem)] sm:max-w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 200, damping: 20 }}
    >
      <Card className={`mx-auto h-full w-full min-w-0 max-w-full overflow-hidden rounded-xl border-0 card-premium hover-lift border-l-4 ${card.borderColor}`}>
        <CardContent className="relative flex h-full min-w-0 flex-col p-3 md:p-5">
          {card.gaugeMax && !isMobile && (
            <div className="absolute top-3 right-3">
              <CircularGauge value={card.rawValue} max={card.gaugeMax} color={card.gaugeColor} />
            </div>
          )}
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className={`shrink-0 rounded-lg p-2.5 ${card.bgColor}`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            {card.prev !== null ? (
              <div className="flex shrink-0 items-center gap-1">
                <TrendIndicator current={card.rawValue} previous={card.prev!} />
                <span className="hidden whitespace-nowrap text-[10px] text-muted-foreground min-[360px]:inline">vs last wk</span>
              </div>
            ) : (
              <div className="w-[60px] shrink-0" />
            )}
          </div>
          <div className="mt-4 min-w-0 grow">
            <p className="break-words text-xs text-muted-foreground md:text-sm">{card.label}</p>
            <p className="mt-0.5 flex min-w-0 flex-wrap items-baseline break-words text-xl font-bold md:text-2xl stat-value" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.06)" }}>
              {displayValue}<span className="text-sm md:text-base font-medium text-muted-foreground ml-0.5">{card.suffix}</span>
            </p>
          </div>
          {card.sparkData.length > 0 ? (
            <MiniSparkline dataPoints={card.sparkData} color={card.sparklineColor} />
          ) : (
            <div className="h-[30px]" />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function QuickStatsStrip({ symptoms }: { symptoms: SymptomLog[] }) {
  const today = startOfDay(new Date());
  const weekStart = subDays(today, 6);

  const thisWeek = useMemo(() => {
    return symptoms.filter((s) => {
      const d = parseISO(s.date);
      return (d >= weekStart && d <= today) || d.toISOString().slice(0, 10) === format(today, "yyyy-MM-dd");
    });
  }, [symptoms, weekStart, today]);

  const totalDays = symptoms.length;
  const avgPainWeek = thisWeek.length
    ? (thisWeek.reduce((a, s) => a + s.painLevel, 0) / thisWeek.length).toFixed(1)
    : "—";
  const bestDay = thisWeek.length
    ? thisWeek.reduce((best, s) => (s.painLevel < best.painLevel ? s : best), thisWeek[0])
    : null;
  const daysInWeek = 7;
  const completeness = Math.round((thisWeek.length / daysInWeek) * 100);

  const items = [
    { icon: CalendarDays, label: "Days Tracked", value: String(totalDays), color: "text-teal-600" },
    { icon: Activity, label: "Avg Pain (wk)", value: String(avgPainWeek), color: "text-rose-500" },
    { icon: CheckCircle, label: "Best Day", value: bestDay ? format(parseISO(bestDay.date), "MMM d") : "—", color: "text-emerald-600" },
    { icon: Trophy, label: "Completeness", value: `${completeness}%`, color: "text-amber-500" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="card-premium mx-auto box-border w-full min-w-0 max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl p-3 sm:max-w-full">
        <div className="mx-auto grid w-full min-w-0 max-w-full grid-cols-2 justify-items-center gap-2 sm:grid-cols-4 sm:gap-3">
          {items.map((item, i) => (
            <motion.div
              key={item.label}
              className="flex min-w-0 max-w-full flex-col items-center gap-1 text-center"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 + 0.1, duration: 0.3 }}
            >
              <item.icon className={`h-4 w-4 shrink-0 ${item.color}`} />
              <div className="min-w-0">
                <p className="text-[10px] leading-tight text-muted-foreground">{item.label}</p>
                <p className={`text-sm font-semibold leading-tight ${item.color}`}>{item.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function OverviewTab({ symptoms, isLoading }: OverviewTabProps) {
  const isMobile = useIsMobile();

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
      const t = Math.round(s.stoolType ?? 4);
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
    let worstDayDate = "—";
    let bestDayDate = "—";
    let worstScore = Number.NEGATIVE_INFINITY;
    let bestScore = Number.POSITIVE_INFINITY;
    sorted.forEach((s) => {
      const score = s.painLevel * 2 + s.stressLevel;
      if (score > worstScore) {
        worstScore = score;
        worstDayDate = format(parseISO(s.date), "MMM d");
      }
      if (score < bestScore) {
        bestScore = score;
        bestDayDate = format(parseISO(s.date), "MMM d");
      }
    });

    // Top trigger
    const triggerMap: Record<string, number> = {};
    symptoms.forEach((s) => s.triggers.forEach((t) => { triggerMap[t] = (triggerMap[t] || 0) + 1; }));
    const topTrigger = Object.entries(triggerMap).sort(([, a], [, b]) => b - a)[0];

    return {
      mostImproved: mostImproved.diff > 0 ? mostImproved.name : null,
      worstDay: worstDayDate,
      bestDay: bestDayDate,
      topTrigger: topTrigger ? topTrigger[0] : "None",
    };
  }, [symptoms]);

  // Period comparison data for first half vs second half
  const periodComparison = useMemo(() => {
    if (symptoms.length < 4) return null;
    const sorted = [...symptoms].sort((a, b) => a.date.localeCompare(b.date));
    const mid = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, mid);
    const secondHalf = sorted.slice(mid);

    const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

    const firstAvgPain = avg(firstHalf.map((s) => s.painLevel));
    const secondAvgPain = avg(secondHalf.map((s) => s.painLevel));
    const firstAvgStool = avg(firstHalf.map((s) => s.stoolFrequency));
    const secondAvgStool = avg(secondHalf.map((s) => s.stoolFrequency));
    const firstAvgStress = avg(firstHalf.map((s) => s.stressLevel));
    const secondAvgStress = avg(secondHalf.map((s) => s.stressLevel));
    const firstBloodPct = firstHalf.length ? Math.round((firstHalf.filter((s) => s.bloodInStool).length / firstHalf.length) * 100) : 0;
    const secondBloodPct = secondHalf.length ? Math.round((secondHalf.filter((s) => s.bloodInStool).length / secondHalf.length) * 100) : 0;

    // Most common trigger per half
    const topTrigger = (arr: typeof symptoms) => {
      const map: Record<string, number> = {};
      arr.forEach((s) => s.triggers.forEach((t) => { map[t] = (map[t] || 0) + 1; }));
      const entry = Object.entries(map).sort(([, a], [, b]) => b - a)[0];
      return entry ? entry[0] : "None";
    };

    return {
      first: {
        avgPain: firstAvgPain,
        avgStool: firstAvgStool,
        avgStress: firstAvgStress,
        bloodPct: firstBloodPct,
        topTrigger: topTrigger(firstHalf),
        dateRange: `${format(parseISO(firstHalf[0].date), "MMM d")} — ${format(parseISO(firstHalf[firstHalf.length - 1].date), "MMM d")}`,
      },
      second: {
        avgPain: secondAvgPain,
        avgStool: secondAvgStool,
        avgStress: secondAvgStress,
        bloodPct: secondBloodPct,
        topTrigger: topTrigger(secondHalf),
        dateRange: `${format(parseISO(secondHalf[0].date), "MMM d")} — ${format(parseISO(secondHalf[secondHalf.length - 1].date), "MMM d")}`,
      },
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

  // Stress vs Pain scatter analysis with linear regression
  const scatterAnalysis = useMemo(() => {
    if (symptoms.length < 2)
      return null;

    const points = symptoms.map((s) => ({
      x: s.stressLevel,
      y: s.painLevel,
      date: format(parseISO(s.date), "MMM d"),
    }));

    const n = symptoms.length;
    const sumX = symptoms.reduce((acc, s) => acc + s.stressLevel, 0);
    const sumY = symptoms.reduce((acc, s) => acc + s.painLevel, 0);
    const sumXY = symptoms.reduce(
      (acc, s) => acc + s.stressLevel * s.painLevel,
      0
    );
    const sumX2 = symptoms.reduce(
      (acc, s) => acc + s.stressLevel ** 2,
      0
    );
    const sumY2 = symptoms.reduce(
      (acc, s) => acc + s.painLevel ** 2,
      0
    );

    const denomX = n * sumX2 - sumX * sumX;
    const denomY = n * sumY2 - sumY * sumY;
    const denom = Math.sqrt(Math.abs(denomX * denomY));

    const correlation =
      denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;

    let trendLine: { x: number; y: number }[] = [];
    if (denomX !== 0) {
      const slope = (n * sumXY - sumX * sumY) / denomX;
      const intercept = (sumY - slope * sumX) / n;
      trendLine = [
        { x: 0, y: Math.max(0, Math.min(10, intercept)) },
        {
          x: 10,
          y: Math.max(0, Math.min(10, slope * 10 + intercept)),
        },
      ];
    }

    const avgStress = sumX / n;
    const avgPain = sumY / n;

    return { points, trendLine, correlation, avgStress, avgPain };
  }, [symptoms]);

  if (isLoading) {
    return (
      <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 space-y-6 overflow-hidden px-2 sm:left-auto sm:mx-auto sm:w-full sm:max-w-full sm:translate-x-0 sm:px-0">
        <div className="grid w-full min-w-0 grid-cols-1 justify-items-center gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
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
        className="bg-mesh mx-auto box-border flex w-full min-w-0 max-w-[calc(100vw-1rem)] flex-col items-center justify-center overflow-hidden rounded-2xl px-4 py-16 text-center sm:max-w-lg sm:py-24"
      >
        <div className="animate-gradient-bg rounded-2xl p-10 mb-6">
          <div className="relative">
            <Activity className="h-20 w-20 text-teal-600 mx-auto" />
            <div className="absolute -top-1 -right-1 h-5 w-5 bg-amber-400 rounded-full animate-bounce" />
            <div className="absolute -bottom-1 -left-1 h-4 w-4 bg-rose-400 rounded-full animate-bounce [animation-delay:0.15s]" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2">Welcome to ColoBrief AI</h3>
        <p className="text-muted-foreground mb-8 max-w-sm">
          Start tracking your Ulcerative Colitis symptoms to unlock personalized insights, 
          trend analysis, and clinical handouts for your doctor.
        </p>
        <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { icon: "📊", title: "Load Demo Data", desc: "Explore with 14 days of sample UC data", highlight: true },
            { icon: "📝", title: "Log First Symptom", desc: "Start tracking your daily symptoms", highlight: false },
            { icon: "📖", title: "Learn More", desc: "Discover all features and tips", highlight: false },
          ].map((tip) => (
            <div key={tip.title} className={`rounded-xl border p-4 text-center transition-all hover-lift ${tip.highlight ? 'bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/20 border-primary/30 shadow-sm' : 'bg-card'}`}>
              <span className="text-3xl">{tip.icon}</span>
              <p className="text-sm font-semibold mt-2">{tip.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{tip.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-8">
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
    <div id="overview-content" className="relative left-1/2 box-border w-screen max-w-[100vw] -translate-x-1/2 space-y-4 overflow-x-hidden px-2 sm:left-auto sm:mx-auto sm:w-full sm:max-w-full sm:translate-x-0 sm:px-0 md:space-y-8 md:px-4 [&>*]:mx-auto [&>*]:w-full [&>*]:min-w-0 [&>*]:max-w-[calc(100vw-1rem)] sm:[&>*]:max-w-full">
      {/* Emergency Alert Banner */}
      <section className="mx-auto w-full min-w-0 max-w-[calc(100vw-1rem)] overflow-hidden sm:max-w-full">
        <EmergencyAlertBanner symptoms={symptoms} isLoading={isLoading} />
      </section>

      {/* Quick Stats Mini Bar */}
      <section className="mx-auto w-full min-w-0 max-w-[calc(100vw-1rem)] overflow-hidden sm:max-w-full">
        <QuickStatsStrip symptoms={symptoms} />
      </section>

      {/* 7-Day Symptom Forecast */}
      <section className="mx-auto w-full min-w-0 max-w-[calc(100vw-1rem)] overflow-hidden sm:max-w-full">
        <SymptomForecast symptoms={symptoms} isLoading={isLoading} />
      </section>

      {/* Health Score + Weekly Progress Row */}
      <section className="mx-auto grid w-full min-w-0 max-w-[calc(100vw-1rem)] grid-cols-1 justify-items-center gap-4 overflow-hidden sm:max-w-full md:grid-cols-2 md:gap-6">
        <div className="mx-auto w-full min-w-0 max-w-[calc(100vw-1rem)] overflow-hidden sm:max-w-full">
          <HealthScoreCard symptoms={symptoms} isLoading={false} />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="mx-auto w-full min-w-0 max-w-[calc(100vw-1rem)] overflow-hidden sm:max-w-full"
        >
          <WeeklyProgressSummary symptoms={symptoms} isLoading={false} />
        </motion.div>
      </section>

      {/* Flare Risk Alert Banner */}
      {flareAlert ? (
        <motion.div
          className="mx-auto w-full min-w-0 max-w-[calc(100vw-1rem)] overflow-hidden sm:max-w-full"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div>
            {flareAlert.level === "high" && (
              <div className="card-premium flex min-w-0 items-start gap-3 overflow-hidden rounded-xl border border-rose-300 bg-gradient-to-r from-rose-50 to-rose-100/50 p-4 dark:border-rose-700/60 dark:from-rose-950/40 dark:to-rose-900/20">
                <div className="rounded-full bg-rose-100 dark:bg-rose-900/60 p-2 shrink-0">
                  <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-rose-800 dark:text-rose-300">High Flare Risk</h4>
                  <p className="mt-0.5 break-words text-sm text-rose-700 dark:text-rose-400">
                    Your average pain level over the last 3 days is {flareAlert.avg.toFixed(1)}/10. Consider contacting your healthcare provider.
                  </p>
                </div>
              </div>
            )}
            {flareAlert.level === "moderate" && (
              <div className="card-premium flex min-w-0 items-start gap-3 overflow-hidden rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 to-amber-100/50 p-4 dark:border-amber-700/60 dark:from-amber-950/40 dark:to-amber-900/20">
                <div className="rounded-full bg-amber-100 dark:bg-amber-900/60 p-2 shrink-0">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">Moderate Symptoms</h4>
                  <p className="mt-0.5 break-words text-sm text-amber-700 dark:text-amber-400">
                    Your recent pain levels are elevated. Continue monitoring and consider dietary adjustments.
                  </p>
                </div>
              </div>
            )}
            {flareAlert.level === "stable" && (
              <div className="card-premium flex min-w-0 items-start gap-3 overflow-hidden rounded-xl border border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 dark:border-emerald-700/60 dark:from-emerald-950/40 dark:to-teal-950/30">
                <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/60 p-2 shrink-0">
                  <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Symptoms Stable</h4>
                  <p className="mt-0.5 break-words text-sm text-emerald-700 dark:text-emerald-400">
                    Your recent readings look good. Keep up the great self-management!
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        <section className="mx-auto w-full min-w-0 max-w-[calc(100vw-1rem)] overflow-hidden sm:max-w-full">
          <div className="rounded-xl border-0 shadow-sm bg-card flex items-center justify-center p-4">
            <p className="text-sm text-muted-foreground">No recent flare data available yet.</p>
          </div>
        </section>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="mx-auto w-full min-w-0 max-w-[calc(100vw-1rem)] overflow-hidden sm:max-w-full"
      >
        <StreakCounter symptoms={symptoms} />
      </motion.div>

      {/* Metric Cards */}
      <section className="mx-auto w-full min-w-0 max-w-[calc(100vw-1rem)] overflow-hidden sm:max-w-full">
        <div className="grid min-w-0 max-w-full grid-cols-[repeat(auto-fit,minmax(min(100%,9.5rem),1fr))] gap-3 md:gap-4 xl:grid-cols-6">
          {metricCards.map((card, i) => (
            <AnimatedMetricCard key={card.label} card={card} index={i} />
          ))}
        </div>
      </section>

      {/* Weekly Insights */}
      {weeklyInsights && (
        <motion.div
          className="mx-auto w-full min-w-0 max-w-[calc(100vw-1rem)] overflow-hidden sm:max-w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <Card className="min-w-0 max-w-full overflow-hidden rounded-xl border-0 card-premium card-glow bg-gradient-subtle">
            <CardHeader className="pb-3">
              <CardTitle className="flex min-w-0 items-center gap-2 break-words text-base font-semibold">
                <Trophy className="h-4 w-4 text-amber-500" />
                Weekly Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs text-muted-foreground">Most Improved</span>
                  </div>
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                    {weeklyInsights.mostImproved || "No change yet"}
                  </p>
                </div>
                <div className="rounded-lg bg-rose-50 dark:bg-rose-950/30 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldAlert className="h-4 w-4 text-rose-500" />
                    <span className="text-xs text-muted-foreground">Worst Day</span>
                  </div>
                  <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">{weeklyInsights.worstDay}</p>
                </div>
                <div className="rounded-lg bg-teal-50 dark:bg-teal-950/30 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-teal-600" />
                    <span className="text-xs text-muted-foreground">Best Day</span>
                  </div>
                  <p className="text-sm font-semibold text-teal-800 dark:text-teal-300">{weeklyInsights.bestDay}</p>
                </div>
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Flame className="h-4 w-4 text-amber-500" />
                    <span className="text-xs text-muted-foreground">Top Trigger</span>
                  </div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">{weeklyInsights.topTrigger}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Symptom Calendar Heatmap */}
      <section className="mx-auto w-full min-w-0 max-w-[calc(100vw-1rem)] overflow-hidden sm:max-w-full">
        <SymptomCalendar symptoms={symptoms} isLoading={false} />
      </section>

      {/* Main Line Chart */}
      <motion.div
        className="mx-auto w-full min-w-0 max-w-[calc(100vw-1rem)] overflow-hidden sm:max-w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
          <Card className="mx-auto w-full min-w-0 max-w-full overflow-hidden rounded-xl border-0 card-premium">
          <CardHeader className="pb-2">
            <CardTitle className="min-w-0 break-words text-base font-semibold">Symptom Trends</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 p-2 sm:p-6">
              <div className="mx-auto w-full min-w-0 max-w-full overflow-hidden">
                <ChartContainer config={lineChartConfig} className="mx-auto h-[220px] w-full min-w-0 max-w-full overflow-hidden sm:h-80">
              <LineChart
                data={chartData}
                margin={isMobile ? { top: 5, right: 4, left: -20, bottom: 0 } : { top: 5, right: 10, left: -20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="roseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="stressGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="scatterTealGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                  interval="preserveStartEnd"
                  minTickGap={isMobile ? 24 : 16}
                  className="fill-muted-foreground"
                />
                <YAxis yAxisId="left" tick={{ fontSize: isMobile ? 10 : 12 }} width={isMobile ? 26 : 32} className="fill-muted-foreground" interval="preserveStartEnd" />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                  width={isMobile ? 0 : 32}
                  hide={isMobile}
                  className="fill-muted-foreground"
                  interval="preserveStartEnd"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent className="px-2" />} />
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
                  yAxisId="right"
                  type="monotone"
                  dataKey="stressLevel"
                  stroke="none"
                  fill="url(#stressGradient)"
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
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stress vs Pain Scatter Plot */}
      {scatterAnalysis && (
        <motion.div
          className="mx-auto w-full min-w-0 max-w-[calc(100vw-1rem)] overflow-hidden sm:max-w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.17 }}
        >
          <Card className="mx-auto w-full min-w-0 max-w-full overflow-hidden rounded-xl border-0 card-premium">
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                <CardTitle className="flex min-w-0 items-center gap-2 break-words text-base font-semibold">
                  <Brain className="h-4 w-4 text-teal-600" />
                  Stress vs Pain Correlation
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <Badge
                    variant={
                      Math.abs(scatterAnalysis.correlation) > 0.6
                        ? "destructive"
                        : "secondary"
                    }
                    className="text-xs"
                  >
                    r = {scatterAnalysis.correlation.toFixed(2)}
                  </Badge>
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    {Math.abs(scatterAnalysis.correlation) > 0.7
                      ? "Strong"
                      : Math.abs(scatterAnalysis.correlation) > 0.4
                        ? "Moderate"
                        : "Weak"}{" "}
                    correlation
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 p-2 sm:p-6">
              <div className="mx-auto w-full min-w-0 max-w-full overflow-hidden">
                <ChartContainer config={enhancedScatterConfig} className="mx-auto h-[250px] w-full min-w-0 max-w-full overflow-hidden sm:h-60">
              <ScatterChart
                margin={{
                  top: 10,
                  right: isMobile ? 4 : 10,
                  bottom: isMobile ? 12 : 20,
                  left: isMobile ? 0 : 10,
                }}
              >
                  <defs>
                    <radialGradient
                      id="scatterPointGradient"
                      cx="50%"
                      cy="50%"
                      r="50%"
                    >
                      <stop
                        offset="0%"
                        stopColor="#5eead4"
                        stopOpacity={0.9}
                      />
                      <stop
                        offset="100%"
                        stopColor="#14b8a6"
                        stopOpacity={0.7}
                      />
                    </radialGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="x"
                    name="Stress Level"
                    type="number"
                    domain={[0, 10]}
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    className="fill-muted-foreground"
                    label={isMobile ? undefined : {
                      value: "Stress Level →",
                      position: "bottom",
                      offset: 0,
                      fontSize: 12,
                      fill: "var(--color-muted-foreground)",
                    }}
                  />
                  <YAxis
                    dataKey="y"
                    name="Pain Level"
                    type="number"
                    domain={[0, 10]}
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    width={isMobile ? 28 : 36}
                    className="fill-muted-foreground"
                    label={isMobile ? undefined : {
                      value: "↑ Pain Level",
                      angle: -90,
                      position: "insideLeft",
                      fontSize: 12,
                      fill: "var(--color-muted-foreground)",
                    }}
                  />
                  <ZAxis dataKey={"z"} range={[40, 80]} />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    cursor={{ strokeDasharray: "3 3", stroke: "#14b8a6" }}
                  />
                  <ReferenceLine
                    x={scatterAnalysis.avgStress}
                    stroke="#0d9488"
                    strokeDasharray="3 3"
                    strokeOpacity={0.4}
                  />
                  <ReferenceLine
                    y={scatterAnalysis.avgPain}
                    stroke="#0d9488"
                    strokeDasharray="3 3"
                    strokeOpacity={0.4}
                  />
                  {scatterAnalysis.trendLine.length > 0 && (
                    <Line
                      data={scatterAnalysis.trendLine}
                      dataKey="y"
                      stroke="#0d9488"
                      strokeWidth={2}
                      strokeDasharray="8 4"
                      dot={false}
                      type="linear"
                      legendType="none"
                    />
                  )}
                  <Scatter
                    data={scatterAnalysis.points}
                    fill="url(#scatterPointGradient)"
                    stroke="#0d9488"
                    strokeWidth={1}
                  >
                    {symptoms.map((s, i) => {
                      const intensity = s.painLevel / 10;
                      return (
                        <Cell
                          key={i}
                          fill={`rgba(20, 184, 166, ${0.4 + intensity * 0.5})`}
                          stroke="#0d9488"
                          strokeWidth={1}
                          r={4 + intensity * 3}
                        />
                      );
                    })}
                  </Scatter>
                </ScatterChart>
            </ChartContainer>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="h-2.5 w-2.5 rounded-full bg-teal-500" />
                  Symptom Log Entry
                </div>
                {scatterAnalysis.trendLine.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="h-0 w-5 border-t-2 border-dashed border-teal-700" />
                    Trend Line
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="h-2.5 w-5 border-t border-dashed border-teal-600/50" />
                  Mean Crosshair
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Period Comparison */}
      {periodComparison && (
        <motion.div className="mx-auto w-full min-w-0 max-w-[calc(100vw-1rem)] overflow-hidden sm:max-w-full" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <Card className="mx-auto w-full min-w-0 max-w-full overflow-hidden rounded-xl border-0 card-premium">
            <CardHeader className="pb-2">
              <div className="flex min-w-0 items-start justify-between gap-2">
                <CardTitle className="flex min-w-0 items-center gap-2 break-words text-base font-semibold">
                  <GitCompareArrows className="h-4 w-4 text-teal-600" />
                  Period Comparison
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-4">Compare your first and second half of logged data to spot trends.</p>
              {/* Column headers */}
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_2.25rem_minmax(0,1fr)] items-center gap-1 sm:gap-2 mb-3">
                <div className="text-center">
                  <p className="text-xs font-medium text-muted-foreground">First Half</p>
                  <p className="text-xs text-muted-foreground/70">{periodComparison.first.dateRange}</p>
                </div>
                <div className="w-9 shrink-0" />
                <div className="text-center">
                  <p className="text-xs font-medium text-muted-foreground">Second Half</p>
                  <p className="text-xs text-muted-foreground/70">{periodComparison.second.dateRange}</p>
                </div>
              </div>
              {/* Comparison rows */}
              {[
                {
                  label: "Avg Pain",
                  first: periodComparison.first.avgPain.toFixed(1),
                  second: periodComparison.second.avgPain.toFixed(1),
                  lowerIsBetter: true,
                  suffix: "/10",
                },
                {
                  label: "Avg Stool Freq",
                  first: periodComparison.first.avgStool.toFixed(1),
                  second: periodComparison.second.avgStool.toFixed(1),
                  lowerIsBetter: true,
                  suffix: "/day",
                },
                {
                  label: "Avg Stress",
                  first: periodComparison.first.avgStress.toFixed(1),
                  second: periodComparison.second.avgStress.toFixed(1),
                  lowerIsBetter: true,
                  suffix: "/10",
                },
                {
                  label: "Blood Days",
                  first: `${periodComparison.first.bloodPct}%`,
                  second: `${periodComparison.second.bloodPct}%`,
                  lowerIsBetter: true,
                  suffix: "",
                  numeric: [periodComparison.first.bloodPct, periodComparison.second.bloodPct],
                },
                {
                  label: "Top Trigger",
                  first: periodComparison.first.topTrigger,
                  second: periodComparison.second.topTrigger,
                  isText: true,
                },
              ].map((row) => {
                const delta =
                  row.numeric
                    ? row.numeric[1] - row.numeric[0]
                    : row.isText
                      ? 0
                      : parseFloat(row.second) - parseFloat(row.first);
                const improved = row.lowerIsBetter ? delta < 0 : delta > 0;
                const worsened = row.lowerIsBetter ? delta > 0 : delta < 0;
                const stable = Math.abs(delta) < 0.3 && !row.isText;
                const changed = row.isText && row.first !== row.second;

                return (
                  <div
                    key={row.label}
                    className="grid min-w-0 grid-cols-[minmax(0,1fr)_2.25rem_minmax(0,1fr)] items-center gap-1 py-2.5 sm:gap-2 border-b last:border-b-0"
                  >
                    <div className="min-w-0 rounded-lg bg-muted/40 px-2 py-2 text-center sm:px-3">
                      <p className="min-w-0 truncate text-xs font-semibold sm:text-sm">{row.first}{row.suffix}</p>
                    </div>
                    <div className="flex w-9 min-w-0 shrink-0 flex-col items-center">
                      <p className="mb-0.5 max-w-9 break-words text-center text-[9px] leading-tight text-muted-foreground sm:text-[10px]">{row.label}</p>
                      {row.isText ? (
                        changed ? (
                          <ArrowRight className="h-3.5 w-3.5 text-amber-500" />
                        ) : (
                          <Minus className="h-3.5 w-3.5 text-muted-foreground/40" />
                        )
                      ) : stable ? (
                        <Minus className="h-3.5 w-3.5 text-gray-400" />
                      ) : improved ? (
                        <TrendingDown className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <TrendingUp className="h-3.5 w-3.5 text-rose-500" />
                      )}
                    </div>
                    <div className="min-w-0 rounded-lg bg-muted/40 px-2 py-2 text-center sm:px-3">
                      <p
                        className={`min-w-0 truncate text-xs font-semibold sm:text-sm ${
                          row.isText
                            ? ""
                            : worsened
                              ? "text-rose-600 dark:text-rose-400"
                              : improved
                                ? "text-emerald-600 dark:text-emerald-400"
                                : ""
                        }`}
                      >
                        {row.second}{row.suffix}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Bottom Row */}
      <div className="mx-auto grid w-full min-w-0 max-w-[calc(100vw-1rem)] grid-cols-1 justify-items-center gap-4 sm:max-w-full lg:grid-cols-3">
        {/* Most Common Triggers */}
        <motion.div
          className="mx-auto w-full min-w-0 max-w-[calc(100vw-1rem)] overflow-hidden sm:max-w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mx-auto h-full w-full min-w-0 max-w-full overflow-hidden rounded-xl border-0 card-premium">
            <CardHeader className="pb-2">
              <CardTitle className="min-w-0 break-words text-base font-semibold">Most Common Triggers</CardTitle>
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
                          <span className="min-w-0 flex-1 truncate font-medium text-muted-foreground">{t.trigger}</span>
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

        {/* Flare Risk Predictor */}
        <div className="mx-auto w-full min-w-0 max-w-[calc(100vw-1rem)] overflow-hidden sm:max-w-full">
          <FlareRiskPredictor symptoms={symptoms} isLoading={isLoading} />
        </div>

        {/* Stool Type Distribution */}
        <motion.div
          className="mx-auto w-full min-w-0 max-w-[calc(100vw-1rem)] overflow-hidden sm:max-w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="mx-auto h-full w-full min-w-0 max-w-full overflow-hidden rounded-xl border-0 card-premium">
            <CardHeader className="pb-2">
              <CardTitle className="min-w-0 break-words text-base font-semibold">Bristol Stool Type Distribution</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 p-2 sm:p-6">
              {stoolTypeDistribution.length ? (
                <div className="flex max-h-none min-w-0 flex-col items-center gap-4 md:max-h-[200px] md:flex-row">
                  <div className="relative">
                    <ChartContainer config={pieChartConfig} className="h-[150px] w-[150px] max-w-full shrink-0 md:h-[200px] md:w-[200px]">
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
                          innerRadius={35}
                          outerRadius={65}
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
                        <span className="text-lg md:text-2xl font-bold text-foreground">Type {mostCommonStoolType.type}</span>
                        <span className="text-[10px] md:text-xs text-muted-foreground">Most Common</span>
                      </div>
                    )}
                  </div>
                  <div className="flex w-full min-w-0 flex-col gap-1 overflow-y-auto md:gap-2">
                    {stoolTypeDistribution.map((entry) => (
                      <div key={entry.type} className="flex min-w-0 items-center gap-2 text-xs md:text-sm">
                        <div
                          className="h-2.5 w-2.5 md:h-3 md:w-3 rounded-sm shrink-0"
                          style={{ backgroundColor: entry.fill }}
                        />
                        <span className="min-w-0 flex-1 truncate text-muted-foreground">{getStoolEmoji(entry.type)} Type {entry.type}</span>
                        <Badge variant="secondary" className="ml-auto shrink-0 text-[10px] md:text-xs">
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

      {/* Severity Distribution */}
      <section className="mx-auto w-full min-w-0 max-w-[calc(100vw-1rem)] overflow-hidden sm:max-w-full">
        <SeverityDistribution symptoms={symptoms} isLoading={isLoading} />
      </section>

      {/* Week-over-Week Radar */}
      <section className="mx-auto w-full min-w-0 max-w-[calc(100vw-1rem)] overflow-hidden sm:max-w-full">
        <SymptomRadar symptoms={symptoms} isLoading={isLoading} />
      </section>

      {/* Blood Tracker */}
      <section className="mx-auto w-full min-w-0 max-w-[calc(100vw-1rem)] overflow-hidden sm:max-w-full">
        <BloodTracker symptoms={symptoms} isLoading={isLoading} />
      </section>

      {/* Medication Tracker */}
      <section className="mx-auto w-full min-w-0 max-w-[calc(100vw-1rem)] overflow-hidden sm:max-w-full">
        <MedicationTracker symptoms={symptoms} isLoading={isLoading} />
      </section>

      {/* Trigger Correlation Analysis */}
      <section className="mx-auto w-full min-w-0 max-w-[calc(100vw-1rem)] overflow-hidden sm:max-w-full">
        <TriggerCorrelation symptoms={symptoms} isLoading={isLoading} />
      </section>

      {/* Symptom Timeline */}
      <section className="mx-auto w-full min-w-0 max-w-[calc(100vw-1rem)] overflow-hidden sm:max-w-full">
        <SymptomTimeline symptoms={symptoms} isLoading={isLoading} />
      </section>

      {/* AI Symptom Insights Summary */}
      <section className="mx-auto w-full min-w-0 max-w-[calc(100vw-1rem)] overflow-hidden sm:max-w-full">
        <SymptomInsights symptoms={symptoms} isLoading={isLoading} />
      </section>

      {/* AI Insights Chat Panel */}
      <section className="mx-auto w-full min-w-0 max-w-[calc(100vw-1rem)] overflow-hidden sm:max-w-full">
        <AIInsightsPanel symptoms={symptoms} />
      </section>
    </div>
  );
}
