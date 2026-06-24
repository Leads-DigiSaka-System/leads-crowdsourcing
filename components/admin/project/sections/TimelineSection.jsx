"use client"

import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X, Plus, Pencil, Check, RotateCcw } from "lucide-react"
import { TimelineDatePicker } from "@/components/ui/timeline-date-picker"
import { useMemo, useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

const RichTextEditor = dynamic(() => import("@/components/ui/rich-text-editor"), { ssr: false })

export function TimelineSection({
    form,
    newTimelineEvent,
    setNewTimelineEvent,
    addTimelineEvent,
    removeTimelineEvent,
    timelineEventsSorted,
}) {
    const events = timelineEventsSorted || form.watch("timelineEvents") || []

    // Editing state
    const [editingIndex, setEditingIndex] = useState(null)
    const [editingDraft, setEditingDraft] = useState({ date: "", title: "" })

    // Project-wide timeline mode: 'absolute' | 'relative'
    const [mode, setMode] = useState('absolute')
    const [isSwitchDialogOpen, setIsSwitchDialogOpen] = useState(false)
    const [pendingMode, setPendingMode] = useState(null)

    // Relative mode composer state
    const [durationLocal, setDurationLocal] = useState(() => form.getValues('timelineDurationMonths') || "")
    const [relType, setRelType] = useState('single') // 'single' | 'range'
    const [relStart, setRelStart] = useState(1)
    const [relEnd, setRelEnd] = useState(2)

    // Map from sorted index to original index (if sorted array differs)
    const originalEvents = form.watch("timelineEvents") || []
    const indexMap = useMemo(() => {
        // Build a simple mapping by matching first occurrence of date+title pairs
        return (events || []).map(ev => {
            const idx = originalEvents.findIndex(o => o.date === ev.date && o.title === ev.title)
            return idx
        })
    }, [events, originalEvents])

    // Helpers to detect relative month strings and coverage
    const parseRelativeRange = (s) => {
        if (!s || typeof s !== 'string') return null
        const normalized = s.trim().toLowerCase().replace(/\u2013|\u2014/g, '-')
        // Month 5 or Months 5
        let m = normalized.match(/^months?\s*(\d+)$/i)
        if (m) {
            const n = parseInt(m[1], 10)
            if (!isNaN(n)) return { start: n, end: n }
        }
        // Months 2-5 or Month 2-5
        let r = normalized.match(/^months?\s*(\d+)\s*(?:-|to)\s*(\d+)$/i)
        if (r) {
            const a = parseInt(r[1], 10), b = parseInt(r[2], 10)
            if (!isNaN(a) && !isNaN(b)) return { start: Math.min(a, b), end: Math.max(a, b) }
        }
        return null
    }

    const isRelativeOnly = useMemo(() => {
        if (!events.length) return null
        let rel = 0, abs = 0
        for (const ev of events) {
            if (parseRelativeRange(ev?.date)) rel++
            else abs++
        }
        if (rel > 0 && abs === 0) return true
        if (abs > 0 && rel === 0) return false
        return false // fallback to absolute if mixed (legacy)
    }, [events])

    // Initialize/adjust mode from existing events
    useEffect(() => {
        if (isRelativeOnly === null) return
        setMode(isRelativeOnly ? 'relative' : 'absolute')
    }, [isRelativeOnly])

    // Compute covered months set from current events
    const coveredMonths = useMemo(() => {
        const set = new Set()
        for (const ev of events) {
            const r = parseRelativeRange(ev?.date)
            if (r) {
                for (let m = r.start; m <= r.end; m++) set.add(m)
            }
        }
        return set
    }, [events])

    const duration = Number(form.watch('timelineDurationMonths') || durationLocal || 0)

    const availableStartMonths = useMemo(() => {
        if (!duration || duration <= 0) return []
        const arr = []
        for (let m = 1; m <= duration; m++) {
            if (!coveredMonths.has(m)) arr.push(m)
        }
        return arr
    }, [duration, coveredMonths])

    const availableEndMonthsForStart = useMemo(() => {
        if (!duration || duration <= 0) return []
        const start = relStart
        const arr = []
        if (relType === 'single') return []
        if (!start) return []
        for (let e = start + 1; e <= duration; e++) {
            let ok = true
            for (let m = start; m <= e; m++) {
                if (coveredMonths.has(m)) { ok = false; break }
            }
            if (ok) arr.push(e)
        }
        return arr
    }, [duration, coveredMonths, relStart, relType])

    const formatRelativeLabel = (start, end) => {
        if (start && !end) return `Month ${start}`
        if (start && end) return start === end ? `Month ${start}` : `Months ${start}\u2013${end}`
        return ""
    }

    const handleModeChange = (nextMode) => {
        if (nextMode === mode) return
        if (events.length > 0) {
            setPendingMode(nextMode)
            setIsSwitchDialogOpen(true)
        } else {
            setMode(nextMode)
        }
    }

    const confirmSwitchMode = () => {
        setIsSwitchDialogOpen(false)
        if (pendingMode) {
            // Clear events on switch
            form.setValue('timelineEvents', [])
            setMode(pendingMode)
            setPendingMode(null)
        }
    }

    const cancelSwitchMode = () => {
        setIsSwitchDialogOpen(false)
        setPendingMode(null)
    }

    const onChangeDuration = (val) => {
        const v = Number(val)
        if (!Number.isFinite(v) || v <= 0) {
            setDurationLocal(val)
            form.setValue('timelineDurationMonths', undefined)
            return
        }
        // Validate against existing events
        let maxUsed = 0
        for (const ev of events) {
            const r = parseRelativeRange(ev?.date)
            if (r) maxUsed = Math.max(maxUsed, r.end)
        }
        if (maxUsed > v) {
            toast.error(`Cannot set duration to ${v} months, existing events reach Month ${maxUsed}. Remove or edit them first.`)
            return
        }
        setDurationLocal(v)
        form.setValue('timelineDurationMonths', v)
        // Adjust composer defaults within bounds
        setRelStart((s) => Math.min(Math.max(1, s), v || 1))
        setRelEnd((e) => Math.min(Math.max(2, e), v || 2))
    }

    const startEdit = (displayIndex) => {
        const origIndex = indexMap[displayIndex] ?? displayIndex
        const target = events[displayIndex]
        setEditingIndex(displayIndex)
        setEditingDraft({ date: target.date, title: target.title, __orig: origIndex })
    }

    const cancelEdit = () => {
        setEditingIndex(null)
        setEditingDraft({ date: "", title: "" })
    }

    const saveEdit = () => {
        if (editingIndex == null) return
        const origIndex = editingDraft.__orig ?? indexMap[editingIndex] ?? editingIndex
        const current = [...originalEvents]
        // In relative mode, validate month overlaps and duration
        if (mode === 'relative') {
            const r = parseRelativeRange(editingDraft.date)
            if (!r) {
                toast.error('Please select a valid month or month range')
                return
            }
            if (!duration || r.end > duration) {
                toast.error(`Month selection exceeds duration (1–${duration || '?'}).`)
                return
            }
            // Check overlaps with other events
            for (let i = 0; i < current.length; i++) {
                if (i === origIndex) continue
                const rr = parseRelativeRange(current[i]?.date)
                if (rr) {
                    const overlap = Math.max(r.start, rr.start) <= Math.min(r.end, rr.end)
                    if (overlap) {
                        toast.error('Selected months overlap an existing event')
                        return
                    }
                }
            }
        }
        current[origIndex] = { date: editingDraft.date, title: editingDraft.title }
        form.setValue("timelineEvents", current)
        cancelEdit()
    }

    return (
        <Card>
            <CardHeader className="pb-4">
                <CardTitle className="text-xl">Project Timeline</CardTitle>
                <CardDescription>Timeline description and events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField
                    control={form.control}
                    name="timelineDescription"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Timeline Description *</FormLabel>
                            <FormControl>
                                <RichTextEditor value={field.value} onChange={field.onChange} placeholder="Overall timeline description" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Mode toggle */}
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                    <div className="flex items-center gap-3">
                        <Label className="text-sm">Timeline mode</Label>
                        <div className="flex gap-2">
                            <Button type="button" variant={mode === 'absolute' ? 'default' : 'outline'} size="sm" onClick={() => handleModeChange('absolute')}>Absolute dates</Button>
                            <Button type="button" variant={mode === 'relative' ? 'default' : 'outline'} size="sm" onClick={() => handleModeChange('relative')}>Relative months</Button>
                        </div>
                    </div>
                    {mode === 'relative' && (
                        <div className="flex items-center gap-2">
                            <Label className="text-sm">Duration (months)</Label>
                            <Input
                                type="number"
                                min={1}
                                value={durationLocal}
                                onChange={(e) => onChangeDuration(e.target.value)}
                                className="w-28 h-8"
                                placeholder="e.g. 24"
                            />
                        </div>
                    )}
                </div>

                <Separator />

                <div className="space-y-4">
                    <h4 className="font-medium text-sm">Add Timeline Event</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/20">
                        {mode === 'absolute' ? (
                            <div>
                                <Label className="text-sm">Date *</Label>
                                <div className="mt-1">
                                    <TimelineDatePicker
                                        value={newTimelineEvent.date}
                                        onChange={(val) => setNewTimelineEvent(prev => ({ ...prev, date: val }))}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label className="text-sm">Month selection *</Label>
                                <div className="flex flex-wrap gap-2 items-center">
                                    <Select value={relType} onValueChange={setRelType}>
                                        <SelectTrigger size="sm" className="h-8">
                                            <SelectValue placeholder="Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="single">Single month</SelectItem>
                                            <SelectItem value="range">Month range</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={String(relStart)} onValueChange={(v) => setRelStart(Number(v))}>
                                        <SelectTrigger size="sm" className="h-8 min-w-24">
                                            <SelectValue placeholder="Start" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableStartMonths.map(m => (
                                                <SelectItem key={m} value={String(m)}>Month {m}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {relType === 'range' && (
                                        <>
                                            <span className="opacity-60">to</span>
                                            <Select value={String(relEnd)} onValueChange={(v) => setRelEnd(Number(v))}>
                                                <SelectTrigger size="sm" className="h-8 min-w-24">
                                                    <SelectValue placeholder="End" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableEndMonthsForStart.map(m => (
                                                        <SelectItem key={m} value={String(m)}>Month {m}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </>
                                    )}
                                </div>
                                {duration > 0 && (
                                    <div className="text-xs text-muted-foreground">Unavailable months: {
                                        (() => {
                                            const blocked = []
                                            for (let m = 1; m <= duration; m++) if (coveredMonths.has(m)) blocked.push(m)
                                            return blocked.length ? blocked.join(', ') : 'None'
                                        })()
                                    }</div>
                                )}
                            </div>
                        )}
                        <div>
                            <Label className="text-sm">Event Title *</Label>
                            <Input
                                value={newTimelineEvent.title}
                                onChange={(e) => setNewTimelineEvent(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Project launch"
                                className="mt-1"
                            />
                        </div>
                        <div className="sm:col-span-2 flex justify-end pt-2">
                            <Button
                                type="button"
                                onClick={() => {
                                    if (mode === 'relative') {
                                        const d = Number(duration)
                                        if (!d || d <= 0) { toast.error('Please set a valid duration first'); return }
                                        if (!newTimelineEvent.title) { toast.error('Please enter an event title'); return }
                                        if (relType === 'single') {
                                            if (!relStart || relStart < 1 || relStart > d) { toast.error('Invalid month'); return }
                                            if (coveredMonths.has(relStart)) { toast.error('Selected month is already used'); return }
                                            const label = formatRelativeLabel(relStart, null)
                                            addTimelineEvent({ title: newTimelineEvent.title, date: label })
                                        } else {
                                            if (!relStart || !relEnd || relEnd <= relStart) { toast.error('End month must be greater than start month'); return }
                                            if (relEnd > d) { toast.error('Range exceeds duration'); return }
                                            for (let m = relStart; m <= relEnd; m++) if (coveredMonths.has(m)) { toast.error('Range overlaps existing event'); return }
                                            const label = formatRelativeLabel(relStart, relEnd)
                                            addTimelineEvent({ title: newTimelineEvent.title, date: label })
                                        }
                                    } else {
                                        // absolute mode - use event as-is
                                        addTimelineEvent()
                                    }
                                }}
                                size="sm"
                                disabled={mode === 'relative' && (!newTimelineEvent.title)}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Event
                            </Button>
                        </div>
                    </div>
                </div>

                {events.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="font-medium text-sm">Timeline Events ({events.length})</h4>
                        <div className="space-y-2">
                            {events.map((event, index) => {
                                const isEditing = editingIndex === index
                                const origIndex = indexMap[index] ?? index
                                return (
                                    <div key={index} className="p-3 border rounded-lg bg-muted/10 space-y-2">
                                        {isEditing ? (
                                            <div className="space-y-2">
                                                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                                                    <div className="sm:col-span-2">
                                                        <Label className="text-xs font-medium">{mode === 'relative' ? 'Month(s) *' : 'Date *'}</Label>
                                                        <div className="mt-1">
                                                            {mode === 'relative' ? (
                                                                <div className="flex items-center gap-2">
                                                                    {/* derive current selection */}
                                                                    {(() => {
                                                                        const r = parseRelativeRange(editingDraft.date) || { start: relStart, end: relType === 'range' ? relEnd : relStart }
                                                                        const [eType, setEType] = [(r && r.start !== r.end) ? 'range' : 'single', (v) => setEditingDraft(d => ({ ...d, date: v === 'single' ? formatRelativeLabel(r.start, null) : formatRelativeLabel(r.start, Math.max(r.start + 1, r.end)) }))]
                                                                        return (
                                                                            <>
                                                                                <Select defaultValue={eType} onValueChange={(v) => {
                                                                                    const rr = parseRelativeRange(editingDraft.date) || { start: 1, end: 2 }
                                                                                    const newLabel = v === 'single' ? formatRelativeLabel(rr.start, null) : formatRelativeLabel(rr.start, Math.max(rr.start + 1, rr.end))
                                                                                    setEditingDraft(d => ({ ...d, date: newLabel }))
                                                                                }}>
                                                                                    <SelectTrigger size="sm" className="h-8"><SelectValue placeholder="Type" /></SelectTrigger>
                                                                                    <SelectContent>
                                                                                        <SelectItem value="single">Single</SelectItem>
                                                                                        <SelectItem value="range">Range</SelectItem>
                                                                                    </SelectContent>
                                                                                </Select>
                                                                                {/* Start month */}
                                                                                <Select value={String(r.start)} onValueChange={(v) => {
                                                                                    const rr = parseRelativeRange(editingDraft.date) || { start: 1, end: 1 }
                                                                                    const ns = Number(v)
                                                                                    const ne = Math.max(ns, rr.end)
                                                                                    const label = ne === ns ? formatRelativeLabel(ns, null) : formatRelativeLabel(ns, ne)
                                                                                    setEditingDraft(d => ({ ...d, date: label }))
                                                                                }}>
                                                                                    <SelectTrigger size="sm" className="h-8 min-w-20"><SelectValue placeholder="Start" /></SelectTrigger>
                                                                                    <SelectContent>
                                                                                        {Array.from({ length: Math.max(0, duration) }, (_, i) => i + 1).map(m => (
                                                                                            <SelectItem key={m} value={String(m)}>Month {m}</SelectItem>
                                                                                        ))}
                                                                                    </SelectContent>
                                                                                </Select>
                                                                                {/* End month for range */}
                                                                                {(parseRelativeRange(editingDraft.date)?.end ?? 0) > (parseRelativeRange(editingDraft.date)?.start ?? 0) && (
                                                                                    <Select value={String(parseRelativeRange(editingDraft.date).end)} onValueChange={(v) => {
                                                                                        const rr = parseRelativeRange(editingDraft.date) || { start: 1, end: 2 }
                                                                                        const ne = Number(v)
                                                                                        const label = formatRelativeLabel(rr.start, ne)
                                                                                        setEditingDraft(d => ({ ...d, date: label }))
                                                                                    }}>
                                                                                        <SelectTrigger size="sm" className="h-8 min-w-20"><SelectValue placeholder="End" /></SelectTrigger>
                                                                                        <SelectContent>
                                                                                            {Array.from({ length: Math.max(0, duration) }, (_, i) => i + 1).filter(m => m > (parseRelativeRange(editingDraft.date)?.start ?? 0)).map(m => (
                                                                                                <SelectItem key={m} value={String(m)}>Month {m}</SelectItem>
                                                                                            ))}
                                                                                        </SelectContent>
                                                                                    </Select>
                                                                                )}
                                                                            </>
                                                                        )
                                                                    })()}
                                                                </div>
                                                            ) : (
                                                                <TimelineDatePicker
                                                                    value={editingDraft.date}
                                                                    onChange={(val) => setEditingDraft(d => ({ ...d, date: val }))}
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="sm:col-span-3">
                                                        <Label className="text-xs font-medium">Event Title *</Label>
                                                        <Input
                                                            value={editingDraft.title}
                                                            onChange={(e) => setEditingDraft(d => ({ ...d, title: e.target.value }))}
                                                            className="mt-1 h-8"
                                                            placeholder="Event title"
                                                        />
                                                    </div>
                                                    <div className="sm:col-span-5 flex gap-2 justify-end">
                                                        <Button type="button" size="sm" onClick={saveEdit} disabled={!editingDraft.date || !editingDraft.title}>
                                                            <Check className="h-4 w-4 mr-1" /> Save
                                                        </Button>
                                                        <Button type="button" size="sm" variant="outline" onClick={cancelEdit}>
                                                            <RotateCcw className="h-4 w-4 mr-1" /> Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-start gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm truncate">{event.title}</div>
                                                    <div className="text-xs text-muted-foreground">{event.date}</div>
                                                </div>
                                                <div className="flex gap-1 flex-shrink-0">
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => startEdit(index)} className="ml-auto h-8 w-8 p-0">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => removeTimelineEvent(origIndex)} className="text-destructive hover:text-destructive ml-auto h-8 w-8 p-0">
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Mode switch confirm dialog */}
                <AlertDialog open={isSwitchDialogOpen} onOpenChange={setIsSwitchDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Switch timeline mode?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Switching modes will clear all existing timeline events. This cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={cancelSwitchMode}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmSwitchMode}>Switch and clear</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    )
}
