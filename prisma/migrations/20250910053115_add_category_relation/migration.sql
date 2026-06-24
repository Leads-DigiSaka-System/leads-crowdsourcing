/*
  Warnings:

  - You are about to drop the column `category` on the `projects` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."projects" DROP COLUMN "category",
ADD COLUMN     "categoryId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
