"use client";

import { useMemo } from "react";
import { useAnimatedNumber } from "@/hooks/use-animated-number";
import { motion } from "framer-motion";
import { Activity, Brain, UtensilsCrossed, Droplets, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, parseISO, isAfter, isBefore } from "date-fns";
import type { SymptomLog } from "@/types/symptom";

interface HealthScoreCardProps {
  symptoms: SymptomLog[];
  isLoading: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#10b981";
  if (score >= 50) return "#f59e0b";
  return "#f43f5e";
}

function getStatusLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Good", color: "text-emerald-600 dark:text-emerald-400" };
  if (score >= 65) return { label: "Fair", color: "text-amber-600 dark:text-amber-400" };
  if (score >= 50) return { label: "Needs Attention", color: "text-amber-600 dark:text-amber-400" };
  return { label: "Critical", color: "text-rose-600 dark:text-rose-400" };
}

function calculateScore(logs: SymptomLog[]): number {
  if (!logs.length) return 100;
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

  const avgPain = avg(logs.map((s) => s.painLevel));
  const avgStoolFreq = avg(logs.map((s) => s.stoolFrequency));
  const avgStress = avg(logs.map((s) => s.stressLevel));
  const avgStoolType = avg(logs.map((s) => s.stoolType));
  const bloodPct = (logs.filter((s) => s.bloodInStool).length / logs.length) * 100;

  let score =
    100 -
    avgPain * 4 -
    avgStoolFreq * 3 -
    avgStress * 1.5 -
    (avgStoolType > 4 ? (avgStoolType - 4) * 5 : 0) -
    bloodPct * 0.2;

  return Math.round(Math.max(0, Math.min(100, score)));
}

function CircularGaugeLarge({ value, color }: { value: number; color: string }) {
  const size = 150;
  const mobileSize = 130;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const mobileRadius = (mobileSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const mobileCircumference = mobileRadius * 2 * Math.PI;
  const progress = (value / 100) * circumference;
  const mobileProgress = (value / 100) * mobileCircumference;
  const center = size / 2;
  const mobileCenter = mobileSize / 2;

  return (
    <div className="relative mx-auto flex justify-center items-center w-full max-w-[130px] md:max-w-none cursor-pointer group transition-transform duration-200 hover:scale-[1.04]">
      {/* Mobile SVG */}
      <svg width={mobileSize} height={mobileSize} className="-rotate-90 md:hidden">
        {/* Background track */}
        <circle
          cx={mobileCenter}
          cy={mobileCenter}
          r={mobileRadius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        {/* Glow filter */}
        <defs>
          <filter id="gaugeGlowMobile">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Progress arc */}
        <motion.circle
          cx={mobileCenter}
          cy={mobileCenter}
          r={mobileRadius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={mobileCircumference}
          filter="url(#gaugeGlowMobile)"
          initial={{ strokeDashoffset: mobileCircumference }}
          animate={{ strokeDashoffset: mobileCircumference - mobileProgress }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      
      {/* Desktop SVG */}
      <svg width={size} height={size} className="-rotate-90 hidden md:block">
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        {/* Glow filter */}
        <defs>
          <filter id="gaugeGlowDesktop">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Progress arc */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          filter="url(#gaugeGlowDesktop)"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      
      {/* Center score text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-2xl md:text-4xl font-bold tabular-nums"
          style={{ color }}
        >
          {Math.round(value)}
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
          Health Score
        </span>
      </div>
    </div>
  );
}

function TrendArrow({ current, previous }: { current: number; previous: number }) {
  const diff = current - previous;
  if (Math.abs(diff) < 3) {
    return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  }
  if (diff > 0) {
    return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />;
  }
  return <TrendingDown className="h-3.5 w-3.5 text-rose-500" />;
}

export default function HealthScoreCard({ symptoms, isLoading }: HealthScoreCardProps) {
  const now = new Date();

  const { score, prevScore, miniMetrics } = useMemo(() => {
    const sevenDaysAgo = subDays(now, 7);
    const fourteenDaysAgo = subDays(now, 14);

    const recent = symptoms.filter((s) => isAfter(parseISO(s.date), sevenDaysAgo) || parseISO(s.date).toISOString().slice(0, 10) === sevenDaysAgo.toISOString().slice(0, 10));
    const older = symptoms.filter((s) => {
      const d = parseISO(s.date);
      return (isAfter(d, fourteenDaysAgo) || d.toISOString().slice(0, 10) === fourteenDaysAgo.toISOString().slice(0, 10)) && isBefore(d, sevenDaysAgo);
    });

    const score = calculateScore(recent.length ? recent : symptoms);
    const prevScore = older.length ? calculateScore(older) : null;

    const activeLogs = recent.length ? recent : symptoms;
    const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

    const miniMetrics = [
      {
        label: "Pain",
        value: avg(activeLogs.map((s) => s.painLevel)).toFixed(1),
        icon: Activity,
        color: "text-rose-500",
        borderColor: "#f43f5e",
      },
      {
        label: "Stool",
        value: avg(activeLogs.map((s) => s.stoolFrequency)).toFixed(1),
        icon: UtensilsCrossed,
        color: "text-teal-600 dark:text-teal-400",
        borderColor: "#14b8a6",
      },
      {
        label: "Stress",
        value: avg(activeLogs.map((s) => s.stressLevel)).toFixed(1),
        icon: Brain,
        color: "text-amber-500",
        borderColor: "#f59e0b",
      },
      {
        label: "Blood",
        value: `${Math.round((activeLogs.filter((s) => s.bloodInStool).length / activeLogs.length) * 100)}%`,
        icon: Droplets,
        color: "text-rose-500",
        borderColor: "#f43f5e",
      },
    ];

    return { score, prevScore, miniMetrics };
  }, [symptoms, now]);

  const animatedScore = useAnimatedNumber(score, 1200);
  const color = getScoreColor(score);
  const status = getStatusLabel(score);

  if (isLoading) {
    return (
      <Card className="rounded-xl border-0 shadow-sm h-full">
        <CardContent className="p-5 flex flex-col items-center justify-center">
          <Skeleton className="h-[140px] w-[140px] rounded-full" />
          <Skeleton className="h-5 w-24 mt-4" />
          <div className="flex gap-6 mt-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-14" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="rounded-xl border-0 shadow-sm h-full overflow-hidden relative card-premium card-glow glow-teal">
        {/* Subtle gradient background accent */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 30%, ${color}, transparent 70%)`,
          }}
        />
        <CardContent className="flex flex-col items-center justify-center text-center p-4 w-full md:p-5 md:relative">
          {/* Header */}
          <div className="flex items-center justify-between w-full mb-3">
            <h3 className="section-title">
              UC Health Score
            </h3>
            {prevScore !== null && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>vs prev 7d</span>
                <TrendArrow current={score} previous={prevScore} />
                <span
                  className="font-medium tabular-nums"
                  style={{
                    color:
                      score - prevScore > 3
                        ? "#10b981"
                        : score - prevScore < -3
                          ? "#f43f5e"
                          : undefined,
                  }}
                >
                  {score > prevScore ? "+" : ""}
                  {score - prevScore}
                </span>
              </div>
            )}
          </div>

          {/* Gauge */}
          <CircularGaugeLarge value={animatedScore} color={color} />

          {/* Status label */}
          <motion.p
            className={`text-sm font-semibold mt-3 ${status.color}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {status.label}
          </motion.p>

          {/* Mini metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 w-full">
            {miniMetrics.map((m) => (
              <div
                key={m.label}
                className="flex flex-col items-center gap-1 rounded-lg bg-muted/40 p-2"
                style={{ borderLeftColor: m.borderColor, borderLeftWidth: '2px', borderLeftStyle: 'solid' }}
              >
                <m.icon className={`h-4 w-4 ${m.color}`} />
                <span className="text-sm font-bold tabular-nums">{m.value}</span>
                <span className="text-[10px] text-muted-foreground">{m.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}