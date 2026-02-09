-- CreateEnum
CREATE TYPE "ScheduleEventType" AS ENUM ('LAB_WORKSHOP', 'MENTOR_MEETING');

-- CreateTable
CREATE TABLE "TraineeScheduledEvent" (
    "id" TEXT NOT NULL,
    "traineeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "eventType" "ScheduleEventType" NOT NULL,
    "requestCoffee" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT NOT NULL,
    "equipmentNeeded" TEXT,
    "teamMembers" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TraineeScheduledEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TraineeScheduledEvent_traineeId_idx" ON "TraineeScheduledEvent"("traineeId");
CREATE INDEX "TraineeScheduledEvent_date_idx" ON "TraineeScheduledEvent"("date");

-- AddForeignKey
ALTER TABLE "TraineeScheduledEvent" ADD CONSTRAINT "TraineeScheduledEvent_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
