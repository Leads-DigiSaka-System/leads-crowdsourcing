"use client"

import ProjectTimeline from "./project-timeline"

// Parse varied date strings like "Apr 01, 2025" safely; invalid -> Infinity so they sort last
export const parseEventDate = (s) => {
  if (!s || typeof s !== 'string') return Number.POSITIVE_INFINITY
  // Handle relative months: "Month 1" or "Months 2–5" (dash variants) -> sort by start month as number
  const rel = s.trim().toLowerCase()
  // Normalize dash variants
  const normalized = rel.replace(/\u2013|\u2014/g, '-') // en/em dash -> hyphen
  // Match "month 5" or "months 2-5"
  const singleMonthMatch = normalized.match(/^month\s*(\d+)$/i) || normalized.match(/^months\s*(\d+)$/i)
  if (singleMonthMatch) {
    const m = parseInt(singleMonthMatch[1], 10)
    if (!isNaN(m)) return m // smaller numbers first
  }
  const rangeMatch = normalized.match(/^months?\s*(\d+)\s*[-to]+\s*(\d+)$/i)
  if (rangeMatch) {
    const startM = parseInt(rangeMatch[1], 10)
    if (!isNaN(startM)) return startM
  }
  // If it's a range like "Aug 01, 2023 to Sep 06, 2023", take the start part
  const startStr = s.split(/\s+(to|–|—|-)\s+/i)[0]?.trim() || s
  const d1 = new Date(startStr)
  if (!isNaN(d1)) return d1.getTime()
  // Fallbacks
  const months = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11,
  }
  // Pattern: MMM DD, YYYY or Month DD, YYYY
  const m1 = startStr.match(/^(\w{3,})\s+(\d{1,2}),\s*(\d{4})$/)
  if (m1) {
    const mon = months[m1[1].toLowerCase()]
    const day = parseInt(m1[2], 10)
    const year = parseInt(m1[3], 10)
    if (mon != null) return new Date(year, mon, day).getTime()
  }
  // Pattern: MMM YYYY or Month YYYY (assume day 1)
  const m2 = startStr.match(/^(\w{3,})\s*(\d{4})$/)
  if (m2) {
    const mon = months[m2[1].toLowerCase()]
    const year = parseInt(m2[2], 10)
    if (mon != null) return new Date(year, mon, 1).getTime()
  }
  return Number.POSITIVE_INFINITY
}


export default function ProjectTimelineContent({
  timelineDescription,
  timelineEvents,
  timelineDurationMonths,
  className = ""
}) {


  const descriptionToShow = timelineDescription || "No timeline description provided.";
  const eventsToShow = Array.isArray(timelineEvents) && timelineEvents.length > 0
    ? [...timelineEvents].sort((a, b) => parseEventDate(a?.date) - parseEventDate(b?.date))
    : [{ date: "", title: "No timeline events provided." }];

  return (
    <div className={className}>
      <ProjectTimeline
        title="Project Timeline"
        description={descriptionToShow}
        events={eventsToShow}
        initialVisibleEvents={5}
        durationMonths={timelineDurationMonths}
      />
    </div>
  )
}
