"use client"

import { Button } from "@/components/ui/button"
import dynamic from "next/dynamic"
import { MessageCircle, ChevronRight } from "lucide-react"

export default function AskScientists({
  title = "Ask the Scientists",
  discussionLink,
  onJoinDiscussion,
  questions = [],
  className = "",
}) {
  const RichTextView = dynamic(() => import("@/components/ui/rich-text-view"), { ssr: false })
  const handleJoinDiscussion = () => {
    if (onJoinDiscussion) {
      onJoinDiscussion()
    } else if (discussionLink) {
      window.open(discussionLink, "_blank")
    }
  }

  return (
    <div className={`max-w-6xl mx-auto px-4 py-8 ${className}`}>
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>

        {(discussionLink || onJoinDiscussion) && (
          <Button
            variant="link"
            className="text-primary hover:text-primary/80 p-0 h-auto font-medium"
            onClick={handleJoinDiscussion}
          >
            JOIN THE DISCUSSION
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Q&A Content */}
      <div className="space-y-8">
        {questions.map((question, index) => (
          <div key={index} className="space-y-4">
            <h3 className="text-xl font-bold text-foreground">{question.question}</h3>
            {typeof question.answer === "string" ? (
              <RichTextView html={question.answer} />
            ) : (
              <div className="prose prose-gray max-w-none text-muted-foreground leading-relaxed">{question.answer}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
