"use client"

import { useMemo, useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { currencies } from "@/components/ui/currency-list"

export function CurrencyCombobox({ value, onChange, placeholder = "Select currency", className }) {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")

    const items = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return currencies
        return currencies.filter((c) =>
            c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
        )
    }, [query])

    const selected = currencies.find((c) => c.code === value)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button type="button" variant="outline" className={cn("w-full justify-between", className)}>
                    {selected ? `${selected.code} — ${selected.name}` : placeholder}
                    <span className="ml-2 text-muted-foreground">▾</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-2 w-[320px]" align="start">
                <div className="space-y-2">
                    <Input
                        autoFocus
                        placeholder="Search currency (code or name)"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <div className="max-h-64 overflow-auto rounded-md border">
                        {items.length === 0 ? (
                            <div className="p-3 text-sm text-muted-foreground">No results</div>
                        ) : (
                            <ul className="divide-y">
                                {items.map((c) => (
                                    <li key={c.code}>
                                        <button
                                            type="button"
                                            className={cn(
                                                "w-full text-left p-2 hover:bg-accent hover:text-accent-foreground",
                                                value === c.code && "bg-accent"
                                            )}
                                            onClick={() => {
                                                onChange?.(c.code)
                                                setOpen(false)
                                            }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-xs font-bold">{c.code} — {c.name}</div>
                                                    <div className="text-xs text-muted-foreground">Symbol: {c.symbol}</div>
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
