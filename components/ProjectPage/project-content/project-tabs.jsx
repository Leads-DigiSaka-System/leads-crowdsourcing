"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import dynamic from "next/dynamic"

const RichTextView = dynamic(() => import("@/components/ui/rich-text-view"), { ssr: false })

export default function ProjectTabs({ tabs = [], defaultTab, className = "" }) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.value || "")

  if (!tabs.length) return null

  return (
    <div className={`w-full ${className} `}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto p-0 bg-transparent border-b rounded-none">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="relative px-4 py-3 text-base font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent bg-transparent text-muted-foreground hover:text-foreground transition-colors"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent
            key={tab.value}
            value={tab.value}
            className="mt-8 focus-visible:outline-none focus-visible:ring-0"
          >
            <div className="space-y-6">
              {tab.title && <h2 className="text-2xl font-bold">{tab.title}</h2>}
              {tab.content && (
                typeof tab.content === "string" ? (
                  <RichTextView html={tab.content} />
                ) : (
                  <div className="prose prose-gray max-w-none">{tab.content}</div>
                )
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
