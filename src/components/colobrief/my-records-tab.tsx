"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Trash2, PlusCircle, FileText, Download, Droplets, Pencil, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
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

const BRISTOL_EMOJIS: Record<number, string> = {
  1: "🪨", 2: "🪨", 3: "✅", 4: "✅", 5: "⚠️", 6: "⚠️", 7: "🚨"
};

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

const PAGE_SIZE = 10;

interface MyRecordsTabProps {
  symptoms: SymptomLog[];
  isLoading: boolean;
  onDeleted: () => void;
  onGoToLog: () => void;
}

function EditSymptomDialog({
  log,
  open,
  onOpenChange,
  onSaved,
}: {
  log: SymptomLog;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [date, setDate] = useState(log.date);
  const [painLevel, setPainLevel] = useState([log.painLevel]);
  const [stoolFrequency, setStoolFrequency] = useState(log.stoolFrequency);
  const [stoolType, setStoolType] = useState(String(log.stoolType));
  const [stressLevel, setStressLevel] = useState([log.stressLevel]);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([...log.triggers]);
  const [medication, setMedication] = useState(log.medicationTaken || "");
  const [bloodInStool, setBloodInStool] = useState(log.bloodInStool);
  const [urgencyLevel, setUrgencyLevel] = useState(log.urgencyLevel);
  const [notes, setNotes] = useState(log.notes || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDate(log.date);
      setPainLevel([log.painLevel]);
      setStoolFrequency(log.stoolFrequency);
      setStoolType(String(log.stoolType));
      setStressLevel([log.stressLevel]);
      setSelectedTriggers([...log.triggers]);
      setMedication(log.medicationTaken || "");
      setBloodInStool(log.bloodInStool);
      setUrgencyLevel(log.urgencyLevel);
      setNotes(log.notes || "");
    }
  }, [open, log]);

  const toggleTrigger = useCallback((trigger: string) => {
    setSelectedTriggers((prev) =>
      prev.includes(trigger) ? prev.filter((t) => t !== trigger) : [...prev, trigger]
    );
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/symptoms/${log.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
      if (!res.ok) throw new Error("Update failed");
      toast.success("Log updated successfully!");
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error("Failed to update log.");
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Symptom Log — {format(parseISO(log.date), "MMM d, yyyy")}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-5 pb-4">
            {/* Date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="max-w-[200px]" />
            </div>

            {/* Pain & Stool Frequency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Pain Level</Label>
                  <span className={`text-xl font-bold ${getPainColor(painLevel[0])}`}>{painLevel[0]}</span>
                </div>
                <Slider value={painLevel} onValueChange={setPainLevel} min={1} max={10} step={1} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>No pain</span><span>Severe</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Stool Frequency</Label>
                  <span className="text-xl font-bold text-teal-600">{stoolFrequency}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" onClick={() => setStoolFrequency(Math.max(0, stoolFrequency - 1))}>−</Button>
                  <Input type="number" value={stoolFrequency} onChange={(e) => setStoolFrequency(Math.min(20, Math.max(0, Number(e.target.value) || 0)))} className="text-center text-lg font-semibold h-9" min={0} max={20} />
                  <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" onClick={() => setStoolFrequency(Math.min(20, stoolFrequency + 1))}>+</Button>
                </div>
              </div>
            </div>

            {/* Bristol & Stress */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Bristol Stool Type</Label>
                <Select value={stoolType} onValueChange={setStoolType}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BRISTOL_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Stress Level</Label>
                  <span className={`text-xl font-bold ${getPainColor(stressLevel[0])}`}>{stressLevel[0]}</span>
                </div>
                <Slider value={stressLevel} onValueChange={setStressLevel} min={1} max={10} step={1} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Calm</span><span>Very stressed</span>
                </div>
              </div>
            </div>

            {/* Triggers */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Triggers</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                {COMMON_TRIGGERS.map((trigger) => (
                  <label key={trigger} className="flex items-center gap-2 cursor-pointer select-none">
                    <Checkbox
                      checked={selectedTriggers.includes(trigger)}
                      onCheckedChange={() => toggleTrigger(trigger)}
                    />
                    <span className="text-sm">{trigger}</span>
                  </label>
                ))}
              </div>
              {selectedTriggers.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedTriggers.map((t) => (
                    <Badge key={t} variant="secondary" className="cursor-pointer hover:bg-destructive/10 transition-colors" onClick={() => toggleTrigger(t)}>
                      {t} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Medication & Blood & Urgency */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Medication Taken</Label>
                <Input
                  placeholder="e.g., Mesalamine 800mg"
                  value={medication}
                  onChange={(e) => setMedication(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Blood in Stool</Label>
                  <p className="text-xs text-muted-foreground">Check if noticed</p>
                </div>
                <Switch checked={bloodInStool} onCheckedChange={setBloodInStool} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Urgency Level</Label>
                <div className="grid grid-cols-4 gap-2">
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
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes..." rows={3} className="resize-none" />
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-teal-600 hover:bg-teal-700">
            {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function MyRecordsTab({
  symptoms,
  isLoading,
  onDeleted,
  onGoToLog,
}: MyRecordsTabProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingLog, setEditingLog] = useState<SymptomLog | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return symptoms;
    const q = search.toLowerCase();
    return symptoms.filter(
      (s) =>
        s.date.includes(q) ||
        s.notes?.toLowerCase().includes(q) ||
        s.triggers.some((t) => t.toLowerCase().includes(q))
    );
  }, [symptoms, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/symptoms?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Log deleted.");
      onDeleted();
    } catch {
      toast.error("Failed to delete.");
    } finally {
      setDeletingId(null);
    }
  };

  const avgPain = filtered.length ? filtered.reduce((s, l) => s + l.painLevel, 0) / filtered.length : 0;
  const avgFreq = filtered.length ? filtered.reduce((s, l) => s + l.stoolFrequency, 0) / filtered.length : 0;
  const avgStress = filtered.length ? filtered.reduce((s, l) => s + l.stressLevel, 0) / filtered.length : 0;

  const getPainVariant = (pain: number): "default" | "secondary" | "destructive" | "outline" => {
    if (pain <= 3) return "default";
    if (pain <= 6) return "secondary";
    return "destructive";
  };

  const getPainClass = (pain: number): string => {
    if (pain <= 3) return "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100";
    if (pain <= 6) return "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100";
    return "bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100";
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-sm rounded-lg" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!symptoms.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="animate-gradient-bg rounded-2xl p-8 mb-6">
          <FileText className="h-14 w-14 text-teal-600 mx-auto" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No records yet</h3>
        <p className="text-muted-foreground max-w-md mb-6">
          Your symptom history will appear here once you start logging. Each entry shows 
          pain levels, stool data, triggers, and personal notes.
        </p>
        <Button onClick={onGoToLog} className="gap-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 shadow-lg shadow-teal-500/25">
          <PlusCircle className="h-4 w-4" />
          Log Your First Symptom
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Export & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by date, notes, or triggers..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs h-8"
            onClick={() => window.open("/api/symptoms/export?format=csv", "_blank")}
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs h-8"
            onClick={() => window.open("/api/symptoms/export?format=json", "_blank")}
          >
            <Download className="h-3.5 w-3.5" />
            JSON
          </Button>
          <p className="text-sm text-muted-foreground ml-1">
            <span className="font-medium text-foreground">{paged.length}</span>
            {" / "}
            <span className="font-medium text-foreground">{filtered.length}</span>
          </p>
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="rounded-xl border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="pl-4">Date</TableHead>
                  <TableHead>Pain</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Stool Type</TableHead>
                  <TableHead>Stress</TableHead>
                  <TableHead>Triggers</TableHead>
                  <TableHead>Blood</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead className="pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((log, i) => (
                  <React.Fragment key={log.id}>
                  <TableRow
                    className="cursor-pointer hover:bg-muted/30"
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  >
                    <TableCell className="pl-4 font-medium">
                      {format(parseISO(log.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`font-medium ${getPainClass(log.painLevel)}`}
                      >
                        {log.painLevel}/10
                      </Badge>
                    </TableCell>
                    <TableCell>{log.stoolFrequency}×</TableCell>
                    <TableCell>
                      <span className="text-sm">
                        <span className="mr-1">{BRISTOL_EMOJIS[log.stoolType] || "📋"}</span>
                        Type {log.stoolType}
                        <span className="text-muted-foreground text-xs ml-1">
                          ({BRISTOL_LABELS[log.stoolType] || "Unknown"})
                        </span>
                      </span>
                    </TableCell>
                    <TableCell>{log.stressLevel}/10</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {log.triggers.slice(0, 3).map((t) => (
                          <Badge key={t} variant="secondary" className="text-xs">
                            {t}
                          </Badge>
                        ))}
                        {log.triggers.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{log.triggers.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.bloodInStool ? (
                        <Droplets className="h-4 w-4 text-rose-500" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          log.urgencyLevel === 0 ? "outline" :
                          log.urgencyLevel === 1 ? "default" :
                          log.urgencyLevel === 2 ? "secondary" : "destructive"
                        }
                        className="text-xs"
                      >
                        {["None", "Mild", "Moderate", "Severe"][log.urgencyLevel] || "None"}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          onClick={(e) => { e.stopPropagation(); setEditingLog(log); }}
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-muted-foreground hover:text-teal-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              onClick={(e) => e.stopPropagation()}
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this log?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove the symptom log from{" "}
                              {format(parseISO(log.date), "MMM d, yyyy")}. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(log.id)}
                              className="bg-destructive text-white hover:bg-destructive/90"
                              disabled={deletingId === log.id}
                            >
                              {deletingId === log.id ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedId === log.id && (
                    <TableRow>
                      <TableCell colSpan={9} className="bg-muted/20 px-6 py-3">
                        <div className="text-sm">
                          <span className="font-medium text-muted-foreground">Notes: </span>
                          {log.notes || "No notes recorded for this entry."}
                          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Stress: {log.stressLevel}/10</span>
                            <span>Bristol Type: {log.stoolType} — {BRISTOL_LABELS[log.stoolType] || "Unknown"}</span>
                            <span>Medication: {log.medicationTaken || "None"}</span>
                            <span>Blood: {log.bloodInStool ? "Yes" : "No"}</span>
                            <span>Urgency: {["None", "Mild", "Moderate", "Severe"][log.urgencyLevel] || "None"}</span>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </motion.div>

      {/* Summary Averages */}
      {filtered.length > 0 && (
        <div className="flex gap-6 mt-3 px-4 text-sm text-muted-foreground">
          <span>Avg Pain: <strong className="text-foreground">{avgPain.toFixed(1)}</strong>/10</span>
          <span>Avg Freq: <strong className="text-foreground">{avgFreq.toFixed(1)}</strong>/day</span>
          <span>Avg Stress: <strong className="text-foreground">{avgStress.toFixed(1)}</strong>/10</span>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1">
          <Button variant="outline" size="sm" onClick={() => setPage(0)} disabled={page === 0}>&laquo;</Button>
          <Button variant="outline" size="sm" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>&lsaquo;</Button>
          {totalPages <= 7
            ? Array.from({ length: totalPages }, (_, i) => (
                <Button
                  key={i}
                  variant={i === page ? "default" : "outline"}
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => setPage(i)}
                >
                  {i + 1}
                </Button>
              ))
            : (() => {
                const pages: number[] = [];
                const start = Math.max(1, page - 2);
                const end = Math.min(totalPages - 2, page + 2);
                pages.push(0);
                if (start > 1) pages.push(-1);
                for (let i = start; i <= end; i++) pages.push(i);
                if (end < totalPages - 2) pages.push(-2);
                pages.push(totalPages - 1);
                return pages.map((p, idx) =>
                  p < 0 ? (
                    <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground">&hellip;</span>
                  ) : (
                    <Button
                      key={p}
                      variant={p === page ? "default" : "outline"}
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => setPage(p)}
                    >
                      {p + 1}
                    </Button>
                  )
                );
              })()}
          <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}>&rsaquo;</Button>
          <Button variant="outline" size="sm" onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}>&raquo;</Button>
        </div>
      )}

      {/* Edit Dialog */}
      {editingLog && (
        <EditSymptomDialog
          log={editingLog}
          open={!!editingLog}
          onOpenChange={(open) => { if (!open) setEditingLog(null); }}
          onSaved={onDeleted}
        />
      )}
    </div>
  );
}