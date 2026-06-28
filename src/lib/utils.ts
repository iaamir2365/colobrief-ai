import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { SymptomLog } from "@/types/symptom"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function mapSymptomLogToResponse(log: any): SymptomLog {
  return {
    id: log.id,
    userId: log.userId,
    date: log.date,
    painLevel: log.painLevel,
    stoolFrequency: log.stoolFrequency,
    stoolType: log.stoolType,
    stressLevel: log.stressLevel,
    triggers: JSON.parse(log.triggers),
    notes: log.notes ?? undefined,
    medicationTaken: log.medicationTaken ?? null,
    bloodInStool: log.bloodInStool,
    urgencyLevel: log.urgencyLevel,
    createdAt: log.createdAt instanceof Date ? log.createdAt.toISOString() : log.createdAt,
  }
}
