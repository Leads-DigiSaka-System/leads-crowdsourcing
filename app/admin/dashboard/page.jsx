import Navbar from "@/components/Navbar";
import DashboardContent from "@/components/admin/dashboard/DashboardContent";
import DashboardLoading from "@/components/admin/dashboard/DashboardLoading";
import QuickActions from "@/components/admin/dashboard/QuickActions";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen ">
      <Navbar />

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your Research<span className="text-primary">Fund</span>{" "}
              platform
            </p>
          </div>
          <div className="md:w-64">
            <QuickActions />
          </div>
        </div>

        <Suspense fallback={<DashboardLoading />}>
          <DashboardContent />
        </Suspense>
      </div>
    </div>
  );
}
