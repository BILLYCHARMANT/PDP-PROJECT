-- AlterTable: add optional schedule dates to Module (set by admin/mentor)
ALTER TABLE "Module" ADD COLUMN "startDate" TIMESTAMP(3), ADD COLUMN "endDate" TIMESTAMP(3);
