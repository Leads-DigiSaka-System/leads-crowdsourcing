"use client"
import { useEffect, useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, FileText, RefreshCw } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

export function DraftsDialog({ triggerClassName }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [drafts, setDrafts] = useState([])
    const [error, setError] = useState("")
    const router = useRouter()
    const searchParams = useSearchParams()
    const suppressOpenRef = useRef(false)

    const loadDrafts = async () => {
        setLoading(true)
        setError("")
        try {
            const res = await fetch('/api/projects/drafts', { cache: 'no-store' })
            if (!res.ok) throw new Error('Failed to load drafts')
            const json = await res.json()
            setDrafts(Array.isArray(json) ? json : [])
        } catch (e) {
            setError('Unable to load drafts')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { if (open) loadDrafts() }, [open])

    const handleSelectDraft = (id) => {
        suppressOpenRef.current = true
        setOpen(false) // close first
        const params = new URLSearchParams(Array.from(searchParams.entries()))
        params.delete('newDraft')
        params.set('draftId', id)
        // Defer navigation slightly so close state settles and Radix doesn't re-trigger open
        setTimeout(() => {
            router.push(`/admin/projects/add-project?${params.toString()}`)
            // allow future opens after navigation
            setTimeout(() => { suppressOpenRef.current = false }, 300)
        }, 10)
    }

    const handleDeleteDraft = async (id) => {
        const prev = drafts
        setDrafts(d => d.filter(x => x.id !== id))
        try {
            const res = await fetch(`/api/projects/drafts/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('fail')
        } catch (e) {
            // restore on failure
            setDrafts(prev)
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                if (v && suppressOpenRef.current) return
                setOpen(v)
            }}
        >
            <DialogTrigger asChild>
                <Button type="button" variant="outline" className={triggerClassName}>Drafts</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Saved Drafts</DialogTitle>
                </DialogHeader>
                <div className="flex justify-between items-center mb-2 text-xs text-muted-foreground">
                    <div>{loading ? 'Loading…' : `${drafts.length} draft${drafts.length === 1 ? '' : 's'}`}</div>
                    <Button variant="ghost" size="xs" onClick={loadDrafts} disabled={loading}>
                        <RefreshCw className="h-3 w-3 mr-1" /> Refresh
                    </Button>
                </div>
                {error && <div className="text-destructive text-xs mb-2">{error}</div>}
                <ScrollArea className="h-64 pr-2">
                    <div className="space-y-2">
                        {loading && (
                            <div className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Loading drafts…</div>
                        )}
                        {!loading && drafts.length === 0 && (
                            <div className="text-sm text-muted-foreground">No drafts yet.</div>
                        )}
                        {!loading && drafts.map(d => {
                            const title = d?.data?.title?.trim() || '(Untitled)'
                            return (
                                <div key={d.id} className="group border rounded-md p-3 hover:bg-muted/60 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <button type="button" onClick={() => handleSelectDraft(d.id)} className="flex-1 text-left min-w-0">
                                            <div className="flex items-start gap-3">
                                                <FileText className="h-4 w-4 mt-0.5 text-muted-foreground group-hover:text-foreground" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium truncate">{title}</div>
                                                    <div className="text-[11px] text-muted-foreground mt-0.5">Updated {new Date(d.updatedAt).toLocaleString()}</div>
                                                </div>
                                            </div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteDraft(d.id)}
                                            className="text-xs text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                                            aria-label="Delete draft"
                                        >Delete</button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}