"use client"

export default function TimelineItem({ date, title, isLast = false, className = "" }) {
  return (
    <div className={`relative flex items-start gap-4 ${className}`}>
      {/* Timeline Line and Dot */}
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 bg-primary rounded-full border-2 border-background shadow-sm" />
        {!isLast && <div className="w-0.5 h-12 bg-primary/30 mt-2" />}
      </div>

      {/* Content */}
      <div className="flex-1 pb-8">
        <div className="text-sm font-medium text-primary mb-1">{date}</div>
        <div className="text-sm text-muted-foreground">{title}</div>
      </div>
    </div>
  )
}
