import { prisma } from "@/lib/prisma";
import { isPasswordResetToken } from "@/lib/password-reset";
import crypto from "crypto";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("t");
    if (!isPasswordResetToken(token)) return NextResponse.json({ message: "Invalid token" }, { status: 400 });
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const now = new Date();
    const found = await prisma.passwordReset.findFirst({ where: { tokenHash, usedAt: null, expiresAt: { gt: now }, user: { password: { not: null } } } });
    if (!found) return NextResponse.json({ message: "Invalid or expired" }, { status: 404 });
    return NextResponse.json({ ok: true }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
