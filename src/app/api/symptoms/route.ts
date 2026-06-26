import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);
    if (userId instanceof NextResponse) return userId;

    const logs = await db.symptomLog.findMany({
      where: { userId: userId as string },
      orderBy: { date: "desc" },
    });

    const mapped = logs.map((log) => ({
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
      createdAt: log.createdAt.toISOString(),
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Error fetching symptoms:", error);
    return NextResponse.json(
      { error: "Failed to fetch symptoms" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request);
    if (userId instanceof NextResponse) return userId;

    const body = await request.json();
    const { date, painLevel, stoolFrequency, stoolType, stressLevel, triggers, notes } = body;

    const logDate = date || new Date().toISOString().split("T")[0];
    const uid = userId as string;

    // Upsert: delete existing log for same user + date, then create new one
    await db.symptomLog.deleteMany({
      where: { userId: uid, date: logDate },
    });

    const log = await db.symptomLog.create({
      data: {
        userId: uid,
        date: logDate,
        painLevel: Number(painLevel) || 0,
        stoolFrequency: Number(stoolFrequency) || 0,
        stoolType: Number(stoolType) || 1,
        stressLevel: Number(stressLevel) || 0,
        triggers: JSON.stringify(triggers || []),
        notes: notes || null,
        medicationTaken: body.medicationTaken || null,
        bloodInStool: body.bloodInStool ?? false,
        urgencyLevel: body.urgencyLevel ?? 0,
      },
    });

    return NextResponse.json({
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
      createdAt: log.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Error creating symptom log:", error);
    return NextResponse.json(
      { error: "Failed to create symptom log" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await requireAuth(request);
    if (userId instanceof NextResponse) return userId;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    // Verify the log belongs to this user
    const log = await db.symptomLog.findUnique({ where: { id } });
    if (!log || log.userId !== (userId as string)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db.symptomLog.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting symptom log:", error);
    return NextResponse.json(
      { error: "Failed to delete symptom log" },
      { status: 500 }
    );
  }
}