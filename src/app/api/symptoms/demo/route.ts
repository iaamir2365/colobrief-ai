import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

const UC_TRIGGERS = [
  'Dairy',
  'Stress',
  'Spicy Food',
  'NSAIDs',
  'Alcohol',
  'Lack of Sleep',
  'Anxiety',
  'Processed Food',
];

const MEDICATIONS = [
  'Mesalamine (Asacol) 800mg',
  'Mesalamine (Asacol) 800mg',
  'Mesalamine (Asacol) 800mg',
  'Prednisone 20mg',
  '',
  'Mesalamine (Asacol) 800mg',
  'Mesalamine (Asacol) 800mg',
  'Prednisone 20mg',
  'Mesalamine (Asacol) 800mg',
  '',
  'Mesalamine (Asacol) 800mg',
  '',
  'Prednisone 20mg',
  'Mesalamine (Asacol) 800mg',
  'Mesalamine (Asacol) 800mg',
  '',
];

const PATIENT_NOTES = [
  'Woke up feeling okay. Had oatmeal for breakfast. Mild cramping in the afternoon after lunch meeting.',
  'Tough day at work. Lots of deadlines and pressure. Noticed more urgency in the evening.',
  'Had a cheese pizza last night — probably a mistake. Several trips to the bathroom this morning.',
  'Feeling pretty good today. Stayed hydrated, ate bland foods. Low stress day overall.',
  'Couldn\'t sleep well last night. Up multiple times. Feeling drained today with some abdominal discomfort.',
  'Went out for Thai food with friends. Spicy curry was delicious but paying for it now.',
  'Took ibuprofen for a headache yesterday. Seems like it irritated things. Higher pain today.',
  'Relaxing weekend so far. Meditated in the morning. Symptoms seem calmer when I manage stress.',
  'Had a glass of wine at dinner. Usually fine but today my stomach is not happy.',
  'Ate some processed snacks at the office party. Feeling bloated and had loose stools.',
  'Good day! Ate rice and grilled chicken, stayed calm. Only one bathroom trip all day.',
  'Exam season stress is getting to me. Waking up with cramps and urgency is no fun.',
  'Tried a new protein bar — probably has dairy. Mild flare triggered but manageable.',
  'Overall decent week coming to a close. Keeping a food diary is helping me notice patterns.',
  'Work presentation went well but the anxiety beforehand caused a rough morning.',
  'Had a salad with raw veggies. Usually avoid them but felt adventurous — mixed results.',
  'Skipped breakfast due to running late. That always seems to make things worse by noon.',
];

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickTriggers(): string[] {
  const count = rand(0, 3);
  const shuffled = [...UC_TRIGGERS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function formatDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

export async function POST() {
  try {
    // Ensure user exists
    const user = await db.user.upsert({
      where: { email: 'demo@colobrief.ai' },
      update: {},
      create: {
        email: 'demo@colobrief.ai',
        name: 'Demo Patient',
        doctorName: 'Dr. Sarah Chen',
      },
    });

    // Clear existing logs
    await db.symptomLog.deleteMany({
      where: { userId: user.id },
    });

    // Generate 14 days of demo data
    const entries = [];
    for (let i = 13; i >= 0; i--) {
      // Create some flare patterns — days 10 and 4 are higher
      const isFlareDay = i === 10 || i === 4;
      const isGoodDay = i === 7 || i === 2;

      const painLevel = isFlareDay
        ? rand(6, 8)
        : isGoodDay
          ? rand(1, 3)
          : rand(2, 6);

      const stoolFrequency = isFlareDay
        ? rand(5, 8)
        : isGoodDay
          ? rand(1, 2)
          : rand(2, 5);

      const stoolType = isFlareDay
        ? rand(5, 7)
        : isGoodDay
          ? rand(3, 4)
          : rand(3, 6);

      const stressLevel = isFlareDay
        ? rand(7, 9)
        : isGoodDay
          ? rand(2, 3)
          : rand(3, 7);

      const triggers = isFlareDay
        ? ['Stress', UC_TRIGGERS[rand(0, 7)]]
        : pickTriggers();

      // Blood in stool: ~30% chance, higher on flare days
      const bloodInStool = isFlareDay
        ? Math.random() < 0.6
        : Math.random() < 0.2;

      // Urgency correlated with stoolType: higher type = higher urgency
      const urgencyLevel = stoolType >= 6 ? (Math.random() < 0.7 ? 3 : 2)
        : stoolType >= 5 ? (Math.random() < 0.5 ? 2 : 1)
        : stoolType >= 3 ? (Math.random() < 0.4 ? 1 : 0)
        : 0;

      const notes = PATIENT_NOTES[i % PATIENT_NOTES.length];
      const medication = MEDICATIONS[i % MEDICATIONS.length];

      entries.push({
        userId: user.id,
        date: formatDate(i),
        painLevel,
        stoolFrequency,
        stoolType,
        stressLevel,
        triggers: JSON.stringify(triggers),
        notes,
        medicationTaken: medication || null,
        bloodInStool,
        urgencyLevel,
      });
    }

    const result = await db.symptomLog.createMany({
      data: entries,
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `Generated ${result.count} demo symptom logs`,
    });
  } catch (error) {
    console.error('Error generating demo data:', error);
    return NextResponse.json(
      { error: 'Failed to generate demo data' },
      { status: 500 }
    );
  }
}