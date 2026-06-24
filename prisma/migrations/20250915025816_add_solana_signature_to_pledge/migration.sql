-- AlterTable
ALTER TABLE "public"."pledges" ADD COLUMN     "solanaSignature" TEXT;

-- CreateIndex
CREATE INDEX "pledges_solanaSignature_idx" ON "public"."pledges"("solanaSignature");
