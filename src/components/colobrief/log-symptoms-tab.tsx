"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ClipboardCheck,
  Activity,
  Droplets,
  Zap,
  Pill,
  FileText,
  ChevronDown,
  Copy,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { format } from "date-fns";
import type { SymptomLog } from "@/types/symptom";
import { getAuthHeaders } from "@/stores/auth-store";

const COMMON_TRIGGERS = [
  "Dairy",
  "Stress",
  "Spicy Food",
  "NSAIDs",
  "Alcohol",
  "Caffeine",
  "Lack of Sleep",
  "Anxiety",
  "Processed Food",
  "Travel",
  "Other",
];

const BRISTOL_TYPES = [
  { value: "", label: "Unmentioned" },
  { value: "1", label: "Type 1: Separate hard lumps" },
  { value: "2", label: "Type 2: Lumpy sausage shape" },
  { value: "3", label: "Type 3: Sausage with cracks" },
  { value: "4", label: "Type 4: Smooth soft sausage" },
  { value: "5", label: "Type 5: Soft blobs with clear edges" },
  { value: "6", label: "Type 6: Fluffy, mushy" },
  { value: "7", label: "Type 7: Watery, no solid pieces" },
];

const SECTION_KEYS = ["physical", "triggers", "medication", "notes"] as const;
type SectionKey = (typeof SECTION_KEYS)[number];

const DEFAULT_COLLAPSED: Record<SectionKey, boolean> = {
  physical: false,
  triggers: false,
  medication: false,
  notes: false,
};

const STORAGE_KEY = "colobrief-section-collapsed";

function loadCollapsedState(): Record<SectionKey, boolean> {
  if (typeof window === "undefined") return DEFAULT_COLLAPSED;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_COLLAPSED, ...parsed };
    }
  } catch {
    // ignore
  }
  return DEFAULT_COLLAPSED;
}

function saveCollapsedState(state: Record<SectionKey, boolean>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

interface LogSymptomsTabProps {
  symptoms: SymptomLog[];
  onSaved: () => void;
}

const DEFAULT_PAIN = 0;
const DEFAULT_STOOL_FREQ = 0;
const DEFAULT_STOOL_TYPE = "";
const DEFAULT_STRESS = 0;

function isFormDefault({
  date,
  painLevel,
  stoolFrequency,
  stoolType,
  stressLevel,
  selectedTriggers,
  medication,
  bloodInStool,
  urgencyLevel,
  notes,
  today,
}: {
  date: string;
  painLevel: number[];
  stoolFrequency: number;
  stoolType: string;
  stressLevel: number[];
  selectedTriggers: string[];
  medication: string;
  bloodInStool: boolean;
  urgencyLevel: number;
  notes: string;
  today: string;
}) {
  return (
    date === today &&
    painLevel[0] === DEFAULT_PAIN &&
    stoolFrequency === DEFAULT_STOOL_FREQ &&
    stoolType === DEFAULT_STOOL_TYPE &&
    stressLevel[0] === DEFAULT_STRESS &&
    selectedTriggers.length === 0 &&
    medication === "" &&
    !bloodInStool &&
    urgencyLevel === 0 &&
    notes === ""
  );
}

function CollapsibleSection({
  sectionKey,
  title,
  icon,
  iconBgClass,
  iconColorClass,
  collapsed,
  onToggle,
  children,
}: {
  sectionKey: SectionKey;
  title: string;
  icon: React.ReactNode;
  iconBgClass: string;
  iconColorClass: string;
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-w-0 max-w-[24rem] sm:max-w-full mx-auto overflow-hidden">
      {/* Clickable section header */}
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2.5 mb-3 w-full min-w-0 text-left group/section"
      >
        <div className={`rounded-full ${iconBgClass} p-1.5`}>
          {icon}
        </div>
        <h4 className="section-title text-foreground flex-1 min-w-0 truncate">{title}</h4>
        <motion.div
          animate={{ rotate: collapsed ? 0 : 180 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground group-hover/section:text-foreground transition-colors" />
        </motion.div>
      </button>

      {/* Collapsible body */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key={sectionKey}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full min-w-0 max-w-full overflow-hidden"
          >
            <div className="w-full min-w-0 max-w-[24rem] sm:max-w-full mx-auto">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LogSymptomsTab({ symptoms, onSaved }: LogSymptomsTabProps) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [painLevel, setPainLevel] = useState([DEFAULT_PAIN]);
  const [stoolFrequency, setStoolFrequency] = useState(DEFAULT_STOOL_FREQ);
  const [stoolType, setStoolType] = useState(DEFAULT_STOOL_TYPE);
  const [stressLevel, setStressLevel] = useState([DEFAULT_STRESS]);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [customTrigger, setCustomTrigger] = useState("");
  const [medication, setMedication] = useState("");
  const [bloodInStool, setBloodInStool] = useState(false);
  const [urgencyLevel, setUrgencyLevel] = useState(0);
  const [notes, setNotes] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [aiResult, setAiResult] = useState<null | {
    painLevel: number | null;
    stoolFrequency: number | null;
    stoolType: number | null;
    stressLevel: number | null;
    bloodInStool: boolean | null;
    urgencyLevel: string | null;
    triggers: string[];
  }>(null);
  const recognitionRef = useRef<any>(null);

  // Collapsible section state
  const [collapsedState, setCollapsedState] = useState<Record<SectionKey, boolean>>(DEFAULT_COLLAPSED);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCollapsedState(loadCollapsedState());
    setMounted(true);
  }, []);

  const toggleSection = useCallback((key: SectionKey) => {
    setCollapsedState((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveCollapsedState(next);
      return next;
    });
  }, []);

  // Daily completion check
  const todayLogged = useMemo(() => {
    return symptoms.some((s) => s.date === today);
  }, [symptoms, today]);

  const todayLog = useMemo(() => {
    return symptoms.find((s) => s.date === today);
  }, [symptoms, today]);

  // Check if form is in default state (for Copy Previous Day button visibility)
  const formIsDefault = isFormDefault({
    date,
    painLevel,
    stoolFrequency,
    stoolType,
    stressLevel,
    selectedTriggers,
    medication,
    bloodInStool,
    urgencyLevel,
    notes,
    today,
  });

  const hasPreviousLog = symptoms.length > 0;

  const formProgress = useMemo(() => {
    const checks = [
      !!date,
      true, // pain level always has a value
      true, // stool frequency always has a value
      !!stoolType,
      true, // stress level always has a value
      selectedTriggers.length > 0,
      !!notes.trim(),
      !!medication.trim(),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [date, stoolType, selectedTriggers, notes, medication]);

  const toggleTrigger = (trigger: string) => {
    setSelectedTriggers((prev) =>
      prev.includes(trigger) ? prev.filter((t) => t !== trigger) : [...prev, trigger]
    );
  };

  const addCustomTrigger = () => {
    const trimmed = customTrigger.trim();
    if (trimmed && !selectedTriggers.includes(trimmed)) {
      setSelectedTriggers((prev) => [...prev, trimmed]);
      setCustomTrigger("");
    }
  };

  const handleCopyPreviousDay = () => {
    const prev = symptoms[0]; // most recent log (sorted desc)
    if (!prev) return;
    setPainLevel([prev.painLevel]);
    setStoolFrequency(prev.stoolFrequency);
    setStoolType(String(prev.stoolType));
    setStressLevel([prev.stressLevel]);
    setSelectedTriggers(prev.triggers || []);
    setBloodInStool(prev.bloodInStool);
    setUrgencyLevel(prev.urgencyLevel);
    setMedication(prev.medicationTaken || "");
    // Don't copy notes or date
    toast.success("Previous day's values copied (except notes & date).");
  };

  const startRecording = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = notes;
    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? " " : "") + transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      setNotes(finalTranscript + (interimTranscript ? " " + interimTranscript : ""));
    };

    recognition.onerror = () => {
      setIsRecording(false);
      toast.error("Speech recognition stopped unexpectedly.");
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    toast.info("Recording started. Speak into your microphone.");
  }, [notes]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
    toast.success("Recording stopped.");
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const URGENCY_MAP: Record<string, number> = {
    none: 0,
    mild: 1,
    moderate: 2,
    severe: 3,
  };

  const applyAIResult = useCallback((data: NonNullable<typeof aiResult>) => {
    let filledCount = 0;
    if (data.painLevel != null) {
      setPainLevel([Math.min(10, Math.max(0, Math.round(data.painLevel)))]);
      filledCount++;
    }
    if (data.stoolFrequency != null) {
      setStoolFrequency(Math.min(20, Math.max(0, Math.round(data.stoolFrequency))));
      filledCount++;
    }
    if (data.stoolType != null && data.stoolType >= 1 && data.stoolType <= 7) {
      setStoolType(String(Math.round(data.stoolType)));
      filledCount++;
    }
    if (data.stressLevel != null) {
      setStressLevel([Math.min(10, Math.max(0, Math.round(data.stressLevel)))]);
      filledCount++;
    }
    if (data.bloodInStool === true) {
      setBloodInStool(true);
      filledCount++;
    }
    if (data.urgencyLevel && URGENCY_MAP[data.urgencyLevel.toLowerCase()] !== undefined) {
      setUrgencyLevel(URGENCY_MAP[data.urgencyLevel.toLowerCase()]);
      filledCount++;
    }
    if (data.triggers?.length) {
      const validTriggers = data.triggers.filter((t) => COMMON_TRIGGERS.includes(t));
      if (validTriggers.length) {
        setSelectedTriggers(validTriggers);
        filledCount++;
      }
    }
    if (filledCount > 0) {
      toast.success(`AI filled ${filledCount} field${filledCount > 1 ? 's' : ''} from your notes. Review and save!`);
    } else {
      toast.info("AI couldn't extract specific values. Try adding more detail to your notes.");
    }
  }, []);

  const handleAIExtract = async () => {
    if (!notes.trim()) {
      toast.error("Please add some notes before using AI extraction.");
      return;
    }
    setIsExtracting(true);
    try {
      const res = await fetch("/api/symptoms/ai-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ notes }),
      });
      const data = await res.json();
      // Auto-apply the AI results directly to the form
      setAiResult(data);
      applyAIResult(data);
    } catch {
      toast.error("AI extraction failed. Please try again.");
    } finally {
      setIsExtracting(false);
    }
  };

  const wasRecordingRef = useRef(false);

  // Auto-extract when voice recording stops and notes have content
  useEffect(() => {
    if (wasRecordingRef.current && !isRecording && notes.trim().length > 20) {
      const timer = setTimeout(() => {
        handleAIExtract();
      }, 800);
      return () => clearTimeout(timer);
    }
    wasRecordingRef.current = isRecording;
  }, [isRecording, notes]);

  const handleSave = async () => {
    if (!date) {
      toast.error("Please select a date.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/symptoms", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          date,
          painLevel: painLevel[0],
          stoolFrequency,
          stoolType: Number(stoolType),
          stressLevel: stressLevel[0],
          triggers: selectedTriggers,
          medicationTaken: medication || undefined,
          bloodInStool,
          urgencyLevel,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Symptom log saved successfully! 🎉");
      // Reset form
      setDate(today);
      setPainLevel([DEFAULT_PAIN]);
      setStoolFrequency(DEFAULT_STOOL_FREQ);
      setStoolType(DEFAULT_STOOL_TYPE);
      setStressLevel([DEFAULT_STRESS]);
      setSelectedTriggers([]);
      setMedication("");
      setBloodInStool(false);
      setUrgencyLevel(0);
      setNotes("");
      onSaved();
    } catch {
      toast.error("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const getPainColor = (val: number) => {
    if (val <= 0) return "text-emerald-600";
    if (val <= 3) return "text-emerald-600";
    if (val <= 6) return "text-amber-500";
    return "text-rose-500";
  };

  return (
    <div className="w-full max-w-[24rem] sm:max-w-2xl mx-auto space-y-6 px-4 sm:px-0 min-w-0 overflow-hidden">
      {/* Form Progress Indicator */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full min-w-0 max-w-full mx-auto overflow-hidden">
        <div className="flex items-center gap-3 px-1 w-full min-w-0 max-w-full">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400"
              initial={{ width: 0 }}
              animate={{ width: `${formProgress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground tabular-nums w-10 text-right">{formProgress}%</span>
        </div>
      </motion.div>

      {/* Daily Completion Indicator */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.01 }} className="w-full min-w-0 max-w-full mx-auto overflow-hidden">
        {todayLogged && todayLog ? (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 w-full min-w-0 max-w-full overflow-hidden dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 px-3 py-2">
            <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
              Logged today
            </span>
            <span className="text-xs text-emerald-600/60 dark:text-emerald-400/60 min-w-0 truncate">
              — {format(new Date(todayLog.date + "T00:00:00"), "MMM d, yyyy")}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 w-full min-w-0 max-w-full overflow-hidden dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 px-3 py-2">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
            </span>
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
              Not yet logged today
            </span>
          </div>
        )}
      </motion.div>

      {/* Welcome Banner */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full min-w-0 max-w-full mx-auto overflow-hidden">
        <div className="rounded-xl bg-gradient-to-r from-teal-50 w-full min-w-0 max-w-full overflow-hidden to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 border border-teal-200 dark:border-teal-800/50 p-4 flex items-start gap-3">
          <div className="rounded-lg bg-teal-100 dark:bg-teal-900/50 p-2 mt-0.5 shrink-0">
            <ClipboardCheck className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-teal-800 dark:text-teal-200">Log Today&apos;s Symptoms</h3>
            <p className="text-xs text-teal-700/70 dark:text-teal-300/70 mt-0.5">
              Track your daily UC symptoms to identify patterns and share data with your doctor. Use voice input or AI extraction for faster logging.
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 font-medium">
                💡 Tip: Use voice input for hands-free logging
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium">
                ⌨️ Shortcut: Press Ctrl+L to jump here
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Section 1: Physical Symptoms */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }}>
        <CollapsibleSection
          sectionKey="physical"
          title="Physical Symptoms"
          icon={<Activity className="h-4 w-4 text-teal-600" />}
          iconBgClass="bg-teal-100 dark:bg-teal-900/50"
          iconColorClass="text-teal-600"
          collapsed={mounted ? collapsedState.physical : false}
          onToggle={() => toggleSection("physical")}
        >
          {/* Date */}
          <Card className="w-full min-w-0 max-w-full mx-auto overflow-hidden rounded-xl border-0 shadow-sm card-premium card-glow relative overflow-hidden mb-4">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-500" />
            <CardContent className="p-6 pt-7">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium">
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="max-w-[200px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Pain Level & Stool Frequency side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0 max-w-full justify-items-center [&>*]:w-full [&>*]:min-w-0 [&>*]:max-w-full">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <Card className="w-full min-w-0 max-w-full mx-auto overflow-hidden rounded-xl border-0 shadow-sm card-premium card-glow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Pain Level</Label>
                      <span className={`text-2xl font-bold ${getPainColor(painLevel[0])}`}>
                        {painLevel[0]}
                      </span>
                    </div>
                    <div className="slider-gradient-green-red">
                      <Slider
                        value={painLevel}
                        onValueChange={setPainLevel}
                        min={0}
                        max={10}
                        step={1}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>No pain</span>
                      <span>Moderate</span>
                      <span>Severe</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="w-full min-w-0 max-w-full mx-auto overflow-hidden rounded-xl border-0 shadow-sm card-premium card-glow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium flex items-center gap-1.5"><Droplets className="h-3.5 w-3.5 text-sky-500" /> Stool Frequency</Label>
                      <span className="text-2xl font-bold text-teal-600">{stoolFrequency}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-full"
                        onClick={() => setStoolFrequency(Math.max(0, stoolFrequency - 1))}
                      >
                        −
                      </Button>
                      <Input
                        type="number"
                        value={stoolFrequency}
                        onChange={(e) =>
                          setStoolFrequency(Math.min(20, Math.max(0, Number(e.target.value) || 0)))
                        }
                        className="text-center text-lg font-semibold h-10"
                        min={0}
                        max={20}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-full"
                        onClick={() => setStoolFrequency(Math.min(20, stoolFrequency + 1))}
                      >
                        +
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">per day (0–20)</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Bristol Stool Type & Stress Level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0 max-w-full justify-items-center [&>*]:w-full [&>*]:min-w-0 [&>*]:max-w-full mt-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className="w-full min-w-0 max-w-full mx-auto overflow-hidden rounded-xl border-0 shadow-sm card-premium card-glow">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-1.5"><Droplets className="h-3.5 w-3.5 text-sky-500" /> Bristol Stool Type</Label>
                    <Select value={stoolType} onValueChange={setStoolType}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BRISTOL_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="w-full min-w-0 max-w-full mx-auto overflow-hidden rounded-xl border-0 shadow-sm card-premium card-glow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-amber-500" /> Stress Level</Label>
                      <span className={`text-2xl font-bold ${getPainColor(stressLevel[0])}`}>
                        {stressLevel[0]}
                      </span>
                    </div>
                    <div className="slider-gradient-green-red">
                      <Slider
                        value={stressLevel}
                        onValueChange={setStressLevel}
                        min={0}
                        max={10}
                        step={1}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Calm</span>
                      <span>Moderate</span>
                      <span>Very stressed</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </CollapsibleSection>
      </motion.div>

      {/* Section 2: Identified Triggers */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <CollapsibleSection
          sectionKey="triggers"
          title="Identified Triggers"
          icon={<Zap className="h-4 w-4 text-amber-500" />}
          iconBgClass="bg-amber-100 dark:bg-amber-900/50"
          iconColorClass="text-amber-500"
          collapsed={mounted ? collapsedState.triggers : false}
          onToggle={() => toggleSection("triggers")}
        >
          <Card className="w-full min-w-0 max-w-full mx-auto overflow-hidden rounded-xl border-0 shadow-sm card-premium card-glow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" /> Triggers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 min-[380px]:grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3 w-full min-w-0 max-w-full justify-items-stretch">
                {COMMON_TRIGGERS.map((trigger) => (
                  <label
                    key={trigger}
                    className="flex items-center gap-2 cursor-pointer select-none rounded-lg px-2 py-1.5 bg-muted/30 hover:bg-muted/60 transition-colors"
                  >
                    <Checkbox
                      checked={selectedTriggers.includes(trigger)}
                      onCheckedChange={() => toggleTrigger(trigger)}
                    />
                    <span className="text-sm min-w-0 truncate">{trigger}</span>
                  </label>
                ))}
              </div>
              <div className="flex flex-col min-[380px]:flex-row items-stretch min-[380px]:items-center gap-2 mt-4 w-full min-w-0">
                <Input
                  placeholder="Add custom trigger..."
                  value={customTrigger}
                  onChange={(e) => setCustomTrigger(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomTrigger();
                    }
                  }}
                  className="w-full min-w-0 min-[380px]:flex-1"
                />
                <Button variant="outline" onClick={addCustomTrigger} className="w-full min-[380px]:w-auto shrink-0">
                  Add
                </Button>
              </div>
              {selectedTriggers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {selectedTriggers.map((t) => (
                    <Badge
                      key={t}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive/10 transition-colors"
                      onClick={() => toggleTrigger(t)}
                    >
                      {t} ×
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleSection>
      </motion.div>

      {/* Section 3: Medication & Additional Metrics */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
        <CollapsibleSection
          sectionKey="medication"
          title="Medication & Additional Metrics"
          icon={<Pill className="h-4 w-4 text-violet-500" />}
          iconBgClass="bg-violet-100 dark:bg-violet-900/50"
          iconColorClass="text-violet-500"
          collapsed={mounted ? collapsedState.medication : false}
          onToggle={() => toggleSection("medication")}
        >
          <Card className="w-full min-w-0 max-w-full mx-auto overflow-hidden rounded-xl border-0 shadow-sm card-premium card-glow">
            <CardContent className="p-6 space-y-5">
              {/* Medication Taken */}
              <div className="space-y-2">
                <Label htmlFor="medication" className="text-sm font-medium flex items-center gap-1.5"><Pill className="h-3.5 w-3.5 text-violet-500" /> Medication Taken</Label>
                <Input
                  id="medication"
                  placeholder="e.g., Mesalamine 800mg, Prednisone 20mg"
                  value={medication}
                  onChange={(e) => setMedication(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Optional — list any UC medications taken today</p>
              </div>

              {/* Blood in Stool */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Blood in Stool</Label>
                  <p className="text-xs text-muted-foreground">Check if you noticed any blood</p>
                </div>
                <Switch checked={bloodInStool} onCheckedChange={setBloodInStool} />
              </div>

              {/* Urgency Level */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Urgency Level</Label>
                <div className="grid grid-cols-2 min-[380px]:grid-cols-4 gap-2 w-full min-w-0">
                  {["None", "Mild", "Moderate", "Severe"].map((label, i) => (
                    <Button
                      key={label}
                      type="button"
                      variant={urgencyLevel === i ? "default" : "outline"}
                      size="sm"
                      className={urgencyLevel === i ? "bg-teal-600 hover:bg-teal-700" : ""}
                      onClick={() => setUrgencyLevel(i)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleSection>
      </motion.div>

      {/* Section 4: Additional Notes & AI Assist */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <CollapsibleSection
          sectionKey="notes"
          title="Additional Notes & AI Assist"
          icon={<FileText className="h-4 w-4 text-teal-600" />}
          iconBgClass="bg-teal-100 dark:bg-teal-900/50"
          iconColorClass="text-teal-600"
          collapsed={mounted ? collapsedState.notes : false}
          onToggle={() => toggleSection("notes")}
        >
          <Card className="w-full min-w-0 max-w-full mx-auto overflow-hidden rounded-xl border-0 shadow-sm card-premium card-glow">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <Label className="text-sm font-medium">Notes</Label>
                  <div className="flex flex-col min-[380px]:flex-row sm:flex-wrap items-stretch min-[380px]:items-center gap-2 w-full sm:w-auto min-w-0">
                    <Button
                      variant={isRecording ? "destructive" : "outline"}
                      size="sm"
                      onClick={isRecording ? stopRecording : startRecording}
                      className={isRecording
                        ? "gap-1.5 bg-rose-600 hover:bg-rose-700 text-white border-rose-600 shadow-lg shadow-rose-500/30"
                        : "gap-1.5 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 transition-colors"
                      }
                    >
                      {isRecording ? (
                        <>
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                          </span>
                          <MicOff className="h-3.5 w-3.5" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Mic className="h-3.5 w-3.5" />
                          Voice
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAIExtract}
                      disabled={isExtracting || !notes.trim()}
                      className="gap-1.5 bg-gradient-to-r from-violet-600 to-teal-600 hover:from-violet-700 hover:to-teal-700 text-white border-0 shadow-sm w-full sm:w-auto"
                    >
                      {isExtracting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      AI Extract & Fill
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe how you're feeling today... e.g., 'Mild cramping this morning after dairy. Stressful day at work. Had 5 bowel movements, mostly loose.'"
                  rows={4}
                  className="resize-none w-full min-w-0"
                />
                <p className="text-xs text-muted-foreground text-right mt-1">
                  {notes.length} characters
                </p>
                {isRecording && (
                  <p className="text-xs text-rose-500 flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                    </span>
                    Listening...
                  </p>
                )}
                {isExtracting && (
                  <p className="text-xs text-amber-600 flex items-center gap-1.5 mt-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                    </span>
                    AI extracting... may take longer due to rate limits — please wait patiently.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Result Card — Auto-applied, shows what was extracted */}
          <AnimatePresence>
            {aiResult && (
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                className="mt-4 w-full min-w-0 max-w-full mx-auto overflow-hidden"
              >
                <Card className="w-full min-w-0 max-w-full mx-auto overflow-hidden rounded-xl border border-teal-200 dark:border-teal-800/50 shadow-sm bg-gradient-to-br from-teal-50/80 via-white to-violet-50/40 dark:from-teal-950/30 dark:via-background dark:to-violet-950/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-teal-600" />
                        <span className="text-sm font-semibold text-teal-700 dark:text-teal-300">AI Auto-Filled</span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setAiResult(null)}>
                        Dismiss
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 min-[380px]:grid-cols-3 sm:grid-cols-6 gap-3 mb-3 w-full min-w-0">
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">Pain</p>
                        <p className={`text-base font-bold ${aiResult.painLevel ? 'text-rose-500' : 'text-muted-foreground'}`}>{aiResult.painLevel ?? '—'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">Freq.</p>
                        <p className={`text-base font-bold ${aiResult.stoolFrequency ? 'text-teal-600' : 'text-muted-foreground'}`}>{aiResult.stoolFrequency ?? '—'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">Stool</p>
                        <p className={`text-base font-bold ${aiResult.stoolType ? '' : 'text-muted-foreground'}`}>{aiResult.stoolType ?? '—'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">Stress</p>
                        <p className={`text-base font-bold ${aiResult.stressLevel ? 'text-amber-500' : 'text-muted-foreground'}`}>{aiResult.stressLevel ?? '—'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">Blood</p>
                        <p className={`text-base font-bold ${aiResult.bloodInStool ? 'text-rose-600' : 'text-muted-foreground'}`}>{aiResult.bloodInStool ? 'Yes' : aiResult.bloodInStool === false ? 'No' : '—'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">Urgency</p>
                        <p className={`text-base font-bold ${aiResult.urgencyLevel ? '' : 'text-muted-foreground'}`}>{aiResult.urgencyLevel ?? '—'}</p>
                      </div>
                    </div>
                    {aiResult.triggers?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {aiResult.triggers.map((t) => (
                          <Badge key={t} variant="secondary" className="text-[11px]">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </CollapsibleSection>
      </motion.div>

      {/* Save Button + Copy Previous Day */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <div className="flex flex-col min-[420px]:flex-row gap-3 w-full min-w-0 max-w-full mx-auto">
          {hasPreviousLog && formIsDefault && (
            <Button
              onClick={handleCopyPreviousDay}
              variant="outline"
              size="lg"
              className="shrink-0 h-12 text-sm font-medium rounded-xl border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-300 dark:hover:bg-teal-950/30 gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Previous Day
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="lg"
            className="w-full min-w-0 min-[420px]:flex-1 h-12 text-base font-semibold rounded-xl btn-premium hover:scale-[1.01] active:scale-[0.99]"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Symptom Log"
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}