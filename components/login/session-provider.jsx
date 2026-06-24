"use client"

import { SessionProvider } from "next-auth/react"

export function AuthProvider({ children }) {
  return (
    <SessionProvider
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
      refetchInterval={0}
    >
      {children}
    </SessionProvider>
  )
}
