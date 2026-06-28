import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedAuth } from "@/lib/api-auth";
import { mapSymptomLogToResponse } from "@/lib/utils";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireVerifiedAuth(request);
    if (userId instanceof NextResponse) return userId;

    const { id } = await params;
    const body = await request.json();
    const {
      date,
      painLevel,
      stoolFrequency,
      stoolType,
      stressLevel,
      triggers,
      notes,
      medicationTaken,
      bloodInStool,
      urgencyLevel,
    } = body;

    const existing = await db.symptomLog.findUnique({ where: { id } });
    if (!existing || existing.userId !== (userId as string)) {
      return NextResponse.json({ error: "Symptom log not found" }, { status: 404 });
    }

    const updated = await db.symptomLog.update({
      where: { id },
      data: {
        date: date ?? existing.date,
        painLevel: painLevel !== undefined ? Number(painLevel) : existing.painLevel,
        stoolFrequency: stoolFrequency !== undefined ? Number(stoolFrequency) : existing.stoolFrequency,
        stoolType: stoolType !== undefined ? Number(stoolType) : existing.stoolType,
        stressLevel: stressLevel !== undefined ? Number(stressLevel) : existing.stressLevel,
        triggers: triggers !== undefined ? JSON.stringify(triggers) : existing.triggers,
        notes: notes !== undefined ? notes || null : existing.notes,
        medicationTaken: medicationTaken !== undefined ? medicationTaken || null : existing.medicationTaken,
        bloodInStool: bloodInStool !== undefined ? Boolean(bloodInStool) : existing.bloodInStool,
        urgencyLevel: urgencyLevel !== undefined ? Number(urgencyLevel) : existing.urgencyLevel,
      },
    });

    return NextResponse.json(mapSymptomLogToResponse(updated));
  } catch (error) {
    console.error("Error updating symptom log:", error);
    return NextResponse.json(
      { error: "Failed to update symptom log" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireVerifiedAuth(request);
    if (userId instanceof NextResponse) return userId;

    const { id } = await params;

    const log = await db.symptomLog.findUnique({ where: { id } });
    if (!log || log.userId !== (userId as string)) {
      return NextResponse.json({ error: "Symptom log not found" }, { status: 404 });
    }

    await db.symptomLog.delete({ where: { id } });
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error("Error deleting symptom log:", error);
    return NextResponse.json(
      { error: "Failed to delete symptom log" },
      { status: 500 }
    );
  }
}