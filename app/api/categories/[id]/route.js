import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET /api/categories/[id] - return category + project usage count
export async function GET(req, { params }) {
    const { id } = await params; // Added await here
    try {
        const category = await prisma.category.findUnique({ where: { id } });
        if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });
        const projectCount = await prisma.project.count({ where: { categoryId: id } });
        return NextResponse.json({ ...category, projectCount });
    } catch (e) {
        console.error("GET /api/categories/[id] error", e);
        return NextResponse.json({ error: "Failed to fetch category" }, { status: 500 });
    }
}

// PATCH /api/categories/[id] - admin only
export async function PATCH(req, { params }) {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params; // Added await here
    try {
        const body = await req.json();
        const { name, colorHex, textColor, icon } = body || {};

        let updateData = {};
        if (typeof name === 'string' && name.trim()) {
            const trimmed = name.trim();
            const slug = trimmed
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, "")
                .replace(/\s+/g, "-")
                .replace(/-+/g, "-");
            updateData = { ...updateData, name: trimmed, slug };
        }
        if (typeof colorHex === 'string') {
            if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(colorHex)) {
                return NextResponse.json({ error: "Invalid colorHex format" }, { status: 400 });
            }
            updateData = { ...updateData, colorHex };
        }
        if (textColor === 'black' || textColor === 'white') {
            updateData = { ...updateData, textColor };
        }
        if (typeof icon !== 'undefined') {
            if (icon === null || (typeof icon === 'string' && icon.trim() === '')) {
                updateData = { ...updateData, icon: null };
            } else if (typeof icon === 'string') {
                updateData = { ...updateData, icon: icon.trim() };
            }
        }
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
        }

        const updated = await prisma.category.update({ where: { id }, data: updateData });
        return NextResponse.json(updated);
    } catch (e) {
        if (e?.code === "P2025") {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }
        if (e?.code === "P2002") {
            return NextResponse.json({ error: "Category already exists" }, { status: 409 });
        }
        console.error("PATCH /api/categories/[id] error", e);
        return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
    }
}

// DELETE /api/categories/[id] - admin only
export async function DELETE(req, { params }) {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params; // Added await here
    try {
        let transferCategoryId = null;
        try {
            const body = await req.json().catch(() => null);
            transferCategoryId = body?.transferCategoryId || null;
        } catch (_) { /* ignore body parse errors */ }

        // Ensure category exists
        const category = await prisma.category.findUnique({ where: { id }, select: { id: true } });
        if (!category) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        if (transferCategoryId) {
            if (transferCategoryId === id) {
                return NextResponse.json({ error: "transferCategoryId cannot be the same as the category being deleted" }, { status: 400 });
            }
            const target = await prisma.category.findUnique({ where: { id: transferCategoryId }, select: { id: true } });
            if (!target) {
                return NextResponse.json({ error: "Transfer category not found" }, { status: 404 });
            }
            // Reassign all projects referencing this category
            await prisma.project.updateMany({ where: { categoryId: id }, data: { categoryId: transferCategoryId } });
        } else {
            // If there are projects and no transfer specified, block deletion
            const count = await prisma.project.count({ where: { categoryId: id } });
            if (count > 0) {
                return NextResponse.json({ error: "Category in use. Provide transferCategoryId to reassign projects." }, { status: 400 });
            }
        }

        await prisma.category.delete({ where: { id } });
        return NextResponse.json({ ok: true, transferredTo: transferCategoryId || null });
    } catch (e) {
        if (e?.code === "P2025") {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }
        console.error("DELETE /api/categories/[id] error", e);
        return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
    }
}