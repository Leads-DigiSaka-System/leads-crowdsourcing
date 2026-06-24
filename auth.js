import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    // Google OAuth provider
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      // Rely on default scopes (profile email). Use profile callback to shape user object.
      async profile(profile) {
        // Deterministic hashed suffix to avoid O(n) probe loops
        const baseRaw = (profile.email || profile.name || "user").split("@")[0]
        const base = (baseRaw || "user")
          .toLowerCase()
          .replace(/[^a-z0-9_.-]/g, "")
          .slice(0, 24) || "user"

        // Small stable hash -> base36, 5 chars
        const hashBase36 = (str) => {
          let h = 5381
          for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i)
          return (h >>> 0).toString(36).slice(0, 5)
        }
        const hashInput = `${profile.sub || profile.id || ""}|${profile.email || ""}`
        const suffix = hashBase36(hashInput)
        let candidate = `${base}-${suffix}`.slice(0, 30)

        // Single existence check, then one fallback if needed
        const exists = await prisma.user.findUnique({ where: { username: candidate } })
        if (exists) {
          const rand = Math.floor(Math.random() * 36).toString(36) + Math.floor(Math.random() * 36).toString(36)
          candidate = `${base}-${suffix}${rand}`.slice(0, 30)
        }

        return {
          id: profile.sub || profile.id,
          name: profile.name || profile.given_name || null,
          email: profile.email?.toLowerCase(),
          image: profile.picture || null,
          username: candidate,
          role: "user",
        }
      },
    }),
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username or Email", type: "text", placeholder: "yourusername or you@example.com" },
        password: { label: "Password", type: "password" },
        email: { label: "Email", type: "text" },
        token: { label: "Login Token", type: "text" },
      },
      async authorize(credentials) {
        try {
          // Token-based authentication (for post-verification auto-login)
          if (credentials?.email && credentials?.token) {
            const { getLoginTokenByToken, deleteLoginToken } = await import("@/lib/verification")
            const loginToken = await getLoginTokenByToken(credentials.token)
            
            if (!loginToken || loginToken.email !== credentials.email.toLowerCase()) {
              return null
            }

            // Find user by email
            const user = await prisma.user.findUnique({ where: { email: loginToken.email } })
            if (!user) {
              await deleteLoginToken(credentials.token)
              return null
            }

            // Delete the one-time token after use
            await deleteLoginToken(credentials.token)

            // Return user object
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              username: user.username,
              role: user.role,
              image: user.image
            }
          }

          // Password-based authentication (normal login)
          if (!credentials?.username || !credentials?.password) {
            return null
          }

          // Find user in database
          const identifier = credentials.username.trim().toLowerCase()
          let user = null
          // Try email first if it looks like an email
          if (identifier.includes('@')) {
            user = await prisma.user.findUnique({ where: { email: identifier } })
          }
          // Fallback to username lookup
          if (!user) {
            user = await prisma.user.findUnique({ where: { username: identifier } })
          }

          if (!user) {
            return null
          }

          // Verify password
          // If user has no password (OAuth-only user), disallow credentials login
          if (!user.password) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

          if (!isPasswordValid) {
            return null
          }


          if (!user.emailVerified) {

            return null
          }

          // Return user object (password excluded)
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            username: user.username,
            role: user.role,
            image: user.image
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        token.role = user.role
        token.username = user.username

        if (account?.provider === "google") {
          try {
            const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
            if (dbUser && !dbUser.emailVerified) {
              await prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } })
            }
          } catch (e) {
            console.error("Auto-verify Google user failed", e)
          }
        }
      }


      if (trigger === "update" && session) {
        if (typeof session.name === "string") token.name = session.name
        if (typeof session.username === "string") token.username = session.username

        if (typeof session.image === "string") token.picture = session.image
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub
        session.user.role = token.role
        session.user.username = token.username

        if (token.name) session.user.name = token.name
        if (token.picture) session.user.image = token.picture
      }
      return session
    },
  },
  events: {
    // After a new user is created (first OAuth sign-in), ensure unique username
    async createUser({ user }) {
      // Guard: in case provider didn’t set a username, or a race occurred,
      // ensure uniqueness one more time.
      const base = (user.username || user.email?.split("@")[0] || "user")
        .toLowerCase()
        .replace(/[^a-z0-9_.-]/g, "")
        .slice(0, 24) || "user"

      let candidate = base
      let counter = 0
      while (true) {
        const existing = await prisma.user.findUnique({ where: { username: candidate } })
        if (!existing || existing.id === user.id) break
        counter += 1
        const suffix = `-${counter}`
        candidate = (base + suffix).slice(0, 30)
        if (counter > 1000) {
          candidate = `${base}-${Date.now().toString().slice(-6)}`.slice(0, 30)
          break
        }
      }

      if (candidate !== user.username) {
        await prisma.user.update({ where: { id: user.id }, data: { username: candidate } })
      }
    },
  },
  pages: {
    signIn: "/login",
  },
})
