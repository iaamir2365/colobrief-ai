"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { GitCompareArrows } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import type { SymptomLog } from "@/types/symptom";
import { subDays, parseISO, isAfter, startOfDay } from "date-fns";

interface SymptomRadarProps {
  symptoms: SymptomLog[];
  isLoading: boolean;
}

const radarConfig: ChartConfig = {
  currentWeek: {
    label: "This Week",
    color: "#14b8a6",
  },
  previousWeek: {
    label: "Previous Week",
    color: "#94a3b8",
  },
};

interface WeekAverages {
  pain: number;
  stool: number;
  stress: number;
  urgency: number;
  sleep: number;
  wellbeing: number;
}

function calculateWeekAverages(logs: SymptomLog[]): WeekAverages {
  if (logs.length === 0) {
    return { pain: 0, stool: 0, stress: 0, urgency: 0, sleep: 0, wellbeing: 0 };
  }

  const avgPain = logs.reduce((a, s) => a + s.painLevel, 0) / logs.length;
  const avgStool = logs.reduce((a, s) => a + s.stoolFrequency, 0) / logs.length;
  const avgStress = logs.reduce((a, s) => a + s.stressLevel, 0) / logs.length;
  const avgUrgency = logs.reduce((a, s) => a + s.urgencyLevel, 0) / logs.length;

  // Normalize stool frequency to 0-10 (cap at 10)
  const maxStool = Math.max(...logs.map(s => s.stoolFrequency), 1);
  const stoolNorm = (avgStool / Math.max(maxStool, 1)) * 10;

  // Urgency 0-3 scaled to 0-10
  const urgencyNorm = (avgUrgency / 3) * 10;

  // Sleep quality (inverted stress): higher stress = worse sleep
  const sleep = 10 - avgStress;

  // Overall wellbeing: inverse of composite severity
  // Composite = pain*0.4 + stoolNorm*0.2 + stress*0.3 + urgencyNorm*0.1
  const composite = avgPain * 0.4 + stoolNorm * 0.2 + avgStress * 0.3 + urgencyNorm * 0.1;
  const wellbeing = Math.max(0, 10 - composite);

  return {
    pain: Math.round(avgPain * 10) / 10,
    stool: Math.round(stoolNorm * 10) / 10,
    stress: Math.round(avgStress * 10) / 10,
    urgency: Math.round(urgencyNorm * 10) / 10,
    sleep: Math.round(sleep * 10) / 10,
    wellbeing: Math.round(wellbeing * 10) / 10,
  };
}

export default function SymptomRadar({ symptoms, isLoading }: SymptomRadarProps) {
  const isMobile = useIsMobile();
  const radarData = useMemo(() => {
    if (symptoms.length < 5) return null;

    const now = startOfDay(new Date());
    const sevenDaysAgo = subDays(now, 7);
    const fourteenDaysAgo = subDays(now, 14);

    const currentWeekLogs = symptoms.filter(s =>
      isAfter(parseISO(s.date), sevenDaysAgo) || s.date === sevenDaysAgo.toISOString().split("T")[0]
    );
    const previousWeekLogs = symptoms.filter(s => {
      const d = parseISO(s.date);
      return (isAfter(d, fourteenDaysAgo) || d.toISOString().split("T")[0] === fourteenDaysAgo.toISOString().split("T")[0]) &&
             !isAfter(d, sevenDaysAgo) && d.toISOString().split("T")[0] !== sevenDaysAgo.toISOString().split("T")[0];
    });

    if (currentWeekLogs.length === 0 && previousWeekLogs.length === 0) return null;

    const current = calculateWeekAverages(currentWeekLogs);
    const previous = calculateWeekAverages(previousWeekLogs);

    return [
      { dimension: "Pain", currentWeek: current.pain, previousWeek: previous.pain },
      { dimension: "Stool Freq", currentWeek: current.stool, previousWeek: previous.stool },
      { dimension: "Stress", currentWeek: current.stress, previousWeek: previous.stress },
      { dimension: "Urgency", currentWeek: current.urgency, previousWeek: previous.urgency },
      { dimension: "Sleep", currentWeek: current.sleep, previousWeek: previous.sleep },
      { dimension: "Wellbeing", currentWeek: current.wellbeing, previousWeek: previous.wellbeing },
    ];
  }, [symptoms]);

  if (isLoading) {
    return (
      <Card className="rounded-xl border-0 card-premium">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <GitCompareArrows className="h-4 w-4 text-teal-600" />
            <Skeleton className="h-5 w-48" />
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Skeleton className="h-80 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!radarData) {
    return (
      <Card className="rounded-xl border-0 card-premium">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <GitCompareArrows className="h-4 w-4 text-teal-600" />
            Week-over-Week Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <GitCompareArrows className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              Need at least 5 logged days to show the comparison.
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Two weeks of data gives the best comparison.
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
      transition={{ duration: 0.5 }}
    >
      <Card className="rounded-xl border-0 card-premium">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <GitCompareArrows className="h-4 w-4 text-teal-600" />
            Week-over-Week Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex w-full min-w-0 justify-center">
            <ChartContainer config={radarConfig} className="mx-auto h-60 w-full max-w-lg min-w-0 sm:h-80">
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={isMobile ? "62%" : "75%"}>
              <PolarGrid stroke="var(--color-border)" />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fontSize: isMobile ? 10 : 11, fill: "var(--color-muted-foreground)" }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 10]}
                tick={{ fontSize: isMobile ? 8 : 9, fill: "var(--color-muted-foreground)" }}
                tickCount={6}
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
              />
              <Radar
                name="previousWeek"
                dataKey="previousWeek"
                stroke="var(--color-previousWeek)"
                fill="var(--color-previousWeek)"
                fillOpacity={0.15}
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
              <Radar
                name="currentWeek"
                dataKey="currentWeek"
                stroke="var(--color-currentWeek)"
                fill="var(--color-currentWeek)"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <ChartLegend content={<ChartLegendContent />} />
            </RadarChart>
          </ChartContainer>
          </div>
          <p className="text-[11px] text-muted-foreground/60 mt-2 text-center">
            All metrics normalized to 0–10 scale. Lower is better for Pain, Stool, Stress, Urgency.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
