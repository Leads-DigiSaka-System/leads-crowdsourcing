// Environment projects now belong to Agriculture. Keep legacy database slugs
// and shared links compatible while exposing one category in public discovery.
export function normalizeCategorySlug(slug) {
  const normalized = typeof slug === "string" ? slug.trim().toLowerCase() : "";
  return normalized === "environment" ? "agriculture" : normalized || "all";
}

export function getCategoryLabel(name) {
  const label = typeof name === "string" ? name.trim() : "";
  if (["environment", "agriculture"].includes(label.toLowerCase())) {
    return "Agriculture";
  }
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function getCategorySlugFilter(slug) {
  const category = normalizeCategorySlug(slug);
  if (category === "all") return null;
  return category === "agriculture"
    ? { in: ["agriculture", "environment"] }
    : category;
}

export function getDiscoveryCategories(categories = []) {
  const unique = new Map();
  for (const category of Array.isArray(categories) ? categories : []) {
    if (!category?.slug) continue;
    const id = normalizeCategorySlug(category.slug);
    if (id === "all") continue;

    // Prefer the Agriculture entry's icon regardless of database ordering.
    const isLegacy = category.slug.trim().toLowerCase() === "environment";
    if (unique.has(id) && isLegacy) continue;
    unique.set(id, {
      id,
      label: id === "agriculture" ? "Agriculture" : getCategoryLabel(category.name),
      icon: id === "agriculture"
        ? (!isLegacy && category.icon) || "Leaf"
        : category.icon || null,
    });
  }

  return [
    { id: "all", label: "All projects" },
    ...Array.from(unique.values()).sort((a, b) => a.label.localeCompare(b.label)),
  ];
}
