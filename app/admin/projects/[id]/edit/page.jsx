import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from 'lucide-react'
import Link from "next/link"

import Navbar from "@/components/Navbar"
// Use API fetch instead of direct Prisma access
import { notFound } from "next/navigation"
import { EditProjectForm } from "@/components/admin/project/edit-project-form"

export default async function EditProjectPage({ params }) {
  const session = await auth()
  const { id } = await params;

  if (!session || session.user.role !== 'admin') {
    redirect('/')
  }

  // Fetch the project data via API
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const projectRes = await fetch(`${baseUrl}/api/projects/${id}`, { cache: 'no-store' })
  const project = projectRes.ok ? await projectRes.json() : null

  if (!project) {
    notFound()
  }

  // Fetch categories for the category select via API
  const categoriesRes = await fetch(`${baseUrl}/api/categories`, { cache: 'no-store' })
  const categoriesJson = categoriesRes.ok ? await categoriesRes.json() : []
  const categories = Array.isArray(categoriesJson)
    ? categoriesJson.map(c => ({ id: c.id, name: c.name }))
    : []

  return (
    <div className="bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <Button variant="outline" size="sm" asChild className="w-fit">
            <Link href="/admin/projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight">Edit Project</h1>
            <p className="text-muted-foreground mt-1">Update project information</p>
          </div>
        </div>
        <EditProjectForm project={project} categories={categories} />
      </div>
    </div>
  )
}
