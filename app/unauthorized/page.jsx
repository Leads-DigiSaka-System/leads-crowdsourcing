
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function LoginPage({  }) {
  const session = await auth()

  // Redirect if already logged in
  if (session) {
    redirect("/admin")
  }

  if (session.user.role != 'admin'){
    redirect('/')
  }

  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">

    </div>
  )
}
