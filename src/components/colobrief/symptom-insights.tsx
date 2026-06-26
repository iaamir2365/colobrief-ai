"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  RefreshCw,
  Brain,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { SymptomLog } from "@/types/symptom";

interface SymptomInsightsProps {
  symptoms: SymptomLog[];
  isLoading: boolean;
}

interface AIInsightResult {
  overallTrend: "improving" | "stable" | "worsening";
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  riskLevel: "low" | "moderate" | "high";
}

function RiskBadge({ level }: { level: "low" | "moderate" | "high" }) {
  switch (level) {
    case "low":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 border-0">
          <ShieldCheck className="h-3 w-3 mr-1" />
          Low Risk
        </Badge>
      );
    case "moderate":
      return (
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 border-0">
          <ShieldQuestion className="h-3 w-3 mr-1" />
          Moderate Risk
        </Badge>
      );
    case "high":
      return (
        <Badge variant="destructive" className="border-0">
          <ShieldAlert className="h-3 w-3 mr-1" />
          High Risk
        </Badge>
      );
  }
}

function TrendIcon({ trend }: { trend: "improving" | "stable" | "worsening" }) {
  switch (trend) {
    case "improving":
      return <TrendingDown className="h-4 w-4 text-emerald-500" />;
    case "worsening":
      return <TrendingUp className="h-4 w-4 text-rose-500" />;
    case "stable":
      return <Minus className="h-4 w-4 text-amber-500" />;
  }
}

function TrendLabel({ trend }: { trend: "improving" | "stable" | "worsening" }) {
  switch (trend) {
    case "improving":
      return <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Improving</span>;
    case "worsening":
      return <span className="text-rose-600 dark:text-rose-400 font-semibold">Worsening</span>;
    case "stable":
      return <span className="text-amber-600 dark:text-amber-400 font-semibold">Stable</span>;
  }
}

export default function SymptomInsights({ symptoms, isLoading }: SymptomInsightsProps) {
  const [insights, setInsights] = useState<AIInsightResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsights = useCallback(async () => {
    if (symptoms.length < 3) {
      setError("Need at least 3 logged entries to generate insights.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Prepare summarized symptom data for the AI
      const summaryData = {
        totalEntries: symptoms.length,
        dateRange: {
          earliest: symptoms[0]?.date,
          latest: symptoms[symptoms.length - 1]?.date,
        },
        averages: {
          painLevel: (symptoms.reduce((a, s) => a + s.painLevel, 0) / symptoms.length).toFixed(1),
          stoolFrequency: (symptoms.reduce((a, s) => a + s.stoolFrequency, 0) / symptoms.length).toFixed(1),
          stressLevel: (symptoms.reduce((a, s) => a + s.stressLevel, 0) / symptoms.length).toFixed(1),
          urgencyLevel: (symptoms.reduce((a, s) => a + s.urgencyLevel, 0) / symptoms.length).toFixed(1),
        },
        bloodDays: symptoms.filter(s => s.bloodInStool).length,
        recentEntries: symptoms.slice(-7).map(s => ({
          date: s.date,
          pain: s.painLevel,
          stool: s.stoolFrequency,
          stress: s.stressLevel,
          urgency: s.urgencyLevel,
          blood: s.bloodInStool,
          triggers: s.triggers,
        })),
      };

      const prompt = `Analyze this Ulcerative Colitis patient's symptom data and return ONLY a valid JSON object (no markdown, no code fences) with this exact structure:
{
  "overallTrend": "improving" | "stable" | "worsening",
  "summary": "2-3 sentence clinical summary of the patient's UC status",
  "keyFindings": ["finding 1", "finding 2", "finding 3"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "riskLevel": "low" | "moderate" | "high"
}

Patient data: ${JSON.stringify(summaryData)}

Rules:
- overallTrend: "improving" if recent pain/stress trending down, "worsening" if trending up, "stable" otherwise
- riskLevel: "high" if avg pain > 6 or blood present frequently, "moderate" if avg pain 4-6, "low" if avg pain < 4 and no blood
- keyFindings: 3 specific, clinically relevant observations
- recommendations: 2 actionable, patient-friendly suggestions
- summary: concise clinical overview`;

      const response = await fetch("/api/symptoms/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          symptomData: JSON.stringify(summaryData),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate insights");
      }

      const data = await response.json();

      // Parse the AI response — may contain markdown code fences
      let jsonStr = data.message || "";
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }

      const parsed: AIInsightResult = JSON.parse(jsonStr);
      setInsights(parsed);
    } catch (err) {
      console.error("Insights generation error:", err);
      setError("Failed to generate insights. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [symptoms]);

  if (isLoading) {
    return (
      <Card className="rounded-xl border-0 card-premium card-glow">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Brain className="h-4 w-4 text-teal-600" />
            <Skeleton className="h-5 w-40" />
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-20 w-full" />
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
      <Card className="rounded-xl border-0 card-premium card-glow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Brain className="h-4 w-4 text-teal-600" />
              AI Symptom Insights
            </CardTitle>
            {!insights && !isGenerating && (
              <Button
                size="sm"
                onClick={generateInsights}
                disabled={symptoms.length < 3}
                className="btn-premium animate-[pulse-glow_2s_ease-in-out_infinite]"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Generate AI Insights
              </Button>
            )}
            {insights && !isGenerating && (
              <Button
                size="sm"
                variant="outline"
                onClick={generateInsights}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Generating state */}
          {isGenerating && (
            <div className="space-y-4 animate-pulse-soft">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <motion.div
                    className="h-2 w-2 rounded-full bg-teal-500"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                  />
                  <motion.div
                    className="h-2 w-2 rounded-full bg-teal-500"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }}
                  />
                  <motion.div
                    className="h-2 w-2 rounded-full bg-teal-500"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }}
                  />
                </div>
                <span className="text-sm text-muted-foreground">Analyzing your symptoms...</span>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-16 rounded-lg" />
                <Skeleton className="h-16 rounded-lg" />
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="flex flex-col items-center gap-3 py-6">
              <AlertCircle className="h-8 w-8 text-rose-400" />
              <p className="text-sm text-muted-foreground text-center">{error}</p>
              <Button size="sm" variant="outline" onClick={generateInsights}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </div>
          )}

          {/* Results */}
          <AnimatePresence>
            {insights && !isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                {/* Top row: risk + trend */}
                <div className="flex items-center gap-3 flex-wrap">
                  <RiskBadge level={insights.riskLevel} />
                  <div className="flex items-center gap-1.5">
                    <TrendIcon trend={insights.overallTrend} />
                    <span className="text-sm text-muted-foreground">Overall:</span>
                    <TrendLabel trend={insights.overallTrend} />
                  </div>
                </div>

                {/* Summary */}
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {insights.summary}
                </p>

                {/* Key Findings */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Key Findings
                  </h4>
                  <ul className="space-y-1.5">
                    {insights.keyFindings.map((finding, i) => (
                      <motion.li
                        key={i}
                        className="flex items-start gap-2 text-sm"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 + 0.2 }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-500 shrink-0 mt-2" />
                        <span className="text-foreground/85">{finding}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Recommendations
                  </h4>
                  <ul className="space-y-1.5">
                    {insights.recommendations.map((rec, i) => (
                      <motion.li
                        key={i}
                        className="flex items-start gap-2 text-sm"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 + 0.5 }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-500 shrink-0 mt-2" />
                        <span className="text-foreground/85">{rec}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                <p className="text-[11px] text-muted-foreground/50 pt-1">
                  AI-generated insights are for informational purposes only. Always consult your healthcare provider.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty / no-data state */}
          {!insights && !isGenerating && !error && (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Brain className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                {symptoms.length < 3
                  ? "Log at least 3 entries to unlock AI insights."
                  : "Click the button above to generate AI-powered insights from your data."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}