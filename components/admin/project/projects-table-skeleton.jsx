import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Search, Filter } from 'lucide-react'

export function ProjectsTableSkeleton() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 space-y-4 sm:space-y-8 py-8 sm:py-16 px-4 sm:px-6">
        <div className="container max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Project Management</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Manage and view all research projects</p>
            </div>
            <Button disabled className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Project
            </Button>
          </div>
          <Card className="mt-4 sm:mt-8">
            <CardHeader className="space-y-1 p-4 sm:p-6">
              <CardTitle className="text-xl sm:text-2xl">All Projects</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                View, search, and manage research projects in the system
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
              <div className="space-y-4 p-4 sm:p-0">
                {/* Search and Filters Skeleton */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Skeleton className="h-10 w-full sm:w-[300px] pl-9" />
                    </div>
                    <div className="flex items-center w-full sm:w-[200px]">
                      <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                      <Skeleton className="h-10 flex-1" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-32" />
                </div>

                {/* Desktop Table Skeleton */}
                <div className="hidden lg:block rounded-md border bg-background">
                  <div className="border-b">
                    <div className="flex items-center h-12 px-4">
                      {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className="flex-1 px-2">
                          <Skeleton className="h-4 w-20" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="divide-y">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center h-16 px-4">
                        <div className="flex-1 px-2">
                          <Skeleton className="h-4 w-40 mb-1" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <div className="flex-1 px-2">
                          <Skeleton className="h-5 w-16" />
                        </div>
                        <div className="flex-1 px-2 text-right">
                          <Skeleton className="h-4 w-20 mb-1 ml-auto" />
                          <Skeleton className="h-3 w-16 ml-auto" />
                        </div>
                        <div className="flex-1 px-2">
                          <Skeleton className="h-5 w-16" />
                        </div>
                        <div className="flex-1 px-2">
                          <Skeleton className="h-4 w-20" />
                        </div>
                        <div className="flex-1 px-2">
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <div className="flex-1 px-2">
                          <div className="flex items-center gap-1">
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-8 w-8" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mobile Cards Skeleton */}
                <div className="lg:hidden space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0">
                            <Skeleton className="h-5 w-48 mb-1" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                          <Skeleton className="h-8 w-8 ml-2" />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Skeleton className="h-5 w-20" />
                            <Skeleton className="h-5 w-16" />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-20" />
                          </div>
                          
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination Skeleton */}
                <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-2 py-4">
                  <Skeleton className="h-4 w-24" />
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-20" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
