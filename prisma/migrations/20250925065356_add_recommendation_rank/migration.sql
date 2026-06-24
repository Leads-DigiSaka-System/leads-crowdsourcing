/*
  Warnings:

  - A unique constraint covering the columns `[recommendationRank]` on the table `projects` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."projects" ADD COLUMN     "recommendationRank" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "projects_recommendationRank_key" ON "public"."projects"("recommendationRank");
