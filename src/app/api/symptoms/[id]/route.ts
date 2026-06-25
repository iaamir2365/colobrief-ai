import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const log = await db.symptomLog.findUnique({
      where: { id },
    });

    if (!log) {
      return NextResponse.json({ error: 'Symptom log not found' }, { status: 404 });
    }

    await db.symptomLog.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('Error deleting symptom log:', error);
    return NextResponse.json(
      { error: 'Failed to delete symptom log' },
      { status: 500 }
    );
  }
}