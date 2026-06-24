"use client"

import ProjectTabs from "./project-tabs"




export default function ProjectContent({
  overview,
  methods,
  labNotes,
  discussion,
  className = ""
}) {
  const tabsData = [
    {
      value: "overview",
      label: "Overview",
      title: "About This Project",
      content: overview || "No data inputted for overview.",
    },
    {
      value: "methods",
      label: "Methods",
      title: "Research Methods",
      content: methods || "No data inputted for methods.",
    },
    {
      value: "lab-notes",
      label: "Lab Notes",
      title: "Laboratory Notes",
      content: labNotes || "No data inputted for lab notes.",
    },
    {
      value: "discussion",
      label: "Discussion",
      title: "Discussion & Results",
      content: discussion || "No data inputted for discussion.",
    },
  ]

  return (
    <div className={`max-w-6xl mx-auto px-4 py-6 ${className}`}>
      <ProjectTabs tabs={tabsData} defaultTab="overview" />
    </div>
  )
}
