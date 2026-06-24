import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import ManageRecommendedClient from "@/components/admin/project/ManageRecommendedClient"

export default async function ManageRecommendedPage() {
  const session = await auth()
  if (!session || session.user.role !== 'admin') {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="container max-w-7xl mx-auto py-10 px-4">
        <ManageRecommendedClient />
      </div>
    </div>
  )
}
