"use client";

import { useState, useMemo } from "react";
import { useAnimatedNumber } from "@/hooks/use-animated-number";
import { motion } from "framer-motion";
import { Printer, Sparkles, Loader2, FileText, ClipboardList, Stethoscope, BookOpen, Activity, Lightbulb, Pill, Flame, Waves, Brain, TrendingUp, TrendingDown, Minus, ShieldCheck, Droplets, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { format, parseISO, min, max } from "date-fns";
import type { SymptomLog } from "@/types/symptom";

const BRISTOL_LABELS: Record<number, string> = {
  1: "Hard lumps",
  2: "Lumpy sausage",
  3: "Sausage w/ cracks",
  4: "Smooth soft",
  5: "Soft blobs",
  6: "Mushy",
  7: "Watery",
};

interface DoctorHandoutTabProps {
  symptoms: SymptomLog[];
  isLoading: boolean;
}

export default function DoctorHandoutTab({ symptoms, isLoading }: DoctorHandoutTabProps) {
  const [aiSummary, setAiSummary] = useState<{
    situation: string;
    background: string;
    assessment: string;
    recommendation: string;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Extract unique medications with counts (component-level hook)
  const medicationDetails = useMemo(() => {
    const medMap: Record<string, { name: string; daysTaken: number; avgPain: number }> = {};
    symptoms.forEach((s) => {
      if (!s.medicationTaken || s.medicationTaken.trim() === "") return;
      const name = s.medicationTaken.replace(/\d+\.?\d*\s*(mg|ml|g|mcg|tablet|capsule|puff|dose|tabs?|caps?)s?/gi, "").trim();
      if (!name) return;
      if (!medMap[name]) {
        medMap[name] = { name, daysTaken: 0, avgPain: 0 };
      }
      medMap[name].daysTaken++;
      medMap[name].avgPain += s.painLevel;
    });
    Object.values(medMap).forEach((m) => {
      m.avgPain = m.daysTaken > 0 ? m.avgPain / m.daysTaken : 0;
    });
    return Object.values(medMap).sort((a, b) => b.daysTaken - a.daysTaken);
  }, [symptoms]);

  // Most recent 3 notes (component-level hook)
  const recentNotes = useMemo(() => {
    const withNotes = symptoms.filter((s) => s.notes && s.notes.trim() !== "");
    return withNotes.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  }, [symptoms]);

  const stats = useMemo(() => {
    if (!symptoms.length) return null;

    const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

    const sorted = [...symptoms].sort((a, b) => a.date.localeCompare(b.date));
    const dates = sorted.map((s) => parseISO(s.date));
    const dateRange = {
      from: format(min(dates), "MMM d, yyyy"),
      to: format(max(dates), "MMM d, yyyy"),
    };

    // Split into two halves for trend
    const mid = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, mid);
    const secondHalf = sorted.slice(mid);

    const firstAvgPain = avg(firstHalf.map((s) => s.painLevel));
    const secondAvgPain = avg(secondHalf.map((s) => s.painLevel));
    const painDiff = secondAvgPain - firstAvgPain;

    let trend: string;
    if (Math.abs(painDiff) < 0.5) {
      trend = "Stable";
    } else if (painDiff < 0) {
      trend = "Improving";
    } else {
      trend = "Worsening";
    }

    // Trigger counts
    const triggerCounts: Record<string, number> = {};
    symptoms.forEach((s) => s.triggers.forEach((t) => (triggerCounts[t] = (triggerCounts[t] || 0) + 1)));
    const topTriggers = Object.entries(triggerCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([t, c]) => `${t} (${c}×)`);

    // Stool type distribution
    const stoolTypeCounts: Record<number, number> = {};
    symptoms.forEach((s) => {
      const t = Math.round(s.stoolType);
      stoolTypeCounts[t] = (stoolTypeCounts[t] || 0) + 1;
    });
    const mostCommonStoolType = Object.entries(stoolTypeCounts).sort(([, a], [, b]) => b - a)[0];

    // Medication adherence
    const medAdherence = symptoms.length
      ? Math.round((symptoms.filter((s) => s.medicationTaken && s.medicationTaken.trim() !== "").length / symptoms.length) * 100)
      : 0;
    // Blood frequency
    const bloodDays = symptoms.filter((s) => s.bloodInStool).length;
    const bloodPct = symptoms.length ? Math.round((bloodDays / symptoms.length) * 100) : 0;
    // Average urgency
    const avgUrgency = avg(symptoms.map((s) => s.urgencyLevel));

    return {
      dateRange,
      avgPain: avg(symptoms.map((s) => s.painLevel)),
      avgStool: avg(symptoms.map((s) => s.stoolFrequency)),
      avgStress: avg(symptoms.map((s) => s.stressLevel)),
      totalLogs: symptoms.length,
      trend,
      topTriggers,
      mostCommonStoolType: mostCommonStoolType
        ? `Type ${mostCommonStoolType[0]} — ${BRISTOL_LABELS[Number(mostCommonStoolType[0])] || ""} (${mostCommonStoolType[1]}×)`
        : "N/A",
      recentLogs: sorted.slice(-14),
      medAdherence,
      bloodDays,
      bloodPct,
      avgUrgency,
      medicationDetails,
      recentNotes,
    };
  }, [symptoms]);

  // Animated stat numbers (must be after stats definition)
  const animAvgPain = useAnimatedNumber(stats?.avgPain ?? 0);
  const animAvgStool = useAnimatedNumber(stats?.avgStool ?? 0);
  const animAvgStress = useAnimatedNumber(stats?.avgStress ?? 0);
  const animMedAdherence = useAnimatedNumber(stats?.medAdherence ?? 0);
  const animBloodDays = useAnimatedNumber(stats?.bloodDays ?? 0);
  const animAvgUrgency = useAnimatedNumber(stats?.avgUrgency ?? 0);

  // Determine worst stat key for clinical pulse attention
  const worstStatKey = useMemo(() => {
    if (!stats) return null;
    const entries: [string, number][] = [
      ["avgPain", stats.avgPain],
      ["avgStool", stats.avgStool],
      ["avgStress", stats.avgStress],
      ["avgUrgency", stats.avgUrgency * (10 / 3)], // normalize to 0-10 scale
      ["bloodPct", stats.bloodPct / 10], // normalize
    ];
    return entries.reduce((worst, [key, val]) => (val > (worst?.[1] ?? 0) ? [key, val] as [string, number] : worst), null as [string, number] | null)?.[0] ?? null;
  }, [stats]);

  const situation = useMemo(() => {
    if (!stats) return "";
    if (stats.avgPain <= 3)
      return `Patient reports mild abdominal symptoms with an average pain level of ${stats.avgPain.toFixed(1)}/10 over ${stats.totalLogs} logged days.`;
    if (stats.avgPain <= 6)
      return `Patient reports moderate UC symptoms with an average pain level of ${stats.avgPain.toFixed(1)}/10 and average stool frequency of ${stats.avgStool.toFixed(1)}/day over ${stats.totalLogs} logged days.`;
    return `Patient reports significant UC symptoms with an average pain level of ${stats.avgPain.toFixed(1)}/10 and average stool frequency of ${stats.avgStool.toFixed(1)}/day over ${stats.totalLogs} logged days. Clinical attention recommended.`;
  }, [stats]);

  const background = useMemo(() => {
    if (!stats) return "";
    return `Patient has been self-tracking Ulcerative Colitis symptoms from ${stats.dateRange.from} to ${stats.dateRange.to} (${stats.totalLogs} entries). Most common stool type: ${stats.mostCommonStoolType}. Average stress level: ${stats.avgStress.toFixed(1)}/10.`;
  }, [stats]);

  const computedAssessment = useMemo(() => {
    if (!stats) return "";
    return `Overall trend: ${stats.trend}. Average pain ${stats.avgPain.toFixed(1)}/10, stool frequency ${stats.avgStool.toFixed(1)}/day, stress ${stats.avgStress.toFixed(1)}/10. Common triggers: ${stats.topTriggers.join(", ") || "None identified"}. Most common stool type: ${stats.mostCommonStoolType}. Medication adherence: ${stats.medAdherence}%. Blood in stool reported on ${stats.bloodDays} days (${stats.bloodPct}%). Average urgency level: ${stats.avgUrgency.toFixed(1)}/3.`;
  }, [stats]);
  const assessment = aiSummary?.assessment || computedAssessment;

  const recommendation = aiSummary?.recommendation || "Discuss symptom trends with patient, review trigger management strategies, evaluate current medication efficacy, and consider dietary modifications based on identified triggers.";

  const handleGenerateAI = async () => {
    if (!symptoms.length) {
      toast.error("No data to generate a summary from.");
      return;
    }
    setIsGenerating(true);
    try {
      const summaryData = JSON.stringify(
        symptoms.map((s) => ({
          date: s.date,
          pain: s.painLevel,
          frequency: s.stoolFrequency,
          stoolType: s.stoolType,
          stress: s.stressLevel,
          triggers: s.triggers,
          notes: s.notes,
        }))
      );
      const res = await fetch("/api/symptoms/ai-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: summaryData, mode: "clinical_summary" }),
      });
      const data = await res.json();
      setAiSummary(data);
      toast.success("AI clinical summary generated!");
    } catch {
      toast.error("Failed to generate AI summary.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-6 w-96" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!symptoms.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-mesh rounded-2xl flex flex-col items-center justify-center py-24 text-center max-w-lg mx-auto"
      >
        <div className="animate-gradient-bg rounded-2xl p-10 mb-6">
          <ClipboardList className="h-20 w-20 text-teal-600 mx-auto" />
        </div>
        <h3 className="text-2xl font-bold mb-2">No data for a handout</h3>
        <p className="text-muted-foreground max-w-md mb-6">
          Log at least a few days of symptoms to generate an SBAR Clinical Brief 
          that you can share with your gastroenterologist.
        </p>
        <div className="rounded-xl border bg-card/80 card-premium p-5 text-left max-w-sm w-full mb-6">
          <p className="text-sm font-semibold mb-3">📋 What you'll get:</p>
          <ul className="text-xs text-muted-foreground space-y-2">
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-teal-500 shrink-0" />SBAR-formatted clinical summary</li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-teal-500 shrink-0" />Automated trend analysis</li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-teal-500 shrink-0" />Trigger identification report</li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-teal-500 shrink-0" />Print-ready PDF for your doctor</li>
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">
          Use <strong>"Load Demo Data"</strong> in the sidebar or <strong>"Log Symptoms"</strong> to get started
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action buttons - hidden in print */}
      <div className="flex flex-wrap gap-2 print:hidden">
        <Button onClick={handlePrint} variant="outline" className="gap-2 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 hover:shadow-md hover:shadow-teal-500/10 transition-all">
          <Printer className="h-4 w-4" />
          <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent font-semibold">Export PDF</span>
        </Button>
        <Button onClick={handleGenerateAI} disabled={isGenerating} className="gap-2 shadow-md shadow-teal-500/20 btn-premium">
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {isGenerating ? "Generating..." : "Generate AI Summary"}
        </Button>
      </div>

      {/* Bristol Stool Scale Reference Card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="rounded-xl border-0 shadow-sm print:hidden bg-gradient-to-br from-slate-50/80 via-white to-teal-50/40 dark:from-slate-950/80 dark:via-card dark:to-teal-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Bristol Stool Scale Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Constipation", color: "bg-stone-100 border-stone-200 dark:bg-stone-900/40 dark:border-stone-700/50", desc: "Hard, lumpy — Types 1-2", icon: "🪨" },
                { label: "Normal", color: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/40", desc: "Smooth, soft — Types 3-4", icon: "✅" },
                { label: "Mild Diarrhea", color: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/40", desc: "Soft, mushy — Types 5-6", icon: "⚠️" },
                { label: "Severe Diarrhea", color: "bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800/40", desc: "Watery — Type 7", icon: "🚨" },
              ].map((item) => (
                <div key={item.label} className={`rounded-lg border p-3 bristol-item ${item.color}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bristol-emoji">{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Print area */}
      <div className="print-area space-y-6">
        {/* Professional print-only header */}
        <div className="print-header">
          <h2>ColoBrief AI — Clinical Handout</h2>
          <p>{format(new Date(), "EEEE, MMMM d, yyyy 'at' h:mm a")}</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-xl border-0 shadow-sm print:shadow-none print:border print:rounded-none card-glow relative overflow-hidden">
            <CardContent className="p-6 print:p-4">
              {/* Watermark branding */}
              <div className="print-watermark" aria-hidden="true">ColoBrief AI</div>

              {/* Header */}
              <div className="mb-6">
                <h1 className="text-xl font-bold text-foreground print:text-lg">
                  SBAR Clinical Brief for Gastroenterology Consultations
                </h1>
                <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-muted-foreground">
                  <span>
                    <strong>Patient:</strong> Demo Patient
                  </span>
                  <span>
                    <strong>Period:</strong> {stats?.dateRange.from} — {stats?.dateRange.to}
                  </span>
                  <span>
                    <strong>Attending:</strong> Dr. Sarah Chen, MD
                  </span>
                  <span>
                    <strong>Generated:</strong> {format(new Date(), "MMM d, yyyy")}
                  </span>
                </div>
              </div>

              <Separator className="mb-6 print:mb-4" />

              {/* Medication Adherence Summary */}
              {stats && (
                <div className="mb-5 rounded-xl border border-teal-200/60 dark:border-teal-800/40 bg-gradient-to-r from-teal-50/50 via-white to-emerald-50/30 dark:from-teal-950/20 dark:via-card dark:to-emerald-950/10 p-4 print:p-3 print:bg-white print:border">
                  <h2 className="text-sm font-semibold text-teal-700 dark:text-teal-400 mb-3 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 shrink-0">
                      <Pill className="h-3.5 w-3.5" />
                    </span>
                    Medication Adherence Summary
                  </h2>
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12">
                        <svg className="-rotate-90 h-12 w-12" viewBox="0 0 48 48">
                          <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/20" />
                          <circle cx="24" cy="24" r="20" fill="none" stroke="#0d9488" strokeWidth="4" strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 20}`}
                            strokeDashoffset={`${2 * Math.PI * 20 * (1 - stats.medAdherence / 100)}`}
                            className="transition-all duration-1000" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-teal-700 dark:text-teal-400">
                          {stats.medAdherence}%
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{stats.medAdherence >= 80 ? "Good" : stats.medAdherence >= 50 ? "Partial" : "Low"} Adherence</p>
                        <p className="text-xs text-muted-foreground">
                          {symptoms.filter((s) => s.medicationTaken && s.medicationTaken.trim() !== "").length} of {symptoms.length} days
                        </p>
                      </div>
                    </div>
                    <div className="h-8 w-px bg-border print:hidden" />
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs">Blood Days</span>
                        <p className="font-semibold text-rose-600">{stats.bloodDays} <span className="text-xs font-normal text-muted-foreground">({stats.bloodPct}%)</span></p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Avg Urgency</span>
                        <p className="font-semibold">{stats.avgUrgency.toFixed(1)}<span className="text-xs font-normal text-muted-foreground">/3</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed Medication Breakdown */}
              {stats && stats.medicationDetails.length > 0 && (
                <div className="mb-5">
                  <h2 className="text-sm font-semibold text-teal-700 dark:text-teal-400 mb-3 flex items-center gap-2">
                    <Pill className="h-4 w-4" />
                    Current Medications
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {stats.medicationDetails.map((med) => (
                      <div key={med.name} className="rounded-lg border border-border/60 bg-muted/20 p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center shrink-0">
                            <Pill className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{med.name}</p>
                            <p className="text-xs text-muted-foreground">{med.daysTaken} day{med.daysTaken !== 1 ? "s" : ""} taken</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Avg Pain</p>
                          <p className="text-sm font-semibold">{med.avgPain.toFixed(1)}/10</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Patient Notes */}
              {stats && stats.recentNotes.length > 0 && (
                <div className="mb-5">
                  <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Recent Patient Notes
                  </h2>
                  <div className="space-y-2">
                    {stats.recentNotes.map((s) => (
                      <div key={s.id} className="rounded-lg border border-border/60 bg-muted/20 p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-muted-foreground">{format(parseISO(s.date), "EEE, MMM d")}</span>
                          <Badge variant={s.bloodInStool ? "destructive" : "secondary"} className="text-[10px]">
                            {s.bloodInStool ? "Blood" : "No Blood"} · Pain {s.painLevel}/10
                          </Badge>
                        </div>
                        <p className="text-sm text-foreground italic leading-relaxed">"{s.notes}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator className="mb-6 print:mb-4" />

              {/* S - Situation */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
                className="mb-5 print-avoid-break"
              >
                <div className="border-l-4 border-teal-400 bg-teal-50/30 dark:bg-teal-950/10 rounded-r-lg p-4 card-premium">
                  <h2 className="text-base font-semibold text-teal-700 dark:text-teal-400 mb-1.5 print:text-sm print:mt-4 print:mb-1 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 text-xs font-bold shrink-0"><Stethoscope className="h-3.5 w-3.5" /></span>
                    S — Situation
                  </h2>
                  <p className="text-sm leading-relaxed print:text-xs">
                    {aiSummary?.situation || situation}
                  </p>
                </div>
              </motion.div>

              {/* B - Background */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="mb-5 print-avoid-break"
              >
                <div className="border-l-4 border-sky-400 bg-sky-50/30 dark:bg-sky-950/10 rounded-r-lg p-4 card-premium">
                  <h2 className="text-base font-semibold text-sky-700 dark:text-sky-400 mb-1.5 print:text-sm print:mt-4 print:mb-1 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 text-xs font-bold shrink-0"><BookOpen className="h-3.5 w-3.5" /></span>
                    B — Background
                  </h2>
                  <p className="text-sm leading-relaxed print:text-xs">
                    {aiSummary?.background || background}
                  </p>
                </div>
              </motion.div>

              {/* A - Assessment */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-5 print-avoid-break"
              >
                <div className="border-l-4 border-amber-400 bg-amber-50/30 dark:bg-amber-950/10 rounded-r-lg p-4 card-premium">
                  <h2 className="text-base font-semibold text-amber-700 dark:text-amber-400 mb-1.5 print:text-sm print:mt-4 print:mb-1 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-xs font-bold shrink-0"><Activity className="h-3.5 w-3.5" /></span>
                    A — Assessment
                  </h2>
                  {aiSummary && (
                    <Badge variant="secondary" className="mb-2 print:hidden">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI-Generated
                    </Badge>
                  )}
                  <p className="text-sm leading-relaxed print:text-xs">{assessment}</p>

                  {/* Quick stats — enhanced with animated numbers, colored borders, icons, and worst-pulse */}
                  {stats && (
                    <div className="grid grid-cols-2 sm:grid-cols-7 gap-3 mt-4 print:grid-cols-7 print:gap-2 print:mt-2">
                      {[
                        { key: "avgPain", label: "Avg Pain", value: animAvgPain.toFixed(1), accent: "metric-accent-rose", icon: <Flame className="h-3 w-3" />, iconBg: "bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400" },
                        { key: "avgStool", label: "Avg Frequency", value: `${animAvgStool.toFixed(1)}/day`, accent: "metric-accent-teal", icon: <Waves className="h-3 w-3" />, iconBg: "bg-teal-100 text-teal-600 dark:bg-teal-900/50 dark:text-teal-400" },
                        { key: "avgStress", label: "Avg Stress", value: animAvgStress.toFixed(1), accent: "metric-accent-amber", icon: <Brain className="h-3 w-3" />, iconBg: "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400" },
                        { key: "trend", label: "Trend", value: stats.trend, accent: "metric-accent-violet", icon: stats.trend === "Improving" ? <TrendingUp className="h-3 w-3" /> : stats.trend === "Worsening" ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />, iconBg: stats.trend === "Improving" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400" : stats.trend === "Worsening" ? "bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400" : "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400", valueClass: stats.trend === "Improving" ? "text-emerald-600" : stats.trend === "Worsening" ? "text-rose-600" : "text-amber-600" },
                        { key: "medAdherence", label: "Med Adherence", value: `${Math.round(animMedAdherence)}%`, accent: "metric-accent-teal", icon: <ShieldCheck className="h-3 w-3" />, iconBg: "bg-teal-100 text-teal-600 dark:bg-teal-900/50 dark:text-teal-400", valueClass: "text-teal-600" },
                        { key: "bloodDays", label: "Blood Days", value: `${Math.round(animBloodDays)} (${stats.bloodPct}%)`, accent: "metric-accent-rose", icon: <Droplets className="h-3 w-3" />, iconBg: "bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400", valueClass: "text-rose-600" },
                        { key: "avgUrgency", label: "Avg Urgency", value: `${animAvgUrgency.toFixed(1)}/3`, accent: "metric-accent-amber", icon: <Zap className="h-3 w-3" />, iconBg: "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400" },
                      ].map((stat) => (
                        <div
                          key={stat.key}
                          className={`rounded-lg bg-muted/60 p-3 text-center print:p-2 print:bg-gray-100 card-premium hover-lift ${stat.accent} ${worstStatKey === stat.key ? "stat-pulse-worst" : ""} print-avoid-break`}
                        >
                          <div className="flex items-center justify-center gap-1.5 mb-1">
                            <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full ${stat.iconBg} shrink-0`}>
                              {stat.icon}
                            </span>
                            <span className="text-xs text-muted-foreground">{stat.label}</span>
                          </div>
                          <p className={`text-xl font-extrabold ${stat.valueClass ?? ""}`}>{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* R - Recommendation */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mb-6 print-avoid-break"
              >
                <div className="border-l-4 border-violet-400 bg-violet-50/30 dark:bg-violet-950/10 rounded-r-lg p-4 card-premium">
                  <h2 className="text-base font-semibold text-violet-700 dark:text-violet-400 mb-1.5 print:text-sm print:mt-4 print:mb-1 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300 text-xs font-bold shrink-0"><Lightbulb className="h-3.5 w-3.5" /></span>
                    R — Recommendation
                  </h2>
                  <p className="text-sm leading-relaxed print:text-xs">
                    {aiSummary?.recommendation || recommendation}
                  </p>
                </div>
              </motion.div>

              <Separator className="mb-6 print:mb-4" />

              {/* Data Table */}
              <div className="border-l-4 border-teal-400 pl-4 print:border-l-0 print:pl-0">
                <h2 className="text-base font-semibold mb-3 print:text-sm print:mt-4 print:mb-1">
                  Recent Symptom Log
                </h2>
                <p className="text-xs text-muted-foreground mb-2 sm:hidden">
                  &larr; Scroll horizontally to see all columns &rarr;
                </p>
                <div className="overflow-x-auto rounded-lg border print:rounded-none">
                  <Table className="table-row-hover table-row-premium table-zebra">
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Date</TableHead>
                        <TableHead>Pain</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Stool Type</TableHead>
                        <TableHead>Stress</TableHead>
                        <TableHead>Triggers</TableHead>
                        <TableHead>Blood</TableHead>
                        <TableHead>Urgency</TableHead>
                        <TableHead className="hidden lg:table-cell">Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats?.recentLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">
                            {format(parseISO(log.date), "MMM d")}
                          </TableCell>
                          <TableCell>
                            <span className={`font-medium ${
                              log.painLevel <= 3 ? "text-emerald-600" : log.painLevel <= 6 ? "text-amber-600" : "text-rose-600"
                            }`}>
                              {log.painLevel}/10
                            </span>
                          </TableCell>
                          <TableCell>{log.stoolFrequency}×</TableCell>
                          <TableCell>Type {log.stoolType}</TableCell>
                          <TableCell>{log.stressLevel}/10</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {[...new Set(log.triggers)].slice(0, 2).map((t) => (
                                <Badge key={`${log.id}-${t}`} variant="secondary" className="text-xs">
                                  {t}
                                </Badge>
                              ))}
                              {log.triggers.length > 2 && (
                                <span className="text-xs text-muted-foreground">
                                  +{log.triggers.length - 2}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {log.bloodInStool ? (
                              <span className="text-rose-600 font-medium text-xs">Yes</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-xs">
                              {["None", "Mild", "Moderate", "Severe"][log.urgencyLevel] || "None"}
                            </span>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell max-w-[200px] truncate text-xs text-muted-foreground">
                            {log.notes || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Footer for print */}
              <div className="mt-8 pt-4 border-t text-xs text-muted-foreground print:mt-6 print:pt-3">
                <p>
                  Generated by ColoBrief AI — An empathetic, AI-assisted symptom tracking portal for
                  Ulcerative Colitis patients. This document is intended as a supplementary tool for
                  clinical consultations and does not replace professional medical advice.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}