"use client";
import DonationsTable, {
  SignatureBadge,
} from "@/components/donations/DonationsTable";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
import { nameTitleCase, smartTitle } from "@/lib/utils";
import { Calendar, DollarSign, Heart, Users } from "lucide-react";
import { useEffect, useState } from "react";

export default function DonationsContent() {
  const [timeFilter, setTimeFilter] = useState("monthly");
  const [donations, setDonations] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalAmount: 0,
    totalDonations: 0,
    uniqueDonors: 0,
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);

  useEffect(() => {
    fetchDonations(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFilter, page]);

  const fetchDonations = async (targetPage = 1) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/donations?filter=${timeFilter}&page=${targetPage}`
      );
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
      console.error("Error fetching donations:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
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
      {/* Time Filter */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Time Period
            </CardTitle>
            <Select
              value={timeFilter}
              onValueChange={(v) => {
                setTimeFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={DollarSign}
          title="Total Donated"
          value={formatCurrency(analytics.totalAmount)}
          description={`${timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)} total`}
        />
        <StatCard
          icon={Heart}
          title="Total Donations"
          value={analytics.totalDonations.toLocaleString()}
          description="Individual transactions"
        />
        <StatCard
          icon={Users}
          title="Unique Donors"
          value={analytics.uniqueDonors.toLocaleString()}
          description="Active supporters"
        />
      </div>

      {/* Donations Table with pagination */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Donations</CardTitle>
        </CardHeader>
        <CardContent>
          {donations.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No donations found
              </h3>
              <p className="text-muted-foreground">
                No donations were made in the selected time period.
              </p>
            </div>
          ) : (
            <DonationsTable
              data={donations}
              rowKey={(d) => d.id}
              page={page}
              pageCount={pageCount}
              onPageChange={(next) => setPage(next)}
              columns={[
                {
                  id: "donor",
                  header: "Donor",
                  cell: (d) => (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={d.user.image} />
                        <AvatarFallback>
                          {d.user.name?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {nameTitleCase(d.user.name)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          @{d.user.username}
                        </div>
                      </div>
                    </div>
                  ),
                },
                { id: "email", header: "Email", accessor: (d) => d.user.email },
                {
                  id: "amount",
                  header: "Amount",
                  className: "font-medium text-green-600",
                  cell: (d) => formatCurrency(d.amount),
                },
                {
                  id: "project",
                  header: "Project",
                  cell: (d) => (
                    <div className="max-w-48 truncate" title={d.project.title}>
                      {smartTitle(d.project.title)}
                    </div>
                  ),
                },
                {
                  id: "date",
                  header: "Date",
                  accessor: (d) => formatDate(d.createdAt),
                },
                {
                  id: "signature",
                  header: "Solana Signature",
                  cell: (d) => <SignatureBadge signature={d.solanaSignature} />,
                },
              ]}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
