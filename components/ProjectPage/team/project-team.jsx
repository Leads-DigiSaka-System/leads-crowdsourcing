"use client"

import MeetTheTeam from "./meet-the-team"



export default function ProjectTeam({
  teamDescription,
  teamMembers,
  className = ""
}) {
  const descriptionToShow = teamDescription || "No team description provided.";
  const membersToShow = Array.isArray(teamMembers) && teamMembers.length > 0
    ? teamMembers
    : [{ name: "No team members provided.", role: "", bio: "", image: "", imageAlt: "", expertise: [] }];

  return (
    <div className={className}>
      <MeetTheTeam title="Meet the Team" description={descriptionToShow} teamMembers={membersToShow} columns={3} />
    </div>
  )
}
