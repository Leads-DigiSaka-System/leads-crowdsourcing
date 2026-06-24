"use client";
import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus, Pencil, Check, RotateCcw, Shield, GripVertical } from "lucide-react";
import RichTextView from "@/components/ui/rich-text-view";
import { useEffect, useState } from "react";
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from "../SortableItem";
import { toast } from "sonner";

const RichTextEditor = dynamic(() => import("@/components/ui/rich-text-editor"), { ssr: false })

export function BudgetSection({
    form,
    newBudgetItem,
    setNewBudgetItem,
    addBudgetItem,
    removeBudgetItem,
}) {
    const items = form.watch("budgetItems") || []
    const total = items.reduce((sum, item) => sum + Number(item.value || 0), 0)
    const [isMounted, setIsMounted] = useState(false)

    // Local edit state (per item index)
    const [editingIndex, setEditingIndex] = useState(null)
    const [editingDraft, setEditingDraft] = useState({ name: "", value: 0, description: "" })
    const [activeId, setActiveId] = useState(null)

    // Enable DnD only after mount to avoid SSR hydration mismatches from dnd-kit aria ids
    useEffect(() => { setIsMounted(true) }, [])

    const startEdit = (index) => {
        const target = items[index]
        setEditingIndex(index)
        setEditingDraft({ name: target.name, value: target.value, description: target.description || "" })
    }

    const cancelEdit = () => {
        setEditingIndex(null)
        setEditingDraft({ name: "", value: 0, description: "" })
    }

    const saveEdit = () => {
        if (editingIndex == null) return

        const item = items[editingIndex]
        const hasAllocations = item?.allocations && Array.isArray(item.allocations) && item.allocations.length > 0
        const allocatedAmount = hasAllocations
            ? item.allocations.reduce((sum, alloc) => sum + (Number(alloc.amount) || 0), 0)
            : 0

        const newValue = Number(editingDraft.value) || 0


        if (hasAllocations && newValue < allocatedAmount) {
            toast.error("Invalid amount", {
                description: `Amount cannot be less than ₱${allocatedAmount.toLocaleString()} (total donations received). Please enter ₱${allocatedAmount.toLocaleString()} or higher.`,
                duration: 6000,
            })
            return
        }

        const updated = items.map((it, i) => i === editingIndex ? { ...it, ...editingDraft, value: newValue } : it)
        form.setValue("budgetItems", updated)
        cancelEdit()

        if (hasAllocations && newValue > allocatedAmount) {
            toast.success("Budget item updated", {
                description: `Amount increased to ₱${newValue.toLocaleString()}. ₱${allocatedAmount.toLocaleString()} is already funded.`
            })
        } else {
            toast.success("Budget item updated successfully")
        }
    }

    // Drag and drop sorting
    const onDragStart = (event) => {
        setActiveId(event.active?.id || null)
    }

    const onDragEnd = (event) => {
        const { active, over } = event
        setActiveId(null)
        if (!over || active.id === over.id) return

        // Use stable ids (db id or clientId) to compute indices reliably
        const ids = items.map((it, idx) => String(it?.id ?? it?.clientId ?? idx))
        const oldIndex = ids.findIndex(v => v === active.id)
        const newIndex = ids.findIndex(v => v === over.id)
        if (oldIndex === -1 || newIndex === -1) return

        const reordered = arrayMove(items, oldIndex, newIndex)
        form.setValue("budgetItems", reordered)
    }

    const handleRemoveBudgetItem = (index) => {
        const item = items[index]


        const hasAllocations = item?.allocations && Array.isArray(item.allocations) && item.allocations.length > 0
        const allocatedAmount = hasAllocations
            ? item.allocations.reduce((sum, alloc) => sum + (Number(alloc.amount) || 0), 0)
            : 0

        if (hasAllocations) {
            toast.error("Cannot delete budget item", {
                description: `This item has ₱${allocatedAmount.toLocaleString()} in donations and cannot be deleted. You can edit its details instead.`,
                duration: 5000,
            })
            return
        }


        removeBudgetItem(index)
        toast.success("Budget item removed", {
            description: "The budget item has been successfully removed."
        })
    }

    return (
        <Card>
            <CardHeader className="pb-4">
                <CardTitle className="text-xl">Project Budget</CardTitle>
                <CardDescription>Budget description and breakdown</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField
                    control={form.control}
                    name="budgetDescription"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Budget Description *</FormLabel>
                            <FormControl>
                                <RichTextEditor value={field.value} onChange={field.onChange} placeholder="Overall budget description" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Separator />

                <div className="space-y-4">
                    <h4 className="font-medium text-sm">Add Budget Item</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/20">
                        <div>
                            <Label className="text-sm">Item Name *</Label>
                            <Input
                                value={newBudgetItem.name}
                                onChange={(e) => setNewBudgetItem(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Equipment costs"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label className="text-sm">Amount *</Label>
                            <Input
                                type="number"
                                value={newBudgetItem.value}
                                onChange={(e) => {
                                    const value = e.target.value
                                    setNewBudgetItem(prev => ({ ...prev, value: value === "" ? "" : parseInt(value) || 0 }))
                                }}
                                placeholder="0"
                                className="mt-1"
                            />
                        </div>
                        <div className="sm:col-span-2 lg:col-span-1 flex items-end">
                            <Button type="button" onClick={addBudgetItem} size="sm" className="w-full">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Item
                            </Button>
                        </div>
                        <div className="sm:col-span-2 lg:col-span-3">
                            <Label className="text-sm">Item Description</Label>
                            <RichTextEditor
                                value={newBudgetItem.description}
                                onChange={val => setNewBudgetItem(prev => ({ ...prev, description: val }))}
                                placeholder="Item description (optional)"
                                className="mt-1"
                            />
                        </div>
                    </div>
                </div>

                {items.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="font-medium text-sm">Budget Items (₱{total.toLocaleString()})</h4>
                        {isMounted ? (
                            <DndContext collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
                                <SortableContext items={items.map((it, idx) => String(it?.id ?? it?.clientId ?? idx))} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-2">
                                        {items.map((item, index) => {
                                            const isEditing = editingIndex === index
                                            const hasAllocations = item?.allocations && Array.isArray(item.allocations) && item.allocations.length > 0
                                            const allocatedAmount = hasAllocations
                                                ? item.allocations.reduce((sum, alloc) => sum + (Number(alloc.amount) || 0), 0)
                                                : 0
                                            const itemId = String(item?.id ?? item?.clientId ?? index)

                                            return (
                                                <SortableItem key={itemId} id={itemId} disabled={!!isEditing}>
                                                    {({ attributes, listeners, setActivatorNodeRef }) => (
                                                        <div className={`p-3 border rounded-lg ${activeId === itemId ? 'bg-accent' : 'bg-muted/10'} space-y-2`}>
                                                            <div className="flex gap-2 items-start">
                                                                {/* Drag handle (disabled while editing) */}
                                                                <button
                                                                    type="button"
                                                                    className={`mt-1 h-6 w-6 flex items-center justify-center rounded hover:bg-muted ${isEditing ? 'cursor-not-allowed opacity-40' : 'cursor-grab'}`}
                                                                    ref={setActivatorNodeRef}
                                                                    {...(!isEditing ? { ...attributes, ...listeners } : {})}
                                                                    aria-label="Drag to reorder"
                                                                    title="Drag to reorder"
                                                                >
                                                                    <GripVertical className="h-4 w-4" />
                                                                </button>
                                                                <div className="flex-1 space-y-2">
                                                                    {isEditing ? (
                                                                        <div className="space-y-2">
                                                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                                                <div className="sm:col-span-1">
                                                                                    <Label className="text-xs font-medium">Item Name *</Label>
                                                                                    <Input
                                                                                        value={editingDraft.name}
                                                                                        onChange={(e) => setEditingDraft(d => ({ ...d, name: e.target.value }))}
                                                                                        className="mt-1 h-8"
                                                                                    />
                                                                                </div>
                                                                                <div className="sm:col-span-1">
                                                                                    <Label className="text-xs font-medium">
                                                                                        Amount *
                                                                                        {hasAllocations && (
                                                                                            <span className="text-primary text-xs ml-1">
                                                                                                (min: ₱{allocatedAmount.toLocaleString()})
                                                                                            </span>
                                                                                        )}
                                                                                    </Label>
                                                                                    <Input
                                                                                        type="number"
                                                                                        value={editingDraft.value}
                                                                                        min={hasAllocations ? allocatedAmount : 0}
                                                                                        onChange={(e) => setEditingDraft(d => ({ ...d, value: e.target.value }))}
                                                                                        className="mt-1 h-8"
                                                                                        placeholder={hasAllocations ? `Min: ${allocatedAmount}` : "0"}
                                                                                    />
                                                                                </div>
                                                                                <div className="sm:col-span-1 flex items-end gap-2">
                                                                                    <Button
                                                                                        type="button"
                                                                                        size="sm"
                                                                                        onClick={saveEdit}
                                                                                        disabled={
                                                                                            !editingDraft.name ||
                                                                                            Number(editingDraft.value) <= 0 ||
                                                                                            (hasAllocations && Number(editingDraft.value) < allocatedAmount)
                                                                                        }
                                                                                    >
                                                                                        <Check className="h-4 w-4 mr-1" /> Save
                                                                                    </Button>
                                                                                    <Button type="button" size="sm" variant="outline" onClick={cancelEdit}>
                                                                                        <RotateCcw className="h-4 w-4 mr-1" /> Cancel
                                                                                    </Button>
                                                                                </div>
                                                                                <div className="sm:col-span-3">
                                                                                    <Label className="text-xs font-medium">Description</Label>
                                                                                    <RichTextEditor
                                                                                        value={editingDraft.description}
                                                                                        onChange={(val) => setEditingDraft(d => ({ ...d, description: val }))}
                                                                                        placeholder="Item description (optional)"
                                                                                        className="mt-1"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-start gap-3">
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                    <div className="font-medium text-sm truncate">{item.name}</div>
                                                                                    {hasAllocations && (
                                                                                        <div className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full border border-primary/20">
                                                                                            <Shield className="h-3 w-3" />
                                                                                            Protected
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <div className="text-xs text-muted-foreground">
                                                                                    ₱{Number(item.value).toLocaleString()}
                                                                                    {hasAllocations && (
                                                                                        <span className="ml-2 text-primary font-medium">
                                                                                            • ₱{allocatedAmount.toLocaleString()} donated
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                {item.description && (
                                                                                    <RichTextView html={item.description} className="text-xs text-muted-foreground mt-2" />
                                                                                )}
                                                                            </div>
                                                                            <div className="flex gap-1 flex-shrink-0">
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => startEdit(index)}
                                                                                    className="ml-auto h-8 w-8 p-0"
                                                                                    onMouseDown={(e) => e.stopPropagation()}
                                                                                    onPointerDown={(e) => e.stopPropagation()}
                                                                                    onTouchStart={(e) => e.stopPropagation()}
                                                                                >
                                                                                    <Pencil className="h-4 w-4" />
                                                                                </Button>
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => handleRemoveBudgetItem(index)}
                                                                                    className={`ml-auto h-8 w-8 p-0 ${hasAllocations ? 'text-muted-foreground cursor-not-allowed opacity-50' : 'text-destructive hover:text-destructive'}`}
                                                                                    onMouseDown={(e) => e.stopPropagation()}
                                                                                    onPointerDown={(e) => e.stopPropagation()}
                                                                                    onTouchStart={(e) => e.stopPropagation()}
                                                                                    title={hasAllocations ? 'Cannot delete: This item has donations' : 'Delete budget item'}
                                                                                >
                                                                                    <X className="h-4 w-4" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </SortableItem>
                                            )
                                        })}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        ) : (
                            <div className="space-y-2">
                                {items.map((item, index) => {
                                    const hasAllocations = item?.allocations && Array.isArray(item.allocations) && item.allocations.length > 0
                                    const allocatedAmount = hasAllocations
                                        ? item.allocations.reduce((sum, alloc) => sum + (Number(alloc.amount) || 0), 0)
                                        : 0
                                    return (
                                        <div key={`static-${index}`} className={`p-3 border rounded-lg bg-muted/10 space-y-2`}>
                                            <div className="flex gap-2 items-start">
                                                <span className="mt-1 h-6 w-6 flex items-center justify-center rounded text-muted-foreground">
                                                    <GripVertical className="h-4 w-4" />
                                                </span>
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <div className="font-medium text-sm truncate">{item.name}</div>
                                                                {hasAllocations && (
                                                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full border border-primary/20">
                                                                        <Shield className="h-3 w-3" />
                                                                        Protected
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                ₱{Number(item.value).toLocaleString()}
                                                                {hasAllocations && (
                                                                    <span className="ml-2 text-primary font-medium">
                                                                        • ₱{allocatedAmount.toLocaleString()} donated
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {item.description && (
                                                                <RichTextView html={item.description} className="text-xs text-muted-foreground mt-2" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
