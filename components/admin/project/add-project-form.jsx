"use client";
import { ImportPreviewDialog } from "@/components/admin/project/ImportPreviewDialog";
import { parseEventDate } from "@/components/ProjectPage/timeline/project-timeline-content";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useEdgeStore } from "@/lib/edgestore";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Cloud,
  CloudUpload,
  Loader2,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
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
        name: z.string().optional(), // Name is now optional
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

export function AddProjectForm({
  categories = [],
  initialDraftId = null,
  forceNewDraft = false,
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [categoryOptions, setCategoryOptions] = useState(categories);
  const { edgestore } = useEdgeStore();

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
  // Team member image upload (temporary) state for the composer
  const [teamImagePreview, setTeamImagePreview] = useState(null);
  const [teamUploadProgress, setTeamUploadProgress] = useState(0);
  const [isUploadingTeamImage, setIsUploadingTeamImage] = useState(false);
  const [teamTempImageUrl, setTeamTempImageUrl] = useState("");
  // Track all temp team image URLs to confirm on submit
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
  // Edit team member dialog state
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

  // categories managed via section's ManageCategoriesDialog

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      tagline: "",
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

  // --- Autosave State ---
  const [autosaveStatus, setAutosaveStatus] = useState("idle");
  const [draftId, setDraftId] = useState(initialDraftId);
  const forceNewRef = useRef(forceNewDraft);
  const lastSavedRef = useRef({}); // snapshot of last saved partial
  const changedSinceSaveRef = useRef(false);
  const abortControllerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const retryCountRef = useRef(0);
  const suppressAutosaveRef = useRef(true); // block autosave until initial draft load completes

  // Fields to ignore for autosave (pure UI helpers)
  const AUTOSAVE_FIELDS_IGNORE = new Set([
    // dynamic builders not in form or temporary
  ]);

  // Extract only changed fields compared to lastSavedRef
  const computeDiff = (current) => {
    const diff = {};
    for (const [key, value] of Object.entries(current)) {
      if (AUTOSAVE_FIELDS_IGNORE.has(key)) continue;
      const prev = lastSavedRef.current[key];
      // Simple deep compare for primitives / arrays / objects via JSON stringify (fast enough for form size)
      const changed = JSON.stringify(prev) !== JSON.stringify(value);
      if (changed) diff[key] = value;
    }
    return diff;
  };

  // Define performAutosave before scheduleAutosave to avoid TDZ error
  const performAutosave = useCallback(async () => {
    const values = form.getValues();
    const diff = computeDiff(values);
    if (Object.keys(diff).length === 0) {
      if (autosaveStatus === "pending") setAutosaveStatus("saved");
      return;
    }
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setAutosaveStatus("saving");
    try {
      const res = await fetch("/api/projects/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId,
          data: diff,
          forceNew: forceNewRef.current && !draftId,
        }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      if (json?.id && !draftId) {
        setDraftId(json.id);
        forceNewRef.current = false;
      }
      lastSavedRef.current = { ...lastSavedRef.current, ...diff };
      changedSinceSaveRef.current = false;
      setAutosaveStatus("saved");
      retryCountRef.current = 0;
    } catch (e) {
      if (e.name === "AbortError") return;
      setAutosaveStatus("error");
      if (retryCountRef.current < 3) {
        const delay = 1500 * Math.pow(2, retryCountRef.current);
        retryCountRef.current += 1;
        setTimeout(() => {
          void performAutosave();
        }, delay);
      }
    }
  }, [draftId, autosaveStatus, form]);

  const scheduleAutosave = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    // Mark pending only if not already saving (avoid flicker)
    setAutosaveStatus((prev) => (prev === "saving" ? prev : "pending"));
    debounceTimerRef.current = setTimeout(() => {
      void performAutosave();
    }, 5000); // 5s inactivity debounce
  }, [performAutosave]);

  // Watch form changes (generic) using react-hook-form subscription
  useEffect(() => {
    // establish initial baseline so empty diff not sent
    lastSavedRef.current = form.getValues();
    const subscription = form.watch(() => {
      if (suppressAutosaveRef.current) return;
      scheduleAutosave();
    });
    return () => subscription.unsubscribe();
  }, [form, scheduleAutosave]);

  // Load existing draft if initialDraftId provided
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!draftId) {
        suppressAutosaveRef.current = false;
        return;
      }
      try {
        const res = await fetch(`/api/projects/drafts/${draftId}`);
        if (res.status === 404) {
          setDraftId(null);
          suppressAutosaveRef.current = false;
          return;
        }
        if (!res.ok) {
          suppressAutosaveRef.current = false;
          return;
        }
        const json = await res.json();
        if (!cancelled && json?.data) {
          form.reset({ ...form.getValues(), ...json.data });
          lastSavedRef.current = { ...json.data };
          // Restore image preview state from draft data
          if (json.data.image) {
            setImagePreview(json.data.image);
            setTempImageUrl(json.data.image);
            form.setValue("image", json.data.image);
          } else {
            setImagePreview(null);
            setTempImageUrl("");
          }
          setAutosaveStatus("saved");
        }
      } catch {
      } finally {
        suppressAutosaveRef.current = false;
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [draftId, form]);

  // Add effect to react to URL param changes (initialDraftId prop updates) for dynamic draft switching without reload.
  useEffect(() => {
    // If prop initialDraftId changes (via navigation) and differs from current draftId, switch.
    if (initialDraftId !== draftId) {
      // Reset state for new draft load.
      setDraftId(initialDraftId);
      suppressAutosaveRef.current = true;
      lastSavedRef.current = initialDraftId ? {} : form.getValues();
    }
  }, [initialDraftId]);

  // Clear current draft state if forceNewDraft prop is true
  useEffect(() => {
    if (forceNewDraft) {
      // user requested a fresh draft; clear any existing draft data
      setDraftId(null);
      lastSavedRef.current = form.getValues(); // baseline
      suppressAutosaveRef.current = false;
    }
  }, [forceNewDraft]);

  // If user is on /add-project without selecting a draft or requesting newDraft, force creation of a new draft.
  useEffect(() => {
    // If user is on /add-project without selecting a draft or requesting newDraft, force creation of a new draft.
    if (!initialDraftId && !forceNewDraft) {
      forceNewRef.current = true;
    }
  }, []);

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
    if (newTeamMember.role) {
      // Only require role, name is optional now
      const currentMembers = form.getValues("teamMembers");
      const memberToAdd = {
        ...newTeamMember,
        image: teamTempImageUrl || newTeamMember.image || "",
      };
      form.setValue("teamMembers", [...currentMembers, memberToAdd]);
      if (teamTempImageUrl) {
        setTempTeamImageUrls((prev) =>
          Array.from(new Set([...prev, teamTempImageUrl]))
        );
      }
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
      setTeamTempImageUrl("");
      setTeamImagePreview(null);
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

  const addBudgetItem = () => {
    if (newBudgetItem.name && Number(newBudgetItem.value) > 0) {
      const currentItems = form.getValues("budgetItems");
      const valueToAdd = Number(newBudgetItem.value);
      form.setValue("budgetItems", [
        ...currentItems,
        { ...newBudgetItem, value: valueToAdd },
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
      // ensure autosave picks up immediately
      try {
        if (!suppressAutosaveRef.current) {
          setAutosaveStatus("saving");
          void performAutosave();
        }
      } catch {}
      if (!evt) {
        setNewTimelineEvent({ date: "", title: "" });
      } else {
        // also reset composer state
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
    // eager autosave on destructive change
    try {
      if (!suppressAutosaveRef.current) {
        setAutosaveStatus("saving");
        void performAutosave();
      }
    } catch {}
  };

  // TimelineDatePicker moved to reusable component at components/ui/timeline-date-picker.jsx

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      setUploadProgress(0);
      setError("");

      // Compress and convert to WebP
      const options = {
        maxSizeMB: 1, // Target size (adjust as needed)
        maxWidthOrHeight: 2000, // Resize if needed
        fileType: "image/webp", // Convert to WebP
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);

      setUploadedImage(compressedFile);

      // Start upload to EdgeStore as a temporary file
      const res = await edgestore.publicFiles.upload({
        file: compressedFile,
        options: { temporary: true },
        onProgressChange: (p) => setUploadProgress(p),
      });

      setTempImageUrl(res.url);
      setImagePreview(res.url);
      form.setValue("image", res.url);
      // Eager autosave for image so it isn't lost if user leaves quickly
      try {
        // Cancel any pending debounce
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        // Only autosave if not suppressed (draft fully loaded) and image actually differs
        if (!suppressAutosaveRef.current) {
          setAutosaveStatus("saving");
          await performAutosave();
        }
      } catch {
        /* ignore */
      }
      toast.success(
        "Image uploaded (temporary). It will be confirmed on save."
      );
    } catch (e) {
      console.error(e);
      setError("Failed to upload image. Please try again.");
      toast.error("Failed to upload image");
      setUploadedImage(null);
      setImagePreview(null);
      setTempImageUrl("");
      form.setValue("image", "");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeImage = async () => {
    if (tempImageUrl) {
      try {
        await edgestore.publicFiles.deleteFile({ url: tempImageUrl });
      } catch (e) {
        console.warn("Failed to delete temp image:", e);
      }
    }
    setUploadedImage(null);
    setImagePreview(null);
    setTempImageUrl("");
    setUploadProgress(0);
    form.setValue("image", "");
    // Persist removal immediately
    try {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (!suppressAutosaveRef.current) {
        setAutosaveStatus("saving");
        await performAutosave();
      }
    } catch {
      /* ignore */
    }
  };

  // Team member image upload handlers (temporary)
  const handleTeamImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingTeamImage(true);
      setTeamUploadProgress(0);
      setError("");

      // Compress and convert to WebP
      const options = {
        maxSizeMB: 1, // Target size (adjust as needed)
        maxWidthOrHeight: 1200, // Resize if needed
        fileType: "image/webp", // Convert to WebP
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);

      // Upload compressed WebP to EdgeStore
      const res = await edgestore.publicFiles.upload({
        file: compressedFile,
        options: { temporary: true },
        onProgressChange: (p) => setTeamUploadProgress(p),
      });

      setTeamTempImageUrl(res.url);
      setTeamImagePreview(res.url);
      toast.success(
        "Team photo uploaded (temporary). It will be confirmed on save."
      );
    } catch (e) {
      console.error(e);
      setError("Failed to upload team member image. Please try again.");
      toast.error("Failed to upload team member image");
      setTeamTempImageUrl("");
      setTeamImagePreview(null);
    } finally {
      setIsUploadingTeamImage(false);
    }
  };

  const removeTeamImage = async () => {
    if (teamTempImageUrl) {
      try {
        await edgestore.publicFiles.deleteFile({ url: teamTempImageUrl });
      } catch (e) {
        console.warn("Failed to delete temp team image:", e);
      }
    }
    setTeamTempImageUrl("");
    setTeamImagePreview(null);
    setTeamUploadProgress(0);
  };

  // Edit team member: open dialog
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

  // Upload a new temporary photo for the member being edited
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
      // track for confirmation
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
        await edgestore.publicFiles.deleteFile({ url: editTeamTempImageUrl });
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
    const updated = members.map((m, i) =>
      i === editMemberIndex ? { ...editMember } : m
    );
    form.setValue("teamMembers", updated);
    setIsEditMemberOpen(false);
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError("");

    try {
      // If an image was uploaded as temporary, confirm it first
      let finalImageUrl = data.image || "";
      if (tempImageUrl && data.image === tempImageUrl) {
        try {
          const confirmed = await edgestore.publicFiles.confirmUpload({
            url: tempImageUrl,
          });
          finalImageUrl = confirmed?.url || tempImageUrl;
        } catch (e) {
          console.error(e);
          // If confirmation fails, proceed without image to avoid broken refs
          finalImageUrl = "";
        }
      }

      // Prepare team members: confirm temporary images and ensure default avatar when missing
      const defaultAvatar = null;
      const originalMembers = Array.isArray(data.teamMembers)
        ? data.teamMembers
        : [];

      const payloadTeamMembers = await Promise.all(
        originalMembers.map(async (m) => {
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

      // Calculate goal as sum of all budget items
      const calculatedGoal = Array.isArray(data.budgetItems)
        ? data.budgetItems.reduce(
            (sum, item) => sum + (Number(item.value) || 0),
            0
          )
        : 0;

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          goal: calculatedGoal, // Set calculated goal
          image: finalImageUrl,
          teamMembers: payloadTeamMembers,
        }),
      });

      if (response.ok) {
        toast.success("Project created successfully!");
        form.reset();
        setUploadedImage(null);
        setImagePreview(null);
        setTempImageUrl("");
        setUploadProgress(0);
        setTeamTempImageUrl("");
        setTeamImagePreview(null);
        setTeamUploadProgress(0);
        setTempTeamImageUrls([]);
        setIsEditMemberOpen(false);
        setEditMemberIndex(null);
        // Clear draft after successful submit
        if (draftId) {
          try {
            await fetch(`/api/projects/drafts/${draftId}`, {
              method: "DELETE",
            });
          } catch {}
          setDraftId(null);
          lastSavedRef.current = {};
        }
        router.push("/admin/projects");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create project");
        toast.error(errorData.error || "Failed to create project");
      }
    } catch (error) {
      setError("An error occurred while creating the project");
      toast.error("An error occurred while creating the project");
    } finally {
      setIsLoading(false);
    }
  };

  // Keep timeline preview ordered by date for Add form as well
  const watchedTimelineEvents = form.watch("timelineEvents");
  const timelineEventsSorted = Array.isArray(watchedTimelineEvents)
    ? [...watchedTimelineEvents].sort(
        (a, b) => parseEventDate(a?.date) - parseEventDate(b?.date)
      )
    : [];

  const clearDraft = async () => {
    if (!draftId) return;
    try {
      await fetch(`/api/projects/drafts/${draftId}`, { method: "DELETE" });
    } catch {}
    setDraftId(null);
    lastSavedRef.current = {};
    setAutosaveStatus("idle");
    // Reset image related UI state as we now have no draft context
    setUploadedImage(null);
    setImagePreview(null);
    setTempImageUrl("");
    setUploadProgress(0);
    toast.success("Draft cleared");
  };

  // --- Import from Word (.docx) ---
  const fileInputRef = useRef(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [importPreview, setImportPreview] = useState(null);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".docx")) {
      toast.error("Please upload a .docx file");
      e.target.value = "";
      return;
    }
    setIsImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/projects/import-docx", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 422) {
          if (err?.missingHeadings) {
            toast.error(
              <div>
                <div className="font-medium">
                  Import blocked: template headings changed
                </div>
                <div className="mt-1">
                  Please download a fresh template and avoid editing these
                  headings:
                </div>
                <ul className="mt-1 list-disc pl-5">
                  {err.missingHeadings.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
                <a
                  href="/api/projects/export-docx-template"
                  className="mt-2 inline-block text-primary underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Download fresh template
                </a>
              </div>
            );
          } else if (err?.tableHeaderErrors) {
            toast.error(
              <div>
                <div className="font-medium">
                  Import blocked: table headers changed
                </div>
                <div className="mt-1">Fix the table headers exactly:</div>
                <ul className="mt-1 list-disc pl-5">
                  {err.tableHeaderErrors.map((t, i) => (
                    <li key={i}>
                      <span className="font-medium">{t.section}:</span>{" "}
                      {t.details.join("; ")}
                    </li>
                  ))}
                </ul>
                <a
                  href="/api/projects/export-docx-template"
                  className="mt-2 inline-block text-primary underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Download fresh template
                </a>
              </div>
            );
          }
        }
        throw new Error(err.error || "Failed to import document");
      }
      const json = await res.json();
      const data = json?.data || {};
      const warnings = Array.isArray(json?.warnings) ? json.warnings : [];

      // Prepare preview object (resolve category name now for visibility but apply later)
      let categoryId = "";
      let categoryLabel = data.categoryName || "";
      if (data.categoryName && Array.isArray(categoryOptions)) {
        const found = categoryOptions.find(
          (c) =>
            (c.name || "").toLowerCase() === data.categoryName.toLowerCase()
        );
        categoryId = found?.id || "";
        if (!categoryId && data.categoryName)
          categoryLabel = `${data.categoryName} (not found)`;
      }
      setImportPreview({ data, warnings, categoryId, categoryLabel });
      setIsPreviewOpen(true);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to import document");
    } finally {
      setIsImporting(false);
      if (e.target) e.target.value = "";
    }
  };

  const applyImportPreview = () => {
    if (!importPreview) return;
    const { data, categoryId, warnings } = importPreview;
    form.reset({
      ...form.getValues(),
      title: data.title || "",
      authors: data.authors || "",
      location: data.location || "",
      currency: data.currency || form.getValues("currency") || "PHP",
      goal: data.goal || "",
      daysLeft: data.daysLeft || "",
      tags: Array.isArray(data.tags) ? data.tags : [],
      categoryId,
      overview: data.overview || "",
      methods: data.methods || "",
      labNotes: data.labNotes || "",
      discussion: data.discussion || "",
      contextAnswer: data.contextAnswer || "",
      significanceAnswer: data.significanceAnswer || "",
      goalsAnswer: data.goalsAnswer || "",
      teamDescription: data.teamDescription || "",
      teamMembers: Array.isArray(data.teamMembers) ? data.teamMembers : [],
      budgetDescription: data.budgetDescription || "",
      budgetItems: Array.isArray(data.budgetItems) ? data.budgetItems : [],
      timelineDescription: data.timelineDescription || "",
      timelineEvents: Array.isArray(data.timelineEvents)
        ? data.timelineEvents
        : [],
    });
    lastSavedRef.current = { ...lastSavedRef.current, ...form.getValues() };
    setIsPreviewOpen(false);
    if (warnings?.length) {
      toast.warning(
        <div>
          <div>Imported with warnings:</div>
          <ul className="mt-1 list-disc pl-5">
            {warnings.slice(0, 5).map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
          {warnings.length > 5 && (
            <div className="mt-1">...and {warnings.length - 5} more</div>
          )}
        </div>
      );
    } else {
      toast.success("Document imported");
    }
  };

  const downloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    try {
      const res = await fetch("/api/projects/export-docx-template");
      if (!res.ok) throw new Error("Failed to download template");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Project_Template.docx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Failed to download template");
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  return (
    <div className="space-y-8 relative">
      <div className="fixed right-4 bottom-4 z-50 px-4 py-2 rounded-md shadow-md bg-background/95 backdrop-blur border flex items-center gap-2 text-sm">
        {autosaveStatus === "pending" && (
          <CloudUpload className="h-4 w-4 animate-pulse" />
        )}
        {autosaveStatus === "saving" && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
        {autosaveStatus === "saved" && (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        )}
        {autosaveStatus === "error" && (
          <AlertTriangle className="h-4 w-4 text-destructive" />
        )}
        {autosaveStatus === "idle" && <Cloud className="h-4 w-4" />}
        <span className="font-medium">
          {autosaveStatus === "pending" && "Changes pending…"}
          {autosaveStatus === "saving" && "Saving draft…"}
          {autosaveStatus === "saved" && "Draft saved"}
          {autosaveStatus === "error" && "Save failed – retrying"}
          {autosaveStatus === "idle" && "Autosave idle"}
        </span>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, (errors) => {
            const errorFields = Object.entries(errors)
              .map(([field, error]) => {
                // Handle nested errors (like array fields)
                if (error.type === "too_small" && field === "teamMembers") {
                  return "- At least one team member is required";
                }
                if (error.message) {
                  return `- ${error.message}`;
                }
                return null;
              })
              .filter(Boolean);

            toast.error(
              <div>
                <p>Please complete all required fields before submitting:</p>
                <div className="mt-2">
                  {errorFields.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              </div>
            );
          })}
          noValidate
          className="space-y-8"
        >
          {/* Import/Download Word Template */}
          <div className="flex justify-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx"
              className="hidden"
              onChange={handleImportFile}
            />
            <Button
              type="button"
              variant="outline"
              onClick={downloadTemplate}
              disabled={isDownloadingTemplate}
              className="mb-2"
            >
              {isDownloadingTemplate ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparing
                  template...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" /> Download Word Template
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleImportClick}
              disabled={isImporting}
              className="mb-2"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" /> Import from Word (.docx)
                </>
              )}
            </Button>
          </div>

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

          {/* Clear draft button at top (inline) */}
          <div className="flex justify-between items-center -mt-4">
            <div />
            {draftId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearDraft}
                className="flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4" /> Clear Draft
              </Button>
            )}
          </div>

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
                  Creating Project...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Project
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>

      <ImportPreviewDialog
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        preview={importPreview}
        onApply={applyImportPreview}
      />
    </div>
  );
}
