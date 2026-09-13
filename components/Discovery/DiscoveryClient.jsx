"use client";
import {
  getDiscoveryCategories,
  normalizeCategorySlug,
} from "@/lib/project-categories";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import FilterAndPick from "./FilterAndPick";

const filterOptions = [
  { value: "all", label: "All projects" },
  { value: "recommended", label: "Recommended only" },
  { value: "newest", label: "Newest first" },
  { value: "ending-soon", label: "Ending soon" },
  { value: "funded", label: "Most funded" },
];

const DiscoveryClient = ({
  initialProjects = [],
  initialPagination = null,
  initialCategories = null,
  initialError = null,
} = {}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const queryString = searchParams.toString();
  const urlSearch = searchParams.get("search") || "";
  const urlFilter = searchParams.get("filter") || "recommended";
  const urlCategory = normalizeCategorySlug(searchParams.get("category"));
  const [isPending, startTransition] = useTransition();
  const [selection, setSelection] = useOptimistic(
    { filter: urlFilter, category: urlCategory },
    (current, updates) => ({ ...current, ...updates })
  );
  const [search, setSearch] = useState({
    value: urlSearch,
    url: queryString,
    submitted: null,
  });
  const [fallbackCategories, setFallbackCategories] = useState(null);
  const searchTimer = useRef(null);
  const pendingNavigation = useRef(null);
  const committedQuery = useRef(queryString);

  // Restore the input on history navigation, while preserving text typed during
  // an in-flight search request. Keep the input mounted so focus is retained.
  if (search.url !== queryString) {
    setSearch({
      value: search.submitted === queryString ? search.value : urlSearch,
      url: queryString,
      submitted: null,
    });
  }

  useEffect(() => () => clearTimeout(searchTimer.current), []);

  useEffect(() => {
    const isOwnNavigation = pendingNavigation.current?.query === queryString;
    committedQuery.current = queryString;
    pendingNavigation.current = null;
    // History navigation abandons any search that has not been submitted yet.
    if (!isOwnNavigation) clearTimeout(searchTimer.current);
  }, [queryString]);

  useEffect(() => {
    if (initialCategories) return;
    const controller = new AbortController();
    async function loadCategories() {
      try {
        const res = await fetch("/api/categories", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) return;
        const list = await res.json();
        if (Array.isArray(list)) setFallbackCategories(getDiscoveryCategories(list));
      } catch (error) {
        if (error.name !== "AbortError") console.error("Failed to load categories", error);
      }
    }
    loadCategories();
    return () => controller.abort();
  }, [initialCategories]);

  const updateUrl = (updates) => {
    clearTimeout(searchTimer.current);
    // Merge rapid clicks with the pending URL, so a category click cannot drop
    // a search or view change that has not finished loading yet.
    const currentQuery = committedQuery.current;
    const params = new URLSearchParams(pendingNavigation.current?.query ?? currentQuery);
    params.delete("categoryId");
    const category = normalizeCategorySlug(updates.category ?? params.get("category"));
    if (category === "all") params.delete("category");
    else params.set("category", category);

    if (updates.filter !== undefined) {
      if (updates.filter === "recommended") params.delete("filter");
      else params.set("filter", updates.filter);
    }
    if (updates.search !== undefined) {
      if (!updates.search) params.delete("search");
      else params.set("search", updates.search);
    }
    if (updates.page !== undefined) {
      if (updates.page === 1) params.delete("page");
      else params.set("page", String(updates.page));
    }

    const nextQuery = params.toString();
    if (nextQuery === currentQuery && !pendingNavigation.current) return;
    pendingNavigation.current = { query: nextQuery };
    setSearch((current) => ({ ...current, submitted: nextQuery }));
    startTransition(() => {
      setSelection({ category, filter: params.get("filter") || "recommended" });
      router.replace(`${pathname}${nextQuery ? `?${nextQuery}` : ""}`, { scroll: false });
    });
  };

  const handleSearchChange = (value) => {
    setSearch((current) => ({ ...current, value }));
    clearTimeout(searchTimer.current);
    // One debounce for both the visible input and the URL.
    searchTimer.current = setTimeout(() => updateUrl({ search: value, page: 1 }), 350);
  };

  const handleResetFilters = () => {
    setSearch((current) => ({ ...current, value: "" }));
    updateUrl({ filter: "all", category: "all", search: "", page: 1 });
  };

  const handlePickRandomProject = async () => {
    try {
      const res = await fetch("/api/projects/discovery?filter=all&limit=10000");
      if (!res.ok) throw new Error("Failed to load projects");
      const data = await res.json();
      const list = Array.isArray(data.projects)
        ? data.projects.filter((project) => project.show !== false && !project.archived)
        : [];
      if (list.length === 0) {
        toast.info("There are no projects to explore yet.");
        return;
      }
      const project = list[Math.floor(Math.random() * list.length)];
      router.push(`/discover/${project.slug || project.id}`);
    } catch {
      toast.error("Couldn't pick a project. Please try again.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:py-12">
      <FilterAndPick
        selectedFilter={selection.filter}
        setSelectedFilter={(filter) => updateUrl({ filter, search: search.value, page: 1 })}
        selectedCategory={selection.category}
        setSelectedCategory={(category) => updateUrl({ category, search: search.value, page: 1 })}
        searchQuery={search.value}
        setSearchQuery={handleSearchChange}
        filterOptions={filterOptions}
        categories={initialCategories || fallbackCategories || getDiscoveryCategories([])}
        onPickProject={handlePickRandomProject}
        projects={initialProjects}
        pagination={initialPagination}
        isLoading={isPending || search.value !== urlSearch}
        error={initialError}
        onPageChange={(page) => updateUrl({ page, search: search.value })}
        onResetFilters={handleResetFilters}
        onRetry={() => startTransition(() => router.refresh())}
      />
    </div>
  );
};

export default DiscoveryClient;
