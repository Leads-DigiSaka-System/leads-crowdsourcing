-- CreateTable
CREATE TABLE "public"."project_drafts" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "addedBy" TEXT NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "project_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_drafts_addedBy_idx" ON "public"."project_drafts"("addedBy");

-- AddForeignKey
ALTER TABLE "public"."project_drafts" ADD CONSTRAINT "project_drafts_addedBy_fkey" FOREIGN KEY ("addedBy") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
