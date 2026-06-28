import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { hashPassword, signToken, generateVerificationCode } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, doctorName } = body;

    // Validate required fields
    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await db.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password and generate verification code
    const hashedPassword = await hashPassword(password);
    const { code, token: verificationToken } = generateVerificationCode();
    const createdUser = await db.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        doctorName: doctorName?.trim() || null,
        verificationToken,
      },
    });

    // Send verification email in the background (don't block the response)
    sendVerificationEmail(createdUser.email, code).catch((err) => {
      console.error("Background verification email error:", err);
    });

    // Generate JWT
    const jwt = signToken({
      userId: createdUser.id,
      email: createdUser.email,
      name: createdUser.name,
    });

    return NextResponse.json({
      token: jwt,
      user: {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        doctorName: createdUser.doctorName,
        emailVerified: false,
        createdAt: createdUser.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error during signup:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}