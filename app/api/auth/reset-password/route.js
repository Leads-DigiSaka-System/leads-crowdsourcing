import { prisma } from "@/lib/prisma";
import { isPasswordResetToken } from "@/lib/password-reset";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { token, password } = (await req.json().catch(() => null)) || {};
    if (!isPasswordResetToken(token)) {
      return NextResponse.json({ message: "Invalid or expired token" }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters" }, { status: 400 });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const now = new Date();
    const record = await prisma.passwordReset.findFirst({ where: { tokenHash, usedAt: null, expiresAt: { gt: now } } });
    if (!record) {
      return NextResponse.json({ message: "Invalid or expired token" }, { status: 400 });
    }

 
    const user = await prisma.user.findUnique({ where: { id: record.userId } });
    if (!user || user.password == null) {
      return NextResponse.json({ message: "This account uses Google sign-in. Password cannot be changed." }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 10);
    const updated = await prisma.$transaction(async (tx) => {
      const consumedAt = new Date();
      const claimed = await tx.passwordReset.updateMany({
        where: { id: record.id, usedAt: null, expiresAt: { gt: consumedAt } },
        data: { usedAt: consumedAt },
      });
      if (claimed.count !== 1) return false;

      await tx.user.update({ where: { id: user.id }, data: { password: hash } });
      await tx.passwordReset.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: consumedAt },
      });
      return true;
    });
    if (!updated) {
      return NextResponse.json({ message: "Invalid or expired token" }, { status: 400 });
    }

    return NextResponse.json({ message: "Password updated" }, { status: 200 });
  } catch (e) {
    console.error("Password reset failed:", e.name);
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
