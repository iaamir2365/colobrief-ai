import { db } from "@/lib/db";
import { getTokenFromRequest, type JWTPayload } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Validates the JWT token from the request and returns the authenticated user's ID.
 * Returns null if not authenticated.
 */
export async function getAuthUserId(request: Request): Promise<string | null> {
  const payload: JWTPayload | null = getTokenFromRequest(request);
  if (!payload) return null;

  // Verify user still exists in DB
  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: { id: true },
  });

  return user?.id ?? null;
}

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
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const user = await db.user.findUnique({
    where: { id: authResult },
    select: { id: true, emailVerified: true },
  });

  if (!user?.emailVerified) {
    return NextResponse.json(
      { error: "Email verification required" },
      { status: 403 }
    );
  }

  return user.id;
}