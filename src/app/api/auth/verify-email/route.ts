import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

/**
 * POST /api/auth/verify-email
 * Verifies the 6-digit code the user enters.
 * Body: { code: "ABCDEF" }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request);
    if (userId instanceof NextResponse) return userId;

    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string" || code.trim().length !== 6) {
      return NextResponse.json(
        { error: "A valid 6-digit code is required" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId as string },
      select: { id: true, email: true, verificationToken: true, emailVerified: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ success: true, message: "Email already verified" });
    }

    if (!user.verificationToken) {
      return NextResponse.json(
        { error: "No verification code found. Please request a new one." },
        { status: 400 }
      );
    }

    // Extract the code part (before the dash + timestamp)
    const storedCode = user.verificationToken.split("-")[0];
    const timestamp = parseInt(user.verificationToken.split("-").slice(1).join("-"), 10);

    // Check expiration (10 minutes)
    const now = Date.now();
    if (now - timestamp > 10 * 60 * 1000) {
      // Token expired
      await db.user.update({
        where: { id: user.id },
        data: { verificationToken: null },
      });
      return NextResponse.json(
        { error: "Verification code expired. Please request a new one." },
        { status: 410 }
      );
    }

    // Verify code (case-insensitive)
    if (storedCode !== code.trim().toUpperCase()) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 401 }
      );
    }

    // Mark email as verified
    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Email verified successfully!",
    });
  } catch (error) {
    console.error("Error verifying email:", error);
    return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 }
    );
  }
}