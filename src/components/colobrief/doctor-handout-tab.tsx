"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Printer, Sparkles, Loader2, FileText, ClipboardList } from "lucide-react";
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
    };
  }, [symptoms]);

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
    return `Overall trend: ${stats.trend}. Average pain ${stats.avgPain.toFixed(1)}/10, stool frequency ${stats.avgStool.toFixed(1)}/day, stress ${stats.avgStress.toFixed(1)}/10. Common triggers: ${stats.topTriggers.join(", ") || "None identified"}. Most common stool type: ${stats.mostCommonStoolType}.`;
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
        className="flex flex-col items-center justify-center py-20 text-center max-w-lg mx-auto"
      >
        <div className="animate-gradient-bg rounded-2xl p-8 mb-6">
          <ClipboardList className="h-14 w-14 text-teal-600 mx-auto" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No data for a handout</h3>
        <p className="text-muted-foreground max-w-md mb-4">
          Log at least a few days of symptoms to generate an SBAR Clinical Brief 
          that you can share with your gastroenterologist.
        </p>
        <div className="rounded-lg border bg-card/50 p-4 text-left max-w-sm w-full">
          <p className="text-sm font-medium mb-2">📋 What you'll get:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• SBAR-formatted clinical summary</li>
            <li>• Automated trend analysis</li>
            <li>• Trigger identification report</li>
            <li>• Print-ready PDF for your doctor</li>
          </ul>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action buttons - hidden in print */}
      <div className="flex flex-wrap gap-2 print:hidden">
        <Button onClick={handlePrint} variant="outline" className="gap-2">
          <Printer className="h-4 w-4" />
          Export PDF
        </Button>
        <Button onClick={handleGenerateAI} disabled={isGenerating} className="gap-2">
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
        <Card className="rounded-xl border-0 shadow-sm print:hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Bristol Stool Scale Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Constipation", color: "bg-stone-100 border-stone-200", desc: "Hard, lumpy — Types 1-2", icon: "🪨" },
                { label: "Normal", color: "bg-emerald-50 border-emerald-200", desc: "Smooth, soft — Types 3-4", icon: "✅" },
                { label: "Mild Diarrhea", color: "bg-amber-50 border-amber-200", desc: "Soft, mushy — Types 5-6", icon: "⚠️" },
                { label: "Severe Diarrhea", color: "bg-rose-50 border-rose-200", desc: "Watery — Type 7", icon: "🚨" },
              ].map((item) => (
                <div key={item.label} className={`rounded-lg border p-3 ${item.color}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{item.icon}</span>
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
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-xl border-0 shadow-sm print:shadow-none print:border print:rounded-none">
            <CardContent className="p-6 print:p-4">
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

              {/* S - Situation */}
              <div className="mb-5 border-l-4 border-teal-400 pl-4">
                <h2 className="text-base font-semibold text-teal-700 mb-1.5 print:text-sm print:mt-4 print:mb-1">
                  S — Situation
                </h2>
                <p className="text-sm leading-relaxed print:text-xs">
                  {aiSummary?.situation || situation}
                </p>
              </div>

              {/* B - Background */}
              <div className="mb-5 border-l-4 border-sky-400 pl-4">
                <h2 className="text-base font-semibold text-sky-700 mb-1.5 print:text-sm print:mt-4 print:mb-1">
                  B — Background
                </h2>
                <p className="text-sm leading-relaxed print:text-xs">
                  {aiSummary?.background || background}
                </p>
              </div>

              {/* A - Assessment */}
              <div className="mb-5 border-l-4 border-amber-400 pl-4">
                <h2 className="text-base font-semibold text-amber-700 mb-1.5 print:text-sm print:mt-4 print:mb-1">
                  A — Assessment
                </h2>
                {aiSummary && (
                  <Badge variant="secondary" className="mb-2 print:hidden">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI-Generated
                  </Badge>
                )}
                <p className="text-sm leading-relaxed print:text-xs">{assessment}</p>

                {/* Quick stats */}
                {stats && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 print:grid-cols-4 print:gap-2 print:mt-2">
                    <div className="rounded-lg bg-muted/60 p-3 text-center print:p-2 print:bg-gray-100">
                      <p className="text-xs text-muted-foreground">Avg Pain</p>
                      <p className="text-lg font-bold">{stats.avgPain.toFixed(1)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/60 p-3 text-center print:p-2 print:bg-gray-100">
                      <p className="text-xs text-muted-foreground">Avg Frequency</p>
                      <p className="text-lg font-bold">{stats.avgStool.toFixed(1)}/day</p>
                    </div>
                    <div className="rounded-lg bg-muted/60 p-3 text-center print:p-2 print:bg-gray-100">
                      <p className="text-xs text-muted-foreground">Avg Stress</p>
                      <p className="text-lg font-bold">{stats.avgStress.toFixed(1)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/60 p-3 text-center print:p-2 print:bg-gray-100">
                      <p className="text-xs text-muted-foreground">Trend</p>
                      <p
                        className={`text-lg font-bold ${
                          stats.trend === "Improving"
                            ? "text-emerald-600"
                            : stats.trend === "Worsening"
                            ? "text-rose-600"
                            : "text-amber-600"
                        }`}
                      >
                        {stats.trend}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* R - Recommendation */}
              <div className="mb-6 border-l-4 border-violet-400 pl-4">
                <h2 className="text-base font-semibold text-violet-700 mb-1.5 print:text-sm print:mt-4 print:mb-1">
                  R — Recommendation
                </h2>
                <p className="text-sm leading-relaxed print:text-xs">
                  {aiSummary?.recommendation || recommendation}
                </p>
              </div>

              <Separator className="mb-6 print:mb-4" />

              {/* Data Table */}
              <div>
                <h2 className="text-base font-semibold mb-3 print:text-sm print:mt-4 print:mb-1">
                  Recent Symptom Log
                </h2>
                <p className="text-xs text-muted-foreground mb-2 sm:hidden">
                  &larr; Scroll horizontally to see all columns &rarr;
                </p>
                <div className="overflow-x-auto rounded-lg border print:rounded-none">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Date</TableHead>
                        <TableHead>Pain</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Stool Type</TableHead>
                        <TableHead>Stress</TableHead>
                        <TableHead>Triggers</TableHead>
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
                              {log.triggers.slice(0, 2).map((t) => (
                                <Badge key={t} variant="secondary" className="text-xs">
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