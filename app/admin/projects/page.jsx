import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import Navbar from "@/components/Navbar"
import { ProjectsContent } from "@/components/admin/project/projects-content"
import { ProjectsTableSkeleton } from "@/components/admin/project/projects-table-skeleton"

export default async function ProjectsPage({ searchParams }) {
  const session = await auth()

  if (!session || session.user.role !== 'admin') {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <Suspense fallback={<ProjectsTableSkeleton />}>
        <ProjectsContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
