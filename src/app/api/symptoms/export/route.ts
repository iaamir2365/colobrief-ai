import { db } from "@/lib/db";
import { format } from "date-fns";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const exportFormat = searchParams.get("format") || "csv";

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

    const logs = await db.symptomLog.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
    });

    if (exportFormat === "json") {
      const jsonBody = JSON.stringify(
        logs.map((log) => ({
          date: log.date,
          painLevel: log.painLevel,
          stoolFrequency: log.stoolFrequency,
          stoolType: log.stoolType,
          stressLevel: log.stressLevel,
          triggers: JSON.parse(log.triggers),
          notes: log.notes ?? "",
        })),
        null,
        2
      );

      const dateStr = format(new Date(), "yyyy-MM-dd");
      return new Response(jsonBody, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="colobrief-export-${dateStr}.json"`,
        },
      });
    }

    // Default: CSV format
    const header = "Date,Pain Level,Stool Frequency,Stool Type,Stress Level,Triggers,Notes";
    const rows = logs.map((log) => {
      const triggers = JSON.parse(log.triggers).join("; ");
      const notes = (log.notes ?? "").replace(/"/g, '""');
      return `${log.date},${log.painLevel},${log.stoolFrequency},${log.stoolType},${log.stressLevel},"${triggers}","${notes}"`;
    });

    const csvBody = [header, ...rows].join("\n");
    const dateStr = format(new Date(), "yyyy-MM-dd");

    return new Response(csvBody, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="colobrief-export-${dateStr}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting symptoms:", error);
    return new Response(JSON.stringify({ error: "Failed to export symptoms" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}