"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2, Save, ShieldCheck, Lock, Eye, EyeOff } from "lucide-react";
import AvatarWithSkeleton from "@/components/ui/AvatarWithSkeleton";
import { useEdgeStore } from "@/lib/edgestore";
import imageCompression from "browser-image-compression";
import Navbar from "@/components/Navbar";
import ImageUpload from "@/components/ui/ImageUpload";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z
    .string()
    .min(3, "At least 3 characters")
    .regex(/^[a-zA-Z0-9_.-]{3,30}$/, "Use letters, numbers, _ . -"),
  image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

const companyLogoSchema = z.object({
  companyLogo: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "At least 6 characters"),
    confirmPassword: z.string().min(6, "At least 6 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [loadingSelf, setLoadingSelf] = useState(true);
  const [hasPassword, setHasPassword] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState("");
  const [previousImageUrl, setPreviousImageUrl] = useState("");
  const [tempLogoUrl, setTempLogoUrl] = useState("");
  const [previousLogoUrl, setPreviousLogoUrl] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { edgestore } = useEdgeStore();

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", username: "", image: "" },
  });

  const companyLogoForm = useForm({
    resolver: zodResolver(companyLogoSchema),
    defaultValues: { companyLogo: "" },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoadingSelf(true);
        const res = await fetch("/api/user/self", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load profile");
        const data = await res.json();
        if (!mounted) return;
        profileForm.reset({
          name: data.name || "",
          username: data.username || "",
          image: data.image || "",
        });
        companyLogoForm.reset({ companyLogo: data.companyLogo || "" });

        setPreviousImageUrl(data.image || "");
        setPreviousLogoUrl(data.companyLogo || "");
        setHasPassword(Boolean(data.hasPassword));
      } catch (e) {
        toast.error(e.message || "Failed to load user profile");
      } finally {
        setLoadingSelf(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const onUploadAvatar = async (file) => {
    if (!file) return;
    try {
      setUploading(true);

      if (tempImageUrl) {
        try {
          await edgestore.publicFiles.deleteFile({ url: tempImageUrl });
        } catch {}
      }

      const options = {
        maxSizeMB: 2,
        maxWidthOrHeight: 1600,
        fileType: "image/webp",
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);

      if (compressedFile.size > 2 * 1024 * 1024) {
        toast.error(
          "Image is too large even after compression. Please choose a smaller image."
        );
        return;
      }

      const finalFile = new File(
        [compressedFile],
        (file.name || "avatar").replace(/\.[^.]+$/, "") + ".webp",
        { type: "image/webp" }
      );

      const res = await edgestore.publicFiles.upload({
        file: finalFile,
        options: { temporary: true },
      });
      setTempImageUrl(res.url);
      profileForm.setValue("image", res.url, { shouldValidate: true });
      toast.success(
        "Photo uploaded (temporary). It will be confirmed on Save changes."
      );
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onUploadCompanyLogo = async (file) => {
    if (!file) return;
    try {
      setUploadingLogo(true);

      if (tempLogoUrl) {
        try {
          await edgestore.companyLogos.deleteFile({ url: tempLogoUrl });
        } catch {}
      }

      const options = {
        maxSizeMB: 0.5, // 500KB
        maxWidthOrHeight: 1000,
        fileType: "image/png",
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);

      if (compressedFile.size > 1024 * 1024) {
        toast.error(
          "Logo is too large even after compression. Please choose a smaller image."
        );
        return;
      }

      const finalFile = new File(
        [compressedFile],
        (file.name || "logo").replace(/\.[^.]+$/, "") + ".png",
        { type: "image/png" }
      );

      const res = await edgestore.companyLogos.upload({
        file: finalFile,
        options: { temporary: true },
      });
      setTempLogoUrl(res.url);
      companyLogoForm.setValue("companyLogo", res.url, {
        shouldValidate: true,
      });
      toast.success(
        "Logo uploaded (temporary). It will be confirmed on Save changes."
      );
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    } finally {
      setUploadingLogo(false);
    }
  };

  const submitProfile = async (values) => {
    try {
      let finalImageUrl = typeof values.image === "string" ? values.image : "";
      if (tempImageUrl && values.image === tempImageUrl) {
        try {
          const confirmed = await edgestore.publicFiles.confirmUpload({
            url: tempImageUrl,
          });
          finalImageUrl = confirmed?.url || finalImageUrl;
        } catch (e) {
          console.warn("Avatar confirmUpload failed", e);

          toast.error(
            "Could not finalize avatar upload. Please try saving again."
          );
        }
      }

      const body = { name: values.name, username: values.username };
      if (typeof finalImageUrl === "string") body.image = finalImageUrl;
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to update profile");

      // delete old image from EdgeStore if it's different from the new one
      if (previousImageUrl && previousImageUrl !== finalImageUrl) {
        try {
          await edgestore.publicFiles.delete({ url: previousImageUrl });
          console.log("Old avatar deleted from EdgeStore");
        } catch (e) {
          console.warn("Failed to delete old avatar from EdgeStore:", e);
        }
      }

      await update({
        name: data.user?.name,
        username: data.user?.username,
        image: data.user?.image,
      });

      if (tempImageUrl && data.user?.image) {
        setTempImageUrl("");
        setPreviousImageUrl(data.user?.image);
      }
      toast.success("Profile updated");
    } catch (e) {
      toast.error(e.message || "Update failed");
    }
  };

  const submitCompanyLogo = async (values) => {
    try {
      let finalLogoUrl =
        typeof values.companyLogo === "string" ? values.companyLogo : "";
      if (tempLogoUrl && values.companyLogo === tempLogoUrl) {
        try {
          const confirmed = await edgestore.companyLogos.confirmUpload({
            url: tempLogoUrl,
          });
          finalLogoUrl = confirmed?.url || finalLogoUrl;
        } catch (e) {
          console.warn("Logo confirmUpload failed", e);
          toast.error(
            "Could not finalize logo upload. Please try saving again."
          );
          return;
        }
      }

      const body = { companyLogo: finalLogoUrl };
      const res = await fetch("/api/user/company-logo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data?.error || "Failed to update company logo");

      // delete old logo from EdgeStore if it's different from the new one
      if (previousLogoUrl && previousLogoUrl !== finalLogoUrl) {
        try {
          await edgestore.companyLogos.delete({ url: previousLogoUrl });
          console.log("Old logo deleted from EdgeStore");
        } catch (e) {
          console.warn("Failed to delete old logo from EdgeStore:", e);
        }
      }

      await update({ companyLogo: data.user?.companyLogo });

      if (tempLogoUrl && data.user?.companyLogo) {
        setTempLogoUrl("");
        setPreviousLogoUrl(data.user?.companyLogo);
      }
      toast.success("Company logo updated");
    } catch (e) {
      toast.error(e.message || "Update failed");
    }
  };

  const submitPassword = async (values) => {
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to update password");
      toast.success("Password updated");
      passwordForm.reset();
    } catch (e) {
      toast.error(e.message || "Update failed");
    }
  };

  return (
    <div>
      <Navbar />

      <div className="container max-w-3xl mx-auto px-6 py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSelf ? (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading…
              </div>
            ) : (
              <Form {...profileForm}>
                <form
                  onSubmit={profileForm.handleSubmit(submitProfile)}
                  className="space-y-6"
                >
                  <div>
                    <div className="flex items-start gap-4">
                      <AvatarWithSkeleton
                        src={profileForm.watch("image") || session?.user?.image}
                        fallbackText={
                          session?.user?.name?.[0]?.toUpperCase() || "U"
                        }
                      />
                      <ImageUpload
                        currentImage={
                          profileForm.watch("image") || session?.user?.image
                        }
                        onUpload={onUploadAvatar}
                        uploading={uploading}
                        label="Upload Avatar"
                        helpText="Upload a square image for best results. Max 2MB."
                        previewClassName="hidden"
                      />
                    </div>
                  </div>

                  <FormField
                    name="name"
                    control={profileForm.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="username"
                    control={profileForm.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="yourusername" {...field} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Allowed: letters, numbers, underscore, dot, dash
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={profileForm.formState.isSubmitting}
                    >
                      {profileForm.formState.isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
                          Saving…
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" /> Save changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Company Logo</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSelf ? (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading…
              </div>
            ) : (
              <Form {...companyLogoForm}>
                <form
                  onSubmit={companyLogoForm.handleSubmit(submitCompanyLogo)}
                  className="space-y-6"
                >
                  <FormField
                    name="companyLogo"
                    control={companyLogoForm.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Logo</FormLabel>
                        <FormControl>
                          <div>
                            <ImageUpload
                              currentImage={field.value}
                              onUpload={onUploadCompanyLogo}
                              uploading={uploadingLogo}
                              label="Upload Logo"
                              validation={{
                                maxSizeMB: 1,
                              }}
                              previewClassName="w-32 h-32"
                            />
                            <div className="mt-2 text-xs text-muted-foreground">
                              <div>
                                Upload your company logo — it will be displayed
                                on your donation certificate.
                              </div>
                              <div>Max size: 1MB.</div>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={companyLogoForm.formState.isSubmitting}
                    >
                      {companyLogoForm.formState.isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
                          Saving…
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" /> Save changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
          </CardHeader>
          <CardContent>
            {!hasPassword ? (
              <div className="flex items-center text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 mr-2" />
                You sign in with Google. Password change is disabled.
              </div>
            ) : (
              <Form {...passwordForm}>
                <form
                  onSubmit={passwordForm.handleSubmit(submitPassword)}
                  className="space-y-6"
                >
                  <FormField
                    name="currentPassword"
                    control={passwordForm.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showCurrent ? "text" : "password"}
                              placeholder="••••••"
                              {...field}
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrent((v) => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              aria-label={
                                showCurrent ? "Hide password" : "Show password"
                              }
                            >
                              {showCurrent ? (
                                <EyeOff className="w-5 h-5" />
                              ) : (
                                <Eye className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      name="newPassword"
                      control={passwordForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showNew ? "text" : "password"}
                                placeholder="At least 6 characters"
                                {...field}
                                className="pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowNew((v) => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                aria-label={
                                  showNew ? "Hide password" : "Show password"
                                }
                              >
                                {showNew ? (
                                  <EyeOff className="w-5 h-5" />
                                ) : (
                                  <Eye className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="confirmPassword"
                      control={passwordForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm new password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showConfirm ? "text" : "password"}
                                placeholder="Re-enter new password"
                                {...field}
                                className="pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirm((v) => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                aria-label={
                                  showConfirm
                                    ? "Hide password"
                                    : "Show password"
                                }
                              >
                                {showConfirm ? (
                                  <EyeOff className="w-5 h-5" />
                                ) : (
                                  <Eye className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={passwordForm.formState.isSubmitting}
                    >
                      {passwordForm.formState.isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
                          Updating…
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 mr-2" /> Update password
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
