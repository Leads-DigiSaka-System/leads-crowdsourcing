"use client"

import { useState } from "react"
import { Calendar, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import dynamic from "next/dynamic"
import TimelineItem from "./timeline-item"


export default function ProjectTimeline({
  title = "Project Timeline",
  description,
  events = [],
  initialVisibleEvents = 5,
  showMoreText = "Show more events",
  showLessText = "Show less events",
  className = "",
  durationMonths,
}) {
  const RichTextView = dynamic(() => import("@/components/ui/rich-text-view"), { ssr: false })
  const [showAll, setShowAll] = useState(false)
  const visibleEvents = showAll ? events : events.slice(0, initialVisibleEvents)
  const hasMoreEvents = events.length > initialVisibleEvents

  const toggleShowMore = () => {
    setShowAll(!showAll)
  }

  return (
    <div className={`max-w-6xl mx-auto px-4 py-8 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <Calendar className="w-5 h-5 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold">{title}</h2>
        {typeof durationMonths === 'number' && durationMonths > 0 && (
          <Badge variant="secondary" className="ml-1">
            Duration: {durationMonths} {durationMonths === 1 ? 'month' : 'months'}
          </Badge>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Description */}
        <div className="space-y-4">
          {description && (
            typeof description === "string" ? (
              <RichTextView html={description} />
            ) : (
              <div className="prose prose-gray max-w-none">{description}</div>
            )
          )}
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          <div className="space-y-0">
            {visibleEvents.map((event, index) => (
              <TimelineItem
                key={index}
                date={event.date}
                title={event.title}
                isLast={index === visibleEvents.length - 1 && (!hasMoreEvents || showAll)}
              />
            ))}
          </div>

          {/* Show More Button */}
          {hasMoreEvents && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleShowMore}
              className="text-muted-foreground hover:text-foreground bg-transparent"
            >
              {showAll ? showLessText : showMoreText}
              <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showAll ? "rotate-180" : ""}`} />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
