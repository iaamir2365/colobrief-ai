"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Pill, TrendingDown, TrendingUp, Minus, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import type { SymptomLog } from "@/types/symptom";

interface MedicationTrackerProps {
  symptoms: SymptomLog[];
  isLoading: boolean;
}

interface MedicationStats {
  name: string;
  daysTaken: number;
  daysNotTaken: number;
  avgPainTaken: number;
  avgPainNotTaken: number;
  avgFreqTaken: number;
  avgFreqNotTaken: number;
  painDiff: number;
  freqDiff: number;
}

function extractMedications(symptoms: SymptomLog[]): Set<string> {
  const meds = new Set<string>();
  for (const s of symptoms) {
    if (!s.medicationTaken) continue;
    const parts = s.medicationTaken
      .split(/[,;+&]/)
      .map((m) => m.trim())
      .filter(Boolean);
    for (const part of parts) {
      // Strip dosage info and keep just the name
      const name = part.replace(/\d+\.?\d*\s*(mg|ml|g|mcg|tablet|capsule|puff|dose|tabs?|caps?)s?/gi, "").trim();
      if (name) meds.add(name);
    }
  }
  return meds;
}

function computeStats(
  symptoms: SymptomLog[],
  medName: string
): MedicationStats {
  const taken: SymptomLog[] = [];
  const notTaken: SymptomLog[] = [];

  for (const s of symptoms) {
    const med = s.medicationTaken?.toLowerCase() ?? "";
    const name = medName.toLowerCase();
    // Match if medication field contains this medication name
    if (med.includes(name)) {
      taken.push(s);
    } else if (s.medicationTaken) {
      notTaken.push(s);
    }
  }

  // Also include days with no medication as "not taken"
  for (const s of symptoms) {
    if (!s.medicationTaken && !taken.includes(s) && !notTaken.includes(s)) {
      notTaken.push(s);
    }
  }

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

  const avgPainTaken = avg(taken.map((s) => s.painLevel));
  const avgPainNotTaken = avg(notTaken.map((s) => s.painLevel));
  const avgFreqTaken = avg(taken.map((s) => s.stoolFrequency));
  const avgFreqNotTaken = avg(notTaken.map((s) => s.stoolFrequency));

  return {
    name: medName,
    daysTaken: taken.length,
    daysNotTaken: notTaken.length,
    avgPainTaken,
    avgPainNotTaken,
    avgFreqTaken,
    avgFreqNotTaken,
    painDiff: avgPainNotTaken - avgPainTaken,
    freqDiff: avgFreqNotTaken - avgFreqTaken,
  };
}

export default function MedicationTracker({ symptoms, isLoading }: MedicationTrackerProps) {
  const data = useMemo(() => {
    if (!symptoms.length) return null;

    const meds = extractMedications(symptoms);
    if (!meds.size) return null;

    const stats = Array.from(meds)
      .map((name) => computeStats(symptoms, name))
      .sort((a, b) => b.daysTaken - a.daysTaken);

    const totalDays = symptoms.length;
    const daysWithMed = symptoms.filter((s) => !!s.medicationTaken).length;
    const adherence = totalDays > 0 ? (daysWithMed / totalDays) * 100 : 0;

    // Best insight: medication with the most meaningful pain reduction
    const bestPainRelief = stats
      .filter((s) => s.daysTaken >= 2 && s.daysNotTaken >= 2)
      .sort((a, b) => b.painDiff - a.painDiff)[0];

    return { stats, adherence, daysWithMed, totalDays, bestPainRelief };
  }, [symptoms]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (!data || !data.stats.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="rounded-xl border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Pill className="h-4 w-4 text-teal-600" />
              Medication Tracker
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-6">
              No medications logged yet. Start logging your medications to see correlation data.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const maxDays = Math.max(...data.stats.map((s) => s.daysTaken), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      <Card className="rounded-xl border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Pill className="h-4 w-4 text-teal-600" />
              Medication Tracker
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {data.stats.length} medication{data.stats.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Adherence Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Medication Adherence</span>
              <span className="font-semibold">{data.adherence.toFixed(0)}%</span>
            </div>
            <Progress value={data.adherence} className="h-3" />
            <p className="text-xs text-muted-foreground">
              {data.daysWithMed} of {data.totalDays} days had medication logged
            </p>
          </div>

          {/* Insight */}
          {data.bestPainRelief && data.bestPainRelief.painDiff > 0.1 && (
            <div className="rounded-lg border border-teal-200 dark:border-teal-800/50 bg-teal-50 dark:bg-teal-950/30 p-3 flex items-start gap-2.5">
              <Info className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
              <p className="text-sm text-teal-800 dark:text-teal-200">
                On days you took <strong>{data.bestPainRelief.name}</strong>, your average pain was{" "}
                <strong>{data.bestPainRelief.painDiff.toFixed(1)}</strong> points lower
                ({data.bestPainRelief.avgPainTaken.toFixed(1)} vs {data.bestPainRelief.avgPainNotTaken.toFixed(1)}).
              </p>
            </div>
          )}

          {/* Medication Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.stats.map((med, idx) => (
              <motion.div
                key={med.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + idx * 0.06 }}
                className="rounded-lg border bg-card p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center shrink-0">
                      <Pill className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <span className="font-medium text-sm truncate">{med.name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {med.daysTaken} day{med.daysTaken !== 1 ? "s" : ""}
                  </Badge>
                </div>

                {/* Days taken bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Days taken</span>
                    <span>{med.daysTaken}/{med.daysTaken + med.daysNotTaken}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full bg-teal-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(med.daysTaken / Math.max(med.daysTaken + med.daysNotTaken, 1)) * 100}%`,
                      }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Pain comparison */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Avg Pain (taken)</span>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{med.avgPainTaken.toFixed(1)}</span>
                        {med.daysTaken >= 2 && med.daysNotTaken >= 2 && (
                          med.painDiff > 0.1 ? (
                            <TrendingDown className="h-3 w-3 text-emerald-500" />
                          ) : med.painDiff < -0.1 ? (
                            <TrendingUp className="h-3 w-3 text-rose-500" />
                          ) : (
                            <Minus className="h-3 w-3 text-muted-foreground" />
                          )
                        )}
                      </div>
                    </div>
                    {/* Mini comparison bar */}
                    {med.daysNotTaken >= 2 && (
                      <div className="flex gap-1 h-2">
                        <div
                          className="rounded-full bg-rose-400/70"
                          style={{ width: `${(med.avgPainNotTaken / 10) * 100}%` }}
                          title={`Not taken: ${med.avgPainNotTaken.toFixed(1)}`}
                        />
                        <div
                          className="rounded-full bg-teal-500"
                          style={{ width: `${(med.avgPainTaken / 10) * 100}%` }}
                          title={`Taken: ${med.avgPainTaken.toFixed(1)}`}
                        />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Avg Freq (taken)</span>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{med.avgFreqTaken.toFixed(1)}</span>
                        {med.daysTaken >= 2 && med.daysNotTaken >= 2 && (
                          med.freqDiff > 0.1 ? (
                            <TrendingDown className="h-3 w-3 text-emerald-500" />
                          ) : med.freqDiff < -0.1 ? (
                            <TrendingUp className="h-3 w-3 text-rose-500" />
                          ) : (
                            <Minus className="h-3 w-3 text-muted-foreground" />
                          )
                        )}
                      </div>
                    </div>
                    {med.daysNotTaken >= 2 && (
                      <div className="flex gap-1 h-2">
                        <div
                          className="rounded-full bg-rose-400/70"
                          style={{ width: `${Math.min((med.avgFreqNotTaken / 20) * 100, 100)}%` }}
                          title={`Not taken: ${med.avgFreqNotTaken.toFixed(1)}`}
                        />
                        <div
                          className="rounded-full bg-teal-500"
                          style={{ width: `${Math.min((med.avgFreqTaken / 20) * 100, 100)}%` }}
                          title={`Taken: ${med.avgFreqTaken.toFixed(1)}`}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer insight */}
                {med.daysTaken >= 2 && med.daysNotTaken >= 2 && Math.abs(med.painDiff) > 0.1 && (
                  <p className="text-xs text-muted-foreground">
                    {med.painDiff > 0
                      ? `Pain was ${med.painDiff.toFixed(1)} pts lower on medication days`
                      : `Pain was ${Math.abs(med.painDiff).toFixed(1)} pts higher on medication days`}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}