-- CreateEnum
CREATE TYPE "public"."MeetingRequestStatus" AS ENUM ('PENDING', 'READ', 'SCHEDULED', 'COMPLETED', 'REJECTED');

-- CreateTable
CREATE TABLE "public"."meeting_requests" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "preferredDate" TEXT NOT NULL,
    "preferredTime" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "public"."MeetingRequestStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "meeting_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meeting_requests_userId_idx" ON "public"."meeting_requests"("userId");

-- CreateIndex
CREATE INDEX "meeting_requests_status_idx" ON "public"."meeting_requests"("status");

-- AddForeignKey
ALTER TABLE "public"."meeting_requests" ADD CONSTRAINT "meeting_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meeting_requests" ADD CONSTRAINT "meeting_requests_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
