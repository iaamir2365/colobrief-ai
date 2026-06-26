"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Mic,
  Sparkles,
  Activity,
  Printer,
  BarChart3,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  CalendarDays,
  Flame,
  Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface OnboardingTourProps {
  onLoadDemo: () => void;
  onStartLogging: () => void;
  symptomCount: number;
}

const STORAGE_KEY = "colobrief-tour-completed";
const TOTAL_STEPS = 5;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 280 : -280,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 280 : -280,
    opacity: 0,
  }),
};

export default function OnboardingTour({
  onLoadDemo,
  onStartLogging,
  symptomCount,
}: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if tour not completed AND no symptom data loaded
    const tourCompleted = localStorage.getItem(STORAGE_KEY);
    if (!tourCompleted && symptomCount === 0) {
      // Small delay for smooth mount
      const t = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(t);
    } else if (visible) {
      // Auto-dismiss tour if data loads while tour is visible
      setVisible(false);
    }
  }, [symptomCount]);

  const completeTour = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  }, []);

  const goNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const handleAction = useCallback(
    (action: "demo" | "log") => {
      completeTour();
      if (action === "demo") onLoadDemo();
      else onStartLogging();
    },
    [completeTour, onLoadDemo, onStartLogging],
  );

  const progress = ((currentStep + 1) / TOTAL_STEPS) * 100;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <div className="relative max-w-md w-full mx-4 rounded-2xl bg-card shadow-2xl border overflow-hidden">
            {/* Progress Bar */}
            <div className="h-1 w-full bg-muted">
              <motion.div
                className="h-full bg-gradient-to-r from-teal-500 to-teal-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              />
            </div>

            {/* Step Content */}
            <div className="relative overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="px-8 py-8"
                >
                  {/* Step 1 — Welcome */}
                  {currentStep === 0 && (
                    <div className="flex flex-col items-center text-center space-y-6">
                      {/* Animated gradient icon */}
                      <div className="relative">
                        <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-teal-400 via-teal-500 to-emerald-400 opacity-30 blur-xl animate-pulse" />
                        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-700 shadow-lg shadow-teal-500/30">
                          <Heart className="h-10 w-10 text-white" fill="white" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight">
                          Welcome to{" "}
                          <span className="bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">
                            ColoBrief AI
                          </span>
                        </h2>
                        <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">
                          Your AI-powered companion for tracking Ulcerative Colitis
                          symptoms. Let&apos;s take a quick tour.
                        </p>
                      </div>
                      <div className="flex flex-col items-center gap-3 pt-2 w-full">
                        <Button
                          onClick={goNext}
                          className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white shadow-md shadow-teal-500/25 h-11"
                        >
                          Next
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        <button
                          onClick={completeTour}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Skip Tour
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2 — Track Your Symptoms */}
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight">
                          Track Your Symptoms
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                          Log symptoms your way — choose from three flexible input
                          methods.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-start gap-4 rounded-xl border bg-muted/30 p-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                            <Mic className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Voice Input</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Speak naturally about how you feel. AI extracts clinical
                              data from your words.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4 rounded-xl border bg-muted/30 p-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                            <Sparkles className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">AI Extraction</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Paste free-form notes and let AI intelligently parse pain
                              levels, triggers, and more.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4 rounded-xl border bg-muted/30 p-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                            <Activity className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Manual Form</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Fill in structured fields for pain, stool frequency, stress
                              level, and triggers.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <Button variant="ghost" size="sm" onClick={goBack}>
                          <ArrowLeft className="mr-1.5 h-4 w-4" />
                          Back
                        </Button>
                        <Button
                          onClick={goNext}
                          className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white shadow-md shadow-teal-500/25"
                        >
                          Next
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 3 — Visualize Trends */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight">
                          Visualize Trends
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                          Your Overview dashboard transforms raw data into actionable
                          insights.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border bg-muted/30 p-3 space-y-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                            <Gauge className="h-4 w-4" />
                          </div>
                          <p className="text-xs font-semibold">Health Score</p>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-teal-500 to-emerald-400" />
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            Composite wellness metric
                          </p>
                        </div>

                        <div className="rounded-xl border bg-muted/30 p-3 space-y-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                            <BarChart3 className="h-4 w-4" />
                          </div>
                          <p className="text-xs font-semibold">Symptom Trends</p>
                          <div className="flex items-end gap-0.5 h-6">
                            {[3, 5, 2, 6, 4, 3, 1].map((h, i) => (
                              <div
                                key={i}
                                className="flex-1 rounded-sm bg-teal-500/60"
                                style={{ height: `${h * 16.6}%` }}
                              />
                            ))}
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            Pain, frequency over time
                          </p>
                        </div>

                        <div className="rounded-xl border bg-muted/30 p-3 space-y-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                            <Flame className="h-4 w-4" />
                          </div>
                          <p className="text-xs font-semibold">Trigger Analysis</p>
                          <div className="flex flex-wrap gap-1">
                            {["Stress", "Dairy", "NSAIDs"].map((t) => (
                              <span
                                key={t}
                                className="text-[9px] px-1.5 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-medium"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            Correlated flare triggers
                          </p>
                        </div>

                        <div className="rounded-xl border bg-muted/30 p-3 space-y-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                            <CalendarDays className="h-4 w-4" />
                          </div>
                          <p className="text-xs font-semibold">Calendar Heatmap</p>
                          <div className="grid grid-cols-7 gap-0.5">
                            {Array.from({ length: 14 }).map((_, i) => (
                              <div
                                key={i}
                                className="aspect-square rounded-sm"
                                style={{
                                  backgroundColor: `rgba(20, 184, 166, ${Math.random() * 0.7 + 0.1})`,
                                }}
                              />
                            ))}
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            Daily severity at a glance
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <Button variant="ghost" size="sm" onClick={goBack}>
                          <ArrowLeft className="mr-1.5 h-4 w-4" />
                          Back
                        </Button>
                        <Button
                          onClick={goNext}
                          className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white shadow-md shadow-teal-500/25"
                        >
                          Next
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 4 — Share with Your Doctor */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight">
                          Share with Your Doctor
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                          Generate a professional clinical handout in SBAR format,
                          ready for your next appointment.
                        </p>
                      </div>

                      <div className="rounded-xl border bg-muted/30 p-5 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                            <Printer className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              Print-Ready SBAR Report
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Situation, Background, Assessment, Recommendation
                            </p>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                          {[
                            {
                              label: "Situation",
                              desc: "Current symptoms & reason for visit",
                            },
                            {
                              label: "Background",
                              desc: "Recent trends & health history",
                            },
                            {
                              label: "Assessment",
                              desc: "AI-generated clinical analysis",
                            },
                            {
                              label: "Recommendation",
                              desc: "Suggested discussion points",
                            },
                          ].map((item) => (
                            <div key={item.label} className="flex items-start gap-3">
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[10px] font-bold">
                                {item.label[0]}
                              </div>
                              <div>
                                <p className="text-xs font-medium">{item.label}</p>
                                <p className="text-[11px] text-muted-foreground">
                                  {item.desc}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <Button variant="ghost" size="sm" onClick={goBack}>
                          <ArrowLeft className="mr-1.5 h-4 w-4" />
                          Back
                        </Button>
                        <Button
                          onClick={goNext}
                          className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white shadow-md shadow-teal-500/25"
                        >
                          Next
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 5 — Get Started */}
                  {currentStep === 4 && (
                    <div className="flex flex-col items-center text-center space-y-6">
                      <div className="relative">
                        <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 opacity-20 blur-xl" />
                        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-700 shadow-lg shadow-teal-500/30">
                          <ChevronRight className="h-8 w-8 text-white" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight">
                          You&apos;re All Set!
                        </h2>
                        <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">
                          Try with sample data or start logging your own symptoms
                          right away.
                        </p>
                      </div>

                      <div className="flex flex-col items-center gap-3 pt-2 w-full">
                        <Button
                          onClick={() => handleAction("demo")}
                          className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white shadow-md shadow-teal-500/25 h-12 text-base font-semibold"
                        >
                          <Sparkles className="mr-2 h-5 w-5" />
                          Load Demo Data
                        </Button>
                        <Button
                          onClick={() => handleAction("log")}
                          variant="outline"
                          className="w-full h-12 text-base font-medium border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 hover:text-teal-600 dark:hover:text-teal-400"
                        >
                          <Activity className="mr-2 h-5 w-5" />
                          Start Logging
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Step Indicator Dots */}
            <div className="flex items-center justify-center gap-2 pb-6 px-8">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === currentStep
                      ? "w-6 bg-teal-600 dark:bg-teal-500"
                      : i < currentStep
                        ? "w-2 bg-teal-600/40 dark:bg-teal-500/40"
                        : "w-2 bg-muted-foreground/20"
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}