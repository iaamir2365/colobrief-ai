"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Flame,
  Droplets,
  Waves,
  Zap,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SymptomLog } from "@/types/symptom";
import { subDays, parseISO, isAfter } from "date-fns";

interface EmergencyAlertBannerProps {
  symptoms: SymptomLog[];
  isLoading: boolean;
}

interface DetectedWarning {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  severity: "critical" | "high";
}

export default function EmergencyAlertBanner({
  symptoms,
  isLoading,
}: EmergencyAlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const warnings = useMemo<DetectedWarning[]>(() => {
    if (isLoading || symptoms.length === 0) return [];

    const now = new Date();
    const threeDaysAgo = subDays(now, 3);
    const recentLogs = symptoms.filter((log) =>
      isAfter(parseISO(log.date), threeDaysAgo)
    );

    if (recentLogs.length === 0) return [];

    const detected: DetectedWarning[] = [];

    // Pain level >= 8
    const severePain = recentLogs.find((log) => log.painLevel >= 8);
    if (severePain) {
      detected.push({
        id: "severe-pain",
        label: "Severe Pain Detected",
        description: `Pain level of ${severePain.painLevel}/10 recorded on ${formatDate(severePain.date)}`,
        icon: Flame,
        severity: "critical",
      });
    }

    // Stool frequency >= 8
    const highFrequency = recentLogs.find((log) => log.stoolFrequency >= 8);
    if (highFrequency) {
      detected.push({
        id: "high-frequency",
        label: "High Stool Frequency",
        description: `${highFrequency.stoolFrequency} bowel movements on ${formatDate(highFrequency.date)}`,
        icon: Zap,
        severity: "critical",
      });
    }

    // Blood in stool
    const bloodStool = recentLogs.find((log) => log.bloodInStool);
    if (bloodStool) {
      detected.push({
        id: "blood-stool",
        label: "Blood in Stool",
        description: `Blood detected on ${formatDate(bloodStool.date)}`,
        icon: Droplets,
        severity: "critical",
      });
    }

    // Stool type 7 (watery)
    const wateryStool = recentLogs.find((log) => log.stoolType === 7);
    if (wateryStool) {
      detected.push({
        id: "watery-stool",
        label: "Watery Stool (Bristol Type 7)",
        description: `Watery stool recorded on ${formatDate(wateryStool.date)}`,
        icon: Waves,
        severity: "high",
      });
    }

    // Urgency level = 3 (severe)
    const severeUrgency = recentLogs.find((log) => log.urgencyLevel === 3);
    if (severeUrgency) {
      detected.push({
        id: "severe-urgency",
        label: "Severe Urgency",
        description: `Severe bathroom urgency reported on ${formatDate(severeUrgency.date)}`,
        icon: AlertTriangle,
        severity: "high",
      });
    }

    return detected;
  }, [symptoms, isLoading]);

  if (dismissed || isLoading || warnings.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="overflow-hidden"
    >
      <div className="relative rounded-xl border border-rose-300/80 dark:border-rose-800/60 bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-950/20 dark:to-red-950/10 border-l-4 border-l-rose-500 p-4 sm:p-5">
        {/* Dismiss button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 h-7 w-7 text-rose-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:text-rose-300 dark:hover:bg-rose-900/40"
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Header */}
        <div className="flex items-start gap-3 pr-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="rounded-full bg-rose-100 dark:bg-rose-900/60 p-2 shrink-0"
          >
            <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          </motion.div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-rose-900 dark:text-rose-200 text-base">
                Emergency Symptom Alert
              </h3>
              <Badge
                variant="destructive"
                className="text-[10px] px-1.5 py-0 font-semibold uppercase tracking-wider"
              >
                {warnings.length} {warnings.length === 1 ? "Warning" : "Warnings"}
              </Badge>
            </div>
            <p className="text-rose-700/80 dark:text-rose-400/80 text-sm mt-0.5">
              The following dangerous symptoms were detected in the last 3 days
            </p>
          </div>
        </div>

        {/* Warning List */}
        <ul className="mt-4 space-y-2.5 ml-1">
          {warnings.map((warning, index) => (
            <motion.li
              key={warning.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 * (index + 1), duration: 0.35 }}
              className="flex items-start gap-2.5"
            >
              <warning.icon
                className={`h-4 w-4 mt-0.5 shrink-0 ${
                  warning.severity === "critical"
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              />
              <div className="min-w-0">
                <span
                  className={`font-semibold text-sm ${
                    warning.severity === "critical"
                      ? "text-rose-800 dark:text-rose-300"
                      : "text-amber-800 dark:text-amber-300"
                  }`}
                >
                  {warning.label}
                </span>
                <p className="text-rose-700/70 dark:text-rose-400/70 text-xs mt-0.5">
                  {warning.description}
                </p>
              </div>
              <Badge
                variant={warning.severity === "critical" ? "destructive" : "outline"}
                className={`shrink-0 text-[10px] px-1.5 py-0 mt-0.5 ${
                  warning.severity === "high"
                    ? "border-amber-400 text-amber-700 dark:text-amber-400 dark:border-amber-600"
                    : ""
                }`}
              >
                {warning.severity === "critical" ? "Critical" : "High"}
              </Badge>
            </motion.li>
          ))}
        </ul>

        {/* Disclaimer */}
        <div className="mt-4 pt-3 border-t border-rose-200/60 dark:border-rose-800/40">
          <p className="text-[11px] leading-relaxed text-rose-600/70 dark:text-rose-500/60">
            <strong>Disclaimer:</strong> This is not medical advice. If you're
            experiencing severe symptoms, please contact your healthcare provider
            or visit an emergency room.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function formatDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}