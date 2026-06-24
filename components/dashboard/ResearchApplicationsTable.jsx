"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Eye,
  FileText,
  Loader2,
  Search,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

export default function ResearchApplicationsTable() {
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/researcher-applications?pageSize=1000`
      );
      const data = await response.json();

      if (data.success) {
        setApplications(data.applications);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (applicationId) => {
    router.push(`/applications/${applicationId}`);
  };

  const handleEdit = (applicationId) => {
    router.push(`/apply-researcher?edit=${applicationId}`);
  };

  const handleDelete = async (applicationId) => {
    const confirmed = window.confirm(
      "Delete this application? This cannot be undone."
    );
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/researcher-applications/${applicationId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        // Refresh table
        fetchApplications();
      } else {
        alert(data.message || "Unable to delete application");
      }
    } catch (e) {
      alert("Network error while deleting application");
    }
  };

  if (loading && applications.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const columns = [
    {
      accessorKey: "title",
      header: ({ column }) => {
        return (
          <div className="flex items-center gap-1">
            Title
            {column.getIsSorted() === "asc" ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ChevronDown className="ml-2 h-4 w-4" />
            ) : null}
          </div>
        );
      },
      cell: ({ row }) => (
        <div className="w-[300px] max-w-full overflow-hidden">
          <div className="truncate font-medium text-foreground">
            {row.original.title}
          </div>
        </div>
      ),
    },
    {
      id: "type",
      header: () => <span>Type</span>,
      cell: ({ row }) => {
        const applicationType = row.original.targetProjectId
          ? "Revision"
          : "Initial";
        return (
          <Badge variant="outline" className="font-normal">
            {applicationType}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <div className="flex items-center gap-1">
            Status
            {column.getIsSorted() === "asc" ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ChevronDown className="ml-2 h-4 w-4" />
            ) : null}
          </div>
        );
      },
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
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <div className="flex items-center gap-1">
            Submitted
            {column.getIsSorted() === "asc" ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ChevronDown className="ml-2 h-4 w-4" />
            ) : null}
          </div>
        );
      },
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground font-medium">
          {format(new Date(row.original.createdAt), "MMM dd, yyyy")}
        </div>
      ),
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }) => {
        return (
          <div className="flex items-center gap-1">
            Updated
            {column.getIsSorted() === "asc" ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ChevronDown className="ml-2 h-4 w-4" />
            ) : null}
          </div>
        );
      },
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground font-medium">
          {format(new Date(row.original.updatedAt), "MMM dd, yyyy")}
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const app = row.original;
        const isEditable = ["PENDING", "REVISION_PENDING"].includes(app.status);
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleView(app.id)}
              className="flex items-center gap-1"
            >
              <Eye className="h-3 w-3" /> View
            </Button>
            {isEditable && (
              <Button
                size="sm"
                onClick={() => handleEdit(app.id)}
                className="flex items-center gap-1 bg-primary text-primary-foreground"
              >
                <Edit className="h-3 w-3" /> Edit
              </Button>
            )}
            {isEditable && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(app.id)}
                className="flex items-center "
              >
                <Trash2 className="h-3 w-3" /> Delete
              </Button>
            )}
          </div>
        );
      },
      enableSorting: false,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search applications..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9 w-full sm:w-[300px]"
          />
        </div>
        <Button
          onClick={() => router.push("/apply-researcher")}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          New Application
        </Button>
      </div>

      {/* Table */}
      {applications.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No applications yet</p>
          <p className="text-gray-500 text-sm mt-1">
            Submit your first research proposal to get started
          </p>
          <Button
            onClick={() => router.push("/apply-researcher")}
            className="mt-4"
          >
            Submit Proposal
          </Button>
        </div>
      ) : (
        <div className="rounded-md border bg-background">
          <DataTable
            columns={columns}
            data={applications}
            globalFilter={globalFilter}
            onGlobalFilterChange={setGlobalFilter}
          />
        </div>
      )}
    </div>
  );
}
