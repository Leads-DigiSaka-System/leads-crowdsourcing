"use client"

import { Users } from "lucide-react"
import TeamMemberCard from "./team-member-card"
import dynamic from "next/dynamic"


export default function MeetTheTeam({
  title = "Meet the Team",
  description,
  teamMembers = [],
  columns = 3,
  className = "",
}) {
  const RichTextView = dynamic(() => import("@/components/ui/rich-text-view"), { ssr: false })
  const gridCols = {
    1: "grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-2 lg:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  }

  return (
    <div className={`max-w-6xl mx-auto px-4 py-8 ${className}`}>
      {/* Header */}
      <div className="text-center mb-8 space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Users className="w-5 h-5 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>

        {description && (
          <div className="max-w-3xl mx-auto">
            {typeof description === "string" ? (
              <RichTextView html={description} />
            ) : (
              description
            )}
          </div>
        )}
      </div>

      {/* Team Grid */}
      <div className={`grid gap-6 ${gridCols[columns] || gridCols[3]}`}>
        {teamMembers.map((member, index) => (
          <TeamMemberCard
            key={index}
            name={member.name}
            role={member.role}
            bio={member.bio}
            responsibility={member.responsibility}
            image={member.image}
            imageAlt={member.imageAlt}
            email={member.email}
            linkedin={member.linkedin}
            twitter={member.twitter}
            website={member.website}
            expertise={member.expertise}
          />
        ))}
      </div>
    </div>
  )
}
