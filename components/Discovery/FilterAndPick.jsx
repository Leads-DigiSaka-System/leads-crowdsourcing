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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getLucideIconByName } from "@/lib/categoryIcons";
import {
  AlertCircle,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  RotateCcw,
  Search,
  Shuffle,
  X,
} from "lucide-react";
import { useId, useRef } from "react";
import { ProjectGridSkeleton } from "./ProjectCardSkeleton";

const projectBenefits = [
  {
    label: "Societal relevance and timing",
    example: "Examples: flooding problem, parking problem",
  },
  {
    label: "Pre-identified stakeholders and beneficiaries",
    example: "Examples: farmer groups, upland community, LGUs",
  },
  {
    label: "Research backbone and novelty",
    example: "Examples: literature scan, pilot results, novel method",
  },
];

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
  onResetFilters,
  onRetry,
}) {
  const controlId = useId();
  const searchInputRef = useRef(null);
  const activeCategory = categories.find((c) => c.id === selectedCategory);
  const categoryLabel = activeCategory?.label || "All projects";
  const hasActiveFilters =
    selectedCategory !== "all" || selectedFilter !== "all" || Boolean(searchQuery);
  const totalCount = pagination?.totalCount ?? projects?.length ?? 0;
  const viewLabel = filterOptions.find((f) => f.value === selectedFilter)?.label;
  const resultsHeading =
    selectedCategory === "all" ? "All projects" : `${categoryLabel} projects`;

  const clearSearch = () => {
    setSearchQuery("");
    searchInputRef.current?.focus();
  };

  return (
    <div className="w-full min-w-0">
      <ul className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        {projectBenefits.map((benefit) => (
          <li key={benefit.label} className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  tabIndex={0}
                  className="cursor-help rounded-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  title={benefit.example}
                >
                  {benefit.label}
                </span>
              </TooltipTrigger>
              <TooltipContent sideOffset={6}>{benefit.example}</TooltipContent>
            </Tooltip>
          </li>
        ))}
      </ul>

      <section
        aria-labelledby={`${controlId}-filters-heading`}
        className="mb-7 rounded-2xl border bg-background p-4 shadow-sm sm:p-6"
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <div>
            <h2 id={`${controlId}-filters-heading`} className="text-lg font-semibold">
              Find a project
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Search or choose a category to explore projects.
            </p>
          </div>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              onClick={onResetFilters}
              className="min-h-11 px-3 text-primary"
            >
              <RotateCcw aria-hidden="true" />
              Reset filters
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px]">
          <div className="min-w-0">
            <label htmlFor={`${controlId}-search`} className="mb-2 block text-sm font-medium">
              Search projects
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                ref={searchInputRef}
                id={`${controlId}-search`}
                placeholder="Search by title or keyword"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-12 bg-background pl-10 pr-12"
                aria-controls={`${controlId}-results`}
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={clearSearch}
                  aria-label="Clear search"
                  className="absolute right-0.5 top-1/2 h-11 w-11 -translate-y-1/2 text-muted-foreground"
                >
                  <X aria-hidden="true" />
                </Button>
              )}
            </div>
          </div>
          <div>
            <label htmlFor={`${controlId}-view`} className="mb-2 block text-sm font-medium">
              Show projects
            </label>
            <Select value={selectedFilter} onValueChange={setSelectedFilter}>
              <SelectTrigger
                id={`${controlId}-view`}
                className="w-full bg-background data-[size=default]:h-12"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="min-h-11">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <fieldset className="mt-5 min-w-0 border-0 p-0">
          <legend className="mb-3 text-sm font-medium">Filter by category</legend>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const isSelected = selectedCategory === category.id;
              const Icon = getLucideIconByName(category.icon) || LayoutGrid;
              return (
                <Button
                  key={category.id}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  aria-pressed={isSelected}
                  aria-controls={`${controlId}-results`}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`min-h-11 rounded-full px-4 font-medium focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    isSelected
                      ? "border border-primary shadow-sm"
                      : "text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                  }`}
                >
                  {isSelected ? <Check aria-hidden="true" /> : <Icon aria-hidden="true" />}
                  {category.label}
                </Button>
              );
            })}
          </div>
        </fieldset>
      </section>

      <section id={`${controlId}-results`} aria-labelledby={`${controlId}-results-heading`}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id={`${controlId}-results-heading`} className="text-xl font-semibold sm:text-2xl">
              {resultsHeading}
            </h2>
            <p role="status" aria-live="polite" aria-atomic="true" className="mt-1 text-sm text-muted-foreground">
              {isLoading
                ? "Updating projects…"
                : error
                  ? "Projects could not be loaded."
                  : `${totalCount} ${totalCount === 1 ? "project" : "projects"} found${viewLabel ? ` · ${viewLabel}` : ""}`}
            </p>
          </div>
          <Button type="button" variant="outline" onClick={onPickProject} className="min-h-11">
            <Shuffle aria-hidden="true" />
            Pick a project for me
          </Button>
        </div>

        <div aria-busy={isLoading}>
          {error && !isLoading && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p>Error loading projects: {error}</p>
                {onRetry && (
                  <Button type="button" variant="outline" onClick={onRetry} className="mt-3 min-h-11">
                    Try again
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          {isLoading && <ProjectGridSkeleton count={12} />}

          {!isLoading && !error && projects?.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

          {!isLoading && !error && !projects?.length && (
            <div className="rounded-2xl border border-dashed bg-muted/20 px-5 py-12 text-center">
              <Search className="mx-auto mb-4 h-8 w-8 text-muted-foreground" aria-hidden="true" />
              <h3 className="mb-2 text-lg font-semibold">No projects found</h3>
              <p className="mx-auto max-w-md break-words text-sm text-muted-foreground">
                {searchQuery
                  ? `No projects match “${searchQuery}”${selectedCategory === "all" ? "" : ` in ${categoryLabel}`}. Try another keyword or reset your filters.`
                  : hasActiveFilters
                    ? "There are no projects for these filters. Try another category or reset your filters to see all projects."
                    : "There are no projects to explore yet. Please check back soon."}
              </p>
              {hasActiveFilters && (
                <Button type="button" onClick={onResetFilters} className="mt-5 min-h-11">
                  <RotateCcw aria-hidden="true" />
                  Show all projects
                </Button>
              )}
            </div>
          )}

          {!isLoading && !error && pagination && pagination.totalPages > 1 && (
            <nav
              aria-label="Project pages"
              className="mt-8 flex flex-col items-center justify-between gap-4 border-t pt-6 lg:flex-row"
            >
              <p className="text-sm text-muted-foreground">
                Page {pagination.currentPage} of {pagination.totalPages} · {pagination.totalCount} projects
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onPageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPreviousPage}
                  className="min-h-11"
                >
                  <ChevronLeft aria-hidden="true" />
                  Previous
                </Button>
                <div className="hidden items-center gap-1 sm:flex">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, index) => {
                    const firstPage = Math.max(
                      1,
                      Math.min(pagination.currentPage - 2, pagination.totalPages - 4)
                    );
                    const pageNumber = firstPage + index;
                    const isCurrentPage = pageNumber === pagination.currentPage;

                    return (
                      <Button
                        key={pageNumber}
                        type="button"
                        variant={isCurrentPage ? "default" : "outline"}
                        onClick={() => onPageChange(pageNumber)}
                        aria-label={`Page ${pageNumber}`}
                        aria-current={isCurrentPage ? "page" : undefined}
                        className="h-11 min-w-11 px-3"
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onPageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="min-h-11"
                >
                  Next
                  <ChevronRight aria-hidden="true" />
                </Button>
              </div>
            </nav>
          )}
        </div>
      </section>
    </div>
  );
}
