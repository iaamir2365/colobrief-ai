import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await db.user.upsert({
      where: { email: 'patient@colobrief.ai' },
      update: {},
      create: {
        email: 'patient@colobrief.ai',
        name: 'Demo Patient',
        doctorName: 'Dr. Sarah Chen',
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching/creating user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}