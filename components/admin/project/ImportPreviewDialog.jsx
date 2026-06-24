"use client";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ImportPreviewDialog({ open, onOpenChange, preview, onApply }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Preview import</DialogTitle>
                </DialogHeader>
                {preview ? (
                    <div className="space-y-4 max-h-[70vh] overflow-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm text-muted-foreground">Title</div>
                                <div className="font-medium break-words">{preview.data.title || '—'}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Authors</div>
                                <div className="break-words">{preview.data.authors || '—'}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Location</div>
                                <div className="break-words">{preview.data.location || '—'}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Category</div>
                                <div className="break-words">{preview.categoryLabel || '—'}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Currency</div>
                                <div className="break-words">{preview.data.currency || '—'}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Goal</div>
                                <div className="break-words">{preview.data.goal || '—'}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Days Left</div>
                                <div className="break-words">{preview.data.daysLeft || '—'}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Tags</div>
                                <div className="break-words">{(preview.data.tags || []).join(', ') || '—'}</div>
                            </div>
                        </div>

                        <div>
                            <div className="text-sm text-muted-foreground mb-1">Overview</div>
                            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: preview.data.overview || '' }} />
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground mb-1">Methods</div>
                            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: preview.data.methods || '' }} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm font-medium mb-1">Team Members (first 5)</div>
                                <div className="rounded border divide-y">
                                    {(preview.data.teamMembers || []).slice(0, 5).map((m, i) => (
                                        <div key={i} className="p-2 text-sm">
                                            <div className="font-medium">{m.name || '—'} <span className="text-muted-foreground font-normal">({m.role || '—'})</span></div>
                                            <div className="text-muted-foreground">{m.email || m.linkedin || m.twitter || '—'}</div>
                                        </div>
                                    ))}
                                    {!(preview.data.teamMembers || []).length && <div className="p-2 text-sm text-muted-foreground">No team members detected</div>}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-medium mb-1">Budget Items (first 5)</div>
                                <div className="rounded border divide-y">
                                    {(preview.data.budgetItems || []).slice(0, 5).map((b, i) => (
                                        <div key={i} className="p-2 text-sm flex justify-between gap-2">
                                            <div className="truncate"><span className="font-medium">{b.name || '—'}</span>{b.description ? ` — ${b.description}` : ''}</div>
                                            <div className="shrink-0">{b.value ?? '—'}</div>
                                        </div>
                                    ))}
                                    {!(preview.data.budgetItems || []).length && <div className="p-2 text-sm text-muted-foreground">No budget items detected</div>}
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="text-sm font-medium mb-1">Timeline Events (first 5)</div>
                            <div className="rounded border divide-y">
                                {(preview.data.timelineEvents || []).slice(0, 5).map((t, i) => (
                                    <div key={i} className="p-2 text-sm flex justify-between gap-2">
                                        <div className="truncate">{t.title || '—'}</div>
                                        <div className="shrink-0 text-muted-foreground">{t.date || '—'}</div>
                                    </div>
                                ))}
                                {!(preview.data.timelineEvents || []).length && <div className="p-2 text-sm text-muted-foreground">No timeline events detected</div>}
                            </div>
                        </div>

                        {(preview.warnings || []).length > 0 && (
                            <div className="rounded border border-amber-300 bg-amber-50 text-amber-900 p-3 text-sm">
                                <div className="font-medium">Warnings</div>
                                <ul className="mt-1 list-disc pl-5">
                                    {preview.warnings.map((w, i) => (<li key={i}>{w}</li>))}
                                </ul>
                            </div>
                        )}
                    </div>
                ) : null}
                <DialogFooter className="mt-4">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="button" onClick={onApply}>Apply to form</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
