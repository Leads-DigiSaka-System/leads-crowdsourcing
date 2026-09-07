"use client";

import { flexRender } from "@tanstack/react-table";

import { useState } from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useLegacyTable,
} from "@tanstack/react-table/legacy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  Users,
  Loader2,
  MoreVertical,
  RotateCcw,
  Copy,
} from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  nameTitleCase,
  smartTitle,
  getProjectDaysLeft,
  capitalizeFirstWordOnly,
  getFundedPercent,
  formatFundedPercent,
} from "@/lib/utils";
import { useEdgeStore } from "@/lib/edgestore";

export function ProjectsDataTable({
  data: initialData,
  categories: initialCategories = [],
  archivedView = false,
}) {
  const router = useRouter();
  const { edgestore } = useEdgeStore();
  const [data, setData] = useState(initialData);
  const [previousData, setPreviousData] = useState(initialData);
  // Keep internal data in sync when parent supplies new list (e.g., toggling archive view)
  if (initialData !== previousData) {
    setPreviousData(initialData);
    setData(initialData);
  }
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [projectToDeleteId, setProjectToDeleteId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [duplicatingId, setDuplicatingId] = useState(null);

  const isEdgeStoreUrl = (url) =>
    typeof url === "string" && /edgestore\.dev/.test(url);

  const handleDeleteClick = (projectId) => {
    setProjectToDeleteId(projectId);
    setOpenDeleteDialog(true);
  };

  // Build a draft from an existing project and route to Add Project with that draft prefilled
  const handleDuplicate = async (project) => {
    try {
      setDuplicatingId(project.id);
      // Prepare fields matching AddProjectForm schema
      const draftData = {
        title: `${project.title || ""} (Copy)`,
        authors: project.authors || "",
        location: project.location || "",
        image: project.image || "",
        currency: project.currency || "PHP",
        daysLeft: Number(project.daysLeft) || 30,
        tags: Array.isArray(project.tags) ? project.tags : [],
        categoryId: project.categoryId || project.category?.id || "",

        // Project Content
        overview: project.overview || "",
        methods: project.methods || "",
        labNotes: project.labNotes || "",
        discussion: project.discussion || "",

        // Scientists Content
        contextAnswer: project.contextAnswer || "",
        significanceAnswer: project.significanceAnswer || "",
        goalsAnswer: project.goalsAnswer || "",

        // Team
        teamDescription: project.teamDescription || "",
        teamMembers: Array.isArray(project.teamMembers)
          ? project.teamMembers.map((m) => ({
              name: m?.name || "",
              role: m?.role || "",
              responsibility: m?.responsibility || "",
              bio: m?.bio || "",
              image: m?.image || "",
              imageAlt: m?.imageAlt || "",
              email: m?.email || "",
              linkedin: m?.linkedin || "",
              twitter: m?.twitter || "",
              expertise: Array.isArray(m?.expertise) ? m.expertise : [],
            }))
          : [],

        // Budget
        budgetDescription: project.budgetDescription || "",
        budgetItems: Array.isArray(project.budgetItems)
          ? project.budgetItems.map((b) => ({
              name: b?.name || "",
              description: b?.description || "",
              value: Number(b?.value) || 0,
            }))
          : [],

        // Timeline
        timelineDescription: project.timelineDescription || "",
        timelineEvents: Array.isArray(project.timelineEvents)
          ? project.timelineEvents.map((t) => ({
              date: t?.date || "",
              title: t?.title || "",
            }))
          : [],
      };

      const res = await fetch("/api/projects/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: draftData, forceNew: true }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error("Could not create duplicate", {
          description: payload?.error || "Draft creation failed.",
        });
        return;
      }
      const json = await res.json();
      const draftId = json?.id;
      if (!draftId) {
        toast.error("Duplicate failed", {
          description: "No draft ID returned.",
        });
        return;
      }
      toast.success("Copy created", {
        description: "Opening new project form…",
      });
      router.push(`/admin/projects/add-project?draftId=${draftId}`);
    } catch (e) {
      toast.error("Duplicate failed", { description: e.message });
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDeleteId) return;
    setIsDeleting(true);
    try {
      // Capture the project's image URL (if any) before deleting from DB
      const projectToDelete = data.find((p) => p.id === projectToDeleteId);
      const imageUrl = projectToDelete?.image;
      const teamImageUrls = Array.isArray(projectToDelete?.teamMembers)
        ? projectToDelete.teamMembers
            .map((m) => m?.image)
            .filter((u) => u && isEdgeStoreUrl(u))
        : [];

      const response = await fetch(`/api/projects/${projectToDeleteId}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => ({}));
      if (response.ok) {
        // Remove from current view (archived or active) after operation
        setData((prevData) =>
          prevData.filter((project) => project.id !== projectToDeleteId)
        );
        const wasSoft =
          payload?.archived === true ||
          /moved to archive/i.test(payload?.message || "");
        toast.success(
          wasSoft ? "Project Archived" : "Project Permanently Deleted",
          {
            description: wasSoft
              ? "The project was moved to archive. You can restore it from the Archive view."
              : "The project was permanently removed.",
          }
        );
        // Best-effort: also delete the associated image from EdgeStore
        if (!payload?.archived && imageUrl && isEdgeStoreUrl(imageUrl)) {
          try {
            await edgestore?.publicFiles?.delete({ url: imageUrl });
          } catch (e) {
            console.warn("Failed to delete project image from EdgeStore:", e);
          }
        }
        if (!payload?.archived && teamImageUrls.length > 0) {
          try {
            const uniqueUrls = Array.from(new Set(teamImageUrls));
            await Promise.allSettled(
              uniqueUrls.map((u) =>
                edgestore?.publicFiles?.deleteFile({ url: u })
              )
            );
          } catch (e) {
            console.warn(
              "Failed to delete one or more team images from EdgeStore:",
              e
            );
          }
        }
        router.refresh();
      } else {
        toast.error("Deletion Failed", {
          description: payload.error || "Could not delete the project.",
        });
      }
    } catch (error) {
      toast.error("Error", {
        description: "An unexpected error occurred during deletion.",
      });
    } finally {
      setIsDeleting(false);
      setOpenDeleteDialog(false);
      setProjectToDeleteId(null);
    }
  };

  const columns = [
    {
      accessorKey: "title",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold hover:bg-transparent"
          >
            Project Title
            {column.getIsSorted() === "asc" ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ChevronDown className="ml-2 h-4 w-4" />
            ) : null}
          </Button>
        );
      },
      cell: ({ row }) => {
        const project = row.original;
        return (
          <div className="w-[420px] max-w-full overflow-hidden">
            <Link
              href={`/discover/${project.slug || project.id}`}
              className="block truncate font-medium text-foreground hover:underline"
              title={project.title}
            >
              {capitalizeFirstWordOnly(project.title)}
            </Link>
            <div
              className="block text-sm text-muted-foreground truncate"
              title={project.authors}
            >
              by {capitalizeFirstWordOnly(project.authors)}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const categoryObj = row.getValue("category");
        const categoryName = categoryObj?.name || "No Category";
        const titleCase = smartTitle(categoryName);
        const bgColor = categoryObj?.colorHex || undefined;
        const textColor = categoryObj?.textColor || undefined;
        return (
          <Badge
            variant="secondary"
            className="text-xs font-medium"
            style={{
              backgroundColor: bgColor,
              color: textColor,
              border: bgColor ? `1px solid ${bgColor}` : undefined,
            }}
          >
            {titleCase}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        if (!value || value === "all") return true;
        const categoryObj = row.getValue(id);
        const categoryName = categoryObj?.name?.toLowerCase() || "";
        const selected = value.toString().toLowerCase();
        return categoryName === selected;
      },
    },
    {
      accessorKey: "goal",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold hover:bg-transparent"
          >
            <DollarSign className="mr-1 h-4 w-4 text-muted-foreground" />
            Goal
            {column.getIsSorted() === "asc" ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ChevronDown className="ml-2 h-4 w-4" />
            ) : null}
          </Button>
        );
      },
      cell: ({ row }) => {
        const project = row.original;

        const calculatedGoal =
          Array.isArray(project?.budgetItems) && project.budgetItems.length > 0
            ? project.budgetItems.reduce(
                (sum, item) => sum + (Number(item?.value) || 0),
                0
              )
            : Number(project.goal) || 0;

        const pledges = Array.isArray(project?.pledges) ? project.pledges : [];
        const paidPledges = pledges.filter(
          (p) => (p?.status || "paid") === "paid"
        );
        const pledged = paidPledges.reduce(
          (sum, p) => sum + (Number(p?.amount) || 0),
          0
        );

        const displayGoal = calculatedGoal;
        const displayAllocated = pledged;

        const fundedPercent = project?.isCompleted
          ? 100
          : getFundedPercent(pledged, calculatedGoal);
        const fundedLabel = project?.isCompleted
          ? "100%"
          : formatFundedPercent(pledged, calculatedGoal);

        const raisedDisplay = project?.isCompleted ? calculatedGoal : pledged;

        return (
          <div className="">
            <div className="text-right font-medium text-foreground">
              ₱{(Number(raisedDisplay) || 0).toLocaleString()}{" "}
              <span className="text-muted-foreground">
                / ₱{(Number(displayGoal) || 0).toLocaleString()}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 justify-end">
              <Progress
                value={Math.min(100, Math.max(0, fundedPercent))}
                className="h-2 w-20"
              />
              <div className="w-12 text-right text-xs text-muted-foreground">
                {fundedLabel}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "daysLeft",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold hover:bg-transparent"
          >
            <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
            Days Left
            {column.getIsSorted() === "asc" ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ChevronDown className="ml-2 h-4 w-4" />
            ) : null}
          </Button>
        );
      },
      cell: ({ row }) => {
        const project = row.original;
        const days = getProjectDaysLeft(project.createdAt, project.daysLeft);
        let variant = "default";
        if (typeof days === "number") {
          if (days === 0) variant = "destructive";
          else if (days > 30) variant = "default";
          else if (days > 7) variant = "secondary";
          else variant = "destructive";
        }
        return (
          <div className="flex justify-center">
            <Badge variant={variant} className="font-medium">
              {days} days
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "teamMembers",
      header: "Team",
      cell: ({ row }) => {
        const teamMembers = row.getValue("teamMembers") || [];
        return (
          <div className="flex items-center text-muted-foreground">
            <Users className="mr-2 h-4 w-4" />
            <span className="text-sm font-medium">
              {teamMembers.length} members
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "show",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold hover:bg-transparent"
          >
            Visibility
            {column.getIsSorted() === "asc" ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ChevronDown className="ml-2 h-4 w-4" />
            ) : null}
          </Button>
        );
      },
      cell: ({ row }) => {
        const project = row.original;
        const isVisible = !!project.show;
        return (
          <div className="text-center flex justify-center">
            {isVisible ? (
              <Eye
                className="h-4 w-4 text-green-600"
                title="Visible to public"
              />
            ) : (
              <EyeOff
                className="h-4 w-4 text-muted-foreground"
                title="Hidden from public"
              />
            )}
          </div>
        );
      },

      filterFn: (row, id, value) => {
        if (!value || value === "all") return true;
        const val = !!row.getValue(id);
        if (value === "visible") return val === true;
        if (value === "hidden") return val === false;
        return true;
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold hover:bg-transparent"
          >
            Created
            {column.getIsSorted() === "asc" ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ChevronDown className="ml-2 h-4 w-4" />
            ) : null}
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return (
          <div className="text-sm text-muted-foreground font-medium">
            {date.toLocaleDateString()}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const project = row.original;
        return (
          <div className="flex items-center gap-1">
            {/* Desktop: More actions dropdown */}
            <div className="hidden sm:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    {duplicatingId === project.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MoreVertical className="h-4 w-4" />
                    )}
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {project.archived ? (
                    <>
                      <DropdownMenuLabel>Archived</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={async () => {
                          try {
                            setTogglingId(project.id);
                            const res = await fetch(
                              `/api/projects/${project.id}/archive`,
                              {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ archived: false }),
                              }
                            );
                            const payload = await res.json();
                            if (!res.ok) {
                              toast.error("Restore failed", {
                                description:
                                  payload?.error || "Could not restore.",
                              });
                              return;
                            }
                            setData((prev) =>
                              prev.filter((p) => p.id !== project.id)
                            );
                            toast.success("Project restored");
                            router.refresh();
                          } catch (e) {
                            toast.error("Network error", {
                              description: e.message,
                            });
                          } finally {
                            setTogglingId(null);
                          }
                        }}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" /> Restore
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(project.id)}
                        variant="destructive"
                        disabled={isDeleting}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Permanently Delete
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/discover/${project.slug || project.id}`}>
                          <Eye className="mr-2 h-4 w-4" /> View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/projects/${project.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDuplicate(project)}
                      >
                        <Copy className="mr-2 h-4 w-4" /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem
                        checked={!!project.show}
                        onCheckedChange={async (checked) => {
                          try {
                            setTogglingId(project.id);
                            const res = await fetch(
                              `/api/projects/${project.id}/visibility`,
                              {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ show: !!checked }),
                              }
                            );
                            const payload = await res.json();
                            if (!res.ok) {
                              toast.error("Update failed", {
                                description:
                                  payload?.error ||
                                  "Could not update visibility.",
                              });
                              return;
                            }
                            setData((prev) =>
                              prev.map((p) =>
                                p.id === project.id
                                  ? { ...p, show: payload.show }
                                  : p
                              )
                            );
                            toast.success(
                              payload.show
                                ? "Project is now visible"
                                : "Project hidden"
                            );
                          } catch (e) {
                            toast.error("Network error", {
                              description: e.message,
                            });
                          } finally {
                            setTogglingId(null);
                            router.refresh();
                          }
                        }}
                      >
                        Visible to public
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={!!project.featuredHero}
                        onCheckedChange={async (checked) => {
                          try {
                            setTogglingId(project.id);
                            const res = await fetch(
                              `/api/projects/${project.id}/feature`,
                              {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ featured: !!checked }),
                              }
                            );
                            const payload = await res.json();
                            if (!res.ok) {
                              toast.error("Update failed", {
                                description:
                                  payload?.error ||
                                  "Could not update featured flag.",
                              });
                              return;
                            }
                            setData((prev) =>
                              prev.map((p) =>
                                p.id === project.id
                                  ? { ...p, featuredHero: payload.featuredHero }
                                  : p
                              )
                            );
                            if (typeof window !== "undefined") {
                              window.dispatchEvent(
                                new Event("featured-updated")
                              );
                            }
                            toast.success(
                              payload.featuredHero
                                ? "Project featured"
                                : "Project unfeatured"
                            );
                          } catch (e) {
                            toast.error("Network error", {
                              description: e.message,
                            });
                          } finally {
                            setTogglingId(null);
                            router.refresh();
                          }
                        }}
                      >
                        Featured on homepage
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem
                        checked={!!project.isCompleted}
                        onCheckedChange={async (checked) => {
                          try {
                            setTogglingId(project.id);
                            const res = await fetch(
                              `/api/projects/${project.id}/complete`,
                              {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  isCompleted: !!checked,
                                }),
                              }
                            );
                            const payload = await res.json();
                            if (!res.ok) {
                              toast.error("Update failed", {
                                description:
                                  payload?.error ||
                                  "Could not update completion.",
                              });
                              return;
                            }
                            setData((prev) =>
                              prev.map((p) =>
                                p.id === project.id
                                  ? { ...p, isCompleted: payload.isCompleted }
                                  : p
                              )
                            );
                            toast.success(
                              payload.isCompleted
                                ? "Marked as completed"
                                : "Marked as incomplete"
                            );
                          } catch (e) {
                            toast.error("Network error", {
                              description: e.message,
                            });
                          } finally {
                            setTogglingId(null);
                            router.refresh();
                          }
                        }}
                      >
                        {project.isCompleted
                          ? "Mark as Incomplete"
                          : "Mark as Completed"}
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(project.id)}
                        variant="destructive"
                        disabled={isDeleting}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Archive
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    {duplicatingId === project.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MoreVertical className="h-4 w-4" />
                    )}
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {project.archived ? (
                    <>
                      <DropdownMenuLabel>Archived</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={async () => {
                          try {
                            setTogglingId(project.id);
                            const res = await fetch(
                              `/api/projects/${project.id}/archive`,
                              {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ archived: false }),
                              }
                            );
                            const payload = await res.json();
                            if (!res.ok) {
                              toast.error("Restore failed", {
                                description:
                                  payload?.error || "Could not restore.",
                              });
                              return;
                            }
                            setData((prev) =>
                              prev.filter((p) => p.id !== project.id)
                            );
                            toast.success("Project restored");
                            router.refresh();
                          } catch (e) {
                            toast.error("Network error", {
                              description: e.message,
                            });
                          } finally {
                            setTogglingId(null);
                          }
                        }}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" /> Restore
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(project.id)}
                        variant="destructive"
                        disabled={isDeleting}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Permanently Delete
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/discover/${project.slug || project.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/projects/${project.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDuplicate(project)}
                      >
                        <Copy className="mr-2 h-4 w-4" /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem
                        checked={!!project.show}
                        onCheckedChange={async (checked) => {
                          try {
                            setTogglingId(project.id);
                            const res = await fetch(
                              `/api/projects/${project.id}/visibility`,
                              {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ show: !!checked }),
                              }
                            );
                            const payload = await res.json();
                            if (!res.ok) {
                              toast.error("Update failed", {
                                description:
                                  payload?.error ||
                                  "Could not update visibility.",
                              });
                              return;
                            }
                            setData((prev) =>
                              prev.map((p) =>
                                p.id === project.id
                                  ? { ...p, show: payload.show }
                                  : p
                              )
                            );
                            toast.success(
                              payload.show
                                ? "Project is now visible"
                                : "Project hidden"
                            );
                          } catch (e) {
                            toast.error("Network error", {
                              description: e.message,
                            });
                          } finally {
                            setTogglingId(null);
                            router.refresh();
                          }
                        }}
                      >
                        Visible to public
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={!!project.featuredHero}
                        onCheckedChange={async (checked) => {
                          try {
                            setTogglingId(project.id);
                            const res = await fetch(
                              `/api/projects/${project.id}/feature`,
                              {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ featured: !!checked }),
                              }
                            );
                            const payload = await res.json();
                            if (!res.ok) {
                              toast.error("Update failed", {
                                description:
                                  payload?.error ||
                                  "Could not update featured flag.",
                              });
                              return;
                            }
                            setData((prev) =>
                              prev.map((p) =>
                                p.id === project.id
                                  ? { ...p, featuredHero: payload.featuredHero }
                                  : p
                              )
                            );
                            if (typeof window !== "undefined") {
                              window.dispatchEvent(
                                new Event("featured-updated")
                              );
                            }
                            toast.success(
                              payload.featuredHero
                                ? "Project featured"
                                : "Project unfeatured"
                            );
                          } catch (e) {
                            toast.error("Network error", {
                              description: e.message,
                            });
                          } finally {
                            setTogglingId(null);
                            router.refresh();
                          }
                        }}
                      >
                        Featured on homepage
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem
                        checked={!!project.isCompleted}
                        onCheckedChange={async (checked) => {
                          try {
                            setTogglingId(project.id);
                            const res = await fetch(
                              `/api/projects/${project.id}/complete`,
                              {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  isCompleted: !!checked,
                                }),
                              }
                            );
                            const payload = await res.json();
                            if (!res.ok) {
                              toast.error("Update failed", {
                                description:
                                  payload?.error ||
                                  "Could not update completion.",
                              });
                              return;
                            }
                            setData((prev) =>
                              prev.map((p) =>
                                p.id === project.id
                                  ? { ...p, isCompleted: payload.isCompleted }
                                  : p
                              )
                            );
                            toast.success(
                              payload.isCompleted
                                ? "Marked as completed"
                                : "Marked as incomplete"
                            );
                          } catch (e) {
                            toast.error("Network error", {
                              description: e.message,
                            });
                          } finally {
                            setTogglingId(null);
                            router.refresh();
                          }
                        }}
                      >
                        {project.isCompleted
                          ? "Mark as Incomplete"
                          : "Mark as Completed"}
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(project.id)}
                        variant="destructive"
                        disabled={isDeleting}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Archive
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        );
      },
    },
  ];

  const table = useLegacyTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  // Mobile card component
  const MobileProjectCard = ({ project }) => {
    const categoryObj = project.category || {};
    const categoryName = categoryObj.name || "No Category";
    const titleCase = smartTitle(categoryName);
    const bgColor = categoryObj.colorHex || undefined;
    const textColor = categoryObj.textColor || undefined;
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-foreground truncate">
                  {capitalizeFirstWordOnly(project.title)}
                </h3>
                {project.show ? (
                  <Eye
                    className="h-4 w-4 text-green-600"
                    title="Visible to public"
                  />
                ) : (
                  <EyeOff
                    className="h-4 w-4 text-muted-foreground"
                    title="Hidden from public"
                  />
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                by {nameTitleCase(project.authors)}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-2">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {project.archived ? (
                  <>
                    <DropdownMenuItem
                      onClick={async () => {
                        try {
                          setTogglingId(project.id);
                          const res = await fetch(
                            `/api/projects/${project.id}/archive`,
                            {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ archived: false }),
                            }
                          );
                          const payload = await res.json();
                          if (!res.ok) {
                            toast.error("Restore failed", {
                              description:
                                payload?.error || "Could not restore.",
                            });
                            return;
                          }
                          setData((prev) =>
                            prev.filter((p) => p.id !== project.id)
                          );
                          toast.success("Project restored");
                          router.refresh();
                        } catch (e) {
                          toast.error("Network error", {
                            description: e.message,
                          });
                        } finally {
                          setTogglingId(null);
                        }
                      }}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" /> Restore
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteClick(project.id)}
                      className="text-destructive focus:text-destructive"
                      disabled={isDeleting}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Permanently Delete
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem
                      className={`${project.show ? "text-red-600 focus:text-red-700" : "text-green-600 focus:text-green-700"}`}
                      onClick={async () => {
                        try {
                          setTogglingId(project.id);
                          const nextVal = !project.show;
                          const res = await fetch(
                            `/api/projects/${project.id}/visibility`,
                            {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ show: nextVal }),
                            }
                          );
                          const payload = await res.json();
                          if (!res.ok) {
                            toast.error("Update failed", {
                              description:
                                payload?.error ||
                                "Could not update visibility.",
                            });
                            return;
                          }
                          setData((prev) =>
                            prev.map((p) =>
                              p.id === project.id
                                ? { ...p, show: payload.show }
                                : p
                            )
                          );
                          toast.success(
                            payload.show
                              ? "Project is now visible"
                              : "Project hidden"
                          );
                        } catch (e) {
                          toast.error("Network error", {
                            description: e.message,
                          });
                        } finally {
                          setTogglingId(null);
                          router.refresh();
                        }
                      }}
                    >
                      {project.show ? (
                        <EyeOff className="mr-2 h-4 w-4" />
                      ) : (
                        <Eye className="mr-2 h-4 w-4" />
                      )}
                      {project.show ? "Hide" : "Show"}
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/discover/${project.slug || project.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/projects/${project.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteClick(project.id)}
                      className="text-destructive focus:text-destructive"
                      disabled={isDeleting}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Archive
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge
                variant="secondary"
                className="text-xs"
                style={{
                  backgroundColor: bgColor,
                  color: textColor,
                  border: bgColor ? `1px solid ${bgColor}` : undefined,
                }}
              >
                {titleCase}
              </Badge>
              <Badge
                variant={
                  project.daysLeft > 30
                    ? "default"
                    : project.daysLeft > 7
                      ? "secondary"
                      : "destructive"
                }
                className="text-xs"
              >
                {project.daysLeft} days left
              </Badge>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-muted-foreground">
                <span>
                  ₱
                  {(() => {
                    const calculatedGoal =
                      Array.isArray(project?.budgetItems) &&
                      project.budgetItems.length > 0
                        ? project.budgetItems.reduce(
                            (sum, item) => sum + (Number(item?.value) || 0),
                            0
                          )
                        : Number(project.goal) || 0;
                    return calculatedGoal.toLocaleString();
                  })()}
                </span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <Users className="mr-1 h-4 w-4" />
                <span>{project.teamMembers?.length || 0} members</span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Created: {new Date(project.createdAt).toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const filteredData = table.getRowModel().rows.map((row) => row.original);

  return (
    <div className="space-y-4 p-4 sm:p-0">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(String(event.target.value))}
              className="pl-9 w-full sm:w-[300px]"
            />
          </div>
          <Select
            value={table.getColumn("category")?.getFilterValue() ?? "all"}
            onValueChange={(value) =>
              table
                .getColumn("category")
                ?.setFilterValue(value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {initialCategories.map((c) => (
                <SelectItem key={c.id} value={c.name}>
                  {smartTitle(c.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Visibility filter */}
          <Select
            value={table.getColumn("show")?.getFilterValue() ?? "all"}
            onValueChange={(value) =>
              table
                .getColumn("show")
                ?.setFilterValue(value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Filter by visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="visible">Visible</SelectItem>
              <SelectItem value="hidden">Hidden</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground text-center sm:text-right">
          {table.getFilteredRowModel().rows.length} of{" "}
          {table.getCoreRowModel().rows.length} project(s)
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block rounded-md border bg-background">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="font-semibold">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No projects found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden">
        {filteredData.length > 0 ? (
          <div className="space-y-4">
            {filteredData.map((project) => (
              <MobileProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No projects found.
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="w-20"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="w-20"
          >
            Next
          </Button>
        </div>
      </div>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent className="mx-4 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {(() => {
                const proj = data.find((p) => p.id === projectToDeleteId);
                return proj?.archived
                  ? "Permanently delete project?"
                  : "Archive project?";
              })()}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const proj = data.find((p) => p.id === projectToDeleteId);
                if (proj?.archived) {
                  return "This will permanently delete the project and all associated data. This action cannot be undone.";
                }
                return "The project will be moved to the archive. You can restore it later or permanently delete it from the archive.";
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {data.find((p) => p.id === projectToDeleteId)?.archived
                    ? "Deleting..."
                    : "Archiving..."}
                </>
              ) : data.find((p) => p.id === projectToDeleteId)?.archived ? (
                "Permanently Delete"
              ) : (
                "Archive Project"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
