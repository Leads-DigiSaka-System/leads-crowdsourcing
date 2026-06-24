import CategoryChart from "@/components/admin/dashboard/CategoryChart";
import DashboardStats from "@/components/admin/dashboard/DashboardStats";
import RecentDonations from "@/components/admin/dashboard/RecentDonations";
import RecentProjects from "@/components/admin/dashboard/RecentProjects";
import TopFundedProjects from "@/components/admin/dashboard/TopFundedProjects";
import { headers } from "next/headers";

async function getBaseUrl() {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  return `${protocol}://${host}`;
}

async function getDashboardData() {
  try {
    const baseUrl = await getBaseUrl();
    const res = await fetch(`${baseUrl}/api/dashboard`, {
      cache: "no-store",
      headers: {
        cookie: (await headers()).get("cookie") || "",
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch dashboard data");
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return {
      totals: { projects: 0, users: 0, pledges: 0, funding: 0 },
      projectsByCategory: [],
      recentProjects: [],
      topFundedProjects: [],
      pledgeStatusDistribution: [],
      recentDonations: [],
    };
  }
}

export default async function DashboardContent() {
  const dashboardData = await getDashboardData();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <DashboardStats stats={dashboardData.totals} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column */}
        <div className="space-y-6 flex flex-col h-full">
          <RecentProjects projects={dashboardData.recentProjects} />
          <div className="flex-1">
            <CategoryChart data={dashboardData.projectsByCategory} />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6 flex flex-col h-full">
          <TopFundedProjects projects={dashboardData.topFundedProjects} />
          <div className="flex-1">
            <RecentDonations donations={dashboardData.recentDonations} />
          </div>
        </div>
      </div>
    </div>
  );
}
