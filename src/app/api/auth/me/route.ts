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
      select: {
        id: true,
        name: true,
        email: true,
        doctorName: true,
        emailVerified: true,
        createdAt: true,
        _count: {
          select: { symptomLogs: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...user,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}