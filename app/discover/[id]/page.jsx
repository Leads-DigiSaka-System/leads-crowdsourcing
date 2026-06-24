import { auth } from "@/auth";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { ProjectPageSkeleton } from "@/components/ProjectPage/project-page-skeleton";
import ProjectPageClient from "@/components/ProjectPage/ProjectPageClient";
import {
  capitalizeFirstWordOnly,
  nameTitleCase,
  smartTitle,
} from "@/lib/utils";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export async function generateMetadata({ params }) {
  const { id: slug } = await params;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/projects/by-slug/${slug}`, {
    cache: "no-store",
  });
  const project = res.ok ? await res.json() : null;

  if (!project) {
    return {
      title: "Project Not Found",
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const publicBaseUrl =
    appUrl && !appUrl.includes("localhost")
      ? appUrl
      : "https://impactofresearch.fund";

  const projectUrl = `${publicBaseUrl}/discover/${project.slug}`;

  const description = project.overview
    ? project.overview.replace(/<[^>]*>/g, "").substring(0, 200)
    : `Check out ${project.title} - Support this research project!`;

  const imageUrl = project.image?.startsWith("http")
    ? project.image
    : `${publicBaseUrl}${project.image?.startsWith("/") ? "" : "/"}${
        project.image || "researchbayanihan_logo.png"
      }`;

  return {
    title: project.title,
    description,
    openGraph: {
      title: project.title,
      description,
      url: projectUrl,
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: project.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description,
      images: [imageUrl],
    },
  };
}

const ProjectPage = async ({ params }) => {
  const { id: slug } = await params;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/projects/by-slug/${slug}`, {
    cache: "no-store",
  });
  const project = res.ok ? await res.json() : null;

  if (!project) {
    return (
      <div>
        <Navbar />
        <div className="container mx-auto px-6 py-16">
          <div className="mx-auto max-w-2xl rounded-lg border bg-background p-8 text-center">
            <h1 className="text-xl font-semibold mb-2">Project Not Found</h1>
            <p className="text-muted-foreground mb-6">
              We couldn't find the project you're looking for. It may have been
              removed, changed, or is currently not visible.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/discover"
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
              >
                Browse All Projects
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (project.slug && slug !== project.slug) {
    redirect(`/discover/${project.slug}`);
  }

  if (project.show === false) {
    const session = await auth();
    const isAdmin = session?.user?.role === "admin";
    if (!isAdmin) {
      return (
        <div>
          <Navbar />
          <div className="container mx-auto px-6 py-16">
            <div className="mx-auto max-w-2xl rounded-lg border bg-background p-8 text-center">
              <h1 className="text-xl font-semibold mb-2">
                Project unavailable
              </h1>
              <p className="text-muted-foreground mb-6">
                This project is currently hidden and not accessible at the
                moment.
              </p>
              <Link
                href="/discover"
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
              >
                Go back to Discover
              </Link>
            </div>
          </div>
          <Footer />
        </div>
      );
    }
  }

  const formattedTitle = capitalizeFirstWordOnly(project.title);
  const rawOverview = project.overview || "";
  const formattedTeamMembers = (project.teamMembers || []).map((m) => ({
    ...m,
    name: nameTitleCase(m.name || ""),
  }));
  const formattedAuthors = (project.authors || "")
    .split(",")
    .map((s) => capitalizeFirstWordOnly(s.trim()))
    .filter(Boolean)
    .join(", ");
  const formattedAddedByUser = project.addedByUser
    ? {
        ...project.addedByUser,
        name: capitalizeFirstWordOnly(project.addedByUser.name || ""),
      }
    : null;
  const formattedCategory = smartTitle(project.category?.name || "");
  const rawScientists = {
    contextAnswer: project.contextAnswer || "",
    significanceAnswer: project.significanceAnswer || "",
    goalsAnswer: project.goalsAnswer || "",
  };
  const formattedBudget = {
    // budgetDescription can be rich text
    budgetDescription: project.budgetDescription || "",
    budgetItems: (project.budgetItems || [])
      .slice()
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || a.id - b.id)
      .map((bi) => ({
        ...bi,
        name: capitalizeFirstWordOnly(bi.name || ""),
        description: capitalizeFirstWordOnly(bi.description || ""),
        donations: (bi.allocations || [])
          .filter((a) => (a?.pledge?.status || "paid") === "paid")
          .map((a) => ({
            id: a.id,
            amount: a.amount || 0,
            createdAt: a.createdAt,
            userName: a.pledge?.user?.name || "Anonymous",
            solanaSignature: a.pledge?.solanaSignature || null,
          })),
      })),
  };

  const formattedTimeline = {
    timelineDescription: project.timelineDescription || "",
    timelineEvents: (project.timelineEvents || []).map((te) => ({
      ...te,
      title: capitalizeFirstWordOnly(te.title || ""),
    })),
  };

  const pledgedSum = Array.isArray(project.pledges)
    ? project.pledges
        .filter((p) => p.status === "paid")
        .reduce((sum, p) => sum + (p.amount || 0), 0)
    : 0;

  const allDonations = (project.budgetItems || [])
    .flatMap((bi) =>
      (bi.allocations || []).filter(
        (a) => (a?.pledge?.status || "paid") === "paid"
      )
    )
    .map((a) => ({
      id: a.id,
      amount: a.amount || 0,
      createdAt: a.createdAt,
      userName: a.pledge?.user?.name || "Anonymous",
      solanaSignature: a.pledge?.solanaSignature || null,
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const projectDataForClient = {
    projectDetail: {
      id: project.id,
      slug: project.slug,
      title: formattedTitle,
      authors: formattedAuthors,
      location: project.location,
      image: project.image,
      imageAlt: project.imageAlt,
      pledged: pledgedSum,
      goal: project.goal,
      daysLeft: project.daysLeft,
      category: formattedCategory,
      tags: project.tags,
      addedByUser: formattedAddedByUser || project.addedByUser,
      createdAt: project.createdAt,
      isCompleted: project.isCompleted,
    },
    projectContent: {
      overview: rawOverview,
      methods: project.methods || "",
      labNotes: project.labNotes || "",
      discussion: project.discussion || "",
    },
    scientistsContent: {
      contextAnswer: rawScientists.contextAnswer,
      significanceAnswer: rawScientists.significanceAnswer,
      goalsAnswer: rawScientists.goalsAnswer,
    },
    projectBudget: {
      budgetDescription: formattedBudget.budgetDescription,
      budgetItems: formattedBudget.budgetItems,
      isCompleted: project.isCompleted,
    },
    projectTimelineContent: {
      timelineDescription: formattedTimeline.timelineDescription,
      timelineEvents: formattedTimeline.timelineEvents,
      timelineDurationMonths: project.timelineDurationMonths ?? undefined,
    },
    projectTeam: {
      // teamDescription can be rich text
      teamDescription: project.teamDescription || "",
      teamMembers: formattedTeamMembers,
    },
    projectDonors: {
      donations: allDonations,
      totalCount: allDonations.length,
    },
  };

  return (
    <div>
      <Navbar />
      <Suspense fallback={<ProjectPageSkeleton />}>
        <ProjectPageClient {...projectDataForClient} />
      </Suspense>
      <Footer />
    </div>
  );
};

export default ProjectPage;
