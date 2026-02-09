-- AlterTable: add mentorId to TraineeScheduledEvent (required for mentor meetings)
ALTER TABLE "TraineeScheduledEvent" ADD COLUMN "mentorId" TEXT;

-- CreateIndex
CREATE INDEX "TraineeScheduledEvent_mentorId_idx" ON "TraineeScheduledEvent"("mentorId");

-- AddForeignKey
ALTER TABLE "TraineeScheduledEvent" ADD CONSTRAINT "TraineeScheduledEvent_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
