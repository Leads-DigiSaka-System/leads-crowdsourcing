import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET /api/categories - public list
export async function GET() {
    try {
        const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
        return NextResponse.json(categories);
    } catch (e) {
        console.error("GET /api/categories error", e);
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}

// POST /api/categories - admin only
export async function POST(req) {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const body = await req.json();
        const { name, colorHex, textColor, icon } = body || {};
        if (!name || typeof name !== "string") {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }
        const trimmed = name.trim();
        const slug = trimmed
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");

        // sanitize optional color inputs
        const color = typeof colorHex === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(colorHex)
            ? colorHex
            : undefined;
        const text = textColor === 'black' || textColor === 'white' ? textColor : undefined;

        const created = await prisma.category.create({
            data: {
                name: trimmed,
                slug,
                ...(color ? { colorHex: color } : {}),
                ...(text ? { textColor: text } : {}),
                ...(typeof icon === 'string' && icon.trim() ? { icon: icon.trim() } : {}),
            }
        });
        return NextResponse.json(created, { status: 201 });
    } catch (e) {
        if (e?.code === "P2002") {
            return NextResponse.json({ error: "Category already exists" }, { status: 409 });
        }
        console.error("POST /api/categories error", e);
        return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
    }
}
