-- AlterTable
ALTER TABLE "public"."meeting_requests" ADD COLUMN     "meetingLink" TEXT,
ADD COLUMN     "scheduledDate" TIMESTAMP(3);
