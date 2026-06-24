import DiscoveryClient from "@/components/Discovery/DiscoveryClient";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { capitalizeFirstWordOnly } from "@/lib/utils";
import { headers } from "next/headers";

async function getBaseUrl() {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  return `${protocol}://${host}`;
}

const Discover = async ({ searchParams }) => {
  const params = await searchParams;
  const filter = params.filter || "recommended";
  const categorySlug = params.category || "all";
  const search = params.search || "";
  const page = parseInt(params.page || "1", 10) || 1;

  const baseUrl = await getBaseUrl();

  // Fetch categories
  let categories = null;
  try {
    const res = await fetch(`${baseUrl}/api/categories`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list)) {
        categories = [
          { id: "all", label: "All" },
          ...list
            .map((c) => ({
              id: c.slug,
              label: capitalizeFirstWordOnly(c.name),
              icon: c.icon || null,
            }))
            .sort((a, b) => a.label.localeCompare(b.label)),
        ];
      }
    }
  } catch (e) {
    console.error("Failed to fetch categories", e);
  }

  // Fetch projects
  let projects = [];
  let pagination = null;
  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: "12",
      filter: filter,
      ...(categorySlug && categorySlug !== "all" && { category: categorySlug }),
      ...(search && { search: search }),
    });

    const res = await fetch(
      `${baseUrl}/api/projects/discovery?${queryParams}`,
      { cache: "no-store" }
    );
    if (res.ok) {
      const data = await res.json();
      projects = Array.isArray(data.projects)
        ? data.projects.filter((p) => p.show !== false)
        : [];
      pagination = data.pagination;
    }
  } catch (e) {
    console.error("Failed to fetch projects", e);
  }

  return (
    <>
      <Navbar />
      <DiscoveryClient
        initialFilter={filter}
        initialCategory={categorySlug}
        initialSearch={search}
        initialPage={page}
        initialProjects={projects}
        initialPagination={pagination}
        initialCategories={categories}
      />
      <Footer />
    </>
  );
};

export default Discover;
