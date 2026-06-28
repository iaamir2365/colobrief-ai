import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { hashPassword, signToken } from "@/lib/auth";
import type { SymptomLog } from "@/lib/db";

const DEMO_EMAIL = "demo@colobrief.ai";
const DEMO_PASSWORD = "demo123";
const DEMO_NAME = "Demo Patient";
const DEMO_DOCTOR = "Dr. Sarah Chen";

const UC_TRIGGERS = [
  "Dairy",
  "Stress",
  "Spicy Food",
  "NSAIDs",
  "Alcohol",
  "Lack of Sleep",
  "Anxiety",
  "Processed Food",
];

const PATIENT_NOTES = [
  "Woke up feeling okay. Had oatmeal for breakfast. Mild cramping in the afternoon after lunch meeting.",
  "Tough day at work. Lots of deadlines and pressure. Noticed more urgency in the evening.",
  "Had a cheese pizza last night — probably a mistake. Several trips to the bathroom this morning.",
  "Feeling pretty good today. Stayed hydrated, ate bland foods. Low stress day overall.",
  "Couldn't sleep well last night. Up multiple times. Feeling drained today with some abdominal discomfort.",
  "Went out for Thai food with friends. Spicy curry was delicious but paying for it now.",
  "Took ibuprofen for a headache yesterday. Seems like it irritated things. Higher pain today.",
  "Relaxing weekend so far. Meditated in the morning. Symptoms seem calmer when I manage stress.",
  "Had a glass of wine at dinner. Usually fine but today my stomach is not happy.",
  "Ate some processed snacks at the office party. Feeling bloated and had loose stools.",
  "Good day! Ate rice and grilled chicken, stayed calm. Only one bathroom trip all day.",
  "Exam season stress is getting to me. Waking up with cramps and urgency is no fun.",
  "Tried a new protein bar — probably has dairy. Mild flare triggered but manageable.",
  "Overall decent week coming to a close. Keeping a food diary is helping me notice patterns.",
];

const MEDICATIONS = [
  "Mesalamine (Asacol) 800mg",
  "Mesalamine (Asacol) 800mg",
  "Mesalamine (Asacol) 800mg",
  "Prednisone 20mg",
  "",
  "Mesalamine (Asacol) 800mg",
  "Mesalamine (Asacol) 800mg",
  "Prednisone 20mg",
  "Mesalamine (Asacol) 800mg",
  "",
  "Mesalamine (Asacol) 800mg",
  "",
  "Prednisone 20mg",
  "Mesalamine (Asacol) 800mg",
  "Mesalamine (Asacol) 800mg",
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
  return d.toISOString().split("T")[0];
}

export async function POST() {
  try {
    // Find or create demo user
    let user = await db.user.findUnique({
      where: { email: DEMO_EMAIL },
    });

    if (!user) {
      const hashedPassword = await hashPassword(DEMO_PASSWORD);
      user = await db.user.create({
        data: {
          name: DEMO_NAME,
          email: DEMO_EMAIL,
          password: hashedPassword,
          doctorName: DEMO_DOCTOR,
          emailVerified: true,
          verificationToken: null,
        },
      });
    }

    // Check if demo user already has data
    const existingLogsCount = await db.symptomLog.count({
      where: { userId: user.id },
    });

    // Generate 14 days of demo data if none exists
    if (existingLogsCount === 0) {
      const entries: Array<Omit<SymptomLog, "id" | "createdAt">> = [];
      for (let i = 13; i >= 0; i--) {
        const isFlareDay = i === 10 || i === 4;
        const isGoodDay = i === 7 || i === 2;

        const painLevel = isFlareDay ? rand(6, 8) : isGoodDay ? rand(1, 3) : rand(2, 6);
        const stoolFrequency = isFlareDay ? rand(5, 8) : isGoodDay ? rand(1, 2) : rand(2, 5);
        const stoolType = isFlareDay ? rand(5, 7) : isGoodDay ? rand(3, 4) : rand(3, 6);
        const stressLevel = isFlareDay ? rand(7, 9) : isGoodDay ? rand(2, 3) : rand(3, 7);

        let triggers = isFlareDay
          ? ["Stress", UC_TRIGGERS[rand(0, 7)]]
          : pickTriggers();
        triggers = [...new Set(triggers)];

        const bloodInStool = isFlareDay ? Math.random() < 0.6 : Math.random() < 0.2;
        const urgencyLevel =
          stoolType >= 6
            ? Math.random() < 0.7
              ? 3
              : 2
            : stoolType >= 5
              ? Math.random() < 0.5
                ? 2
                : 1
              : stoolType >= 3
                ? Math.random() < 0.4
                  ? 1
                  : 0
                : 0;

        entries.push({
          userId: user.id,
          date: formatDate(i),
          painLevel,
          stoolFrequency,
          stoolType,
          stressLevel,
          triggers: JSON.stringify(triggers),
          notes: PATIENT_NOTES[i % PATIENT_NOTES.length],
          medicationTaken: MEDICATIONS[i % MEDICATIONS.length] || null,
          bloodInStool,
          urgencyLevel,
        });
      }

      await db.symptomLog.createMany({ data: entries });
    }

    // Generate JWT
    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        doctorName: user.doctorName,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt.toISOString(),
        _count: { symptomLogs: existingLogsCount || 14 },
      },
    });
  } catch (error) {
    console.error("Demo login error:", error);
    return NextResponse.json(
      { error: "Demo login failed" },
      { status: 500 }
    );
  }
}
