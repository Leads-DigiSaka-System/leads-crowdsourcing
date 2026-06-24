-- CreateEnum
CREATE TYPE "public"."ResearcherApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REVISION_PENDING');

-- AlterTable
ALTER TABLE "public"."projects" ADD COLUMN     "fromApplication" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."researcher_applications" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "public"."ResearcherApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "targetProjectId" TEXT,
    "title" TEXT NOT NULL,
    "authors" TEXT,
    "image" TEXT,
    "imageAlt" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'PHP',
    "daysLeft" INTEGER NOT NULL,
    "tags" TEXT[],
    "categoryId" TEXT,
    "location" TEXT,
    "overview" TEXT NOT NULL,
    "methods" TEXT NOT NULL,
    "labNotes" TEXT,
    "discussion" TEXT,
    "contextAnswer" TEXT NOT NULL,
    "significanceAnswer" TEXT NOT NULL,
    "goalsAnswer" TEXT NOT NULL,
    "teamDescription" TEXT NOT NULL,
    "budgetDescription" TEXT NOT NULL,
    "timelineDescription" TEXT NOT NULL,
    "timelineDurationMonths" INTEGER,
    "teamMembers" JSONB NOT NULL,
    "budgetItems" JSONB NOT NULL,
    "timelineEvents" JSONB NOT NULL,
    "createdProjectId" TEXT,

    CONSTRAINT "researcher_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "researcher_applications_userId_idx" ON "public"."researcher_applications"("userId");

-- CreateIndex
CREATE INDEX "researcher_applications_status_idx" ON "public"."researcher_applications"("status");

-- CreateIndex
CREATE INDEX "researcher_applications_targetProjectId_idx" ON "public"."researcher_applications"("targetProjectId");

-- AddForeignKey
ALTER TABLE "public"."researcher_applications" ADD CONSTRAINT "researcher_applications_targetProjectId_fkey" FOREIGN KEY ("targetProjectId") REFERENCES "public"."projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."researcher_applications" ADD CONSTRAINT "researcher_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."researcher_applications" ADD CONSTRAINT "researcher_applications_createdProjectId_fkey" FOREIGN KEY ("createdProjectId") REFERENCES "public"."projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
