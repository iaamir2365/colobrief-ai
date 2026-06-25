"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Trash2, PlusCircle, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

const PAGE_SIZE = 10;

interface MyRecordsTabProps {
  symptoms: SymptomLog[];
  isLoading: boolean;
  onDeleted: () => void;
  onGoToLog: () => void;
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
        <div className="rounded-full bg-teal-50 p-6 mb-6">
          <FileText className="h-10 w-10 text-teal-600" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No records yet</h3>
        <p className="text-muted-foreground max-w-md mb-6">
          Start logging your symptoms to build your health history.
        </p>
        <Button onClick={onGoToLog} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Log Your First Symptom
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Summary */}
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
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{paged.length}</span> of{" "}
          <span className="font-medium text-foreground">{filtered.length}</span> records
        </p>
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
                  <TableHead className="pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((log, i) => (
                  <TableRow key={log.id}>
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
                    <TableCell className="pr-4 text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground px-3">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}