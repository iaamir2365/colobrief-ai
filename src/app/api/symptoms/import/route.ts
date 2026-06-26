import { db } from "@/lib/db";

// Expected CSV columns (case-insensitive matching)
const EXPECTED_COLUMNS = [
  "date",
  "pain level",
  "stool frequency",
  "stool type",
  "stress level",
  "triggers",
  "notes",
  "medication",
  "blood",
  "urgency",
];

interface CSVRow {
  rowIndex: number;
  data: Record<string, string>;
}

interface ImportError {
  row: number;
  message: string;
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        lines.push(current);
        current = "";
      } else if (ch === "\n" || (ch === "\r" && text[i + 1] === "\n")) {
        lines.push(current);
        current = "";
        if (ch === "\r") i++;
        lines.push("\n"); // newline marker
      } else if (ch === "\r") {
        lines.push(current);
        current = "";
        lines.push("\n");
      } else {
        current += ch;
      }
    }
  }
  if (current.trim()) {
    lines.push(current);
  }

  // Reconstruct rows from tokens
  const rows: string[][] = [];
  let row: string[] = [];
  for (const token of lines) {
    if (token === "\n") {
      if (row.length > 0 || rows.length === 0) {
        rows.push(row);
        row = [];
      }
    } else {
      row.push(token);
    }
  }
  if (row.length > 0) rows.push(row);

  if (rows.length < 2) {
    return { headers: [], rows: [] };
  }

  const headers = rows[0].map(normalizeHeader);
  const dataRows = rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = r[i] !== undefined ? r[i].trim() : "";
    });
    return obj;
  });

  return { headers, rows: dataRows };
}

function parseFlexibleDate(dateStr: string): string | null {
  const trimmed = dateStr.trim();

  // Try YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Try MM/DD/YYYY
  const usMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usMatch) {
    const [, m, d, y] = usMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Try DD/MM/YYYY
  const euMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (euMatch) {
    const [, d, m, y] = euMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Try parsing with Date constructor as fallback
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  return null;
}

function parseTriggers(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) return [];
  // Try pipe-delimited first
  if (trimmed.includes("|")) {
    return trimmed
      .split("|")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  // Try semicolon-delimited (our export format)
  if (trimmed.includes(";")) {
    return trimmed
      .split(";")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  // Try comma-separated
  if (trimmed.includes(",")) {
    return trimmed
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  // Single trigger
  return [trimmed];
}

function parseNumericField(value: string, min: number, max: number, fieldName: string): { value: number | null; error?: string } {
  const trimmed = value.trim();
  if (trimmed === "") return { value: null }; // Optional field

  const num = Number(trimmed);
  if (isNaN(num)) {
    return { value: null, error: `Invalid ${fieldName}: "${trimmed}" is not a number` };
  }
  if (num < min || num > max) {
    return { value: null, error: `${fieldName} ${num} is out of range (${min}-${max})` };
  }
  return { value: num };
}

function parseBooleanField(value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "true" || trimmed === "1" || trimmed === "yes" || trimmed === "y") return true;
  return false;
}

function parseCSVRow(row: Record<string, string>, rowIndex: number): { data: Record<string, unknown>; errors: ImportError[] } {
  const errors: ImportError[] = [];
  const result: Record<string, unknown> = {};

  // Parse date
  const dateRaw = row["date"] ?? "";
  const date = parseFlexibleDate(dateRaw);
  if (!date) {
    errors.push({ row: rowIndex, message: `Invalid date: "${dateRaw}"` });
  } else {
    result.date = date;
  }

  // Parse pain level (0-10)
  const pain = parseNumericField(row["pain level"] ?? "", 0, 10, "Pain Level");
  if (pain.error) errors.push({ row: rowIndex, message: pain.error });
  result.painLevel = pain.value ?? 0;

  // Parse stool frequency (0-20)
  const freq = parseNumericField(row["stool frequency"] ?? "", 0, 20, "Stool Frequency");
  if (freq.error) errors.push({ row: rowIndex, message: freq.error });
  result.stoolFrequency = freq.value ?? 0;

  // Parse stool type (1-7)
  const stool = parseNumericField(row["stool type"] ?? "", 1, 7, "Stool Type");
  if (stool.error) errors.push({ row: rowIndex, message: stool.error });
  result.stoolType = stool.value ?? 1;

  // Parse stress level (0-10)
  const stress = parseNumericField(row["stress level"] ?? "", 0, 10, "Stress Level");
  if (stress.error) errors.push({ row: rowIndex, message: stress.error });
  result.stressLevel = stress.value ?? 0;

  // Parse triggers
  const triggerRaw = row["triggers"] ?? "";
  result.triggers = JSON.stringify(parseTriggers(triggerRaw));

  // Parse notes
  result.notes = row["notes"]?.trim() || null;

  // Parse medication
  result.medicationTaken = row["medication"]?.trim() || null;

  // Parse blood in stool
  result.bloodInStool = parseBooleanField(row["blood"] ?? "");

  // Parse urgency level (0-10)
  const urgency = parseNumericField(row["urgency"] ?? "", 0, 10, "Urgency Level");
  if (urgency.error) errors.push({ row: rowIndex, message: urgency.error });
  result.urgencyLevel = urgency.value != null ? Math.round(urgency.value) : 0;

  return { data: result, errors };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new Response(
        JSON.stringify({ success: false, imported: 0, errors: ["No file provided. Please upload a CSV file."] }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!file.name.endsWith(".csv")) {
      return new Response(
        JSON.stringify({ success: false, imported: 0, errors: ["Only .csv files are accepted."] }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const text = await file.text();
    if (!text.trim()) {
      return new Response(
        JSON.stringify({ success: false, imported: 0, errors: ["The CSV file is empty."] }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { headers, rows } = parseCSV(text);

    // Validate required columns
    const normalizedHeaders = headers.map(normalizeHeader);
    const missingColumns: string[] = [];
    const requiredColumns = ["date"];
    for (const required of requiredColumns) {
      if (!normalizedHeaders.includes(required)) {
        missingColumns.push(required);
      }
    }
    if (missingColumns.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          imported: 0,
          errors: [`Missing required column(s): ${missingColumns.join(", ")}. Found columns: ${headers.join(", ")}`],
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get or create demo user
    let user = await db.user.findFirst();
    if (!user) {
      user = await db.user.create({
        data: {
          name: "Demo Patient",
          email: "demo@colobrief.ai",
          doctorName: "Dr. Sarah Chen",
        },
      });
    }

    // Parse all rows
    const allErrors: ImportError[] = [];
    const validRecords: Record<string, unknown>[] = [];

    for (let i = 0; i < rows.length; i++) {
      const { data, errors } = parseCSVRow(rows[i], i + 2); // +2 because header is row 1, data starts at row 2
      allErrors.push(...errors);
      if (data.date) {
        validRecords.push(data);
      }
    }

    // Skip rows that have no data at all
    const recordsToInsert = validRecords.filter((r) => {
      const hasData = r.painLevel !== 0 || r.stoolFrequency !== 0 || r.stressLevel !== 0 || (r.notes as string);
      return hasData;
    });

    // Insert records in batch
    let imported = 0;
    if (recordsToInsert.length > 0) {
      await db.symptomLog.createMany({
        data: recordsToInsert.map((record) => ({
          userId: user!.id,
          date: record.date as string,
          painLevel: record.painLevel as number,
          stoolFrequency: record.stoolFrequency as number,
          stoolType: record.stoolType as number,
          stressLevel: record.stressLevel as number,
          triggers: record.triggers as string,
          notes: (record.notes as string) || null,
          medicationTaken: (record.medicationTaken as string) || null,
          bloodInStool: record.bloodInStool as boolean,
          urgencyLevel: record.urgencyLevel as number,
        })),
      });
      imported = recordsToInsert.length;
    }

    return new Response(
      JSON.stringify({
        success: true,
        imported,
        errors: allErrors.map((e) => `Row ${e.row}: ${e.message}`),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error importing CSV:", error);
    return new Response(
      JSON.stringify({
        success: false,
        imported: 0,
        errors: ["An unexpected error occurred during import. Please check your file and try again."],
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}