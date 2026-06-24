"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";

export default function AvatarWithSkeleton({
  src,
  fallbackText = "No Picture",
  size = 10,
}) {
  const [loading, setLoading] = useState(!!src);
  const [error, setError] = useState(!src);
  return (
    <Avatar>
      {/* Skeleton loader */}
      {loading && !error && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span
            className={`w-${size} h-${size} rounded-full bg-muted animate-pulse block`}
          />
        </span>
      )}
      {src && !error && (
        <AvatarImage
          src={src}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
          style={{ display: loading || error ? "none" : "block" }}
        />
      )}
      {/* Show fallback when no src or error */}
      {(!src || error) && <AvatarFallback>{fallbackText}</AvatarFallback>}
    </Avatar>
  );
}
