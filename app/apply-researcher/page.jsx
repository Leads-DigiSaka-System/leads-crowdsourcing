import ResearchApplicationForm from "@/components/researcher/ResearchApplicationForm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Apply as Researcher | Submit Research Proposal",
  description: "Submit your research proposal to become a researcher",
};

export default async function ApplyResearcherPage({ searchParams }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/apply-researcher");
  }

  // Fetch categories with Prisma
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  // Check if user has researcher role (from session)
  const isResearcher = session.user.role === "researcher";

  // If non-researcher, check application count with Prisma
  let applicationCount = 0;
  if (!isResearcher) {
    applicationCount = await prisma.researcherApplication.count({
      where: { userId: session.user.id },
    });
  }

  const sp = await searchParams;

  return (
    <div className="">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {sp?.edit || sp?.view
              ? "Research Application"
              : "Apply as Researcher"}
          </h1>
          <p className="text-gray-600 mt-2">
            {sp?.view
              ? "Viewing your research proposal"
              : sp?.edit
                ? "Edit your research proposal"
                : "Submit your research proposal to become a researcher and access exclusive benefits"}
          </p>
          {!isResearcher && !sp?.edit && !sp?.view && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-primary">
                <strong>Application Limit:</strong> You can submit up to 3
                research proposals before your first approval. After becoming a
                researcher, you can submit unlimited proposals.
                {applicationCount > 0 && ` (${applicationCount}/3 used)`}
              </p>
            </div>
          )}
        </div>

        <div className="">
          <ResearchApplicationForm
            categories={categories}
            applicationId={sp?.edit || sp?.view}
            isViewMode={!!sp?.view}
            isResearcher={isResearcher}
            applicationCount={applicationCount}
          />
        </div>
      </div>
    </div>
  );
}
