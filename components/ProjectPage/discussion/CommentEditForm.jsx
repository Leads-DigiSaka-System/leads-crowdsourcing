"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Save, X } from 'lucide-react'

export default function CommentEditForm({ comment, onCancel, onSave }) {
  const [content, setContent] = useState(comment.content)
  const [isAnonymous, setIsAnonymous] = useState(comment.isAnonymous)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!content.trim()) {
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: content.trim(),
          isAnonymous
        })
      })

      if (response.ok) {
        onSave()
      } else {
        const error = await response.json()
        console.error('Error updating comment:', error)
        // You could show a toast notification here
      }
    } catch (error) {
      console.error('Error updating comment:', error)
      // You could show a toast notification here
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-16 resize-none"
        disabled={isSubmitting}
        placeholder="Edit your comment..."
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`edit-anonymous-${comment.id}`}
            checked={isAnonymous}
            onCheckedChange={setIsAnonymous}
            disabled={isSubmitting}
          />
          <label
            htmlFor={`edit-anonymous-${comment.id}`}
            className="text-sm text-muted-foreground cursor-pointer"
          >
            Post anonymously
          </label>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <X className="w-4 h-4" />
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || isSubmitting}
            className="min-w-20"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}