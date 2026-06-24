"use client";
import { capitalizeFirstWordOnly } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import FilterAndPick from "./FilterAndPick";

const DiscoveryClient = ({
  initialProjects = [],
  initialPagination = null,
  initialCategories = null,
  initialFilter = "recommended",
  initialCategory = "all",
  initialSearch = "",
  initialPage = 1,
} = {}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const lastPushedQsRef = useRef(null);

  const [selectedFilter, setSelectedFilter] = useState(initialFilter);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [projects, setProjects] = useState(initialProjects);
  const [pagination, setPagination] = useState(initialPagination);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState(
    initialCategories || [{ id: "all", label: "All" }]
  );

  const filterOptions = [
    { value: "recommended", label: "Recommended" },
    { value: "newest", label: "Newest" },
    { value: "ending-soon", label: "Ending soon" },
    { value: "funded", label: "Funded" },
  ];

  // Sync state when props change (SSR data update)
  useEffect(() => {
    setProjects(initialProjects);
    setPagination(initialPagination);
    setIsLoading(false);
  }, [initialProjects, initialPagination]);

  // Sync local state with URL params (for back/forward navigation)
  useEffect(() => {
    const f = searchParams.get("filter") || "recommended";
    const c = searchParams.get("category") || "all";
    const s = searchParams.get("search") || "";
    const p = parseInt(searchParams.get("page") || "1", 10);
    const np = isNaN(p) || p < 1 ? 1 : p;

    setSelectedFilter(f);
    setSelectedCategory(c);
    setSearchQuery(s);
    setCurrentPage(np);
  }, [searchParams]);

  // Debounce search query updates to the URL
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentS = searchParams.get("search") || "";
      if (searchQuery !== currentS) {
        updateUrl({ search: searchQuery, page: 1 });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const updateUrl = (updates) => {
    setIsLoading(true);
    const params = new URLSearchParams(searchParams);

    // Remove legacy categoryId if present
    params.delete("categoryId");

    if (updates.filter !== undefined) {
      if (updates.filter === "recommended") params.delete("filter");
      else params.set("filter", updates.filter);
    }

    if (updates.category !== undefined) {
      if (updates.category === "all") params.delete("category");
      else params.set("category", updates.category);
    }

    if (updates.search !== undefined) {
      if (!updates.search) params.delete("search");
      else params.set("search", updates.search);
    }

    if (updates.page !== undefined) {
      if (updates.page === 1) params.delete("page");
      else params.set("page", updates.page.toString());
    }

    router.replace(`/discover?${params.toString()}`);
  };

  // Fetch categories only if not provided
  useEffect(() => {
    if (initialCategories) return;
    const load = async () => {
      try {
        const res = await fetch("/api/categories", { cache: "no-store" });
        const list = await res.json();
        if (Array.isArray(list)) {
          const mapped = [
            { id: "all", label: "All" },
            ...list
              .map((c) => ({
                id: c.slug,
                label: capitalizeFirstWordOnly(c.name),
                icon: c.icon || null,
              }))
              .sort((a, b) => a.label.localeCompare(b.label)),
          ];
          setCategories(mapped);
        }
      } catch {}
    };
    load();
  }, [initialCategories]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    updateUrl({ page });
  };

  const handleFilterChange = (newFilter) => {
    setSelectedFilter(newFilter);
    updateUrl({ filter: newFilter, page: 1 });
  };

  const handleCategoryChange = (newCategory) => {
    setSelectedCategory(newCategory);
    updateUrl({ category: newCategory, page: 1 });
  };

  const handleSearchChange = (newSearch) => {
    setSearchQuery(newSearch);
    // URL update handled by debounced useEffect
  };

  const handlePickRandomProject = async () => {
    try {
      const res = await fetch("/api/projects/discovery?filter=all&limit=10000");
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data.projects)
        ? data.projects.filter((p) => p.show !== false && !p.archived)
        : [];
      if (list.length === 0) return;
      const randomProject = list[Math.floor(Math.random() * list.length)];
      router.push(`/discover/${randomProject.slug || randomProject.id}`);
    } catch (e) {
      console.error("Error picking random project", e);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 lg:py-16">
      <FilterAndPick
        selectedFilter={selectedFilter}
        setSelectedFilter={handleFilterChange}
        selectedCategory={selectedCategory}
        setSelectedCategory={handleCategoryChange}
        searchQuery={searchQuery}
        setSearchQuery={handleSearchChange}
        filterOptions={filterOptions}
        categories={categories}
        onPickProject={handlePickRandomProject}
        projects={projects}
        pagination={pagination}
        isLoading={isLoading}
        error={error}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default DiscoveryClient;
