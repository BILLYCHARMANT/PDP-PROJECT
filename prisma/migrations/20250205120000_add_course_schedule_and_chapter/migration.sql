-- AlterEnum: add COURSE_SCHEDULE to ScheduleEventType
ALTER TYPE "ScheduleEventType" ADD VALUE 'COURSE_SCHEDULE';

-- AlterTable: add moduleId and lessonId to TraineeScheduledEvent (for course schedule chapter)
ALTER TABLE "TraineeScheduledEvent" ADD COLUMN "moduleId" TEXT;
ALTER TABLE "TraineeScheduledEvent" ADD COLUMN "lessonId" TEXT;

-- CreateIndex
CREATE INDEX "TraineeScheduledEvent_moduleId_idx" ON "TraineeScheduledEvent"("moduleId");
CREATE INDEX "TraineeScheduledEvent_lessonId_idx" ON "TraineeScheduledEvent"("lessonId");

-- AddForeignKey
ALTER TABLE "TraineeScheduledEvent" ADD CONSTRAINT "TraineeScheduledEvent_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TraineeScheduledEvent" ADD CONSTRAINT "TraineeScheduledEvent_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;
