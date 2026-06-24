"use client";
import { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { shortSig } from "@/lib/utils";

// Reusable signature badge with copy-to-clipboard
export function SignatureBadge({ signature }) {
    if (!signature) return <span className="text-muted-foreground">—</span>

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(signature)
            toast.success("Solana signature copied!")
        } catch (err) {
            try {
                const textarea = document.createElement("textarea")
                textarea.value = signature
                document.body.appendChild(textarea)
                textarea.select()
                document.execCommand("copy")
                document.body.removeChild(textarea)
                toast.success("Solana signature copied!")
            } catch (e) {
                toast.error("Failed to copy signature")
            }
        }
    }

    return (
        <div className="flex items-center gap-2">
            <Badge title={signature} className="font-mono">
                {shortSig(signature)}
            </Badge>
            <button
                type="button"
                aria-label="Copy Solana Signature"
                className="p-1 rounded hover:bg-muted transition"
                onClick={handleCopy}
            >
                <Copy className="w-4 h-4 text-muted-foreground" />
            </button>
        </div>
    )
}

/**
 * DonationsTable
 * Generic table with server-side (controlled) pagination.
 * Props:
 * - data: array of donation-like items (current page slice)
 * - columns: [{ id, header, cell?: (row) => ReactNode, accessor?: (row) => any, className? }]
 * - rowKey: (row) => string | number
 * - emptyMessage?: string
 * - page: current page number (1-based)
 * - pageCount: total number of pages
 * - onPageChange: (nextPage:number) => void
 */
export default function DonationsTable({
    data,
    columns,
    rowKey,
    emptyMessage = "No donations to display",
    page = 1,
    pageCount = 1,
    onPageChange,
}) {
    const pageData = useMemo(() => (Array.isArray(data) ? data : []), [data])

    if (!data || data.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">{emptyMessage}</div>
        )
    }

    return (
        <div className="w-full">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((col) => (
                                <TableHead key={col.id} className={col.headerClassName}>{col.header}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pageData.map((row) => (
                            <TableRow key={rowKey(row)}>
                                {columns.map((col) => (
                                    <TableCell key={col.id} className={col.className}>
                                        {col.cell
                                            ? col.cell(row)
                                            : typeof col.accessor === "function"
                                                ? col.accessor(row)
                                                : row[col.id]}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination controls */}
            <div className="flex items-center justify-end gap-3 mt-4">
                <span className="text-sm text-muted-foreground">
                    Page {page} of {Math.max(1, pageCount)}
                </span>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange && onPageChange(Math.max(1, page - 1))}
                        disabled={page <= 1}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange && onPageChange(Math.min(Math.max(1, pageCount), page + 1))}
                        disabled={page >= Math.max(1, pageCount)}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    )
}
