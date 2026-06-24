"use client";
import { parseEventDate } from "@/components/ProjectPage/timeline/project-timeline-content";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useEdgeStore } from "@/lib/edgestore";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
// Sections
import { BudgetSection } from "@/components/admin/project/sections/BudgetSection";
import { ProjectContentSection } from "@/components/admin/project/sections/ProjectContentSection";
import { ProjectDetailsSection } from "@/components/admin/project/sections/ProjectDetailsSection";
import { ScientistContentSection } from "@/components/admin/project/sections/ScientistContentSection";
import { TeamSection } from "@/components/admin/project/sections/TeamSection";
import { TimelineSection } from "@/components/admin/project/sections/TimelineSection";
import imageCompression from "browser-image-compression";

// Helper: treat RTE values that only contain tags/whitespace as empty
const stripHtml = (html) =>
  (html ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();

const isRichTextEmpty = (html) => stripHtml(html) === "";

const formSchema = z.object({
  // Project Details
  title: z.string().min(1, "Project title is required"),
  tagline: z.string().min(1, "Tagline is required"),
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
        id: z.number().int().optional(),
        clientId: z.string().optional(),
        name: z.string().min(1, "Item name is required"),
        description: z.string().optional(),
        value: z.number().min(1, "Value must be greater than 0"),

        allocated: z.number().int().optional(),
        allocations: z.any().optional(),
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

export function EditProjectForm({ project, categories = [] }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [categoryOptions, setCategoryOptions] = useState(categories);
  const { edgestore } = useEdgeStore();

  // Dynamic form state
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(project.image);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState("");
  // Track previous image for deletion on update
  const [previousImageUrl, setPreviousImageUrl] = useState("");
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
  const [newBudgetItem, setNewBudgetItem] = useState({
    name: "",
    description: "",
    value: "",
  });
  const [newTimelineEvent, setNewTimelineEvent] = useState({
    date: "",
    title: "",
  });
  // Team edit dialog state and temp uploads
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
  const [tempTeamImageUrls, setTempTeamImageUrls] = useState([]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: project.title || "",
      tagline: project.tagline || "",
      authors: project.authors || "",
      location: project.location || "",
      image: project.image || "",
      currency: project.currency || "PHP",
      daysLeft: project.daysLeft || 0,
      tags: project.tags || [],
      categoryId: project.categoryId || project.category?.id || "",
      overview: project.overview || "",
      methods: project.methods || "",
      labNotes: project.labNotes || "",
      discussion: project.discussion || "",
      contextAnswer: project.contextAnswer || "",
      significanceAnswer: project.significanceAnswer || "",
      goalsAnswer: project.goalsAnswer || "",
      teamDescription: project.teamDescription || "",
      teamMembers: Array.isArray(project.teamMembers)
        ? project.teamMembers.map((m) => ({
            ...m,
            responsibility: m.responsibility || "",
            bio: m.bio || "",
            image: m.image || "",
            imageAlt: m.imageAlt || "",
            email: m.email || "",
            linkedin: m.linkedin || "",
            twitter: m.twitter || "",
          }))
        : [],
      budgetDescription: project.budgetDescription || "",

      budgetItems: Array.isArray(project.budgetItems)
        ? project.budgetItems.map((it) => ({
            id: it.id,
            clientId: String(it.id),
            name: it.name,
            description: it.description || "",
            value: Number(it.value) || 0,
            allocated: Number(it.allocated) || 0,
            allocations: Array.isArray(it.allocations) ? it.allocations : [],
          }))
        : [],
      timelineDescription: project.timelineDescription || "",
      timelineDurationMonths: project.timelineDurationMonths ?? undefined,
      timelineEvents: project.timelineEvents || [],
    },
  });

  // categories handled via section dialog

  const addTag = () => {
    if (newTag.trim() && !form.getValues("tags").includes(newTag.trim())) {
      const currentTags = form.getValues("tags");
      form.setValue("tags", [...currentTags, newTag.trim()]);
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

  const addTeamMember = () => {
    if (newTeamMember.name && newTeamMember.role) {
      const currentMembers = form.getValues("teamMembers");
      // Ensure all optional string fields are empty string, not null
      const cleanMember = {
        ...newTeamMember,
        responsibility: newTeamMember.responsibility || "",
        bio: newTeamMember.bio || "",
        image: newTeamMember.image || "",
        imageAlt: newTeamMember.imageAlt || "",
        email: newTeamMember.email || "",
        linkedin: newTeamMember.linkedin || "",
        twitter: newTeamMember.twitter || "",
      };
      form.setValue("teamMembers", [...currentMembers, cleanMember]);
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
    }
  };

  const removeTeamMember = (index) => {
    const currentMembers = form.getValues("teamMembers");
    form.setValue(
      "teamMembers",
      currentMembers.filter((_, i) => i !== index)
    );
  };

  const addBudgetItem = () => {
    const numericValue = Number(newBudgetItem.value);
    if (newBudgetItem.name && numericValue > 0) {
      const currentItems = form.getValues("budgetItems");
      const clientId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      form.setValue("budgetItems", [
        ...currentItems,
        { ...newBudgetItem, value: numericValue, clientId },
      ]);
      setNewBudgetItem({
        name: "",
        description: "",
        value: "",
      });
    }
  };

  const removeBudgetItem = (index) => {
    const currentItems = form.getValues("budgetItems");
    form.setValue(
      "budgetItems",
      currentItems.filter((_, i) => i !== index)
    );
  };

  const addTimelineEvent = (evt) => {
    const eventToAdd = evt || newTimelineEvent;
    if (eventToAdd.date && eventToAdd.title) {
      const currentEvents = form.getValues("timelineEvents");
      form.setValue("timelineEvents", [...currentEvents, { ...eventToAdd }]);
      setNewTimelineEvent({ date: "", title: "" });
    }
  };

  const removeTimelineEvent = (index) => {
    const currentEvents = form.getValues("timelineEvents");
    form.setValue(
      "timelineEvents",
      currentEvents.filter((_, i) => i !== index)
    );
  };

  // Using shared TimelineDatePicker via TimelineSection

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPreviousImageUrl(tempImageUrl || imagePreview);

    try {
      setIsUploadingImage(true);
      setUploadProgress(0);
      setError("");

      // Compress and convert to WebP
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
        fileType: "image/webp",
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);

      setUploadedImage(compressedFile);

      const res = await edgestore.publicFiles.upload({
        file: compressedFile,
        options: { temporary: true },
        onProgressChange: (p) => setUploadProgress(p),
      });

      setTempImageUrl(res.url);
      setImagePreview(res.url);
      form.setValue("image", res.url);
      toast.success(
        "Image uploaded (temporary). It will be confirmed on save."
      );
    } catch (e) {
      console.error(e);
      setError("Failed to upload image. Please try again.");
      toast.error("Failed to upload image");
      setUploadedImage(null);
      setImagePreview(project.image || null);
      setTempImageUrl("");
      form.setValue("image", project.image || "");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeImage = async () => {
    if (tempImageUrl) {
      try {
        await edgestore.publicFiles.delete({ url: tempImageUrl });
      } catch (e) {
        console.warn("Failed to delete temp image:", e);
      }
    }
    setUploadedImage(null);
    setImagePreview(null);
    setTempImageUrl("");
    setUploadProgress(0);
    form.setValue("image", "");
  };

  // Edit team member dialog helpers
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
      setEditTeamUploadProgress(0);
      // Compress and convert to WebP
      const options = {
        maxSizeMB: 1, // Target size (adjust as needed)
        maxWidthOrHeight: 1200, // Resize if needed
        fileType: "image/webp", // Convert to WebP
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);

      const res = await edgestore.publicFiles.upload({
        file: compressedFile,
        options: { temporary: true },
        onProgressChange: (p) => setEditTeamUploadProgress(p),
      });
      setEditTeamTempImageUrl(res.url);
      setEditTeamImagePreview(res.url);
      setEditMember((prev) => ({ ...prev, image: res.url }));
      setTempTeamImageUrls((prev) => Array.from(new Set([...prev, res.url])));
    } catch (e) {
      console.error(e);
      toast.error("Failed to upload new team photo");
    } finally {
      setIsUploadingEditTeamImage(false);
    }
  };

  const removeEditTeamImage = async () => {
    if (editTeamTempImageUrl) {
      try {
        await edgestore.publicFiles.delete({ url: editTeamTempImageUrl });
      } catch (e) {
        console.warn("Failed to delete temp team image (edit):", e);
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
    // Ensure all optional string fields are empty string, not null
    const cleanEditMember = {
      ...editMember,
      responsibility: editMember.responsibility || "",
      bio: editMember.bio || "",
      image: editMember.image || "",
      imageAlt: editMember.imageAlt || "",
      email: editMember.email || "",
      linkedin: editMember.linkedin || "",
      twitter: editMember.twitter || "",
    };
    const updated = members.map((m, i) =>
      i === editMemberIndex ? cleanEditMember : m
    );
    form.setValue("teamMembers", updated);
    setIsEditMemberOpen(false);
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError("");

    try {
      // Sanitize teamMembers before submit (for edits)
      const cleanTeamMembers = Array.isArray(data.teamMembers)
        ? data.teamMembers.map((m) => ({
            ...m,
            bio: m.bio || "",
            image: m.image || "",
            imageAlt: m.imageAlt || "",
            email: m.email || "",
            linkedin: m.linkedin || "",
            twitter: m.twitter || "",
          }))
        : [];

      // Confirm temporary image if needed
      let finalImageUrl = data.image || "";
      if (tempImageUrl && data.image === tempImageUrl) {
        try {
          const confirmed = await edgestore.publicFiles.confirmUpload({
            url: tempImageUrl,
          });
          finalImageUrl = confirmed?.url || tempImageUrl;
        } catch (e) {
          console.error(e);
          finalImageUrl = "";
        }
      }

      // Delete previous image only if it is different from the new image
      if (previousImageUrl && previousImageUrl !== finalImageUrl) {
        try {
          await edgestore.publicFiles.delete({ url: previousImageUrl });
        } catch (e) {}
      }

      // Confirm team images and default when missing
      const defaultAvatar = null;
      const payloadTeamMembers = await Promise.all(
        cleanTeamMembers.map(async (m) => {
          let img = m.image;
          if (!img) {
            img = defaultAvatar;
          } else if (tempTeamImageUrls.includes(img)) {
            try {
              const confirmed = await edgestore.publicFiles.confirmUpload({
                url: img,
              });
              img = confirmed?.url || img;
            } catch (e) {
              console.warn("Failed to confirm team image, using default:", e);
              img = defaultAvatar;
            }
          }
          return { ...m, image: img };
        })
      );

      const calculatedGoal = Array.isArray(data.budgetItems)
        ? data.budgetItems.reduce(
            (sum, item) => sum + (Number(item.value) || 0),
            0
          )
        : 0;

      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          goal: calculatedGoal,
          image: finalImageUrl,
          teamMembers: payloadTeamMembers,
        }),
      });

      if (response.ok) {
        toast.success("Project updated successfully!");
        setUploadedImage(null);
        setTempImageUrl("");
        setUploadProgress(0);
        setIsEditMemberOpen(false);
        setEditMemberIndex(null);
        setEditTeamTempImageUrl("");
        setEditTeamImagePreview(null);
        setEditTeamUploadProgress(0);
        setTempTeamImageUrls([]);
        setPreviousImageUrl("");
        router.push("/admin/projects");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update project");
        toast.error(errorData.error || "Failed to update project");
      }
    } catch (error) {
      setError("An error occurred while updating the project");
      toast.error("An error occurred while updating the project");
    } finally {
      setIsLoading(false);
    }
  };

  // Keep timeline preview ordered by date (supports single dates and ranges)
  const watchedTimelineEvents = form.watch("timelineEvents");
  const timelineEventsSorted = Array.isArray(watchedTimelineEvents)
    ? [...watchedTimelineEvents].sort(
        (a, b) => parseEventDate(a?.date) - parseEventDate(b?.date)
      )
    : [];

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, (errors) => {
            toast.error(
              "Please complete all required fields before submitting"
            );
          })}
          noValidate
          className="space-y-8"
        >
          <ProjectDetailsSection
            form={form}
            categoryOptions={categoryOptions}
            onCategoriesUpdated={async () => {
              try {
                const res = await fetch("/api/categories", {
                  cache: "no-store",
                });
                const list = await res.json();
                if (Array.isArray(list)) {
                  const current = form.getValues("categoryId");
                  setCategoryOptions(list);
                  if (current && !list.find((c) => c.id === current)) {
                    form.setValue("categoryId", "");
                  }
                }
              } catch {}
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
          />

          <ProjectContentSection form={form} />

          <ScientistContentSection form={form} />

          <TeamSection
            form={form}
            newTeamMember={newTeamMember}
            setNewTeamMember={setNewTeamMember}
            addTeamMember={addTeamMember}
            removeTeamMember={removeTeamMember}
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

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
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
                  Updating Project...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Project
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
