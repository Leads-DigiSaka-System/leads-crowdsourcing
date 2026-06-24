import { sendPasswordResetEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { NextResponse } from "next/server";

function maskEmail(email) {
  if (!email || typeof email !== "string") return "your email";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const maskedLocal = local.length <= 2 ? `${local[0] || "*"}*` : `${local.slice(0, 2)}***`;
  return `${maskedLocal}@${domain}`;
}

const ACCOUNT_DAILY_LIMIT = 3;
const ACCOUNT_COOLDOWN_SECONDS = 60;
const IP_HOURLY_LIMIT = 10;
const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req) {
  try {
    const { email } = await req.json();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!email || typeof email !== "string") {
      return NextResponse.json({ message: "Invalid email" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const maskedEmail = maskEmail(email);

  
    if (!user) {
      return NextResponse.json({ message: "If this email exists, we sent a reset link.", maskedEmail }, { status: 200 });
    }

   
    if (user.password == null) {
      return NextResponse.json({ code: "GOOGLE_ONLY", message: "This account uses Google sign-in. You cannot change the password.", maskedEmail }, { status: 400 });
    }

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

   
    const recentForAccount = await prisma.passwordReset.count({
      where: { userId: user.id, createdAt: { gte: oneDayAgo } },
    });
    if (recentForAccount >= ACCOUNT_DAILY_LIMIT) {
      return NextResponse.json({ message: "Reset limit reached. Please try again later.", maskedEmail }, { status: 429 });
    }

   
    const lastForAccount = await prisma.passwordReset.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    if (lastForAccount && now.getTime() - lastForAccount.createdAt.getTime() < ACCOUNT_COOLDOWN_SECONDS * 1000) {
      return NextResponse.json({ message: "Please wait a moment before trying again.", maskedEmail }, { status: 429 });
    }

   
    const ipHourlyCount = await prisma.passwordReset.count({ where: { requestIp: ip, createdAt: { gte: oneHourAgo } } });
    if (ipHourlyCount >= IP_HOURLY_LIMIT) {
      return NextResponse.json({ message: "Too many requests from your IP. Try again later.", maskedEmail }, { status: 429 });
    }

  
    const active = await prisma.passwordReset.findFirst({
      where: { userId: user.id, usedAt: null, expiresAt: { gt: now } },
      orderBy: { createdAt: "desc" },
    });
    if (active) {
      return NextResponse.json({ code: "TOKEN_ACTIVE", message: "A reset link was already sent. Please check your email.", maskedEmail }, { status: 409 });
    }

 
    await prisma.passwordReset.deleteMany({ where: { userId: user.id, usedAt: null, expiresAt: { lte: now } } });

 
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(now.getTime() + TOKEN_EXPIRY_MS);

    const created = await prisma.passwordReset.create({
      data: { userId: user.id, tokenHash, expiresAt, requestIp: ip },
    });

 
    const url = `${process.env.NEXT_PUBLIC_APP_URL || ""}/reset-password?t=${encodeURIComponent(rawToken)}`;
    await sendPasswordResetEmail({ to: email, resetUrl: url, maskedEmail });

    return NextResponse.json({ message: "We sent a password reset link.", maskedEmail }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}