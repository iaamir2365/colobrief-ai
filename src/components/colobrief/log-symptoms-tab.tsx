"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

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
  { value: "1", label: "Type 1: Separate hard lumps" },
  { value: "2", label: "Type 2: Lumpy sausage shape" },
  { value: "3", label: "Type 3: Sausage with cracks" },
  { value: "4", label: "Type 4: Smooth soft sausage" },
  { value: "5", label: "Type 5: Soft blobs with clear edges" },
  { value: "6", label: "Type 6: Fluffy, mushy" },
  { value: "7", label: "Type 7: Watery, no solid pieces" },
];

interface LogSymptomsTabProps {
  onSaved: () => void;
}

export default function LogSymptomsTab({ onSaved }: LogSymptomsTabProps) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [painLevel, setPainLevel] = useState([3]);
  const [stoolFrequency, setStoolFrequency] = useState(3);
  const [stoolType, setStoolType] = useState("4");
  const [stressLevel, setStressLevel] = useState([3]);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [customTrigger, setCustomTrigger] = useState("");
  const [notes, setNotes] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [aiResult, setAiResult] = useState<null | {
    stoolFrequency: number;
    painLevel: number;
    bristolStoolType: number;
    stressLevel: number;
    triggers: string[];
  }>(null);
  const recognitionRef = useRef<any>(null);

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

  const handleAIExtract = async () => {
    if (!notes.trim()) {
      toast.error("Please add some notes before using AI extraction.");
      return;
    }
    setIsExtracting(true);
    try {
      const res = await fetch("/api/symptoms/ai-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      const data = await res.json();
      setAiResult(data);
    } catch {
      toast.error("AI extraction failed. Please try again.");
    } finally {
      setIsExtracting(false);
    }
  };

  const applyAIResult = () => {
    if (!aiResult) return;
    if (aiResult.painLevel) setPainLevel([aiResult.painLevel]);
    if (aiResult.stoolFrequency) setStoolFrequency(aiResult.stoolFrequency);
    if (aiResult.bristolStoolType) setStoolType(String(aiResult.bristolStoolType));
    if (aiResult.stressLevel) setStressLevel([aiResult.stressLevel]);
    if (aiResult.triggers?.length) setSelectedTriggers(aiResult.triggers);
    setAiResult(null);
    toast.success("AI-extracted values applied to the form.");
  };

  const handleSave = async () => {
    if (!date) {
      toast.error("Please select a date.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/symptoms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          painLevel: painLevel[0],
          stoolFrequency,
          stoolType: Number(stoolType),
          stressLevel: stressLevel[0],
          triggers: selectedTriggers,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Symptom log saved successfully! 🎉");
      // Reset form
      setDate(today);
      setPainLevel([3]);
      setStoolFrequency(3);
      setStoolType("4");
      setStressLevel([3]);
      setSelectedTriggers([]);
      setNotes("");
      onSaved();
    } catch {
      toast.error("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const getPainColor = (val: number) => {
    if (val <= 3) return "text-emerald-600";
    if (val <= 6) return "text-amber-500";
    return "text-rose-500";
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Date */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="p-6">
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
      </motion.div>

      {/* Pain Level & Stool Frequency side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="rounded-xl border-0 shadow-sm">
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
                    min={1}
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
          <Card className="rounded-xl border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Stool Frequency</Label>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="rounded-xl border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Bristol Stool Type</Label>
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
          <Card className="rounded-xl border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Stress Level</Label>
                  <span className={`text-2xl font-bold ${getPainColor(stressLevel[0])}`}>
                    {stressLevel[0]}
                  </span>
                </div>
                <div className="slider-gradient-green-red">
                  <Slider
                    value={stressLevel}
                    onValueChange={setStressLevel}
                    min={1}
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

      {/* Triggers */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card className="rounded-xl border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Triggers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {COMMON_TRIGGERS.map((trigger) => (
                <label
                  key={trigger}
                  className="flex items-center gap-2 cursor-pointer select-none"
                >
                  <Checkbox
                    checked={selectedTriggers.includes(trigger)}
                    onCheckedChange={() => toggleTrigger(trigger)}
                  />
                  <span className="text-sm">{trigger}</span>
                </label>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-4">
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
                className="flex-1"
              />
              <Button variant="outline" onClick={addCustomTrigger} className="shrink-0">
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
      </motion.div>

      {/* Notes with Voice Input */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Notes</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant={isRecording ? "destructive" : "outline"}
                    size="sm"
                    onClick={isRecording ? stopRecording : startRecording}
                    className="gap-1.5"
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
                    className="gap-1.5"
                  >
                    {isExtracting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    AI Extract
                  </Button>
                </div>
              </div>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe how you're feeling today... e.g., 'Mild cramping this morning after dairy. Stressful day at work. Had 5 bowel movements, mostly loose.'"
                rows={4}
                className="resize-none"
              />
              {isRecording && (
                <p className="text-xs text-rose-500 flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                  </span>
                  Listening...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Verification Card */}
      <AnimatePresence>
        {aiResult && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
          >
            <Card className="rounded-xl border-2 border-teal-200 shadow-sm bg-teal-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-teal-600" />
                  <CardTitle className="text-base font-semibold">AI-Extracted Values</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Review the values extracted from your notes. Apply to update the form, or dismiss.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Pain Level</p>
                    <p className="text-xl font-bold text-rose-500">{aiResult.painLevel}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Stool Freq.</p>
                    <p className="text-xl font-bold text-teal-600">{aiResult.stoolFrequency}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Stool Type</p>
                    <p className="text-xl font-bold">{aiResult.bristolStoolType}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Stress</p>
                    <p className="text-xl font-bold text-amber-500">{aiResult.stressLevel}</p>
                  </div>
                </div>
                {aiResult.triggers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {aiResult.triggers.map((t) => (
                      <Badge key={t} variant="secondary">
                        {t}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button onClick={applyAIResult} className="gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Apply Values
                  </Button>
                  <Button variant="outline" onClick={() => setAiResult(null)}>
                    Dismiss
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Button */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          size="lg"
          className="w-full h-12 text-base font-semibold rounded-xl"
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
      </motion.div>
    </div>
  );
}