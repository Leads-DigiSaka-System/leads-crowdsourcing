import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("t");
    if (!token) return NextResponse.json({ message: "Missing token" }, { status: 400 });
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const now = new Date();
    const found = await prisma.passwordReset.findFirst({ where: { tokenHash, usedAt: null, expiresAt: { gt: now } } });
    if (!found) return NextResponse.json({ message: "Invalid or expired" }, { status: 404 });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}