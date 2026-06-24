"use client"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2 } from 'lucide-react'
import { toast } from "sonner"
import { DndContext, closestCenter } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableItem } from "./SortableItem"

export default function ManageRecommendedClient() {
  const [leftSearch, setLeftSearch] = useState("")
  const [rightSearch, setRightSearch] = useState("")
  const [recommended, setRecommended] = useState([]) // {id,title,recommendationRank}
  const [candidates, setCandidates] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [activeId, setActiveId] = useState(null)
  // No confirm dialog — faster bulk removals

  const loadData = async () => {
    try {
      const [recRes, candRes] = await Promise.all([
        fetch(`/api/projects/recommended`),
        fetch(`/api/projects/recommended/candidates?search=${encodeURIComponent(rightSearch)}`)
      ])
      const rec = await recRes.json()
      const cand = await candRes.json()
      setRecommended(Array.isArray(rec) ? rec : [])
      setCandidates(Array.isArray(cand) ? cand : [])
    } catch (e) {
      toast.error('Failed to load lists', { description: e.message })
    }
  }

  useEffect(() => { loadData() }, [])
  // Refresh candidates list when right search changes; keep recommended unfiltered for full-order saves
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/projects/recommended/candidates?search=${encodeURIComponent(rightSearch)}`)
        const cand = await res.json()
        setCandidates(Array.isArray(cand) ? cand : [])
      } catch (e) { /* silent */ }
    }, 300)
    return () => clearTimeout(t)
  }, [rightSearch])

  const leftFiltered = useMemo(() => {
    const q = leftSearch.trim().toLowerCase()
    if (!q) return recommended
    return recommended.filter(p => (p.title || '').toLowerCase().includes(q) || (p.authors || '').toLowerCase().includes(q))
  }, [recommended, leftSearch])

  const onDragEnd = (event) => {
    const { active, over } = event
    setActiveId(null)
    if (!over || active.id === over.id) return
    const oldIndex = recommended.findIndex(i => i.id === active.id)
    const newIndex = recommended.findIndex(i => i.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    setRecommended(prev => arrayMove(prev, oldIndex, newIndex))
  }

  const onDragStart = (event) => setActiveId(event.active?.id || null)

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const orderedIds = recommended.map(p => p.id)
      const res = await fetch('/api/projects/recommended', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderedIds })
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) { toast.error('Save failed', { description: payload?.error || 'Could not reorder' }); return }
      toast.success('Recommended order saved')
      loadData()
    } catch (e) {
      toast.error('Save failed', { description: e.message })
    } finally { setIsSaving(false) }
  }

  const addToRecommended = async (project) => {
    try {
      const res = await fetch(`/api/projects/${project.id}/recommendation`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recommended: true }) })
      if (!res.ok) { const p = await res.json().catch(() => ({})); toast.error('Add failed', { description: p?.error || 'Could not add' }); return }
      setCandidates(prev => prev.filter(c => c.id !== project.id))
      setRecommended(prev => [...prev, project])
    } catch (e) { toast.error('Add failed', { description: e.message }) }
  }

  const removeFromRecommended = async (project) => {
    try {
      const res = await fetch(`/api/projects/${project.id}/recommendation`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recommended: false }) })
      if (!res.ok) { const p = await res.json().catch(() => ({})); toast.error('Remove failed', { description: p?.error || 'Could not remove' }); return }
      setRecommended(prev => prev.filter(r => r.id !== project.id))
      setCandidates(prev => [{ id: project.id, title: project.title, authors: project.authors }, ...prev])
      toast.success('Removed', { description: `${project.title} removed from Recommended.` })
    } catch (e) { toast.error('Remove failed', { description: e.message }) }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Manage Recommended Projects</h1>
          <Button onClick={handleSave} disabled={isSaving || leftSearch.trim().length > 0} title={leftSearch.trim().length > 0 ? 'Clear left search to save order' : undefined}>
            {isSaving ? 'Saving…' : 'Save Order'}
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recommended ({recommended.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Input placeholder="Search recommended…" value={leftSearch} onChange={e => setLeftSearch(e.target.value)} className="mb-3" />
              {leftSearch.trim().length > 0 && (
                <div className="text-xs text-muted-foreground mb-2">Reordering is disabled while searching. Clear the search to reorder and save.</div>
              )}
              {leftSearch.trim().length === 0 ? (
                <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd} onDragStart={onDragStart}>
                  <SortableContext items={recommended.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {recommended.map((p, idx) => (
                        <SortableItem key={p.id} id={p.id}>
                          <div className={`flex items-center justify-between p-3 rounded border ${activeId === p.id ? 'bg-accent' : 'bg-background'}`}>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{idx + 1}. {p.title}</div>
                              <div className="text-xs text-muted-foreground truncate">{p.authors}</div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onMouseDown={(e) => e.stopPropagation()}
                              onPointerDown={(e) => e.stopPropagation()}
                              onTouchStart={(e) => e.stopPropagation()}
                              onClick={() => removeFromRecommended(p)}
                              aria-label={`Remove ${p.title}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </SortableItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="space-y-2">
                  {leftFiltered.map((p, idx) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded border">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{(recommended.findIndex(r => r.id === p.id)) + 1}. {p.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{p.authors}</div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onMouseDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onClick={() => removeFromRecommended(p)}
                        aria-label={`Remove ${p.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Add Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <Input placeholder="Search projects…" value={rightSearch} onChange={e => setRightSearch(e.target.value)} className="mb-3" />
              <div className="text-xs text-muted-foreground mb-2">Showing up to 50 recent projects; refine search to find more.</div>
              <div className="space-y-2 max-h-[70vh] overflow-auto pr-1">
                {candidates.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded border">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{p.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{p.authors}</div>
                    </div>
                    <Button size="sm" onClick={() => addToRecommended(p)}>Add</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Confirmation dialog removed intentionally for faster bulk deletion */}
    </>
  )
}
