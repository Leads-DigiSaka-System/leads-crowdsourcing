"use client"

import { useMemo, useState } from "react";

const COLORS = [
  "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF",
  "#FF9F40", "#FFCD56", "#C9CBCF", "#36A2EB"
];

export default function BudgetBreakdown({ items = [], className = "", showTotals = true, showItems = true, isCompleted = false }) {
  const total = items.reduce((sum, item) => sum + (Number(item.value) || 0), 0)
  const totalAllocatedRaw = items.reduce((sum, item) => {
    const v = Number(item.value) || 0
    const a = Math.min(Number(item.allocated) || 0, v)
    return sum + a
  }, 0)
  const totalAllocated = isCompleted ? total : totalAllocatedRaw

  const RichTextView = require('@/components/ui/rich-text-view').default;
  const { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } = require('@/components/ui/dialog');
  const { ScrollArea } = require('@/components/ui/scroll-area');
  const { Tooltip, TooltipContent, TooltipTrigger } = require('@/components/ui/tooltip');
  const { Button } = require('@/components/ui/button');

  function maskSignature(sig) {
    if (!sig) return '—'
    if (sig.length <= 14) return sig
    return `${sig.slice(0, 6)}…${sig.slice(-6)}`
  }

  function DonorListDialog({ itemName, donations = [] }) {
    const PAGE_SIZE = 10
    const [page, setPage] = useState(1)
    const totalPages = Math.max(1, Math.ceil(donations.length / PAGE_SIZE))
    const start = (page - 1) * PAGE_SIZE
    const current = useMemo(() => donations.slice(start, start + PAGE_SIZE), [donations, start])

    function CopyButton({ value }) {
      const [copied, setCopied] = useState(false)
      return (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value || '')
              setCopied(true)
              setTimeout(() => setCopied(false), 1200)
            } catch { }
          }}
        >
          {copied ? 'Copied' : 'Copy'}
        </Button>
      )
    }

    return (
      <Dialog>
        <DialogTrigger asChild>
          <button className="text-xs text-primary underline hover:no-underline">
            View {donations.length} donation{donations.length > 1 ? 's' : ''}
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Donations for {itemName}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-80">
            <ul className="divide-y">
              {current.map((d) => {
                const sig = d.solanaSignature
                const masked = maskSignature(sig)
                const href = sig ? `https://explorer.solana.com/tx/${sig}?cluster=mainnet-beta` : undefined
                return (
                  <li key={d.id} className="py-3 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate capitalize">{d.userName || 'Anonymous'}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>Signature:</span>
                          {sig ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  {masked}
                                </a>
                              </TooltipTrigger>
                              <TooltipContent sideOffset={6}>{sig}</TooltipContent>
                            </Tooltip>
                          ) : (
                            <span>—</span>
                          )}
                          {sig && <CopyButton value={sig} />}
                        </div>
                      </div>
                      <div className="font-semibold whitespace-nowrap">₱{Number(d.amount || 0).toLocaleString()}</div>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {d.createdAt ? new Date(d.createdAt).toLocaleString() : ''}
                    </div>
                  </li>
                )
              })}
            </ul>
          </ScrollArea>
          {totalPages > 1 && (
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Page {page} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
                <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {showItems && items.map((item, index) => {
        const v = Number(item.value) || 0
        const rawAllocated = Math.min(Number(item.allocated) || 0, v)
        const a = isCompleted ? v : rawAllocated
        const pct = isCompleted ? 100 : (v > 0 ? Math.min(100, Math.round((a / v) * 100)) : 0)
        return (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.name}</div>
                  {item.description && (
                    <RichTextView html={item.description} className="text-xs text-muted-foreground" />
                  )}
                </div>
              </div>
              <div className="font-semibold text-sm">₱{v.toLocaleString()}</div>
            </div>

            {/* Allocated / Total bar */}
            <div className="space-y-1">
              <div className="h-2 w-full bg-muted rounded overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${pct}%` }}
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  role="progressbar"
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>₱{a.toLocaleString()} / ₱{v.toLocaleString()}</span>
                <span>{pct}%</span>
              </div>
              {/* Donors dialog trigger */}
              {Array.isArray(item.donations) && item.donations.length > 0 && (
                <div className="pt-1">
                  <DonorListDialog itemName={item.name} donations={item.donations} />
                </div>
              )}
            </div>
          </div>
        )
      })}

      {showTotals && (total > 0 || totalAllocated > 0) && (
        <div className={`${showItems ? 'pt-3 border-t' : ''} space-y-1`}>
          <div className="flex items-center justify-between font-semibold">
            <span>Funded</span>
            <span>₱{totalAllocated.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between font-bold">
            <span>Total</span>
            <span>₱{total.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  )
}
