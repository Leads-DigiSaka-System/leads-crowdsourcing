"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
import { format } from "date-fns";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Loader2,
  Search,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  APPROVED: "bg-green-100 text-green-800 border-green-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
  REVISION_PENDING: "bg-blue-100 text-blue-800 border-blue-200",
};

const statusLabels = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  REVISION_PENDING: "Revision Pending",
};

export default function AdminResearchApplicationsContent() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Action dialog state
  const [actionDialog, setActionDialog] = useState({
    open: false,
    type: null, // 'approve' or 'reject'
    applicationId: null,
    applicationTitle: "",
  });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/researcher-applications?pageSize=1000`
      );
      const data = await response.json();

      if (data.success) {
        setApplications(data.applications);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  };

  const openActionDialog = (type, application) => {
    setActionDialog({
      open: true,
      type,
      applicationId: application.id,
      applicationTitle: application.title,
    });
  };

  const closeActionDialog = () => {
    setActionDialog({
      open: false,
      type: null,
      applicationId: null,
      applicationTitle: "",
    });
  };

  const handleAction = async () => {
    if (!actionDialog.applicationId || !actionDialog.type) return;

    try {
      setActionLoading(true);
      const endpoint =
        actionDialog.type === "approve"
          ? `/api/admin/researcher-applications/${actionDialog.applicationId}/approve`
          : `/api/admin/researcher-applications/${actionDialog.applicationId}/reject`;

      const response = await fetch(endpoint, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        closeActionDialog();
        fetchApplications();
      } else {
        toast.error(data.message || "Action failed");
      }
    } catch (error) {
      console.error("Error processing application:", error);
      toast.error("Failed to process application");
    } finally {
      setActionLoading(false);
    }
  };

  const getActionableCount = () => {
    return applications.filter((app) =>
      ["PENDING", "REVISION_PENDING"].includes(app.status)
    ).length;
  };

  const filteredApplications = applications.filter((app) => {
    if (!statusFilter) return true;
    return app.status === statusFilter;
  });

  if (loading && applications.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards - reuse StatCard UI used in admin dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          title="Total Applications"
          value={applications.length}
          description="Total researcher applications"
        />
        <StatCard
          icon={Clock}
          title="Pending Review"
          value={getActionableCount()}
          description="Awaiting review"
        />
        <StatCard
          icon={CheckCircle}
          title="Approved"
          value={applications.filter((a) => a.status === "APPROVED").length}
          description="Approved applications"
        />
        <StatCard
          icon={XCircle}
          title="Rejected"
          value={applications.filter((a) => a.status === "REJECTED").length}
          description="Rejected applications"
        />
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search applications..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9 w-full sm:w-[300px]"
            />
          </div>
          <Select
            value={statusFilter || "all"}
            onValueChange={(value) =>
              setStatusFilter(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="REVISION_PENDING">Revision Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      {applications.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <p className="text-gray-600">No applications found</p>
        </div>
      ) : (
        <>
          <Card className="rounded-md border bg-background">
            <CardContent>
              <DataTable
                globalFilter={globalFilter}
                onGlobalFilterChange={setGlobalFilter}
                columns={[
                  {
                    id: "applicant",
                    accessorFn: (row) =>
                      `${row.user.name} ${row.user.email} ${row.user.role}`,
                    header: () => <span>Applicant</span>,
                    cell: ({ row }) => (
                      <div>
                        <p className="font-medium text-gray-900 capitalize">
                          {row.original.user.name || "Unknown"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {row.original.user.email}
                        </p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {row.original.user.role}
                        </Badge>
                      </div>
                    ),
                  },
                  {
                    id: "title",
                    accessorFn: (row) => row.title,
                    header: () => <span>Title</span>,
                    cell: ({ row }) => (
                      <div className="font-medium max-w-xs">
                        <p className="truncate capitalize">
                          {row.original.title}
                        </p>
                        {row.original.targetProject && (
                          <Link
                            href={`/discover/${row.original.targetProject.slug}`}
                            className="text-xs text-blue-600 underline mt-1 block"
                          >
                            View project: {row.original.targetProject.title}
                          </Link>
                        )}
                      </div>
                    ),
                  },
                  {
                    id: "type",
                    accessorFn: (row) =>
                      row.targetProjectId ? "Revision" : "Initial",
                    header: () => <span>Type</span>,
                    cell: ({ row }) => {
                      const applicationType = row.original.targetProjectId
                        ? "Revision"
                        : "Initial";
                      return (
                        <Badge
                          variant="outline"
                          className={
                            applicationType === "Revision"
                              ? "bg-blue-50 text-blue-700"
                              : ""
                          }
                        >
                          {applicationType}
                        </Badge>
                      );
                    },
                  },
                  {
                    id: "status",
                    accessorFn: (row) => row.status,
                    header: () => <span>Status</span>,
                    cell: ({ row }) => (
                      <Badge
                        variant="outline"
                        className={`font-normal ${statusColors[row.original.status]}`}
                      >
                        {statusLabels[row.original.status]}
                      </Badge>
                    ),
                  },
                  {
                    id: "createdAt",
                    accessorFn: (row) => row.createdAt,
                    header: () => <span>Submitted</span>,
                    cell: ({ row }) => (
                      <span className="text-gray-600 text-sm">
                        {format(
                          new Date(row.original.createdAt),
                          "MMM dd, yyyy"
                        )}
                      </span>
                    ),
                  },
                  {
                    id: "actions",
                    header: () => <div className="text-right">Actions</div>,
                    cell: ({ row }) => {
                      const app = row.original;
                      const isPending = [
                        "PENDING",
                        "REVISION_PENDING",
                      ].includes(app.status);
                      return (
                        <div className="flex items-center justify-end gap-2">
                          {isPending && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => openActionDialog("approve", app)}
                                className="flex items-center gap-1"
                              >
                                <CheckCircle className="h-3 w-3" /> Approve
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => openActionDialog("reject", app)}
                                className="flex items-center gap-1  "
                              >
                                <XCircle className="h-3 w-3" /> Reject
                              </Button>
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(`/applications/${app.id}`, "_blank")
                            }
                            className="flex items-center gap-1 "
                          >
                            <Eye className="h-3 w-3" /> View
                          </Button>
                        </div>
                      );
                    },
                  },
                ]}
                data={filteredApplications}
              />
            </CardContent>
          </Card>
        </>
      )}

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={closeActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionDialog.type === "approve" ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Approve Application
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  Reject Application
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === "approve"
                ? `Confirm approving ${actionDialog.applicationTitle || "this application"}.`
                : `Confirm rejecting ${actionDialog.applicationTitle || "this application"}.`}
            </DialogDescription>
          </DialogHeader>
          {actionDialog.type === "approve" ? (
            <div className="mt-2 text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200">
              <AlertTriangle className="h-4 w-4 inline mr-1" />
              {applications.find((a) => a.id === actionDialog.applicationId)
                ?.targetProjectId
                ? "This will update the existing project with the new data."
                : "This will create a new project and promote the user to researcher role."}
            </div>
          ) : (
            <div className="mt-2 text-gray-600">
              The applicant will be notified and can view the rejection status.
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeActionDialog}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant={
                actionDialog.type === "approve" ? "default" : "destructive"
              }
              onClick={handleAction}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : actionDialog.type === "approve" ? (
                "Approve"
              ) : (
                "Reject"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
