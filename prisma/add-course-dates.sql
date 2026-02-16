-- Add Course start/end date columns if they don't exist (safe to run multiple times)
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP(3);
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "endDate" TIMESTAMP(3);
