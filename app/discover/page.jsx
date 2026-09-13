import DiscoveryClient from "@/components/Discovery/DiscoveryClient";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { getDiscoveryCategories, normalizeCategorySlug } from "@/lib/project-categories";
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
  const categorySlug = normalizeCategorySlug(params.category);
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
        categories = getDiscoveryCategories(list);
      }
    }
  } catch (e) {
    console.error("Failed to fetch categories", e);
  }

  // Fetch projects
  let projects = [];
  let pagination = null;
  let error = null;
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
    if (!res.ok) throw new Error("Failed to fetch projects");
    const data = await res.json();
    projects = Array.isArray(data.projects)
      ? data.projects.filter((p) => p.show !== false)
      : [];
    pagination = data.pagination;
  } catch (e) {
    console.error("Failed to fetch projects", e);
    error = "We couldn't load projects. Please try again.";
  }

  return (
    <>
      <Navbar />
      <DiscoveryClient
        initialProjects={projects}
        initialPagination={pagination}
        initialCategories={categories}
        initialError={error}
      />
      <Footer />
    </>
  );
};

export default Discover;
