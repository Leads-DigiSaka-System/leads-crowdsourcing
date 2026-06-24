"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send, User } from "lucide-react";
import Link from "next/link";

export default function CommentForm({
  projectId,
  parentId = null,
  parentComment = null, // Add parent comment data for @mentions
  onCommentSubmit,
  onCancel,
  placeholder = "Add a comment...",
  className = "",
}) {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Auto-add @mention when replying
  const getMentionPrefix = () => {
    if (!parentComment || !parentId) return "";

    const mentionName = parentComment.isAnonymous
      ? "Anonymous"
      : parentComment.user?.name || parentComment.user?.username || "User";

    return `@${mentionName} `;
  };

  // Initialize with @mention for replies
  useEffect(() => {
    if (parentId && parentComment && content === "") {
      const mentionPrefix = getMentionPrefix();
      setContent(mentionPrefix);
    }

    setMounted(true);
  }, [parentId, parentComment]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!session?.user) {
      return;
    }

    if (!content.trim()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          parentId,
          content: content.trim(),
          isAnonymous,
        }),
      });

      if (response.ok) {
        const newComment = await response.json();
        setContent("");
        setIsAnonymous(false);
        onCommentSubmit?.(newComment);
        onCancel?.(); // Close reply form if this is a reply
      } else {
        const error = await response.json();
        console.error("Error submitting comment:", error);
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || !session?.user) {
    return (
      <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
        <div className={`border rounded-lg p-4 bg-muted/30`}>
          <div className="text-center py-4">
            <User className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              You need to be signed in to join the discussion.
            </p>
            <Link href="/login">
              <Button size="sm">Sign In</Button>
            </Link>
          </div>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div className="flex gap-3">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={session.user.image} />
          <AvatarFallback>
            {session.user.name?.charAt(0)?.toUpperCase() ||
              session.user.username?.charAt(0)?.toUpperCase() ||
              "U"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <Textarea
            placeholder={placeholder}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-16 resize-none"
            disabled={isSubmitting}
          />

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`anonymous-${parentId || "main"}`}
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
                disabled={isSubmitting}
              />
              <label
                htmlFor={`anonymous-${parentId || "main"}`}
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Post anonymously
              </label>
            </div>

            <div className="flex gap-2">
              {onCancel && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}
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
                    <Send className="w-4 h-4" />
                    {parentId ? "Reply" : "Comment"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
