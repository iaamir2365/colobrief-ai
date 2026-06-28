import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const payload = getTokenFromRequest(request);

    if (!payload) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const symptomLogsCount = await db.symptomLog.count({ where: { userId: user.id } });

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      doctorName: user.doctorName,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt.toISOString(),
      _count: {
        symptomLogs: symptomLogsCount,
      },
    });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}