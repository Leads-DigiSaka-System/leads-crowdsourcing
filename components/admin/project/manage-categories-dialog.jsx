"use client";
import { CATEGORY_ICON_OPTIONS, getLucideIconByName } from "@/lib/categoryIcons";

import { useEffect, useMemo, useState, startTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";

export function ManageCategoriesDialog({ triggerClassName, onChanged }) {
    const toSmartTitle = (s) =>
        s
            ?.toString()
            .split(/\s+/)
            .map((w) => (/^[A-Z0-9]{2,}$/.test(w) ? w : (w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())))
            .join(" ");
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [newName, setNewName] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState("");
    const [newColor, setNewColor] = useState("#e0f2fe");
    const [newTextColor, setNewTextColor] = useState("black");
    const [newIcon, setNewIcon] = useState("");
    const [editingColor, setEditingColor] = useState("#e0f2fe");
    const [editingTextColor, setEditingTextColor] = useState("black");
    const [editingIcon, setEditingIcon] = useState("");

    // Shared icon options and helper
    const normalizeIcon = (val) => {
        if (!val || val === 'none') return null;
        return val;
    };


    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/categories", { cache: "no-store" });
            const data = await res.json();
            setCategories(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load categories");
        }
    };

    useEffect(() => {
        if (open) fetchCategories();
    }, [open]);

    const onAdd = async () => {
        if (!newName.trim()) return;
        setLoading(true);
        try {
            const res = await fetch("/api/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName.trim(), colorHex: newColor, textColor: newTextColor, icon: normalizeIcon(newIcon) }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to create");
            }
            setNewName("");
            setNewColor("#e0f2fe");
            setNewTextColor("black");
            setNewIcon("");
            await fetchCategories();
            onChanged && onChanged();
            toast.success("Category added");
        } catch (e) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    const onSave = async () => {
        if (!editingId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/categories/${editingId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...(editingName ? { name: editingName.trim() } : {}),
                    ...(editingColor ? { colorHex: editingColor } : {}),
                    ...(editingTextColor ? { textColor: editingTextColor } : {}),
                    ...(typeof editingIcon !== 'undefined' ? { icon: normalizeIcon(editingIcon) } : {}),
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to update");
            }
            setEditingId(null);
            setEditingName("");
            setEditingColor("#e0f2fe");
            setEditingTextColor("black");
            setEditingIcon("");
            await fetchCategories();
            onChanged && onChanged();
            toast.success("Category updated");
        } catch (e) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    // State to track deletion flow
    const [pendingDeleteId, setPendingDeleteId] = useState(null);
    const [pendingDeleteCount, setPendingDeleteCount] = useState(0);
    const [pendingDeleteLoading, setPendingDeleteLoading] = useState(false);
    const [pendingDeleteError, setPendingDeleteError] = useState(null);
    const [transferTargetId, setTransferTargetId] = useState("");
    const [confirmOpen, setConfirmOpen] = useState(false);

    const openDeleteDialog = async (id) => {
        setPendingDeleteId(id);
        setTransferTargetId("");
        setPendingDeleteCount(0);
        setPendingDeleteError(null);
        setConfirmOpen(true);
        setPendingDeleteLoading(true);
        try {
            const res = await fetch(`/api/categories/${id}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const json = await res.json();
            setPendingDeleteCount(json.projectCount || 0);
        } catch (e) {
            setPendingDeleteError('Failed to load project usage. Please retry.');
        } finally {
            setPendingDeleteLoading(false);
        }
    };

    const canDelete = useMemo(() => {
        if (!pendingDeleteId) return false;
        if (categories.length <= 1) return false;
        if (pendingDeleteLoading) return false;
        if (pendingDeleteError) return false;
        // If no projects use this category, allow direct delete
        if (pendingDeleteCount === 0) return true;
        return !!transferTargetId && transferTargetId !== pendingDeleteId;
    }, [pendingDeleteId, transferTargetId, categories.length, pendingDeleteCount, pendingDeleteLoading, pendingDeleteError]);

    const performDelete = async () => {
        if (!pendingDeleteId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/categories/${pendingDeleteId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transferCategoryId: transferTargetId || null })
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to delete");
            }
            setConfirmOpen(false);
            setPendingDeleteId(null);
            setTransferTargetId("");
            await fetchCategories();
            onChanged && onChanged();
            toast.success("Category deleted");
        } catch (e) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    const isSaving = loading;

    // Sort categories alphabetically by name before rendering (memoized)
    const sortedCategories = useMemo(() => {
        return [...categories].sort((a, b) => a.name.localeCompare(b.name));
    }, [categories]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className={triggerClassName}>
                    <Plus className="mr-2 h-4 w-4" /> Manage Categories
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Manage Categories</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                            placeholder="New category name (e.g., Agriculture)"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") onAdd();
                            }}
                        />
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-muted-foreground">Color</label>
                            <input
                                type="color"
                                value={newColor}
                                onChange={(e) => startTransition(() => setNewColor(e.target.value))}
                                className="h-9 w-10 p-0 border rounded"
                                title="Category color"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-muted-foreground">Text</label>
                            <Select value={newTextColor} onValueChange={setNewTextColor}>
                                <SelectTrigger className="h-9 w-[110px] text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem className='text-xs' value="black">Black</SelectItem>
                                    <SelectItem className='text-xs' value="white">White</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-muted-foreground">Icon</label>
                            <Select value={newIcon} onValueChange={setNewIcon}>
                                <SelectTrigger className="h-9 w-[160px] text-xs">
                                    <SelectValue placeholder="None" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem className='text-xs' value="none">None</SelectItem>
                                    {CATEGORY_ICON_OPTIONS.map(opt => {
                                        const I = getLucideIconByName(opt.value);
                                        return (
                                            <SelectItem key={opt.value} value={opt.value} className='text-xs'>
                                                <span className="flex items-center gap-2">
                                                    {I ? <I className="h-4 w-4" /> : null}
                                                    {opt.label}
                                                </span>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>

                        </div>
                        <Button onClick={onAdd} disabled={isSaving || !newName.trim()}>Add</Button>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-auto pr-1">
                        {sortedCategories.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No categories yet.</p>
                        ) : (
                            sortedCategories.map((c) => (
                                <div key={c.id} className="flex items-center gap-2 border rounded-md p-2">
                                    {editingId === c.id ? (
                                        <>
                                            <Input
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") onSave();
                                                    if (e.key === "Escape") { setEditingId(null); setEditingName(""); }
                                                }}
                                            />
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs text-muted-foreground">Color</label>
                                                <input
                                                    type="color"
                                                    value={editingColor}
                                                    onChange={(e) => startTransition(() => setEditingColor(e.target.value))}
                                                    className="h-9 w-10 p-0 border rounded"
                                                    title="Category color"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs text-muted-foreground">Text</label>
                                                <Select value={editingTextColor} onValueChange={setEditingTextColor}>
                                                    <SelectTrigger className="h-9 w-[110px] text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem className='text-xs' value="black">Black</SelectItem>
                                                        <SelectItem className='text-xs' value="white">White</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs text-muted-foreground">Icon</label>
                                                <Select value={editingIcon} onValueChange={setEditingIcon}>
                                                    <SelectTrigger className="h-9 w-[160px] text-xs">
                                                        <SelectValue placeholder="None" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem className='text-xs' value="none">None</SelectItem>
                                                        {CATEGORY_ICON_OPTIONS.map(opt => {
                                                            const I = getLucideIconByName(opt.value);
                                                            return (
                                                                <SelectItem key={opt.value} value={opt.value} className='text-xs'>
                                                                    <span className="flex items-center gap-2">
                                                                        {I ? <I className="h-4 w-4" /> : null}
                                                                        {opt.label}
                                                                    </span>
                                                                </SelectItem>
                                                            );
                                                        })}
                                                    </SelectContent>
                                                </Select>

                                            </div>
                                            <Button size="sm" onClick={onSave} disabled={isSaving}>Save</Button>
                                            <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setEditingName(""); }}>Cancel</Button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex-1 flex items-center gap-3">
                                                <span
                                                    className="inline-flex items-center justify-center rounded px-2 py-1 text-xs"
                                                    style={{
                                                        backgroundColor: c.colorHex || '#e0f2fe',
                                                        color: (c.textColor || 'black') === 'white' ? '#fff' : '#000',
                                                    }}
                                                >
                                                    Aa
                                                </span>
                                                <div className="text-sm font-medium flex items-center gap-2">
                                                    {(() => { const I = getLucideIconByName(c.icon); return I ? <I className="h-4 w-4 opacity-80" /> : null; })()}
                                                    {toSmartTitle(c.name)}
                                                </div>

                                            </div>
                                            <Button size="icon" variant="ghost" onClick={() => { setEditingId(c.id); setEditingName(c.name); setEditingColor(c.colorHex || '#e0f2fe'); setEditingTextColor(c.textColor || 'black'); setEditingIcon(c.icon || ""); }}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" onClick={() => openDeleteDialog(c.id)} disabled={categories.length <= 1}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Delete confirmation with transfer */}
                <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Category</AlertDialogTitle>
                            <AlertDialogDescription>
                                {pendingDeleteLoading && (
                                    <span className="animate-pulse">Loading project usage...</span>
                                )}
                                {!pendingDeleteLoading && pendingDeleteError && (
                                    <span className="text-destructive text-xs">{pendingDeleteError}</span>
                                )}
                                {!pendingDeleteLoading && !pendingDeleteError && (
                                    pendingDeleteCount > 0 ? (
                                        <span>This category is used by <strong>{pendingDeleteCount}</strong> project{pendingDeleteCount !== 1 && 's'}. You must transfer them before deletion.</span>
                                    ) : (
                                        <span>This category has no associated projects and can be safely deleted.</span>
                                    )
                                )}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        {!pendingDeleteLoading && !pendingDeleteError && pendingDeleteCount > 0 && (
                            <div className="space-y-2 py-2">
                                <label className="text-xs font-medium text-muted-foreground">Transfer projects to</label>
                                <Select value={transferTargetId} onValueChange={setTransferTargetId} disabled={pendingDeleteLoading}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select target category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories
                                            .filter(cat => cat.id !== pendingDeleteId)
                                            .map(cat => (
                                                <SelectItem key={cat.id} value={cat.id} className="text-sm">
                                                    {toSmartTitle(cat.name)}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {categories.length <= 1 && (
                            <p className="text-xs text-destructive mt-1">You need at least two categories to perform a deletion.</p>
                        )}
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={loading} onClick={() => { setPendingDeleteId(null); setTransferTargetId(""); }}>Cancel</AlertDialogCancel>
                            <AlertDialogAction disabled={!canDelete || loading} onClick={performDelete} className="bg-destructive hover:bg-destructive/90">
                                {loading ? "Deleting..." : pendingDeleteLoading ? "Loading..." : pendingDeleteError ? "Retry Disabled" : "Delete"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
