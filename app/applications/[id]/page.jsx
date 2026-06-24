import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ApplicationPreviewClient from "@/components/applications/ApplicationPreviewClient";
import { Suspense } from "react";
import { capitalizeFirstWordOnly, nameTitleCase } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({ params }) {
  const { id } = await params;

  try {
    const application = await prisma.researcherApplication.findUnique({
      where: { id },
      select: {
        title: true,
        overview: true,
      },
    });

    if (!application) {
      return { title: "Application Not Found" };
    }

    const description = application.overview
      ? application.overview.replace(/<[^>]*>/g, "").substring(0, 200)
      : `View ${application.title} research application proposal`;

    return {
      title: `${application.title} - Research Application`,
      description,
    };
  } catch (error) {
    console.error("Error in generateMetadata:", error);
    return { title: "Application Not Found" };
  }
}

const ApplicationPage = async ({ params }) => {
  const { id } = await params;

  // Check authorization first
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch application with Prisma
  const application = await prisma.researcherApplication.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      targetProject: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
  });

  if (!application) {
    return (
      <div>
        <Navbar />
        <div className="container mx-auto px-6 py-16">
          <div className="mx-auto max-w-2xl rounded-lg border bg-background p-8 text-center">
            <h1 className="text-xl font-semibold mb-2">
              Application Not Found
            </h1>
            <p className="text-muted-foreground mb-6">
              We couldn't find the application you're looking for. It may have
              been removed or is no longer accessible.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const isOwner = application?.userId === session.user.id;
  const isAdmin = session.user.role === "admin";

  if (!isOwner && !isAdmin) {
    return (
      <div>
        <Navbar />
        <div className="container mx-auto px-6 py-16">
          <div className="mx-auto max-w-2xl rounded-lg border bg-background p-8 text-center">
            <h1 className="text-xl font-semibold mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-6">
              You don't have permission to view this application.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // UI formatting helpers (similar to discover page)
  const formattedTitle = capitalizeFirstWordOnly(application.title);
  const rawOverview = application.overview || "";
  const formattedTeamMembers = (application.teamMembers || []).map((m) => ({
    ...m,
    name: nameTitleCase(m.name || ""),
  }));
  const formattedAuthors = (application.authors || "")
    .split(",")
    .map((s) => capitalizeFirstWordOnly(s.trim()))
    .filter(Boolean)
    .join(", ");

  const rawScientists = {
    contextAnswer: application.contextAnswer || "",
    significanceAnswer: application.significanceAnswer || "",
    goalsAnswer: application.goalsAnswer || "",
  };

  const formattedBudget = {
    budgetDescription: application.budgetDescription || "",
    budgetItems: (application.budgetItems || []).map((bi) => ({
      ...bi,
      name: capitalizeFirstWordOnly(bi.name || ""),
      description: capitalizeFirstWordOnly(bi.description || ""),
    })),
  };

  const formattedTimeline = {
    timelineDescription: application.timelineDescription || "",
    timelineEvents: (application.timelineEvents || []).map((te) => ({
      ...te,
      title: capitalizeFirstWordOnly(te.title || ""),
    })),
  };

  const totalBudget = Array.isArray(application.budgetItems)
    ? application.budgetItems.reduce(
        (sum, item) => sum + parseInt(item.value || 0),
        0
      )
    : 0;

  const applicationDataForClient = {
    applicationDetail: {
      id: application.id,
      title: formattedTitle,
      authors: formattedAuthors,
      location: application.location,
      image: application.image,
      imageAlt: application.imageAlt,
      goal: totalBudget,
      daysLeft: application.daysLeft,
      tags: application.tags,
      status: application.status,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
      user: application.user,
      targetProject: application.targetProject,
      currency: application.currency,
    },
    applicationContent: {
      overview: rawOverview,
      methods: application.methods || "",
      labNotes: application.labNotes || "",
      discussion: application.discussion || "",
    },
    scientistsContent: {
      contextAnswer: rawScientists.contextAnswer,
      significanceAnswer: rawScientists.significanceAnswer,
      goalsAnswer: rawScientists.goalsAnswer,
    },
    applicationBudget: {
      budgetDescription: formattedBudget.budgetDescription,
      budgetItems: formattedBudget.budgetItems,
    },
    applicationTimelineContent: {
      timelineDescription: formattedTimeline.timelineDescription,
      timelineEvents: formattedTimeline.timelineEvents,
      timelineDurationMonths: application.timelineDurationMonths ?? undefined,
    },
    applicationTeam: {
      teamDescription: application.teamDescription || "",
      teamMembers: formattedTeamMembers,
    },
    isAdmin,
    isOwner,
  };

  return (
    <div>
      <Navbar />
      <Suspense fallback={<div>Loading...</div>}>
        <ApplicationPreviewClient {...applicationDataForClient} />
      </Suspense>
      <Footer />
    </div>
  );
};

export default ApplicationPage;
