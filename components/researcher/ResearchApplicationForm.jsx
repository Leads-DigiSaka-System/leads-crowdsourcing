"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useEdgeStore } from "@/lib/edgestore";

// Import sections from admin project form
import { ProjectDetailsSection } from "@/components/admin/project/sections/ProjectDetailsSection";
import { ProjectContentSection } from "@/components/admin/project/sections/ProjectContentSection";
import { ScientistContentSection } from "@/components/admin/project/sections/ScientistContentSection";
import { TeamSection } from "@/components/admin/project/sections/TeamSection";
import { BudgetSection } from "@/components/admin/project/sections/BudgetSection";
import { TimelineSection } from "@/components/admin/project/sections/TimelineSection";

// Helper functions
const stripHtml = (html) =>
  (html ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();

const isRichTextEmpty = (html) => stripHtml(html) === "";

const parseEventDate = (dateStr) => {
  if (!dateStr) return new Date(0);
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date(0) : parsed;
};

const formSchema = z.object({
  title: z.string().min(1, "Project title is required"),
  authors: z.string().optional(),
  location: z.string().optional(),
  image: z.string().optional(),
  currency: z.string().min(1, "Currency is required"),
  daysLeft: z.union([
    z.number().min(1, "Days left is required and must be greater than 0"),
    z
      .string()
      .min(1, "Days left is required")
      .transform((val) => Number(val))
      .pipe(
        z.number().min(1, "Days left is required and must be greater than 0")
      ),
  ]),
  tags: z.array(z.string()).default([]),
  categoryId: z.string().min(1, "Category is required"),

  // Project Content
  overview: z
    .string()
    .refine((v) => !isRichTextEmpty(v), { message: "Overview is required" }),
  methods: z
    .string()
    .refine((v) => !isRichTextEmpty(v), { message: "Methods are required" }),
  labNotes: z.string().optional(),
  discussion: z.string().optional(),

  // Scientists Content
  contextAnswer: z.string().refine((v) => !isRichTextEmpty(v), {
    message: "Context answer is required",
  }),
  significanceAnswer: z.string().refine((v) => !isRichTextEmpty(v), {
    message: "Significance answer is required",
  }),
  goalsAnswer: z.string().refine((v) => !isRichTextEmpty(v), {
    message: "Goals answer is required",
  }),

  // Team
  teamDescription: z.string().refine((v) => !isRichTextEmpty(v), {
    message: "Team description is required",
  }),
  teamMembers: z
    .array(
      z.object({
        name: z.string().optional(),
        role: z.string().min(1, "Role is required"),
        responsibility: z.string().optional(),
        bio: z.string().optional(),
        image: z.string().optional(),
        imageAlt: z.string().optional(),
        email: z.string().optional(),
        linkedin: z.string().optional(),
        twitter: z.string().optional(),
        expertise: z.array(z.string()).default([]),
      })
    )
    .min(1, "At least one team member is required"),

  // Budget
  budgetDescription: z.string().refine((v) => !isRichTextEmpty(v), {
    message: "Budget description is required",
  }),
  budgetItems: z
    .array(
      z.object({
        name: z.string().min(1, "Item name is required"),
        description: z.string().optional(),
        value: z.union([
          z.number().min(1, "Value must be greater than 0"),
          z
            .string()
            .transform((val) => (val === "" ? 0 : Number(val)))
            .pipe(z.number().min(1, "Value must be greater than 0")),
        ]),
      })
    )
    .default([]),

  // Timeline
  timelineDescription: z.string().refine((v) => !isRichTextEmpty(v), {
    message: "Timeline description is required",
  }),
  timelineDurationMonths: z
    .union([
      z.number().int().positive(),
      z
        .string()
        .transform((v) => (v === "" ? undefined : Number(v)))
        .pipe(z.number().int().positive()),
    ])
    .optional(),
  timelineEvents: z
    .array(
      z.object({
        date: z.string().min(1, "Date is required"),
        title: z.string().min(1, "Event title is required"),
      })
    )
    .default([]),
});

export default function ResearchApplicationForm({
  categories = [],
  applicationId = null,
  isViewMode = false,
  isResearcher = false,
  applicationCount = 0,
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [categoryOptions, setCategoryOptions] = useState(categories);
  const { edgestore } = useEdgeStore();
  const [isLoadingApplication, setIsLoadingApplication] =
    useState(!!applicationId);

  // Dynamic form state
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newTeamMember, setNewTeamMember] = useState({
    name: "",
    role: "",
    responsibility: "",
    bio: "",
    image: "",
    imageAlt: "",
    email: "",
    linkedin: "",
    twitter: "",
    expertise: [],
  });
  const [teamImagePreview, setTeamImagePreview] = useState(null);
  const [teamUploadProgress, setTeamUploadProgress] = useState(0);
  const [isUploadingTeamImage, setIsUploadingTeamImage] = useState(false);
  const [teamTempImageUrl, setTeamTempImageUrl] = useState("");
  const [tempTeamImageUrls, setTempTeamImageUrls] = useState([]);
  const [newBudgetItem, setNewBudgetItem] = useState({
    name: "",
    description: "",
    value: "",
  });
  const [newTimelineEvent, setNewTimelineEvent] = useState({
    date: "",
    title: "",
  });
  const [isEditMemberOpen, setIsEditMemberOpen] = useState(false);
  const [editMemberIndex, setEditMemberIndex] = useState(null);
  const [editMember, setEditMember] = useState({
    name: "",
    role: "",
    responsibility: "",
    bio: "",
    image: "",
    imageAlt: "",
    email: "",
    linkedin: "",
    twitter: "",
    expertise: [],
  });
  const [editTeamImagePreview, setEditTeamImagePreview] = useState(null);
  const [editTeamUploadProgress, setEditTeamUploadProgress] = useState(0);
  const [isUploadingEditTeamImage, setIsUploadingEditTeamImage] =
    useState(false);
  const [editTeamTempImageUrl, setEditTeamTempImageUrl] = useState("");

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      authors: "",
      location: "",
      image: "",
      currency: "PHP",
      daysLeft: "",
      tags: [],
      categoryId: "",
      overview: "",
      methods: "",
      labNotes: "",
      discussion: "",
      contextAnswer: "",
      significanceAnswer: "",
      goalsAnswer: "",
      teamDescription: "",
      teamMembers: [],
      budgetDescription: "",
      budgetItems: [],
      timelineDescription: "",
      timelineDurationMonths: undefined,
      timelineEvents: [],
    },
  });

  // Load existing application if editing or viewing
  useEffect(() => {
    if (applicationId) {
      loadApplication();
    }
  }, [applicationId]);

  const loadApplication = async () => {
    try {
      setIsLoadingApplication(true);
      const response = await fetch(
        `/api/researcher-applications/${applicationId}`
      );
      const data = await response.json();

      if (data.success && data.application) {
        const app = data.application;
        form.reset({
          title: app.title || "",
          authors: app.authors || "",
          location: app.location || "",
          image: app.image || "",
          currency: app.currency || "PHP",
          daysLeft: app.daysLeft || "",
          tags: app.tags || [],
          categoryId: app.categoryId || "",
          overview: app.overview || "",
          methods: app.methods || "",
          labNotes: app.labNotes || "",
          discussion: app.discussion || "",
          contextAnswer: app.contextAnswer || "",
          significanceAnswer: app.significanceAnswer || "",
          goalsAnswer: app.goalsAnswer || "",
          teamDescription: app.teamDescription || "",
          teamMembers: app.teamMembers || [],
          budgetDescription: app.budgetDescription || "",
          budgetItems: app.budgetItems || [],
          timelineDescription: app.timelineDescription || "",
          timelineDurationMonths: app.timelineDurationMonths || undefined,
          timelineEvents: app.timelineEvents || [],
        });

        if (app.image) {
          setImagePreview(app.image);
          setTempImageUrl(app.image);
        }
      } else {
        toast.error("Failed to load application");
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error loading application:", error);
      toast.error("Failed to load application");
      router.push("/dashboard");
    } finally {
      setIsLoadingApplication(false);
    }
  };

  // Tag management
  const addTag = () => {
    if (newTag.trim() && !form.getValues("tags").includes(newTag.trim())) {
      form.setValue("tags", [...form.getValues("tags"), newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove) => {
    const currentTags = form.getValues("tags");
    form.setValue(
      "tags",
      currentTags.filter((tag) => tag !== tagToRemove)
    );
  };

  // Team member management
  const addTeamMember = () => {
    if (newTeamMember.role) {
      const memberToAdd = { ...newTeamMember };
      if (teamTempImageUrl) {
        memberToAdd.image = teamTempImageUrl;
        setTempTeamImageUrls((prev) => [...prev, teamTempImageUrl]);
      }
      form.setValue("teamMembers", [
        ...form.getValues("teamMembers"),
        memberToAdd,
      ]);
      setNewTeamMember({
        name: "",
        role: "",
        responsibility: "",
        bio: "",
        image: "",
        imageAlt: "",
        email: "",
        linkedin: "",
        twitter: "",
        expertise: [],
      });
      setTeamImagePreview(null);
      setTeamTempImageUrl("");
      setTeamUploadProgress(0);
    }
  };

  const removeTeamMember = (index) => {
    const currentMembers = form.getValues("teamMembers");
    form.setValue(
      "teamMembers",
      currentMembers.filter((_, i) => i !== index)
    );
  };

  // Budget item management
  const addBudgetItem = () => {
    if (newBudgetItem.name && Number(newBudgetItem.value) > 0) {
      form.setValue("budgetItems", [
        ...form.getValues("budgetItems"),
        {
          ...newBudgetItem,
          value: Number(newBudgetItem.value),
        },
      ]);
      setNewBudgetItem({ name: "", description: "", value: "" });
    }
  };

  const removeBudgetItem = (index) => {
    const currentItems = form.getValues("budgetItems");
    form.setValue(
      "budgetItems",
      currentItems.filter((_, i) => i !== index)
    );
  };

  // Timeline event management
  const addTimelineEvent = (evt) => {
    const eventToAdd = evt || newTimelineEvent;
    if (eventToAdd.date && eventToAdd.title) {
      form.setValue("timelineEvents", [
        ...form.getValues("timelineEvents"),
        eventToAdd,
      ]);
      if (!evt) {
        setNewTimelineEvent({ date: "", title: "" });
      }
    }
  };

  const removeTimelineEvent = (index) => {
    const currentEvents = form.getValues("timelineEvents");
    form.setValue(
      "timelineEvents",
      currentEvents.filter((_, i) => i !== index)
    );
  };

  // Image upload handlers
  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result);
      };
      reader.readAsDataURL(file);

      const res = await edgestore.publicFiles.upload({
        file,
        options: { temporary: true },
        onProgressChange: (progress) => {
          setUploadProgress(progress);
        },
      });

      setTempImageUrl(res.url);
      setUploadedImage(file);
      form.setValue("image", res.url);
    } catch (e) {
      console.error("Image upload error:", e);
      toast.error("Failed to upload image");
      setImagePreview(null);
      setUploadProgress(0);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeImage = async () => {
    if (tempImageUrl) {
      try {
        await edgestore.publicFiles.delete({ url: tempImageUrl });
      } catch (e) {
        console.error("Failed to delete temp image:", e);
      }
    }
    setUploadedImage(null);
    setImagePreview(null);
    setTempImageUrl("");
    setUploadProgress(0);
    form.setValue("image", "");
  };

  // Team member image handlers
  const handleTeamImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingTeamImage(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        setTeamImagePreview(e.target?.result);
      };
      reader.readAsDataURL(file);

      const res = await edgestore.publicFiles.upload({
        file,
        options: { temporary: true },
        onProgressChange: (progress) => {
          setTeamUploadProgress(progress);
        },
      });

      setTeamTempImageUrl(res.url);
    } catch (e) {
      console.error("Team image upload error:", e);
      toast.error("Failed to upload team member image");
    } finally {
      setIsUploadingTeamImage(false);
    }
  };

  const removeTeamImage = async () => {
    if (teamTempImageUrl) {
      try {
        await edgestore.publicFiles.delete({ url: teamTempImageUrl });
      } catch (e) {
        console.error("Failed to delete temp team image:", e);
      }
    }
    setTeamTempImageUrl("");
    setTeamImagePreview(null);
    setTeamUploadProgress(0);
  };

  // Edit team member handlers
  const openEditMember = (index) => {
    const members = form.getValues("teamMembers");
    const m = members[index];
    setEditMemberIndex(index);
    setEditMember({ ...m });
    setEditTeamImagePreview(m?.image || null);
    setEditTeamTempImageUrl("");
    setEditTeamUploadProgress(0);
    setIsEditMemberOpen(true);
  };

  const handleEditTeamImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingEditTeamImage(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditTeamImagePreview(e.target?.result);
      };
      reader.readAsDataURL(file);

      const res = await edgestore.publicFiles.upload({
        file,
        options: { temporary: true },
        onProgressChange: (progress) => {
          setEditTeamUploadProgress(progress);
        },
      });

      setEditTeamTempImageUrl(res.url);
      setEditMember((prev) => ({ ...prev, image: res.url }));
    } catch (e) {
      console.error("Edit team image error:", e);
      toast.error("Failed to upload image");
    } finally {
      setIsUploadingEditTeamImage(false);
    }
  };

  const removeEditTeamImage = async () => {
    if (editTeamTempImageUrl) {
      try {
        await edgestore.publicFiles.delete({ url: editTeamTempImageUrl });
      } catch (e) {
        console.error("Failed to delete edit team image:", e);
      }
    }
    setEditTeamTempImageUrl("");
    setEditTeamImagePreview(null);
    setEditTeamUploadProgress(0);
    setEditMember((prev) => ({ ...prev, image: "" }));
  };

  const saveEditedMember = () => {
    if (editMemberIndex == null) return;
    const members = form.getValues("teamMembers");
    const updated = members.map((m, i) =>
      i === editMemberIndex ? { ...editMember } : m
    );
    form.setValue("teamMembers", updated);
    setIsEditMemberOpen(false);
  };

  const onSubmit = async (data) => {
    // Check application limit for non-researchers
    if (!isResearcher && !applicationId && applicationCount >= 3) {
      toast.error("You have reached the maximum limit of 3 applications");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Confirm temporary images
      if (tempImageUrl) {
        try {
          await edgestore.publicFiles.confirmUpload({ url: tempImageUrl });
        } catch (e) {
          console.error("Failed to confirm main image:", e);
        }
      }

      for (const url of tempTeamImageUrls) {
        try {
          await edgestore.publicFiles.confirmUpload({ url });
        } catch (e) {
          console.error("Failed to confirm team image:", e);
        }
      }

      const payload = {
        ...data,
        daysLeft: parseInt(data.daysLeft),
        timelineDurationMonths: data.timelineDurationMonths
          ? parseInt(data.timelineDurationMonths)
          : null,
      };

      const url = applicationId
        ? `/api/researcher-applications/${applicationId}`
        : `/api/researcher-applications`;
      const method = applicationId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        router.push("/dashboard");
      } else {
        setError(result.message || "Failed to submit application");
        toast.error(result.message || "Failed to submit application");
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      setError("An error occurred while submitting your application");
      toast.error("An error occurred while submitting your application");
    } finally {
      setIsLoading(false);
    }
  };

  const watchedTimelineEvents = form.watch("timelineEvents");
  const timelineEventsSorted = Array.isArray(watchedTimelineEvents)
    ? [...watchedTimelineEvents].sort(
        (a, b) => parseEventDate(a?.date) - parseEventDate(b?.date)
      )
    : [];

  if (isLoadingApplication) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (isViewMode) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This application has been {form.getValues("status")} and cannot be
            edited.
          </AlertDescription>
        </Alert>
        {/* Show read-only view - you can expand this later */}
        <div className="text-center py-8">
          <p className="text-gray-600">Viewing application details...</p>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="mt-4"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, (errors) => {
            const firstError = Object.values(errors)[0];
            if (firstError?.message) {
              toast.error(firstError.message);
            }
          })}
          noValidate
          className="space-y-8"
        >
          <ProjectDetailsSection
            form={form}
            categoryOptions={categoryOptions}
            onCategoriesUpdated={async () => {
              // Refresh categories (not allowed to create new ones)
            }}
            imagePreview={imagePreview}
            isUploadingImage={isUploadingImage}
            uploadProgress={uploadProgress}
            uploadedImage={uploadedImage}
            tempImageUrl={tempImageUrl}
            onImageUpload={handleImageUpload}
            onRemoveImage={removeImage}
            newTag={newTag}
            setNewTag={setNewTag}
            addTag={addTag}
            removeTag={removeTag}
            hideCategoryManagement={true} // Hide the "Manage Categories" button
          />

          <ProjectContentSection form={form} />

          <ScientistContentSection form={form} />

          <TeamSection
            form={form}
            newTeamMember={newTeamMember}
            setNewTeamMember={setNewTeamMember}
            addTeamMember={addTeamMember}
            removeTeamMember={removeTeamMember}
            teamImagePreview={teamImagePreview}
            teamUploadProgress={teamUploadProgress}
            isUploadingTeamImage={isUploadingTeamImage}
            onTeamImageUpload={handleTeamImageUpload}
            onRemoveTeamImage={removeTeamImage}
            isEditMemberOpen={isEditMemberOpen}
            setIsEditMemberOpen={setIsEditMemberOpen}
            openEditMember={openEditMember}
            editMember={editMember}
            setEditMember={setEditMember}
            editTeamImagePreview={editTeamImagePreview}
            editTeamUploadProgress={editTeamUploadProgress}
            isUploadingEditTeamImage={isUploadingEditTeamImage}
            onEditTeamImageUpload={handleEditTeamImageUpload}
            onRemoveEditTeamImage={removeEditTeamImage}
            saveEditedMember={saveEditedMember}
          />

          <BudgetSection
            form={form}
            newBudgetItem={newBudgetItem}
            setNewBudgetItem={setNewBudgetItem}
            addBudgetItem={addBudgetItem}
            removeBudgetItem={removeBudgetItem}
          />

          <TimelineSection
            form={form}
            newTimelineEvent={newTimelineEvent}
            setNewTimelineEvent={setNewTimelineEvent}
            addTimelineEvent={addTimelineEvent}
            removeTimelineEvent={removeTimelineEvent}
            timelineEventsSorted={timelineEventsSorted}
          />

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard")}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {applicationId ? "Updating..." : "Submitting..."}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {applicationId ? "Update Application" : "Submit Application"}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
