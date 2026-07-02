-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "region" TEXT;

-- CreateIndex
CREATE INDEX "Job_region_idx" ON "Job"("region");
