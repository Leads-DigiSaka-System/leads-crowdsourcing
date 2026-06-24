import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from 'lucide-react'
import Link from "next/link"
import { AddProjectForm } from "@/components/admin/project/add-project-form"
import Navbar from "@/components/Navbar"
import { prisma } from "@/lib/prisma"
import { DraftsDialog } from "@/components/admin/project/drafts-dialog"

export default async function AddProjectPage({ searchParams }) {
  const session = await auth()

  if (!session || session.user.role !== 'admin') {
    redirect('/')
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true }
  })

  const params = await searchParams
  const draftId = params?.draftId || null
  const forceNew = params?.newDraft === '1'

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
          <div className="flex justify-between w-full">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Add New Project</h1>
              <p className="text-muted-foreground mt-1">Create a new research project entry</p>
            </div>


            <DraftsDialog />
          </div>
        </div>
        <AddProjectForm categories={categories} initialDraftId={draftId} forceNewDraft={forceNew} />
      </div>
    </div>
  )
}
