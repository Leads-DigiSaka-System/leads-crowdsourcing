"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle, Loader2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import ProjectBudget from "../ProjectPage/budget/project-budget";
import ProjectContent from "../ProjectPage/project-content/project-content";
import ProjectDetail from "../ProjectPage/project-detail/project-detail";
import ScientistsContent from "../ProjectPage/scientiest-content/scientists-content";
import ProjectTeam from "../ProjectPage/team/project-team";
import ProjectTimelineContent from "../ProjectPage/timeline/project-timeline-content";

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  APPROVED: "bg-green-100 text-green-800 border-green-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
  REVISION_PENDING: "bg-blue-100 text-blue-800 border-blue-200",
};

const statusLabels = {
  PENDING: "Pending Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  REVISION_PENDING: "Revision Pending",
};

export default function ApplicationPreviewClient({
  applicationDetail = {},
  applicationContent = {},
  scientistsContent = {},
  applicationBudget = {},
  applicationTimelineContent = {},
  applicationTeam = {},
  isAdmin = false,
  isOwner = false,
}) {
  const router = useRouter();
  const [actionDialog, setActionDialog] = useState({ open: false, type: null });
  const [actionLoading, setActionLoading] = useState(false);

  const isPending = ["PENDING", "REVISION_PENDING"].includes(
    applicationDetail.status
  );
  const applicationType = applicationDetail.targetProject
    ? "Revision"
    : "Initial";

  const openActionDialog = (type) => setActionDialog({ open: true, type });
  const closeActionDialog = () => setActionDialog({ open: false, type: null });

  async function handleAction() {
    try {
      setActionLoading(true);
      const endpoint =
        actionDialog.type === "approve"
          ? `/api/admin/researcher-applications/${applicationDetail.id}/approve`
          : `/api/admin/researcher-applications/${applicationDetail.id}/reject`;
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        closeActionDialog();
        router.push("/admin/researcher-applications");
        router.refresh();
      } else {
        toast.error(data.message || "Action failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to process application");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <>
      <ProjectDetail
        {...applicationDetail}
        budgetItems={applicationBudget?.budgetItems}
        showDonation={false}
        showShare={false}
        showHelpLink={false}
      />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 border rounded-lg p-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Submitted By</p>
            <p className="font-semibold text-gray-900 capitalize">
              {applicationDetail.user?.name}
            </p>
            <p className="text-sm text-gray-600">
              {applicationDetail.user?.email}
            </p>
            <Badge variant="outline" className="mt-2 text-xs capitalize">
              {applicationDetail.user?.role}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Submission Date</p>
            <p className="font-semibold text-gray-900">
              {applicationDetail.createdAt &&
                new Date(applicationDetail.createdAt).toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Last Updated</p>
            <p className="font-semibold text-gray-900">
              {applicationDetail.updatedAt &&
                new Date(applicationDetail.updatedAt).toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
            </p>
          </div>
        </div>
        {applicationDetail.targetProject && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Revision for:</strong>{" "}
              <a
                href={`/discover/${applicationDetail.targetProject.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-blue-900 capitalize"
              >
                {applicationDetail.targetProject.title}
              </a>
            </p>
          </div>
        )}
      </div>

      <ProjectContent {...applicationContent} />
      <ScientistsContent {...scientistsContent} showJoinDiscussion={false} />
      <ProjectBudget {...applicationBudget} />
      <ProjectTimelineContent {...applicationTimelineContent} />
      <ProjectTeam {...applicationTeam} />

      {/* Spacer so last content not hidden behind sticky bar */}
      <div className="h-32 sm:h-24" />

      {isPending && (isAdmin || isOwner) && (
        <div className="fixed bottom-0 inset-x-0 bg-white border-t shadow-md py-3 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div
              className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-label="proposal meta"
            >
              <Badge
                variant="outline"
                className="text-xs sm:text-sm px-2 sm:px-3 py-1 flex-shrink-0"
              >
                📋 Proposal
              </Badge>
              <Badge
                variant="outline"
                className="font-medium text-xs sm:text-sm flex-shrink-0"
              >
                {statusLabels[applicationDetail.status]}
              </Badge>
              <Badge
                variant="outline"
                className="text-xs sm:text-sm flex-shrink-0"
              >
                {applicationType}
              </Badge>
              {applicationDetail.targetProject && (
                <a
                  href={`/discover/${applicationDetail.targetProject.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs sm:text-sm text-blue-600 underline whitespace-nowrap flex-shrink-0"
                >
                  Original Project →
                </a>
              )}
            </div>
            <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-2">
              {isOwner && isPending && !isAdmin && (
                <Button
                  size="sm"
                  onClick={() =>
                    router.push(
                      `/apply-researcher?edit=${applicationDetail.id}`
                    )
                  }
                  className="w-full sm:w-auto"
                >
                  Edit
                </Button>
              )}
              {isAdmin && isPending && (
                <>
                  <Button
                    size="sm"
                    onClick={() => openActionDialog("approve")}
                    className="w-full sm:w-auto"
                  >
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => openActionDialog("reject")}
                    className="w-full sm:w-auto"
                  >
                    Reject
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <Dialog open={actionDialog.open} onOpenChange={closeActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionDialog.type === "approve" ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" /> Approve
                  Application
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" /> Reject
                  Application
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === "approve"
                ? `Confirm approving ${applicationDetail.title || "this application"}.`
                : `Confirm rejecting ${applicationDetail.title || "this application"}.`}
            </DialogDescription>
          </DialogHeader>
          {actionDialog.type === "approve" ? (
            <div className="mt-2 text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200">
              <AlertTriangle className="h-4 w-4 inline mr-1" />
              {applicationDetail.targetProject
                ? "This will update the existing project with the new data."
                : "This will create a new project and promote the user to researcher role."}
            </div>
          ) : (
            <div className="mt-2 text-gray-600">
              The applicant will be able to see the rejection status.
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
              onClick={handleAction}
              disabled={actionLoading}
              variant={
                actionDialog.type === "approve" ? "default" : "destructive"
              }
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
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
    </>
  );
}
