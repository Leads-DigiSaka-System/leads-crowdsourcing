"use client"

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Heart,
  Reply,
  MoreHorizontal,
  Edit2,
  Trash2,
  Crown
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import CommentForm from './CommentForm'
import CommentEditForm from './CommentEditForm'
import CommentText from './CommentText'

export default function CommentThread({
  comment,
  projectId,
  userStatus,
  onCommentUpdate,
  onUpvoteToggle,
  level = 0
}) {
  const { data: session } = useSession()
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isUpvoting, setIsUpvoting] = useState(false)

  const isOwner = session?.user?.id === comment.userId
  const isAdmin = session?.user?.role === 'admin'
  const isBacker = userStatus.backerUserIds.includes(comment.userId)
  const isUpvoted = userStatus.upvotedComments.includes(comment.id)

  // Calculate indentation for nested replies (max 2 levels like YouTube)
  const maxLevel = 1 // Only 2 levels: 0 (main) and 1 (replies)
  const currentLevel = Math.min(level, maxLevel)
  const marginLeft = currentLevel * 32 // 32px per level for better spacing

  const handleUpvote = async () => {
    if (!session?.user || isUpvoting) return

    try {
      setIsUpvoting(true)

      const response = await fetch(`/api/comments/${comment.id}/upvote`, {
        method: 'POST'
      })

      if (response.ok) {
        onUpvoteToggle(comment.id)
      }
    } catch (error) {
      console.error('Error toggling upvote:', error)
    } finally {
      setIsUpvoting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return
    }

    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        onCommentUpdate()
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const handleReplySubmit = () => {
    setShowReplyForm(false)
    onCommentUpdate()
  }

  const handleEditComplete = () => {
    setIsEditing(false)
    onCommentUpdate()
  }

  const handleMentionClick = (mentionName) => {



  }

  const displayName = comment.isAnonymous ? 'Anonymous' : (comment.user?.name || comment.user?.username || 'User')
  const avatarSrc = comment.isAnonymous ? null : comment.user?.image

  return (
    <div className="group" style={{ marginLeft: `${marginLeft}px` }}>
      <div className="flex gap-3">
        {/* Avatar */}
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={avatarSrc} />
          <AvatarFallback>
            {comment.isAnonymous ? 'A' : (displayName.charAt(0)?.toUpperCase() || 'U')}
          </AvatarFallback>
        </Avatar>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          {/* Comment Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{displayName}</span>

            {/* Badges */}
            {isBacker && !comment.isAnonymous && (
              <Badge variant="secondary" className="text-xs">
                <Crown className="w-3 h-3" />
                Backer
              </Badge>
            )}

            {comment.isEdited && (
              <span className="text-xs text-muted-foreground">(edited)</span>
            )}

            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>

            {/* More Options Menu */}
            {(isOwner || isAdmin) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isOwner && (
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isAdmin && !isOwner ? 'Hide' : 'Delete'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Comment Body */}
          {isEditing ? (
            <CommentEditForm
              comment={comment}
              onCancel={() => setIsEditing(false)}
              onSave={handleEditComplete}
            />
          ) : (
            <div className="text-sm text-foreground mb-2 whitespace-pre-wrap break-words">
              <CommentText
                content={comment.content}
                onMentionClick={handleMentionClick}
              />
            </div>
          )}

          {/* Comment Actions */}
          {!isEditing && (
            <div className="flex items-center gap-4 mt-2">
              {/* Upvote Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUpvote}
                disabled={!session?.user || isUpvoting}
                className={`h-6 px-2 text-xs hover:bg-red-50 hover:text-red-600 ${isUpvoted ? 'text-red-600 bg-red-50' : 'text-muted-foreground'
                  }`}
              >
                <Heart className={`w-4 h-4 ${isUpvoted ? 'fill-current' : ''}`} />
                {comment.upvotes > 0 && <span className="ml-1">{comment.upvotes}</span>}
              </Button>

              {/* Reply Button */}
              {session?.user && level < maxLevel && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Reply className="w-4 h-4" />
                  Reply
                </Button>
              )}
            </div>
          )}

          {/* Reply Form */}
          {showReplyForm && (
            <div className="mt-4">
              <CommentForm
                projectId={projectId}
                parentId={comment.id}
                parentComment={comment}
                onCommentSubmit={handleReplySubmit}
                onCancel={() => setShowReplyForm(false)}
                placeholder="Write a reply..."
              />
            </div>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              projectId={projectId}
              userStatus={userStatus}
              onCommentUpdate={onCommentUpdate}
              onUpvoteToggle={onUpvoteToggle}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}