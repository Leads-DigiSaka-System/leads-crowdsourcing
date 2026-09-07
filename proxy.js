import NextAuth from "next-auth"
import authConfig from "./auth.config"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { pathname } = req.nextUrl

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    if (!req.auth) {
      const loginUrl = new URL("/login", req.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return Response.redirect(loginUrl)
    }

    // Check if user has admin role
    if (req.auth.user?.role !== "admin") {
      return Response.redirect(new URL("/", req.url))
    }
  }

  // Protect user dashboard routes
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/settings")) {
    if (!req.auth) {
      const loginUrl = new URL("/login", req.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return Response.redirect(loginUrl)
    }

    // Check if user has user role
    // Admin should be redirected to admin dashboard
    if (req.auth.user?.role === "admin") {
      return Response.redirect(new URL("/admin/dashboard", req.url))
    }

    // Allow both 'user' and 'researcher' roles to access dashboard/settings
    if (req.auth.user?.role !== "user" && req.auth.user?.role !== "researcher") {
      return Response.redirect(new URL("/", req.url))
    }
  }
})

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/settings"],
}
