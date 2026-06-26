import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { sendVerificationEmail } from "@/lib/email";
import { randomBytes } from "crypto";

/**
 * POST /api/auth/send-verification
 * Sends a 6-digit verification code to the authenticated user's email.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request);
    if (userId instanceof NextResponse) return userId;

    const user = await db.user.findUnique({
      where: { id: userId as string },
      select: { id: true, email: true, name: true, emailVerified: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate a 6-digit verification code
    const code = randomBytes(3).toString("hex").toUpperCase();
    const token = `${code}-${Date.now()}`;

    // Store the token in the user record
    await db.user.update({
      where: { id: user.id },
      data: { verificationToken: token },
    });

    // Send the email via Mailtrap
    const sent = await sendVerificationEmail(user.email, code);

    if (!sent) {
      return NextResponse.json(
        { error: "Failed to send verification email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${user.email}`,
    });
  } catch (error) {
    console.error("Error sending verification:", error);
    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 500 }
    );
  }
}