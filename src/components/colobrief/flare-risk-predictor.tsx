"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  TrendingUp,
  TrendingDown,
  Activity,
  Droplets,
  Brain,
  UtensilsCrossed,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import type { SymptomLog } from "@/types/symptom";
import { subDays, parseISO, isAfter, isBefore, format } from "date-fns";

interface FlareRiskPredictorProps {
  symptoms: SymptomLog[];
  isLoading: boolean;
}

type RiskLevel = "low" | "moderate" | "high" | "critical";

interface RiskFactor {
  name: string;
  impact: number; // -100 to +100, positive = increases risk
  description: string;
  icon: React.ElementType;
  color: string;
}

function calculateRiskLevel(score: number): { level: RiskLevel; label: string; color: string; bg: string; border: string } {
  if (score >= 75) return { level: "critical", label: "Critical Risk", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/30", border: "border-rose-200 dark:border-rose-800/50" };
  if (score >= 50) return { level: "high", label: "High Risk", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-200 dark:border-orange-800/50" };
  if (score >= 25) return { level: "moderate", label: "Moderate Risk", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800/50" };
  return { level: "low", label: "Low Risk", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800/50" };
}

function RiskIcon({ level }: { level: RiskLevel }) {
  switch (level) {
    case "critical":
      return <ShieldAlert className="h-6 w-6 text-rose-500" />;
    case "high":
      return <ShieldAlert className="h-6 w-6 text-orange-500" />;
    case "moderate":
      return <ShieldQuestion className="h-6 w-6 text-amber-500" />;
    default:
      return <ShieldCheck className="h-6 w-6 text-emerald-500" />;
  }
}

function getProgressColor(score: number): string {
  if (score >= 75) return "bg-rose-500";
  if (score >= 50) return "bg-orange-500";
  if (score >= 25) return "bg-amber-500";
  return "bg-emerald-500";
}

export default function FlareRiskPredictor({ symptoms, isLoading }: FlareRiskPredictorProps) {
  const analysis = useMemo(() => {
    if (symptoms.length < 3) return null;

    const now = new Date();
    const threeDaysAgo = subDays(now, 3);
    const sevenDaysAgo = subDays(now, 7);
    const fourteenDaysAgo = subDays(now, 14);

    const recent3 = symptoms.filter((s) => isAfter(parseISO(s.date), threeDaysAgo) || s.date === format(threeDaysAgo, "yyyy-MM-dd"));
    const week1 = symptoms.filter((s) => {
      const d = parseISO(s.date);
      return (isAfter(d, sevenDaysAgo) || d.toISOString().slice(0, 10) === sevenDaysAgo.toISOString().slice(0, 10)) && (isBefore(d, subDays(now, 3)) || d.toISOString().slice(0, 10) === subDays(now, 3).toISOString().slice(0, 10));
    });
    const older = symptoms.filter((s) => {
      const d = parseISO(s.date);
      return (isAfter(d, fourteenDaysAgo) || d.toISOString().slice(0, 10) === fourteenDaysAgo.toISOString().slice(0, 10)) && isBefore(d, sevenDaysAgo);
    });

    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const factors: RiskFactor[] = [];
    let totalRisk = 0;

    // Factor 1: Recent pain trend (3-day average vs 7-day average)
    if (recent3.length >= 2 && week1.length >= 2) {
      const recentPain = avg(recent3.map((s) => s.painLevel));
      const weekPain = avg(week1.map((s) => s.painLevel));
      const painDiff = recentPain - weekPain;
      const impact = Math.round(painDiff * 12); // Each point of pain increase = 12 risk points
      factors.push({
        name: "Pain Trend",
        impact,
        description: painDiff > 0.5
          ? `Pain rising: ${weekPain.toFixed(1)} → ${recentPain.toFixed(1)} avg`
          : painDiff < -0.5
            ? `Pain improving: ${weekPain.toFixed(1)} → ${recentPain.toFixed(1)} avg`
            : `Pain stable around ${recentPain.toFixed(1)}`,
        icon: Activity,
        color: painDiff > 0.5 ? "text-rose-500" : painDiff < -0.5 ? "text-emerald-500" : "text-amber-500",
      });
    }

    // Factor 2: Blood in stool (recent)
    if (recent3.length > 0) {
      const bloodDays = recent3.filter((s) => s.bloodInStool).length;
      const bloodPct = (bloodDays / recent3.length) * 100;
      const impact = bloodPct > 50 ? 30 : bloodPct > 0 ? 15 : -10;
      factors.push({
        name: "Blood in Stool",
        impact,
        description: bloodDays > 0
          ? `Blood detected on ${bloodDays} of ${recent3.length} recent days`
          : "No blood detected recently",
        icon: Droplets,
        color: bloodDays > 0 ? "text-rose-500" : "text-emerald-500",
      });
    }

    // Factor 3: Stool frequency trend
    if (recent3.length >= 2 && week1.length >= 2) {
      const recentFreq = avg(recent3.map((s) => s.stoolFrequency));
      const weekFreq = avg(week1.map((s) => s.stoolFrequency));
      const freqDiff = recentFreq - weekFreq;
      const impact = Math.round(freqDiff * 6);
      factors.push({
        name: "Stool Frequency",
        impact,
        description: freqDiff > 0.5
          ? `Frequency increasing: ${weekFreq.toFixed(1)} → ${recentFreq.toFixed(1)}/day`
          : freqDiff < -0.5
            ? `Frequency decreasing: ${weekFreq.toFixed(1)} → ${recentFreq.toFixed(1)}/day`
            : `Frequency stable at ${recentFreq.toFixed(1)}/day`,
        icon: UtensilsCrossed,
        color: freqDiff > 0.5 ? "text-rose-500" : freqDiff < -0.5 ? "text-emerald-500" : "text-amber-500",
      });
    }

    // Factor 4: Stress level
    if (recent3.length >= 2) {
      const recentStress = avg(recent3.map((s) => s.stressLevel));
      const impact = recentStress > 7 ? 20 : recentStress > 5 ? 10 : recentStress > 3 ? 0 : -10;
      factors.push({
        name: "Stress Level",
        impact,
        description: recentStress > 7
          ? `High stress: ${recentStress.toFixed(1)}/10`
          : recentStress > 5
            ? `Elevated stress: ${recentStress.toFixed(1)}/10`
            : `Manageable stress: ${recentStress.toFixed(1)}/10`,
        icon: Brain,
        color: recentStress > 7 ? "text-rose-500" : recentStress > 5 ? "text-amber-500" : "text-emerald-500",
      });
    }

    // Factor 5: Stool type (watery = higher risk)
    if (recent3.length > 0) {
      const avgType = avg(recent3.map((s) => s.stoolType));
      const impact = avgType >= 6 ? 25 : avgType >= 5 ? 15 : avgType >= 4 ? 5 : -5;
      factors.push({
        name: "Stool Consistency",
        impact,
        description: avgType >= 6
          ? `Watery/loose stools (avg type ${avgType.toFixed(1)})`
          : avgType >= 4
            ? `Normal consistency (avg type ${avgType.toFixed(1)})`
            : `Hard stools (avg type ${avgType.toFixed(1)})`,
        icon: UtensilsCrossed,
        color: avgType >= 6 ? "text-rose-500" : avgType >= 4 ? "text-amber-500" : "text-emerald-500",
      });
    }

    // Calculate total risk: start at 20, add/subtract factors, clamp 0-100
    totalRisk = Math.max(0, Math.min(100, 20 + factors.reduce((sum, f) => sum + f.impact, 0)));

    const riskInfo = calculateRiskLevel(totalRisk);

    // Recommendation based on level
    let recommendation = "";
    switch (riskInfo.level) {
      case "critical":
        recommendation = "Your symptoms indicate a potential flare. Contact your healthcare provider promptly. Consider avoiding known triggers and ensuring medication adherence.";
        break;
      case "high":
        recommendation = "Elevated flare risk detected. Monitor closely over the next 24-48 hours. Avoid trigger foods, manage stress, and ensure you're taking prescribed medications.";
        break;
      case "moderate":
        recommendation = "Some risk factors present. Continue monitoring and consider proactive stress management and dietary adjustments.";
        break;
      default:
        recommendation = "Your symptoms are well-managed. Continue your current routine and keep logging to maintain this positive trend.";
    }

    return { totalRisk, riskInfo, factors, recommendation, recent3Count: recent3.length };
  }, [symptoms]);

  if (isLoading) {
    return (
      <Card className="rounded-xl border-0 shadow-sm">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-44" />
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full rounded-full" />
            </div>
          </div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className="rounded-xl border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ShieldQuestion className="h-4 w-4 text-teal-600" />
            Flare Risk Predictor
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted/50 p-3 mb-3">
              <ShieldQuestion className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground max-w-[280px]">
              Need at least 3 days of symptom data to generate a flare risk prediction.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22 }}
    >
      <Card className={`rounded-xl border-0 shadow-sm overflow-hidden relative ${analysis.riskInfo.border} border-l-4`}>
        {/* Subtle risk-colored gradient overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            background: analysis.riskInfo.level === "critical"
              ? "radial-gradient(circle at 50% 30%, #f43f5e, transparent 70%)"
              : analysis.riskInfo.level === "high"
                ? "radial-gradient(circle at 50% 30%, #f97316, transparent 70%)"
                : analysis.riskInfo.level === "moderate"
                  ? "radial-gradient(circle at 50% 30%, #f59e0b, transparent 70%)"
                  : "radial-gradient(circle at 50% 30%, #10b981, transparent 70%)",
          }}
        />

        <CardHeader className="pb-3 relative">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShieldQuestion className="h-4 w-4 text-teal-600" />
              Flare Risk Predictor
            </CardTitle>
            <Badge
              variant={analysis.riskInfo.level === "critical" || analysis.riskInfo.level === "high" ? "destructive" : "secondary"}
              className={`text-xs ${analysis.riskInfo.level === "low" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" : ""}`}
            >
              {analysis.riskInfo.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Based on your last {analysis.recent3Count} days of data
          </p>
        </CardHeader>

        <CardContent className="pt-0 space-y-5 relative">
          {/* Risk Score Display */}
          <div className="flex items-center gap-5">
            <motion.div
              key={analysis.riskInfo.level}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <RiskIcon level={analysis.riskInfo.level} />
            </motion.div>

            <div className="flex-1">
              <div className="flex items-baseline justify-between mb-1.5">
                <motion.span
                  className={`text-3xl font-bold tabular-nums ${analysis.riskInfo.color}`}
                  key={analysis.totalRisk}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {analysis.totalRisk}
                </motion.span>
                <span className="text-xs text-muted-foreground">/100 risk score</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${getProgressColor(analysis.totalRisk)}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${analysis.totalRisk}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              {/* Scale markers */}
              <div className="flex justify-between mt-1 text-[10px] text-muted-foreground/60">
                <span>Low</span>
                <span>Moderate</span>
                <span>High</span>
                <span>Critical</span>
              </div>
            </div>
          </div>

          {/* Risk Factors */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Risk Factors</p>
            {analysis.factors.map((factor, i) => (
              <motion.div
                key={factor.name}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="flex items-start gap-3"
              >
                <div className="rounded-lg bg-muted/50 p-1.5 mt-0.5 shrink-0">
                  <factor.icon className={`h-3.5 w-3.5 ${factor.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-medium">{factor.name}</span>
                    <span
                      className={`text-xs font-semibold flex items-center gap-0.5 ${
                        factor.impact > 10
                          ? "text-rose-600 dark:text-rose-400"
                          : factor.impact > 0
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {factor.impact > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : factor.impact < 0 ? (
                        <TrendingDown className="h-3 w-3" />
                      ) : null}
                      {factor.impact > 0 ? "+" : ""}{factor.impact}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{factor.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Recommendation */}
          <div className={`rounded-lg ${analysis.riskInfo.bg} p-3 flex items-start gap-2.5`}>
            <Info className={`h-4 w-4 mt-0.5 shrink-0 ${analysis.riskInfo.color}`} />
            <p className="text-xs leading-relaxed">{analysis.recommendation}</p>
          </div>

          <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
            This prediction is based on your logged data patterns and is not a medical diagnosis. 
            Always consult your healthcare provider for medical advice.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}