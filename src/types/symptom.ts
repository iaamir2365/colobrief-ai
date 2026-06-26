export interface SymptomLog {
  id: string;
  userId: string;
  date: string;
  painLevel: number;
  stoolFrequency: number;
  stoolType: number | null;
  stressLevel: number;
  triggers: string[];
  notes?: string;
  medicationTaken?: string | null;
  bloodInStool: boolean;
  urgencyLevel: number;
  createdAt: string;
}

export interface AIPrediction {
  stoolFrequency: number;
  painLevel: number;
  bristolStoolType: number;
  stressLevel: number;
  triggers: string[];
}