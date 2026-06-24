"use client"

import { useMemo, useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Loader2, FileText } from "lucide-react"

export function ProjectCombobox({ projects = [], value, onChange, placeholder = "Select project", loading = false, className }) {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")

    const items = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return projects
        return projects.filter((project) =>
            project.title?.toLowerCase().includes(q) ||
            project.authors?.toLowerCase().includes(q) ||
            project.tags?.some(tag => tag.toLowerCase().includes(q))
        )
    }, [query, projects])

    const selected = projects.find((project) => project.id === value)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className={cn("w-full justify-between", className)}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading projects...
                        </>
                    ) : selected ? (
                        <>
                            <span className="truncate">{selected.title}</span>
                        </>
                    ) : (
                        placeholder
                    )}
                    <span className="ml-2 text-muted-foreground">▾</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-2 w-[400px]" align="start">
                <div className="space-y-2">
                    <Input
                        autoFocus
                        placeholder="Search projects by title, author, or tags..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <div className="max-h-64 overflow-auto rounded-md border">
                        {items.length === 0 ? (
                            <div className="p-3 text-sm text-muted-foreground">
                                {projects.length === 0 ? 'No projects available' : 'No results found'}
                            </div>
                        ) : (
                            <ul className="divide-y">
                                {items.map((project) => (
                                    <li key={project.id}>
                                        <button
                                            type="button"
                                            className={cn(
                                                "w-full text-left p-3 hover:bg-accent hover:text-accent-foreground",
                                                value === project.id && "bg-accent"
                                            )}
                                            onClick={() => {
                                                onChange?.(project.id)
                                                setOpen(false)
                                            }}
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-start gap-2">
                                                    <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-sm truncate">{project.title}</div>
                                                        {project.authors && (
                                                            <div className="text-xs text-muted-foreground truncate">
                                                                By: {project.authors}
                                                            </div>
                                                        )}
                                                        {project.tags && project.tags.length > 0 && (
                                                            <div className="flex gap-1 mt-1 flex-wrap">
                                                                {project.tags.slice(0, 3).map((tag, index) => (
                                                                    <span
                                                                        key={index}
                                                                        className="inline-block px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded"
                                                                    >
                                                                        {tag}
                                                                    </span>
                                                                ))}
                                                                {project.tags.length > 3 && (
                                                                    <span className="text-xs text-muted-foreground">
                                                                        +{project.tags.length - 3} more
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}