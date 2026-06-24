"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  getFundedPercent,
  getProjectDaysLeft,
  formatFundedPercent,
  getActiveBudgetItemByOrder,
  getBudgetItemAllocated,
} from "@/lib/utils";
import { Facebook, HelpCircle, MessageSquare, MapPin } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { LoginForm } from "@/components/login/login-form";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function ProjectDetail({
  id,
  slug,
  title,
  authors,
  location,
  image,
  imageAlt,
  pledged,
  goal,
  daysLeft,
  budgetItems = [],
  tags = [],
  onHowItWorks,
  className = "",
  createdAt,
  isCompleted = false,
  showDonation = true,
  showShare = true,
  showHelpLink = true,
}) {
  const calculatedGoal =
    Array.isArray(budgetItems) && budgetItems.length > 0
      ? budgetItems.reduce((sum, item) => sum + (Number(item?.value) || 0), 0)
      : Number(goal) || 0;
  const fundedPercentage = getFundedPercent(pledged, calculatedGoal);
  const { data: session } = useSession();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [loginAlertOpen, setLoginAlertOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // Helper functions for project state validation
  const daysRemaining = getProjectDaysLeft(createdAt, daysLeft);
  const isProjectExpired = daysRemaining <= 0;
  const isFullyFundedRaw = (pledged || 0) >= (calculatedGoal || 0);
  // Treat as fully funded if either naturally funded OR marked completed
  const isFullyFunded = isCompleted || isFullyFundedRaw;
  const canBackProject = !isProjectExpired && !isFullyFunded;
  const remainingAmount = Math.max(0, (calculatedGoal || 0) - (pledged || 0));
  const maxDonationAmount = isFullyFunded ? 0 : remainingAmount;

  // Derive active budget item like in ProjectCard
  const paidPledged = pledged || 0;
  const activeBudgetItem = Array.isArray(budgetItems)
    ? getActiveBudgetItemByOrder(budgetItems)
    : null;

  const displayGoal = activeBudgetItem
    ? Number(activeBudgetItem.value) || 0
    : calculatedGoal;
  const displayAllocated = activeBudgetItem
    ? getBudgetItemAllocated(activeBudgetItem)
    : paidPledged;
  const fundedActive = isCompleted
    ? 100
    : getFundedPercent(displayAllocated, displayGoal);

  const getProjectUrl = () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return `${baseUrl}/discover/${slug || id}`;
  };

  const handleFacebookShare = () => {
    const fullUrl = getProjectUrl();
    const url = encodeURIComponent(fullUrl);
    const text = encodeURIComponent(
      `Check out this project: ${title} needs your support! Every peso counts! 💪`
    );

    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`,
      "_blank"
    );
  };

  const handleMessengerShare = () => {
    // Desktop Send Dialog doesn't work on mobile web (shows unsupported dialog).
    // Strategy:
    // - Mobile: use Web Share API first, then try Messenger deep link, then fallbacks
    // - Desktop: open the Facebook Send Dialog
    const fullUrl = getProjectUrl();
    const encoded = encodeURIComponent(fullUrl);
    const appId = "145634995501895";

    const isMobile =
      typeof navigator !== "undefined" &&
      /Android|iPhone|iPad|iPod|IEMobile|Opera Mini|Mobi/i.test(
        navigator.userAgent
      );

    // Prefer native share on mobile to avoid double text in Messenger
    if (
      isMobile &&
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    ) {
      navigator
        .share({
          title: title || "ResearchBayanihan Project",
          // Avoid verbose custom text to reduce duplication with OG preview
          text: undefined,
          url: fullUrl,
        })
        .catch(() => {
          // If user cancels or share fails, try deep link
          tryMessengerDeepLink();
        });
      return;
    }

    // Deep link to Messenger app (opens app if installed)
    const tryMessengerDeepLink = () => {
      const deepLink = `fb-messenger://share?link=${encoded}&app_id=${appId}`;

      const fallbackDelayMs = 900;
      const fallbackTimer = setTimeout(() => {
        // Fallback: open desktop Send Dialog (may still be unsupported on mobile)
        const dialogUrl = `https://www.facebook.com/dialog/send?link=${encoded}&app_id=${appId}&redirect_uri=${encoded}`;
        const newWin = window.open(dialogUrl, "_blank", "noopener,noreferrer");
        if (!newWin) {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard
              .writeText(fullUrl)
              .then(() => {
                alert("Link copied. Share it in Messenger!");
              })
              .catch(() => {
                alert(
                  "Unable to open Messenger. Please copy and share this link: " +
                    fullUrl
                );
              });
          } else {
            alert(
              "Unable to open Messenger. Please copy and share this link: " +
                fullUrl
            );
          }
        }
      }, fallbackDelayMs);

      const clearFallback = () => {
        clearTimeout(fallbackTimer);
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("pagehide", clearFallback);
      };
      const onVisibility = () => {
        if (document.hidden) {
          clearFallback();
        }
      };
      document.addEventListener("visibilitychange", onVisibility);
      window.addEventListener("pagehide", clearFallback);

      try {
        window.location.href = deepLink;
      } catch {
        clearFallback();
      }
    };

    if (isMobile) {
      tryMessengerDeepLink();
      return;
    }

    // Desktop web: use Send Dialog
    window.open(
      `https://www.facebook.com/dialog/send?link=${encoded}&app_id=${appId}&redirect_uri=${encoded}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleBackProjectClick = () => {
    // Check if project can be backed
    if (!canBackProject) {
      if (isProjectExpired) {
        alert("This project has expired and can no longer accept donations.");
      } else if (isFullyFunded) {
        alert("This project has already reached its funding goal.");
      }
      return;
    }

    if (!session) {
      setLoginAlertOpen(true);
      return;
    }
    // User is logged in, open the donation form
    setOpen(true);
  };

  const handleBackProject = async () => {
    const amountNum = Number(amount);

    // Basic amount validation
    if (!amount || amountNum < 100) {
      alert("Minimum amount is ₱100.");
      return;
    }

    // Check if amount would exceed remaining funding needed
    if (amountNum > maxDonationAmount) {
      alert(
        `Maximum amount is ₱${maxDonationAmount.toLocaleString()}. This project only needs ₱${remainingAmount.toLocaleString()} more to reach its goal.`
      );
      return;
    }

    // Check if project is still available for backing
    if (isProjectExpired) {
      alert("This project has expired and can no longer accept donations.");
      return;
    }

    if (isFullyFunded) {
      alert("This project has already reached its funding goal.");
      return;
    }

    setLoading(true);
    try {
      // Always create a new checkout session from Confirm & Pay
      const res = await fetch("/api/paymongo/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: id,
          projectSlug: slug,
          userId: session?.user?.id,
          title,
          amount: amountNum,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to create checkout session.");
      }
    } catch (e) {
      alert("Error creating checkout session.");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <div className={`max-w-6xl mx-auto px-4 py-8 ${className}`}>
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/discover">Discover</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Project Header */}
      <div className="mb-8 space-y-4">
        <h1 className="text-4xl font-bold leading-tight max-w-4xl">{title}</h1>

        <div className="space-y-1 text-muted-foreground">
          {authors && (
            <p className="text-base">
              <span className="font-medium text-foreground">By</span> {authors}
            </p>
          )}
          {location && (
            <p className="text-sm flex items-center gap-1">
              <MapPin className="h-4 w-4 text-muted-foreground mr-1" />
              {location}
            </p>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        {/* Project Image - Takes up 2 columns */}
        <div className="lg:col-span-2">
          <div className="relative w-full overflow-hidden rounded-lg">
            <Image
              src={image || "https://placehold.co/600x400"}
              alt={imageAlt || "https://placehold.co/600x400"}
              width={2000}
              height={200}
              priority
              unoptimized
            />
          </div>
        </div>

        {/* Funding Information Sidebar */}
        <div className="space-y-6">
          {/* Amount Pledged */}
          <div>
            <div className="text-4xl font-bold mb-1">
              ₱{(isCompleted ? calculatedGoal : pledged || 0).toLocaleString()}
            </div>
            <div className="text-muted-foreground">Pledged</div>
            {!canBackProject && (
              <div className="mt-2">
                {/* If project is completed, suppress expired chip (priority to Fully Funded look) */}
                {isProjectExpired && !isCompleted && (
                  <div className="inline-flex items-center px-2 py-1 rounded-md bg-destructive/10 text-destructive text-sm font-medium">
                    Project Expired
                  </div>
                )}
                {isFullyFunded && (
                  <div className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 text-green-700 text-sm font-medium">
                    Fully Funded
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Funding component and Progress (aligned with ProjectCard) */}
          <div>
            {activeBudgetItem && !isFullyFunded && (
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
                {isCompleted
                  ? "100%"
                  : formatFundedPercent(displayAllocated, displayGoal)}{" "}
                funded
              </span>
              <span className="text-sm text-muted-foreground">
                ₱{displayGoal.toLocaleString()} goal
              </span>
            </div>
            <Progress
              value={isCompleted ? 100 : fundedActive}
              className="h-3"
            />
            {activeBudgetItem && (
              <div className="mt-1 text-[11px] leading-snug text-muted-foreground line-clamp-1">
                {isCompleted
                  ? "100%"
                  : formatFundedPercent(pledged, calculatedGoal)}{" "}
                of total goal (₱{calculatedGoal.toLocaleString()})
              </div>
            )}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-semibold text-base">
                {isCompleted
                  ? "100%"
                  : formatFundedPercent(pledged, calculatedGoal)}
              </div>
              <div className="text-muted-foreground">Funded (overall)</div>
            </div>
            <div>
              <div className="font-semibold text-base">
                ₱{calculatedGoal.toLocaleString()}
              </div>
              <div className="text-muted-foreground">Goal (overall)</div>
            </div>
            <div>
              {(() => {
                const days = getProjectDaysLeft(createdAt, daysLeft);
                if (days === 0) {
                  return (
                    <>
                      <div className="font-semibold text-destructive">0</div>
                      <div className="text-destructive">Days Left</div>
                    </>
                  );
                }
                return (
                  <>
                    <div className="font-semibold text-base">{days}</div>
                    <div className="text-muted-foreground">Days Left</div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Modal for Amount Input using shadcn Dialog */}
          {showDonation && (
            <Dialog open={open} onOpenChange={setOpen}>
              <Button
                className="w-full h-12 text-base font-medium"
                size="lg"
                onClick={handleBackProjectClick}
                disabled={!canBackProject}
              >
                {isProjectExpired
                  ? "Project Ended"
                  : isFullyFunded
                    ? "Fully Funded"
                    : "Back This Project"}
              </Button>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enter Amount to Back</DialogTitle>
                  <DialogDescription>
                    Please enter the PHP amount for <b>{title}</b>.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-2 py-2">
                  <Label htmlFor="amount">Amount (PHP)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min={100}
                    max={maxDonationAmount}
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={loading}
                    autoFocus
                  />
                  {(() => {
                    const amountNum = Number(amount);
                    if (amount !== "" && amountNum < 100) {
                      return (
                        <p className="text-xs text-red-500">Minimum is ₱100.</p>
                      );
                    }
                    if (amount !== "" && amountNum > maxDonationAmount) {
                      return (
                        <p className="text-xs text-red-500">
                          Maximum is ₱{maxDonationAmount.toLocaleString()}. Only
                          ₱{remainingAmount.toLocaleString()} needed to reach
                          the goal.
                        </p>
                      );
                    }
                    return (
                      <p className="text-xs text-muted-foreground">
                        Minimum is ₱100.
                      </p>
                    );
                  })()}
                  {/* Terms & Conditions notice */}
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-muted-foreground">
                      By continuing, you confirm that: (1) funds are not from
                      illegal sources, and (2) donations must not be used for
                      greenwashing. Standard donation terms apply.
                    </p>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="agree-terms"
                        checked={agreed}
                        onCheckedChange={(val) => setAgreed(Boolean(val))}
                        disabled={loading}
                      />
                      <Label
                        htmlFor="agree-terms"
                        className="text-sm leading-6"
                      >
                        I agree to the statement above.
                      </Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <div className="flex w-full flex-col gap-2">
                    <Button
                      className="w-full h-12 text-base font-medium"
                      size="lg"
                      onClick={handleBackProject}
                      disabled={
                        loading ||
                        amount === "" ||
                        Number(amount) < 100 ||
                        Number(amount) > maxDonationAmount ||
                        !agreed ||
                        !canBackProject
                      }
                    >
                      {loading ? "Processing..." : "Confirm & Pay"}
                    </Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Social Media Share Section */}
          {showShare && (
            <div className="mt-4">
              <div className="text-sm text-muted-foreground mb-2">
                Can't donate? Help by sharing this project:
              </div>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleFacebookShare}
                  title="Share on Facebook"
                >
                  <Facebook className="text-[#1877F3]" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleMessengerShare}
                  title="Share on Messenger"
                >
                  <MessageSquare className="text-[#00B2FF]" />
                </Button>
              </div>
            </div>
          )}

          {/* Help Link with tooltip */}
          {showHelpLink && onHowItWorks && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onHowItWorks}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <HelpCircle className="h-4 w-4" />
                  What happens if the goal isn’t reached?
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-left leading-relaxed">
                If the total target amount is not fully reached, all funds
                collected through ResearchBayanihan will still be utilized as
                in-kind contributions to strengthen this project’s funding
                proposal. This means the pledged amount can help unlock external
                grants or co-financing from partner agencies and donors—ensuring
                that your contribution still supports the project’s
                implementation and impact.
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Tags Section */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="text-sm px-3 py-1"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Login Alert Dialog */}
      <AlertDialog open={loginAlertOpen} onOpenChange={setLoginAlertOpen}>
        <AlertDialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader className="pb-2">
            <AlertDialogTitle>Sign In Required</AlertDialogTitle>
            <AlertDialogDescription>
              Please sign in to back this project and make a donation.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-0">
            <LoginForm
              callbackUrl={`/discover/${slug || id}`}
              onSuccess={() => {
                setLoginAlertOpen(false);
              }}
              compact={true}
            />
          </div>

          <div className="flex justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
