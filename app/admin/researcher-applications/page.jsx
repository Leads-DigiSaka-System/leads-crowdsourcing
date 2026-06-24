import AdminResearchApplicationsContent from "@/components/admin/researcher-applications/AdminResearchApplicationsContent";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Research Applications | Admin Dashboard",
  description: "Manage researcher applications",
};

export default function AdminResearchApplicationsPage() {
  return (
    <div>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Research Applications
          </h1>
          <p className="text-gray-600 mt-2">
            Review and manage research proposals from applicants
          </p>
        </div>

        <AdminResearchApplicationsContent />
      </div>
    </div>
  );
}
