"use client";
import ProjectCard from "@/components/ProjectCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getLucideIconByName } from "@/lib/categoryIcons";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ProjectGridSkeleton } from "./ProjectCardSkeleton";

export default function FilterAndPick({
  selectedFilter,
  setSelectedFilter,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  filterOptions,
  onPickProject,
  categories,
  projects,
  pagination,
  isLoading,
  error,
  onPageChange,
}) {
  const [searchInput, setSearchInput] = useState(searchQuery);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, setSearchQuery]);

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId || "all");
  };

  return (
    <Tabs
      value={selectedCategory}
      onValueChange={handleCategoryChange}
      className="w-full"
    >
      <div className="relative mb-8">
        <div className="mb-4">
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle
                className="h-5 w-5 text-primary"
                aria-hidden="true"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="font-semibold cursor-help"
                    title="Examples: flooding problem, parking problem"
                  >
                    Societal relevance and timing
                  </span>
                </TooltipTrigger>
                <TooltipContent sideOffset={6}>
                  Examples: flooding problem, parking problem
                </TooltipContent>
              </Tooltip>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle
                className="h-5 w-5 text-primary"
                aria-hidden="true"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="font-semibold cursor-help"
                    title="Examples: farmer groups, upland community, LGUs"
                  >
                    Pre-identified stakeholders and beneficiaries
                  </span>
                </TooltipTrigger>
                <TooltipContent sideOffset={6}>
                  Examples: farmer groups, upland community, LGUs
                </TooltipContent>
              </Tooltip>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle
                className="h-5 w-5 text-primary"
                aria-hidden="true"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="font-semibold cursor-help"
                    title="Examples: literature scan, pilot results, novel method"
                  >
                    Research backbone and novelty
                  </span>
                </TooltipTrigger>
                <TooltipContent sideOffset={6}>
                  Examples: literature scan, pilot results, novel method
                </TooltipContent>
              </Tooltip>
            </li>
          </ul>
        </div>

        {/* Card container for Filter, Search and Tabs */}
        <div className="relative flex flex-col gap-6 p-6 bg-background/90  rounded-2xl shadow-lg mb-8">
          {/* Filter, Search and Pick Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
              {/* Filter */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Filter by
                  </span>
                </div>
                <Select
                  value={selectedFilter}
                  onValueChange={setSelectedFilter}
                >
                  <SelectTrigger className="w-48 bg-background/50 hover:bg-background border-primary/20 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 bg-background/50 hover:bg-background border-primary/20 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300"
                />
              </div>
            </div>

            {/* Pick Random Project Button */}
            <Button
              onClick={onPickProject}
              disabled={!projects || projects.length === 0}
              className="bg-primary hover:to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 px-8 py-3 font-semibold tracking-wide"
              size="lg"
            >
              <span className="flex items-center gap-2">
                🎲 Pick a project for me!
              </span>
            </Button>
          </div>

          {/* Category Tabs Section */}
          <TabsList className="relative grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 h-auto p-2 bg-background/80 rounded-xl">
            {categories.map((category) => {
              const Icon = getLucideIconByName(category.icon);
              return (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="group flex flex-col items-center gap-2 p-4 h-auto rounded-xl transition-all duration-300 ease-in-out
                  data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 
                  data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25
                  data-[state=active]:scale-105 data-[state=active]:border-primary/20
                  hover:bg-gradient-to-br hover:from-accent/50 hover:to-accent/30 
                  border border-transparent hover:border-accent/20"
                >
                  <span className="flex items-center gap-2 text-xs text-center font-semibold transition-all duration-300">
                    {Icon ? <Icon className="h-4 w-4" /> : null}
                    {category.label}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* Tab Content outside the card */}
        {categories.map((category) => (
          <TabsContent
            key={category.id}
            value={category.id}
            className="mt-8 duration-500"
          >
            <div className="flex flex-col items-center text-center py-8 mb-8">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="w-12 h-0.5 bg-gradient-to-r from-transparent to-primary/50"></div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  {category.label} Projects
                </h2>
                <div className="w-12 h-0.5 bg-gradient-to-l from-transparent to-primary/50"></div>
              </div>
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-muted/50 via-background to-muted/50 rounded-full border border-primary/10 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                <span className="text-sm text-muted-foreground font-medium">
                  Current filter:
                </span>
                <span className="text-sm font-bold text-primary px-2 py-1 bg-primary/10 rounded-full">
                  {filterOptions.find((f) => f.value === selectedFilter)?.label}
                </span>
                {pagination && (
                  <>
                    <span className="text-sm text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">
                      {pagination.totalCount} projects found
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Error State */}
            {error && (
              <Alert variant="destructive" className="mb-8">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Error loading projects: {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Loading State */}
            {isLoading && <ProjectGridSkeleton count={12} />}

            {/* Projects Grid */}
            {!isLoading && !error && projects && projects.length > 0 && (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {projects.map((project, index) => (
                  <div
                    key={project.id}
                    className="slide-in-from-bottom-4 duration-500"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <ProjectCard
                      project={project}
                      teams={project.teamMembers || []}
                      description={project.overview}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && projects && projects.length === 0 && (
              <div className="text-center py-12 duration-500">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                    <span className="text-2xl">🔬</span>
                  </div>
                  <p className="text-muted-foreground text-lg font-medium mb-2">
                    No projects found
                  </p>
                  <p className="text-sm text-muted-foreground/70">
                    {searchQuery
                      ? `No projects match "${searchQuery}" in the ${category.label} category.`
                      : `No projects available in the ${category.label} category yet.`}
                  </p>
                </div>
              </div>
            )}

            {/* Pagination */}
            {!isLoading &&
              !error &&
              pagination &&
              pagination.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 pt-8 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing page {pagination.currentPage} of{" "}
                    {pagination.totalPages}({pagination.totalCount} total
                    projects)
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPreviousPage}
                      className="flex items-center gap-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>

                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: Math.min(5, pagination.totalPages) },
                        (_, i) => {
                          let pageNum;
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (pagination.currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (
                            pagination.currentPage >=
                            pagination.totalPages - 2
                          ) {
                            pageNum = pagination.totalPages - 4 + i;
                          } else {
                            pageNum = pagination.currentPage - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={
                                pageNum === pagination.currentPage
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() => onPageChange(pageNum)}
                              className="w-10 h-10"
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className="flex items-center gap-2"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}
