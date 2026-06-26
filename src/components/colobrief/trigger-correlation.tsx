"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { SymptomLog } from "@/types/symptom";

interface TriggerCorrelationProps {
  symptoms: SymptomLog[];
  isLoading: boolean;
}

interface TriggerStats {
  trigger: string;
  presentCount: number;
  absentCount: number;
  avgPainPresent: number;
  avgPainAbsent: number;
  avgStoolFreqPresent: number;
  avgStoolFreqAbsent: number;
  avgStressPresent: number;
  avgStressAbsent: number;
  painLift: number;
  frequencyLift: number;
}

function getStrength(lift: number): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  const abs = Math.abs(lift);
  if (abs > 2) return { label: "Strong", variant: "destructive" };
  if (abs > 1) return { label: "Moderate", variant: "default" };
  return { label: "Weak", variant: "secondary" };
}

export default function TriggerCorrelation({ symptoms, isLoading }: TriggerCorrelationProps) {
  const correlations = useMemo<TriggerStats[]>(() => {
    if (symptoms.length < 3) return [];

    // Collect all unique triggers
    const triggerSet = new Set<string>();
    for (const log of symptoms) {
      for (const t of log.triggers) {
        triggerSet.add(t);
      }
    }

    const results: TriggerStats[] = [];

    for (const trigger of triggerSet) {
      const present = symptoms.filter((s) => s.triggers.includes(trigger));
      const absent = symptoms.filter((s) => !s.triggers.includes(trigger));

      // Need at least 2 days with and 2 days without for meaningful comparison
      if (present.length < 2 || absent.length < 2) continue;

      const avgPainPresent = present.reduce((sum, s) => sum + s.painLevel, 0) / present.length;
      const avgPainAbsent = absent.reduce((sum, s) => sum + s.painLevel, 0) / absent.length;
      const avgStoolFreqPresent = present.reduce((sum, s) => sum + s.stoolFrequency, 0) / present.length;
      const avgStoolFreqAbsent = absent.reduce((sum, s) => sum + s.stoolFrequency, 0) / absent.length;
      const avgStressPresent = present.reduce((sum, s) => sum + s.stressLevel, 0) / present.length;
      const avgStressAbsent = absent.reduce((sum, s) => sum + s.stressLevel, 0) / absent.length;

      results.push({
        trigger,
        presentCount: present.length,
        absentCount: absent.length,
        avgPainPresent,
        avgPainAbsent,
        avgStoolFreqPresent,
        avgStoolFreqAbsent,
        avgStressPresent,
        avgStressAbsent,
        painLift: avgPainPresent - avgPainAbsent,
        frequencyLift: avgStoolFreqPresent - avgStoolFreqAbsent,
      });
    }

    // Sort by pain lift descending (most harmful first)
    results.sort((a, b) => b.painLift - a.painLift);

    return results.slice(0, 6);
  }, [symptoms]);

  const maxAbsLift = useMemo(() => {
    if (correlations.length === 0) return 1;
    return Math.max(...correlations.map((c) => Math.abs(c.painLift)), 0.5);
  }, [correlations]);

  if (isLoading) {
    return (
      <Card className="rounded-xl border-0 shadow-sm card-elevated">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-teal-600" />
            <Skeleton className="h-5 w-44" />
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-3 w-full rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (correlations.length === 0) {
    return (
      <Card className="rounded-xl border-0 shadow-sm card-elevated">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-teal-600" />
            Trigger Impact Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted/50 p-3 mb-3">
              <BarChart3 className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground max-w-[240px]">
              Log more symptoms with triggers to reveal which factors impact your pain the most.
            </p>
            <p className="text-xs text-muted-foreground/70 mt-2">
              Need at least 3 days of data with varied triggers.
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
      transition={{ delay: 0.18 }}
    >
      <Card className="rounded-xl border-0 shadow-sm card-elevated">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-teal-600" />
            Trigger Impact Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-5">
            {correlations.map((stat, i) => {
              const isHarmful = stat.painLift > 0;
              const barWidth = Math.max((Math.abs(stat.painLift) / maxAbsLift) * 100, 6);
              const strength = getStrength(stat.painLift);

              return (
                <motion.div
                  key={stat.trigger}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.07 }}
                  className="group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`text-sm font-medium truncate ${
                          isHarmful
                            ? "text-rose-700 dark:text-rose-400"
                            : "text-emerald-700 dark:text-emerald-400"
                        }`}
                      >
                        {stat.trigger}
                      </span>
                      <Badge
                        variant={strength.variant}
                        className={`text-[10px] px-1.5 py-0 h-4 ${
                          isHarmful
                            ? strength.variant === "destructive"
                              ? ""
                              : "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                        }`}
                      >
                        {strength.label}
                      </Badge>
                    </div>
                    <span
                      className={`text-sm font-semibold tabular-nums whitespace-nowrap ml-2 ${
                        isHarmful
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {stat.painLift > 0 ? "+" : ""}
                      {stat.painLift.toFixed(1)} pts
                    </span>
                  </div>

                  {/* Horizontal bar */}
                  <div className="relative h-2.5 w-full rounded-full bg-muted/50 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ delay: 0.3 + i * 0.07, duration: 0.6, ease: "easeOut" }}
                      className={`absolute inset-y-0 left-0 rounded-full ${
                        isHarmful
                          ? "bg-gradient-to-r from-rose-400 to-rose-600"
                          : "bg-gradient-to-r from-emerald-400 to-emerald-600"
                      }`}
                    />
                  </div>

                  {/* Subtle meta info */}
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                    <span>
                      {stat.presentCount}d with trigger
                    </span>
                    <span className="text-muted-foreground/40">|</span>
                    <span>
                      Avg pain {stat.avgPainPresent.toFixed(1)} vs {stat.avgPainAbsent.toFixed(1)}
                    </span>
                    {stat.frequencyLift > 0.3 && (
                      <>
                        <span className="text-muted-foreground/40">|</span>
                        <span className="text-rose-500/80">
                          +{stat.frequencyLift.toFixed(1)} stool freq
                        </span>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <p className="text-[11px] text-muted-foreground/60 mt-5 leading-relaxed border-t border-border/50 pt-3">
            Analysis based on your logged data. Higher bars = stronger correlation with pain. 
            This does not imply causation — consult your doctor for medical advice.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}