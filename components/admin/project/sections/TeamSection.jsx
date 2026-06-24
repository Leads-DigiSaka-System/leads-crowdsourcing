"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { closestCenter, DndContext } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { SortableItem } from "../SortableItem";

const RichTextEditor = dynamic(
  () => import("@/components/ui/rich-text-editor"),
  { ssr: false }
);

export function TeamSection({
  form,
  // Composer state
  newTeamMember,
  setNewTeamMember,
  addTeamMember,
  removeTeamMember,
  // Optional image upload for composer
  teamImagePreview,
  teamUploadProgress,
  isUploadingTeamImage,
  onTeamImageUpload,
  onRemoveTeamImage,
  // Edit dialog props (optional)
  isEditMemberOpen,
  setIsEditMemberOpen,
  openEditMember,
  editMember,
  setEditMember,
  editTeamImagePreview,
  editTeamUploadProgress,
  isUploadingEditTeamImage,
  onEditTeamImageUpload,
  onRemoveEditTeamImage,
  saveEditedMember,
}) {
  const members = form.watch("teamMembers") || [];
  const [activeId, setActiveId] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  // Avoid SSR hydration mismatches from dnd-kit by enabling DnD after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const onDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = members.findIndex((_, idx) => `team-${idx}` === active.id);
    const newIndex = members.findIndex((_, idx) => `team-${idx}` === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedMembers = arrayMove(members, oldIndex, newIndex);
    form.setValue("teamMembers", reorderedMembers);
  };

  const onDragStart = (event) => {
    setActiveId(event.active?.id || null);
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Project Team</CardTitle>
        <CardDescription>Team description and members</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="teamDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team Description *</FormLabel>
              <FormControl>
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Overall team description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-sm">Add Team Member</h4>
            {form.formState?.errors?.teamMembers && (
              <p className="text-sm text-destructive">
                {form.formState.errors.teamMembers.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/20">
            <div>
              <Label className="text-sm">Name</Label>
              <Input
                value={newTeamMember.name}
                onChange={(e) =>
                  setNewTeamMember((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Dr. John Doe"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Role *</Label>
              <Input
                value={newTeamMember.role}
                onChange={(e) =>
                  setNewTeamMember((prev) => ({
                    ...prev,
                    role: e.target.value,
                  }))
                }
                placeholder="Principal Investigator"
                className="mt-1"
              />
            </div>

            <div className="sm:col-span-2">
              <Label className="text-sm">Responsibility (optional)</Label>
              <Textarea
                value={newTeamMember.responsibility || ""}
                onChange={(e) =>
                  setNewTeamMember((prev) => ({
                    ...prev,
                    responsibility: e.target.value,
                  }))
                }
                placeholder="Briefly describe this member's responsibility"
                rows={2}
                className="mt-1"
              />
            </div>

            {onTeamImageUpload && (
              <div className="sm:col-span-2">
                <Label className="text-sm">Photo</Label>
                <div className="mt-1 border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                  {teamImagePreview ? (
                    <div className="space-y-3">
                      <img
                        src={teamImagePreview}
                        alt="Team member preview"
                        className="h-24 w-24 object-cover rounded-full mx-auto"
                      />
                      {isUploadingTeamImage && (
                        <div className="space-y-1">
                          <Progress value={teamUploadProgress} />
                          <p className="text-xs text-muted-foreground">
                            Uploading... {Math.round(teamUploadProgress)}%
                          </p>
                        </div>
                      )}
                      <div className="flex gap-2 justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            document.getElementById("team-image-upload").click()
                          }
                        >
                          Change Photo
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={onRemoveTeamImage}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Optional: upload a profile photo
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          document.getElementById("team-image-upload").click()
                        }
                      >
                        Choose File
                      </Button>
                    </div>
                  )}
                  <input
                    id="team-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={onTeamImageUpload}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            <div className="sm:col-span-2">
              <Label className="text-sm">Bio</Label>
              <Textarea
                value={newTeamMember.bio}
                onChange={(e) =>
                  setNewTeamMember((prev) => ({ ...prev, bio: e.target.value }))
                }
                placeholder="Team member biography"
                rows={2}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Email</Label>
              <Input
                value={newTeamMember.email}
                onChange={(e) =>
                  setNewTeamMember((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                placeholder="john@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">LinkedIn</Label>
              <Input
                value={newTeamMember.linkedin}
                onChange={(e) =>
                  setNewTeamMember((prev) => ({
                    ...prev,
                    linkedin: e.target.value,
                  }))
                }
                placeholder="https://linkedin.com/in/johndoe"
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2 flex justify-end pt-2">
              <Button type="button" onClick={addTeamMember} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Team Member
              </Button>
            </div>
          </div>
        </div>

        {members.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">
              Team Members ({members.length})
            </h4>
            {isMounted ? (
              <DndContext
                collisionDetection={closestCenter}
                onDragEnd={onDragEnd}
                onDragStart={onDragStart}
              >
                <SortableContext
                  items={members.map((_, idx) => `team-${idx}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {members.map((member, index) => (
                      <SortableItem key={`team-${index}`} id={`team-${index}`}>
                        <div
                          className={`flex items-center justify-between p-3 border rounded-lg ${activeId === `team-${index}` ? "bg-accent" : "bg-muted/10"}`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Avatar>
                              <AvatarImage
                                src={member.image || undefined}
                                alt={member.name}
                              />
                              <AvatarFallback>
                                {member.name?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="font-medium text-sm truncate">
                              {member.name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {member.role}
                            </div>
                            {member.email && (
                              <div className="text-xs text-muted-foreground truncate">
                                {member.email}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 items-center flex-shrink-0 ml-2">
                            {openEditMember && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => openEditMember(index)}
                                onMouseDown={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                              >
                                Edit
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTeamMember(index)}
                              className="text-destructive hover:text-destructive"
                              onMouseDown={(e) => e.stopPropagation()}
                              onPointerDown={(e) => e.stopPropagation()}
                              onTouchStart={(e) => e.stopPropagation()}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </SortableItem>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="space-y-2">
                {members.map((member, index) => (
                  <div
                    key={`static-team-${index}`}
                    className={`flex items-center justify-between p-3 border rounded-lg bg-muted/10`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar>
                        <AvatarImage
                          src={member.image || undefined}
                          alt={member.name}
                        />
                        <AvatarFallback>
                          {member.name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-medium text-sm truncate">
                        {member.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {member.role}
                      </div>
                      {member.email && (
                        <div className="text-xs text-muted-foreground truncate">
                          {member.email}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 items-center flex-shrink-0 ml-2">
                      <Button type="button" variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {typeof isEditMemberOpen === "boolean" && (
          <Dialog open={isEditMemberOpen} onOpenChange={setIsEditMemberOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Team Member</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {onEditTeamImageUpload && (
                  <div className="sm:col-span-2">
                    <Label className="text-sm">Photo</Label>
                    <div className="mt-1 flex items-center gap-3">
                      <Avatar className="size-16">
                        <AvatarImage
                          src={editTeamImagePreview || undefined}
                          alt={editMember?.name}
                        />
                        <AvatarFallback>
                          {editMember?.name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              document
                                .getElementById("edit-team-image-upload")
                                .click()
                            }
                          >
                            Change Photo
                          </Button>
                          {editTeamImagePreview && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={onRemoveEditTeamImage}
                              className="text-destructive"
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        {isUploadingEditTeamImage && (
                          <div className="space-y-1">
                            <Progress value={editTeamUploadProgress} />
                            <p className="text-xs text-muted-foreground">
                              Uploading... {Math.round(editTeamUploadProgress)}%
                            </p>
                          </div>
                        )}
                        <input
                          id="edit-team-image-upload"
                          type="file"
                          accept="image/*"
                          onChange={onEditTeamImageUpload}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <Label className="text-sm">Name</Label>
                  <Input
                    value={editMember?.name || ""}
                    onChange={(e) =>
                      setEditMember?.((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Role *</Label>
                  <Input
                    value={editMember?.role || ""}
                    onChange={(e) =>
                      setEditMember?.((prev) => ({
                        ...prev,
                        role: e.target.value,
                      }))
                    }
                    className="mt-1"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-sm">Responsibility (optional)</Label>
                  <Textarea
                    value={editMember?.responsibility || ""}
                    onChange={(e) =>
                      setEditMember?.((prev) => ({
                        ...prev,
                        responsibility: e.target.value,
                      }))
                    }
                    rows={2}
                    className="mt-1"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-sm">Bio</Label>
                  <Textarea
                    value={editMember?.bio || ""}
                    onChange={(e) =>
                      setEditMember?.((prev) => ({
                        ...prev,
                        bio: e.target.value,
                      }))
                    }
                    rows={3}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Email</Label>
                  <Input
                    value={editMember?.email || ""}
                    onChange={(e) =>
                      setEditMember?.((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">LinkedIn</Label>
                  <Input
                    value={editMember?.linkedin || ""}
                    onChange={(e) =>
                      setEditMember?.((prev) => ({
                        ...prev,
                        linkedin: e.target.value,
                      }))
                    }
                    className="mt-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditMemberOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="button" onClick={saveEditedMember}>
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
