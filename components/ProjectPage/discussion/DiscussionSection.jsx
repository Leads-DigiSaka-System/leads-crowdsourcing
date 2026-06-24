"use client"

import { useState, useEffect, useRef } from 'react'
import { MessageSquare, Users } from 'lucide-react'
import CommentForm from './CommentForm'
import CommentThread from './CommentThread'

function DiscussionSection({ projectId, className = "" }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [userStatus, setUserStatus] = useState({
    upvotedComments: [],
    isBacker: false,
    backerUserIds: []
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalComments: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  const discussionRef = useRef(null)

  const fetchComments = async (page = 1) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/comments?projectId=${projectId}&page=${page}&limit=${pagination.limit}`)

      if (response.ok) {
        const data = await response.json()
        setComments(data.comments)
        setPagination(data.pagination)

        // Fetch user status for these comments
        await fetchUserStatus(data.comments)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserStatus = async (commentsData) => {
    try {
      // Collect all comment IDs (main comments + their replies, max 2 levels)
      const collectCommentIds = (comments) => {
        let ids = []
        comments.forEach(comment => {
          ids.push(comment.id)
          if (comment.replies && comment.replies.length > 0) {
            comment.replies.forEach(reply => {
              ids.push(reply.id)
            })
          }
        })
        return ids
      }

      const commentIds = collectCommentIds(commentsData)

      if (commentIds.length > 0) {
        const response = await fetch(`/api/comments/user-status?projectId=${projectId}&commentIds=${commentIds.join(',')}`)

        if (response.ok) {
          const data = await response.json()
          setUserStatus(data)
        }
      }
    } catch (error) {
      console.error('Error fetching user status:', error)
    }
  }

  useEffect(() => {
    if (projectId) {
      fetchComments()
    }
  }, [projectId])

  const handleNewComment = async (commentData) => {
    // Refresh comments after new comment is posted
    await fetchComments(pagination.page)
  }

  const handleCommentUpdate = async () => {
    // Refresh comments after update/delete
    await fetchComments(pagination.page)
  }

  const handleUpvoteToggle = async (commentId) => {
    // Update local state optimistically
    const updatedComments = updateCommentUpvoteInTree(comments, commentId)
    setComments(updatedComments)

    // Update user status
    const updatedUpvotes = userStatus.upvotedComments.includes(commentId)
      ? userStatus.upvotedComments.filter(id => id !== commentId)
      : [...userStatus.upvotedComments, commentId]

    setUserStatus(prev => ({
      ...prev,
      upvotedComments: updatedUpvotes
    }))
  }

  const updateCommentUpvoteInTree = (commentsTree, targetId) => {
    return commentsTree.map(comment => {
      if (comment.id === targetId) {
        const currentlyUpvoted = userStatus.upvotedComments.includes(targetId)
        return {
          ...comment,
          upvotes: currentlyUpvoted ? comment.upvotes - 1 : comment.upvotes + 1
        }
      }

      // Check replies (only one level deep in YouTube-style)
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: comment.replies.map(reply => {
            if (reply.id === targetId) {
              const currentlyUpvoted = userStatus.upvotedComments.includes(targetId)
              return {
                ...reply,
                upvotes: currentlyUpvoted ? reply.upvotes - 1 : reply.upvotes + 1
              }
            }
            return reply
          })
        }
      }

      return comment
    })
  }

  const handlePageChange = (newPage) => {
    fetchComments(newPage)
  }

  // Expose scroll method for parent components
  const scrollToDiscussion = () => {
    discussionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }

  // Expose scroll method via ref
  useEffect(() => {
    if (discussionRef.current) {
      discussionRef.current.scrollToDiscussion = scrollToDiscussion
    }
  }, [])

  return (
    <div ref={discussionRef} id="discussion-section" className={`max-w-6xl mx-auto px-4 py-8 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Discussion</h2>
          <p className="text-muted-foreground text-sm flex items-center gap-1">
            <Users className="w-4 h-4" />
            {pagination.totalComments} {pagination.totalComments === 1 ? 'comment' : 'comments'}
          </p>
        </div>
      </div>

      {/* Comment Form */}
      <div className="mb-8">
        <CommentForm
          projectId={projectId}
          onCommentSubmit={handleNewComment}
          placeholder="Join the discussion..."
        />
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : comments.length > 0 ? (
          <>
            {comments.map((comment) => (
              <CommentThread
                key={comment.id}
                comment={comment}
                projectId={projectId}
                userStatus={userStatus}
                onCommentUpdate={handleCommentUpdate}
                onUpvoteToggle={handleUpvoteToggle}
                level={0}
              />
            ))}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8 pt-6 border-t">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-4 py-2 text-sm border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="px-4 py-2 text-sm border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Be the first to join the discussion!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DiscussionSection