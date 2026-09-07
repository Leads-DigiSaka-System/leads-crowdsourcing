"use client"

import { useState } from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function TimelineDatePicker({ value, onChange }) {
    const [open, setOpen] = useState(false)
    const [mode, setMode] = useState(value && typeof value === 'string' && value.includes(' to ') ? 'range' : 'single')

    const formatDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })

    // Year bounds
    const currentYear = new Date().getFullYear()
    const fromYear = 2015
    const toYear = currentYear + 3

    // Build year options
    const yearOptions = []
    for (let year = fromYear; year <= toYear; year++) yearOptions.push(year)

    // Month options
    const monthOptions = [
        { value: 0, label: 'January' },
        { value: 1, label: 'February' },
        { value: 2, label: 'March' },
        { value: 3, label: 'April' },
        { value: 4, label: 'May' },
        { value: 5, label: 'June' },
        { value: 6, label: 'July' },
        { value: 7, label: 'August' },
        { value: 8, label: 'September' },
        { value: 9, label: 'October' },
        { value: 10, label: 'November' },
        { value: 11, label: 'December' }
    ]

    // Single selection state
    const parsedSingle = (() => {
        const d = value && !String(value).includes(' to ') ? new Date(value) : null
        return d && !isNaN(d) ? d : undefined
    })()
    const [singleSelected, setSingleSelected] = useState(parsedSingle)

    // Parse incoming range
    const parsedRange = (() => {
        if (value && typeof value === 'string' && value.includes(' to ')) {
            const [fromStr, toStr] = value.split(' to ')
            const from = new Date(fromStr)
            const to = new Date(toStr)
            if (!isNaN(from) && !isNaN(to)) return { from, to }
        }
        return undefined
    })()
    const [range, setRange] = useState(parsedRange)

    // Displayed months for dual calendars
    const [startMonth, setStartMonth] = useState(() => {
        if (parsedRange?.from) return parsedRange.from
        if (parsedSingle) return parsedSingle
        return new Date()
    })
    const [endMonth, setEndMonth] = useState(() => {
        if (parsedRange?.to) return parsedRange.to
        if (parsedRange?.from) {
            const next = new Date(parsedRange.from)
            next.setMonth(next.getMonth() + 1)
            return next
        }
        const next = new Date()
        next.setMonth(next.getMonth() + 1)
        return next
    })

    // Quarter quick-select state (default to currently visible start year)
    const [quarterYear, setQuarterYear] = useState(() => startMonth.getFullYear())

    const getQuarterRange = (year, quarter) => {
        const startMonthIdx = { 1: 0, 2: 3, 3: 6, 4: 9 }[quarter]
        const from = new Date(year, startMonthIdx, 1)
        // Day 0 of next quarter's first month gives the last day of the previous quarter
        const to = new Date(year, startMonthIdx + 3, 0)
        return { from, to }
    }

    const applyQuarter = (quarter) => {
        const q = getQuarterRange(quarterYear, quarter)
        setRange(q)
        setStartMonth(q.from)
        setEndMonth(q.to)
    }

    const handleApply = () => {
        if (mode === 'single' && singleSelected instanceof Date) {
            onChange(formatDate(singleSelected))
            setOpen(false)
        } else if (mode === 'range' && range?.from && range?.to) {
            onChange(`${formatDate(range.from)} to ${formatDate(range.to)}`)
            setOpen(false)
        }
    }

    const handleClear = () => {
        if (mode === 'single') {
            setSingleSelected(undefined)
            onChange("")
        } else {
            setRange(undefined)
            onChange("")
        }
    }

    const handleRangeSelect = (selectedRange) => {
        setRange(selectedRange)
    }

    const handleSingleSelect = (selectedDate) => {
        setSingleSelected(selectedDate)
    }

    // Start month/year controls
    const handleStartMonthChange = (month) => {
        const nextStart = new Date(startMonth)
        nextStart.setMonth(parseInt(month))
        setStartMonth(nextStart)
        if (nextStart > endMonth) setEndMonth(new Date(nextStart))
    }
    const handleStartYearChange = (year) => {
        const nextStart = new Date(startMonth)
        nextStart.setFullYear(parseInt(year))
        setStartMonth(nextStart)
        if (nextStart > endMonth) setEndMonth(new Date(nextStart))
    }

    // End month/year controls with constraints
    const handleEndMonthChange = (month) => {
        const nextEnd = new Date(endMonth)
        nextEnd.setMonth(parseInt(month))
        if (nextEnd < startMonth) {
            nextEnd.setFullYear(startMonth.getFullYear())
            nextEnd.setMonth(startMonth.getMonth())
        }
        setEndMonth(nextEnd)
    }
    const handleEndYearChange = (year) => {
        const nextEnd = new Date(endMonth)
        const yr = parseInt(year)
        nextEnd.setFullYear(yr)
        if (yr < startMonth.getFullYear()) {
            nextEnd.setFullYear(startMonth.getFullYear())
            nextEnd.setMonth(startMonth.getMonth())
        } else if (yr === startMonth.getFullYear() && nextEnd.getMonth() < startMonth.getMonth()) {
            nextEnd.setMonth(startMonth.getMonth())
        }
        setEndMonth(nextEnd)
    }

    const getEndYearOptions = () => yearOptions.filter(y => y >= startMonth.getFullYear())
    const getEndMonthOptions = () => {
        if (endMonth.getFullYear() === startMonth.getFullYear()) {
            return monthOptions.filter(m => m.value >= startMonth.getMonth())
        }
        return monthOptions
    }


    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={"w-full h-10 justify-start text-left font-normal " + (!value ? 'text-muted-foreground' : '')}
                    type="button"
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {value ? value : (mode === 'range' ? 'Pick a date range' : 'Pick a date')}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-auto" align="start">
                <div className="p-3 space-y-3">
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant={mode === 'single' ? 'default' : 'outline'}
                            onClick={() => {
                                setMode('single')
                                if (!singleSelected && range?.from) setSingleSelected(range.from)
                            }}
                        >
                            Single Date
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant={mode === 'range' ? 'default' : 'outline'}
                            onClick={() => {
                                setMode('range')
                                if (!range?.from && singleSelected instanceof Date) {
                                    setRange({ from: singleSelected })
                                }
                            }}
                        >
                            Date Range
                        </Button>
                    </div>

                    {/* Removed previous multi-line status block; will render one-line status below filters */}

                    {mode === 'range' && (
                        <div className="flex items-center justify-between gap-2 text-sm bg-secondary p-2 rounded border">
                            <div className="font-medium">Quick quarters</div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={quarterYear}
                                    onChange={(e) => setQuarterYear(parseInt(e.target.value))}
                                    className="px-2 py-1 bg-white border rounded text-sm"
                                >
                                    {yearOptions.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                                <div className="flex gap-1">
                                    <Button type="button" size="sm" variant="outline" onClick={() => applyQuarter(1)}>Q1</Button>
                                    <Button type="button" size="sm" variant="outline" onClick={() => applyQuarter(2)}>Q2</Button>
                                    <Button type="button" size="sm" variant="outline" onClick={() => applyQuarter(3)}>Q3</Button>
                                    <Button type="button" size="sm" variant="outline" onClick={() => applyQuarter(4)}>Q4</Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {mode === 'range' && (
                        <div className="grid grid-cols-2 gap-4 text-sm bg-muted p-3 rounded">
                            <div>
                                <div className="font-medium mb-2 text-center">Start Calendar</div>
                                <div className="flex gap-2">
                                    <select value={startMonth.getMonth()} onChange={(e) => handleStartMonthChange(e.target.value)} className="flex-1 px-2 py-1 border bg-white rounded text-sm">
                                        {monthOptions.map(m => (<option key={m.value} value={m.value}>{m.label}</option>))}
                                    </select>
                                    <select value={startMonth.getFullYear()} onChange={(e) => handleStartYearChange(e.target.value)} className="px-2 py-1 border rounded bg-white text-sm">
                                        {yearOptions.map(y => (<option key={y} value={y}>{y}</option>))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <div className="font-medium mb-2 text-center">End Calendar</div>
                                <div className="flex gap-2">
                                    <select value={endMonth.getMonth()} onChange={(e) => handleEndMonthChange(e.target.value)} className="flex-1 px-2 py-1 border rounded bg-white text-sm">
                                        {getEndMonthOptions().map(m => (<option key={m.value} value={m.value}>{m.label}</option>))}
                                    </select>
                                    <select value={endMonth.getFullYear()} onChange={(e) => handleEndYearChange(e.target.value)} className="px-2 py-1 border rounded bg-white text-sm">
                                        {getEndYearOptions().map(y => (<option key={y} value={y}>{y}</option>))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {mode === 'range' && (
                        <div className="text-sm bg-blue-50 p-2 rounded border flex items-center gap-3 whitespace-nowrap">
                            <div>
                                Start: {range?.from ? (
                                    <span className="font-medium">{formatDate(range.from)}</span>
                                ) : (
                                    <span className="text-muted-foreground">Click a date in the left calendar</span>
                                )}
                            </div>
                            <span className="opacity-60">•</span>
                            <div>
                                End: {range?.to ? (
                                    <span className="font-medium">{formatDate(range.to)}</span>
                                ) : (
                                    <span className="text-muted-foreground">Click a date in the right calendar</span>
                                )}
                            </div>

                        </div>
                    )}

                    {mode === 'single' ? (
                        <Calendar
                            mode="single"
                            captionLayout="dropdown"
                            startMonth={new Date(fromYear, 0)}
                            endMonth={new Date(toYear, 11)}
                            selected={singleSelected}
                            defaultMonth={singleSelected || new Date()}
                            onSelect={setSingleSelected}
                            autoFocus
                        />
                    ) : (
                        <div className="flex gap-4">
                            <div>
                                <Calendar
                                    mode="range"
                                    numberOfMonths={1}
                                    classNames={{ month_caption: "hidden" }}
                                    startMonth={new Date(fromYear, 0)}
                                    endMonth={new Date(toYear, 11)}
                                    selected={range}
                                    month={startMonth}
                                    onSelect={handleRangeSelect}
                                    showOutsideDays={false}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <Calendar
                                    mode="range"
                                    numberOfMonths={1}
                                    classNames={{ month_caption: "hidden" }}
                                    startMonth={new Date(fromYear, 0)}
                                    endMonth={new Date(toYear, 11)}
                                    selected={range}
                                    month={endMonth}
                                    onSelect={handleRangeSelect}
                                    showOutsideDays={false}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t">
                        <Button variant="ghost" size="sm" onClick={handleClear} className="text-muted-foreground hover:text-foreground">Clear</Button>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Close</Button>
                            <Button size="sm" onClick={handleApply} disabled={(mode === 'single' && !singleSelected) || (mode === 'range' && !(range?.from && range?.to))}>Apply</Button>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
