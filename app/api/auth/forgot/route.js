import { sendPasswordResetEmail } from "@/lib/email";
import { createPasswordResetUrl } from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

function maskEmail(email) {
  const [local, domain] = email.split("@");
  const maskedLocal = local.length <= 2 ? `${local[0]}*` : `${local.slice(0, 2)}***`;
  return `${maskedLocal}@${domain}`;
}

const emailSchema = z.string().trim().toLowerCase().email();
const ACCOUNT_DAILY_LIMIT = 3;
const ACCOUNT_COOLDOWN_SECONDS = 60;
const IP_HOURLY_LIMIT = 10;
const TOKEN_EXPIRY_MS = 60 * 60 * 1000;

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = emailSchema.safeParse(body?.email);
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid email" }, { status: 400 });
    }
    const email = parsed.data;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const user = await prisma.user.findUnique({ where: { email } });
    const maskedEmail = maskEmail(email);

    if (!user) {
      return NextResponse.json({ message: "If this email exists, we sent a reset link.", maskedEmail });
    }
    if (user.password == null) {
      return NextResponse.json({ code: "GOOGLE_ONLY", message: "This account uses Google sign-in. Please continue with Google.", maskedEmail }, { status: 400 });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const resetUrl = createPasswordResetUrl(rawToken);
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    // Reserve the request atomically so concurrent requests cannot bypass limits.
    let reservation;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        reservation = await prisma.$transaction(async (tx) => {
          const now = new Date();
          const recentForAccount = await tx.passwordReset.count({
            where: { userId: user.id, createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
          });
          if (recentForAccount >= ACCOUNT_DAILY_LIMIT) {
            return { message: "Reset limit reached. Please try again later." };
          }
          const lastForAccount = await tx.passwordReset.findFirst({
            where: { userId: user.id }, orderBy: { createdAt: "desc" },
          });
          if (lastForAccount && now.getTime() - lastForAccount.createdAt.getTime() < ACCOUNT_COOLDOWN_SECONDS * 1000) {
            return { message: "Please wait one minute before requesting another reset link." };
          }
          const ipHourlyCount = await tx.passwordReset.count({
            where: { requestIp: ip, createdAt: { gte: new Date(now.getTime() - TOKEN_EXPIRY_MS) } },
          });
          if (ipHourlyCount >= IP_HOURLY_LIMIT) {
            return { message: "Too many requests from your IP. Try again later." };
          }
          const record = await tx.passwordReset.create({
            data: { userId: user.id, tokenHash, expiresAt: new Date(now.getTime() + TOKEN_EXPIRY_MS), requestIp: ip },
          });
          return { record };
        }, { isolationLevel: "Serializable" });
        break;
      } catch (error) {
        if (error.code !== "P2034" || attempt === 2) throw error;
      }
    }
    if (!reservation.record) {
      return NextResponse.json({ message: reservation.message, maskedEmail }, { status: 429 });
    }

    try {
      const result = await sendPasswordResetEmail({ to: user.email, resetUrl, maskedEmail });
      // Resend reports rejected messages through error, without necessarily throwing.
      if (result?.error || !result?.data?.id) {
        console.error("Password reset email rejected:", result?.error?.name || "missing_message_id");
        throw new Error("Email provider did not accept the reset email");
      }
    } catch (error) {
      // Failed delivery must not leave an unusable token or consume the retry quota.
      await prisma.passwordReset.deleteMany({ where: { id: reservation.record.id } });
      console.error("Password reset email failed:", error.name);
      return NextResponse.json({ message: "Unable to send the reset email. Please try again shortly." }, { status: 503 });
    }

    // Resends are allowed after the cooldown. Retire older links only after acceptance.
    // Keep their history so successful resets and expired links still count toward limits.
    await prisma.passwordReset.updateMany({
      where: { userId: user.id, id: { not: reservation.record.id }, usedAt: null, createdAt: { lte: reservation.record.createdAt } },
      data: { usedAt: new Date() },
    });
    return NextResponse.json({ message: "We sent a password reset link. Please use the most recent email.", maskedEmail });
  } catch (error) {
    console.error("Password reset request failed:", error.name);
    return NextResponse.json({ message: "Unable to process the request. Please try again shortly." }, { status: 500 });
  }
}
