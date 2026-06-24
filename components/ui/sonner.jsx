"use client"

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

const Toaster = ({
  ...props
}) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          // Success (green) styling
          "--success-bg": "oklch(0.95 0.05 150)",
          "--success-border": "oklch(0.85 0.07 150)",
          "--success-text": "oklch(0.32 0.04 150)",
          // Error and warning can remain default; override as needed later
        }
      }
      {...props} />
  );
}

export { Toaster }
