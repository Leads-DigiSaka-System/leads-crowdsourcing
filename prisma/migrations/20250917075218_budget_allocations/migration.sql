-- AlterTable
ALTER TABLE "public"."budget_items" ADD COLUMN     "allocated" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."budget_allocations" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pledgeId" TEXT NOT NULL,
    "budgetItemId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "budget_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "budget_allocations_pledgeId_idx" ON "public"."budget_allocations"("pledgeId");

-- CreateIndex
CREATE INDEX "budget_allocations_budgetItemId_idx" ON "public"."budget_allocations"("budgetItemId");

-- AddForeignKey
ALTER TABLE "public"."budget_allocations" ADD CONSTRAINT "budget_allocations_pledgeId_fkey" FOREIGN KEY ("pledgeId") REFERENCES "public"."pledges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."budget_allocations" ADD CONSTRAINT "budget_allocations_budgetItemId_fkey" FOREIGN KEY ("budgetItemId") REFERENCES "public"."budget_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
