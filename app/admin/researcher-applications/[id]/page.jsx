"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";

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

export default function AdminApplicationDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/researcher-applications/${id}`);
      const data = await response.json();

      if (data.success) {
        setApplication(data.application);
      } else {
        toast.error("Failed to load application");
        router.push("/admin/researcher-applications");
      }
    } catch (error) {
      console.error("Error fetching application:", error);
      toast.error("Failed to load application");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    try {
      setActionLoading(true);
      const endpoint =
        action === "approve"
          ? `/api/admin/researcher-applications/${id}/approve`
          : `/api/admin/researcher-applications/${id}/reject`;

      const response = await fetch(endpoint, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        router.push("/admin/researcher-applications");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-600">Application not found</p>
      </div>
    );
  }

  const isPending = ["PENDING", "REVISION_PENDING"].includes(
    application.status
  );
  const applicationType = application.targetProjectId ? "Revision" : "Initial";

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push("/admin/researcher-applications")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Applications
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {application.title}
            </h1>
            <div className="flex items-center gap-3 mt-3">
              <Badge
                variant="outline"
                className={`${statusColors[application.status]}`}
              >
                {statusLabels[application.status]}
              </Badge>
              <Badge variant="outline">{applicationType} Application</Badge>
            </div>
          </div>

          {isPending && (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleAction("approve")}
                disabled={actionLoading}
                className="bg-green-600"
              >
                {actionLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Approve
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAction("reject")}
                disabled={actionLoading}
                className="text-red-600 border-red-600"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Application Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <User className="h-4 w-4" />
            <span className="text-sm font-medium">Applicant</span>
          </div>
          <p className="font-semibold text-gray-900">{application.user.name}</p>
          <p className="text-sm text-gray-600">{application.user.email}</p>
          <Badge variant="outline" className="mt-2 text-xs">
            {application.user.role}
          </Badge>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">Submitted</span>
          </div>
          <p className="font-semibold text-gray-900">
            {format(new Date(application.createdAt), "MMM dd, yyyy")}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Updated: {format(new Date(application.updatedAt), "MMM dd, yyyy")}
          </p>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <FileText className="h-4 w-4" />
            <span className="text-sm font-medium">Project Details</span>
          </div>
          <p className="text-sm text-gray-900">
            Duration: {application.daysLeft} days
          </p>
          <p className="text-sm text-gray-900">
            Currency: {application.currency}
          </p>
          {application.targetProject && (
            <Link
              href={`/discover/${application.targetProject.slug}`}
              target="_blank"
              className="text-sm text-blue-600 underline mt-1 block"
            >
              View existing project
            </Link>
          )}
        </div>
      </div>

      {/* Content Sections */}
      <div className="space-y-6 bg-white border rounded-lg p-6">
        {application.image && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Project Image</h3>
            <img
              src={application.image}
              alt={application.imageAlt || application.title}
              className="w-full max-w-2xl rounded-lg border"
            />
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold mb-2">Overview</h3>
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: application.overview }}
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Methods</h3>
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: application.methods }}
          />
        </div>

        {application.labNotes && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Lab Notes</h3>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: application.labNotes }}
            />
          </div>
        )}

        {application.discussion && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Discussion</h3>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: application.discussion }}
            />
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold mb-2">Context Answer</h3>
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: application.contextAnswer }}
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Significance Answer</h3>
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: application.significanceAnswer }}
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Goals Answer</h3>
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: application.goalsAnswer }}
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Team Description</h3>
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: application.teamDescription }}
          />
        </div>

        {application.teamMembers && application.teamMembers.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Team Members</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {application.teamMembers.map((member, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  {member.image && (
                    <img
                      src={member.image}
                      alt={member.name || member.role}
                      className="w-16 h-16 rounded-full mb-3"
                    />
                  )}
                  <p className="font-semibold">{member.name || "N/A"}</p>
                  <p className="text-sm text-gray-600">{member.role}</p>
                  {member.bio && <p className="text-sm mt-2">{member.bio}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold mb-2">Budget Description</h3>
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: application.budgetDescription }}
          />
        </div>

        {application.budgetItems && application.budgetItems.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Budget Items</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 font-semibold text-sm">
                      Item
                    </th>
                    <th className="text-left p-3 font-semibold text-sm">
                      Description
                    </th>
                    <th className="text-right p-3 font-semibold text-sm">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {application.budgetItems.map((item, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-3">{item.name}</td>
                      <td className="p-3 text-gray-600">
                        {item.description || "—"}
                      </td>
                      <td className="p-3 text-right font-semibold">
                        {application.currency}{" "}
                        {parseInt(item.value).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t bg-gray-50 font-bold">
                    <td colSpan="2" className="p-3">
                      Total
                    </td>
                    <td className="p-3 text-right">
                      {application.currency}{" "}
                      {application.budgetItems
                        .reduce((sum, item) => sum + parseInt(item.value), 0)
                        .toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold mb-2">Timeline Description</h3>
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{
              __html: application.timelineDescription,
            }}
          />
        </div>

        {application.timelineEvents &&
          application.timelineEvents.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Timeline Events</h3>
              <div className="space-y-3">
                {application.timelineEvents.map((event, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 border-l-2 border-blue-500 pl-4 py-2"
                  >
                    <div>
                      <p className="font-semibold">{event.title}</p>
                      <p className="text-sm text-gray-600">{event.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>

      {/* Actions at bottom */}
      {isPending && (
        <div className="mt-6 flex items-center justify-end gap-2 p-4 bg-gray-50 border rounded-lg">
          <Button
            onClick={() => handleAction("reject")}
            disabled={actionLoading}
            variant="outline"
            className="text-red-600 border-red-600"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Reject Application
          </Button>
          <Button
            onClick={() => handleAction("approve")}
            disabled={actionLoading}
            className="bg-green-600"
          >
            {actionLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve Application
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
