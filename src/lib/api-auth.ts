import { db } from "@/lib/db";
import { getTokenFromRequest, type JWTPayload } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Helper that returns 401 if not authenticated, or the userId if valid.
 * Usage: const userId = await requireAuth(request); if (!userId) return;
 */
export async function requireAuth(
  request: Request
): Promise<string | NextResponse> {
  const payload = getTokenFromRequest(request);
  if (!payload) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  return user.id;
}

/**
 * Like requireAuth, but also rejects users who have not verified their email.
 */
export async function requireVerifiedAuth(
  request: Request
): Promise<string | NextResponse> {
  const payload = getTokenFromRequest(request);
  if (!payload) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, emailVerified: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  if (!user.emailVerified) {
    return NextResponse.json(
      { error: "Email verification required" },
      { status: 403 }
    );
  }

  return user.id;
}