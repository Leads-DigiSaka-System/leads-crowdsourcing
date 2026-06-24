import { ProjectsDataTable } from "@/components/admin/project/projects-data-table";
import { StatCard } from "@/components/ui/stat-card";
import { FolderOpen, Tag, EyeOff, Eye, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { History, RotateCcw, Archive, ListChecks } from 'lucide-react';
import Link from "next/link";
import { ManageCategoriesDialog } from "@/components/admin/project/manage-categories-dialog";
import FeaturedHeroPreview from "./FeaturedHeroPreview";

export async function ProjectsContent({ searchParams }) {
  const params = await searchParams;
  const archivedView = params?.archived === 'true';

  const projectsRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/projects?archived=${archivedView}`);
  const projects = await projectsRes.json();

  const categoriesRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/categories`);
  const categories = await categoriesRes.json();

  // Stats calculations
  const totalProjects = projects.length;
  const totalCategories = categories.length;
  const totalHidedProjects = projects.filter(p => p.show === false).length;
  const totalNotHidedProjects = projects.filter(p => p.show).length;

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 space-y-4 sm:space-y-8 py-8 sm:py-16 px-4 sm:px-6">
        <div className="container max-w-7xl mx-auto">
          <div className={`flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-2 ${archivedView ? 'border border-red-400/40 bg-red-50 rounded-md p-4 sm:p-6' : ''}`}>
            <div>
              <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${archivedView ? 'text-red-700' : ''}`}>Project Management {archivedView && '— Archive'}</h1>
              <p className={`text-sm sm:text-base ${archivedView ? 'text-red-700/80' : 'text-muted-foreground'}`}>{archivedView ? 'Archive mode: you can restore or permanently delete projects. Editing & creation disabled.' : 'Manage and view all active research projects.'}</p>
              {archivedView && (
                <div className="mt-2 inline-flex items-center gap-2 text-xs font-medium px-2 py-1 rounded bg-red-100 text-amber-800 border border-red-300/60">
                  <Archive className="h-3.5 w-3.5" /> Archive Mode Active
                </div>
              )}
            </div>
            <div className="w-full sm:w-auto">
              {!archivedView ? (
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 w-full">


                  <div className="w-full">
                    <ManageCategoriesDialog triggerClassName="w-full cursor-pointer" />
                  </div>

                  <Button
                    variant="outline"
                    asChild
                    className="w-full "
                    title="Curate the Recommended list and order"
                  >
                    <Link href="/admin/projects/recommended">
                      <ListChecks className="mr-2 h-4 w-4" /> Manage Recommended
                    </Link>
                  </Button>

                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/admin/projects${archivedView ? '' : '?archived=true'}`}>
                      <History className="mr-2 h-4 w-4" /> Archive
                    </Link>
                  </Button>
                </div>
              ) : (
                <Button variant="outline" asChild>
                  <Link href={`/admin/projects${archivedView ? '' : '?archived=true'}`}>
                    <RotateCcw className="mr-2 h-4 w-4" /> Back to Active
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {!archivedView && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
              <StatCard
                icon={FolderOpen}
                title="Total Projects"
                value={totalProjects}
                description="All projects in this view"
              />
              <StatCard
                icon={Tag}
                title="Total Categories"
                value={totalCategories}
                description="Project categories"
              />
              <StatCard
                icon={EyeOff}
                title="Total Hidden Projects"
                value={totalHidedProjects}
                description="Projects marked as hidden"
              />
              <StatCard
                icon={Eye}
                title="Total Visible Projects"
                value={totalNotHidedProjects}
                description="Projects not hidden"
              />
            </div>
          )}


          <Card className="mt-4 sm:mt-8">
            <CardHeader className="space-y-1 p-4 sm:p-6">
              <CardTitle className="text-xl sm:text-2xl">{archivedView ? 'Archived Projects' : 'All Projects'}</CardTitle>
              <div className="flex justify-between items-center">
                <CardDescription className="text-sm sm:text-base">
                  {archivedView ? 'These projects are archived. You can restore or permanently delete them.' : 'View, search, and manage active research projects in the system.'}
                </CardDescription>
                <Button asChild>
                  <Link href="/admin/projects/add-project">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Project
                  </Link>
                </Button>
              </div>


            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
              <ProjectsDataTable key={archivedView ? 'archived' : 'active'} data={projects} categories={categories} archivedView={archivedView} />
            </CardContent>
          </Card>
          {/* Featured preview section (client component, uses API) */}
          {!archivedView && <FeaturedHeroPreview />}
        </div>
      </div>
    </div>
  )
}
