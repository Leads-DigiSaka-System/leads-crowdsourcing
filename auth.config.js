import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"

export default {
  providers: [
    Google,
    Credentials
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role
        token.username = user.username
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
}
