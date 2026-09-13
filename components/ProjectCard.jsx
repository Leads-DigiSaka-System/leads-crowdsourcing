"use client";
import AvatarWithSkeleton from "@/components/ui/AvatarWithSkeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  capitalizeFirstWordOnly,
  formatFundedPercent,
  getActiveBudgetItemByOrder,
  getBudgetItemAllocated,
  getFundedPercent,
  getProjectDaysLeft,
  nameTitleCase,
  smartTitle,
} from "@/lib/utils";
import { Calendar, MapPin, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

const slugify = (str) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const htmlToPlainText = (html) => {
  if (!html || typeof html !== "string") return "";
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const entities = {
    "&nbsp;": " ",
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
  };
  Object.entries(entities).forEach(([k, v]) => {
    text = text.split(k).join(v);
  });
  return text;
};

const ProjectCard = ({ project, teams, description }) => {
  // Expect project.category to be either null or:
  // { id, name, slug, colorHex, textColor }
  const categoryName = project?.category?.name || null;
  const categoryLabel =
    categoryName?.trim().toLowerCase() === "environment"
      ? "Agriculture"
      : categoryName;
  const categoryColor = project?.category?.colorHex || "#e0f2fe";
  const categoryTextColorRaw = project?.category?.textColor || "black";
  // Use slug from project, fallback to slugified ID if not available
  const projectSlug = project?.slug || slugify(project?.id || "");

  const displayText = project?.tagline || description;

  const categoryStyle = useMemo(() => {
    const bg = categoryColor;
    const declared = categoryTextColorRaw;
    const isValidHex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(bg);
    const autoText = () => {
      try {
        let hex = bg.replace("#", "");
        if (hex.length === 3)
          hex = hex
            .split("")
            .map((c) => c + c)
            .join("");
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.6 ? "#000" : "#fff";
      } catch {
        return "#000";
      }
    };
    const fg =
      declared === "white"
        ? "#fff"
        : declared === "black"
          ? "#000"
          : /^#/.test(declared)
            ? declared
            : isValidHex
              ? autoText()
              : "#000";

    return { backgroundColor: bg, color: fg };
  }, [categoryColor, categoryTextColorRaw]);

  const goal =
    Array.isArray(project?.budgetItems) && project.budgetItems.length > 0
      ? project.budgetItems.reduce(
          (sum, item) => sum + (Number(item?.value) || 0),
          0
        )
      : Number(project.goal) || 0;
  const pledges = Array.isArray(project?.pledges) ? project.pledges : [];
  const paidPledges = pledges.filter((p) => (p?.status || "paid") === "paid");
  const pledged = paidPledges.reduce(
    (sum, p) => sum + (Number(p?.amount) || 0),
    0
  );
  const totalFundedGoal = getFundedPercent(pledged, goal);

  // Determine which "goal" to show: smallest budget item not yet fully funded.
  const budgetItems = Array.isArray(project?.budgetItems)
    ? project.budgetItems
    : [];
  const activeBudgetItem = useMemo(
    () => getActiveBudgetItemByOrder(budgetItems),
    [budgetItems]
  );

  const displayGoal = activeBudgetItem
    ? Number(activeBudgetItem.value) || 0
    : goal;
  const displayAllocated = activeBudgetItem
    ? getBudgetItemAllocated(activeBudgetItem)
    : pledged;
  // If project is marked completed, treat funded as 100% visually (but keep raw amounts)
  const funded = project?.isCompleted
    ? 100
    : getFundedPercent(displayAllocated, displayGoal);
  const backers = new Set(paidPledges.map((p) => p?.userId)).size;

  return (
    <Link href={`/discover/${projectSlug}`} style={{ textDecoration: "none" }}>
      <Card className="group overflow-hidden flex flex-col h-full min-h-[480px] transition-all duration-300 transform cursor-pointer border-muted">
        <div className="relative overflow-hidden">
          {categoryName && (
            <Badge
              variant="secondary"
              className="absolute top-2 right-2 text-xs px-3 py-1 z-10 shadow"
              style={categoryStyle}
            >
              {smartTitle(categoryLabel)}
            </Badge>
          )}
          <Image
            width={400}
            height={250}
            src={project.image || "https://placehold.co/600x400"}
            alt={project.title}
            className="w-full aspect-[4/2.5] object-cover transition-transform" // Replace h-40 with aspect-[4/3]
            unoptimized
          />
        </div>

        <CardContent className="p-4 flex flex-col flex-1">
          <div className="grid grid-rows-[auto_1fr_auto_auto_auto] flex-1 gap-4 min-h-[280px]">
            <div className="min-h-[3.5rem] flex items-start">
              <h3 className="text-xl font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                {project.title}
              </h3>
            </div>
            {project.location && (
              <div className="-mt-2 mb-1 flex gap-1 items-center">
                <MapPin className="w-3 h-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  {project.location}
                </p>
              </div>
            )}

            <div className="flex items-start">
              <p className="text-muted-foreground line-clamp-4 leading-relaxed">
                {capitalizeFirstWordOnly(htmlToPlainText(displayText))}
              </p>
            </div>

            <div className="flex items-center">
              {teams && teams.length > 0 && (
                <>
                  <AvatarWithSkeleton
                    src={teams[0].image || ""}
                    fallbackText={teams[0].name?.[0]?.toUpperCase() || "U"}
                  />
                  <div className="ml-3">
                    <div className="font-semibold text-foreground text-sm">
                      {nameTitleCase(teams[0].name)}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {nameTitleCase(teams[0].role)}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div>
              {activeBudgetItem && (
                <div
                  className="mb-1 text-xs text-muted-foreground break-words line-clamp-1 md:line-clamp-2"
                  title={activeBudgetItem.name}
                >
                  <span className="text-muted-foreground/80">
                    Funding component:
                  </span>{" "}
                  <span className="font-medium text-foreground">
                    {activeBudgetItem.name}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-foreground">
                  {project?.isCompleted
                    ? "100%"
                    : formatFundedPercent(displayAllocated, displayGoal)}{" "}
                  funded
                </span>
                <span className="text-sm text-muted-foreground">
                  ₱{displayGoal.toLocaleString()} goal
                </span>
              </div>
              <Progress
                value={project?.isCompleted ? 100 : funded}
                className="h-3"
              />
              {activeBudgetItem && (
                <div className="mt-1 text-[11px] leading-snug text-muted-foreground line-clamp-1">
                  {project?.isCompleted
                    ? "100%"
                    : formatFundedPercent(pledged, goal)}{" "}
                  of total goal (₱{goal.toLocaleString()})
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm">
              <div className="flex flex-col sm:flex-row items-center text-muted-foreground">
                <span className="font-bold text-primary text-base mb-1 sm:mb-0 sm:mr-1">
                  ₱
                </span>
                <div className="text-center sm:text-left">
                  <div className="font-semibold text-primary">
                    {project?.isCompleted
                      ? goal.toLocaleString()
                      : pledged.toLocaleString()}
                  </div>
                  <div className="text-xs">raised</div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center text-muted-foreground">
                <Users className="w-4 h-4 mb-1 sm:mb-0 sm:mr-1" />
                <div className="text-center sm:text-left">
                  <div className="font-semibold">{backers}</div>
                  <div className="text-xs">donors</div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center text-muted-foreground">
                <Calendar className="w-4 h-4 mb-1 sm:mb-0 sm:mr-1" />
                <div className="text-center sm:text-left">
                  {(() => {
                    const days = getProjectDaysLeft(
                      project.createdAt,
                      project.daysLeft
                    );
                    if (typeof days === "number") {
                      if (days === 0) {
                        return (
                          <>
                            <div className="font-semibold text-destructive">
                              0
                            </div>
                            <div className="text-xs text-destructive">
                              days left
                            </div>
                          </>
                        );
                      }
                      return (
                        <>
                          <div className="font-semibold">{days}</div>
                          <div className="text-xs">days left</div>
                        </>
                      );
                    }
                    return (
                      <div className="font-semibold text-destructive">
                        {days}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProjectCard;
