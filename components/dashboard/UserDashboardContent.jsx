"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import CertificationButton from "./CertificationButton";
import DonationHistory from "./DonationHistory";
import DonationStats from "./DonationStats";
import ResearchApplicationsTable from "./ResearchApplicationsTable";
import ResearcherStats from "./ResearcherStats";

export default function UserDashboardContent() {
  const { data: session } = useSession();
  // Removed timeFilter state
  const [donations, setDonations] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalAmount: 0,
    totalDonations: 0,
    supportedProjects: 0,
    chartData: [],
  });
  const [researcherStats, setResearcherStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [activeTab, setActiveTab] = useState("donations");

  const userId = session?.user?.id;

  useEffect(() => {
    if (userId) {
      fetchUserDonations(page);
      if (session?.user?.role === "researcher") {
        fetchResearcherStats();
      }
    }
    // Only refetch when page or user id changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, page]);

  const fetchResearcherStats = async () => {
    try {
      const response = await fetch("/api/user/researcher-stats");
      const data = await response.json();
      if (data.success) {
        setResearcherStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching researcher stats:", error);
    }
  };

  const fetchUserDonations = async (targetPage = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/donations?page=${targetPage}`);
      const data = await response.json();

      if (data.success) {
        setDonations(data.donations);
        setAnalytics(data.analytics);
        const totalPages = Math.max(
          1,
          Math.ceil((data.total || 0) / (data.pageSize || 10))
        );
        setPageCount(totalPages);
        setPage(data.page || 1);
      }
    } catch (error) {
      console.error("Error fetching user donations:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <TabsList>
            <TabsTrigger value="donations">My Donations</TabsTrigger>
            <TabsTrigger value="researcher">Researcher Hub</TabsTrigger>
          </TabsList>

          {activeTab === "donations" && (
            <CertificationButton totalDonations={analytics.totalDonations} />
          )}
        </div>

        <TabsContent value="donations" className="space-y-6">
          <DonationStats analytics={analytics} />
          <DonationHistory
            donations={donations}
            page={page}
            pageCount={pageCount}
            onPageChange={(next) => setPage(next)}
          />
        </TabsContent>

        <TabsContent value="researcher" className="space-y-6">
          {session?.user?.role === "researcher" && researcherStats && (
            <ResearcherStats stats={researcherStats} />
          )}

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Research Applications
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage your research proposals and track their status
              </p>
            </div>
            <ResearchApplicationsTable />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
