"use client";
// Component to render text with clickable @mentions
export default function CommentText({ content, onMentionClick }) {
    if (!content) return null

    // Split text by @mentions (matches @Username or @Anonymous)
    const parts = content.split(/(@[\w\s]+?)(?=\s|$|[^\w])/g)

    return (
        <span>
            {parts.map((part, index) => {
                // Check if this part is a mention (starts with @)
                if (part.startsWith('@')) {
                    const mentionName = part.slice(1) // Remove @
                    return (
                        <button
                            key={index}
                            onClick={() => onMentionClick?.(mentionName)}
                        // className="text-blue-600 hover:text-blue-800 hover:underline font-medium bg-blue-50 px-1 rounded"
                        >
                            {part}
                        </button>
                    )
                }
                return part
            })}
        </span>
    )
}