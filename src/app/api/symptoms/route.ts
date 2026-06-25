import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
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
    const body = await request.json();
    const { date, painLevel, stoolFrequency, stoolType, stressLevel, triggers, notes } = body;

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

    const log = await db.symptomLog.create({
      data: {
        userId: user.id,
        date: date || new Date().toISOString().split("T")[0],
        painLevel: Number(painLevel) || 0,
        stoolFrequency: Number(stoolFrequency) || 0,
        stoolType: Number(stoolType) || 1,
        stressLevel: Number(stressLevel) || 0,
        triggers: JSON.stringify(triggers || []),
        notes: notes || null,
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
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