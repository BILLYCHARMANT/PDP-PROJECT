import { getServerSession } from "next-auth";
import { ScheduleRequestStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SchedulePassView } from "@/components/trainee/SchedulePassView";

export default async function TraineeSchedulePassPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TRAINEE") redirect("/dashboard");

  const [user, approvedEvents] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, imageUrl: true },
    }),
    prisma.traineeScheduledEvent.findMany({
      where: { traineeId: session.user.id, status: ScheduleRequestStatus.APPROVED },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      include: { mentor: { select: { name: true } } },
    }),
  ]);

  const traineeName = user?.name ?? session.user.name ?? "Trainee";
  const imageUrl = user?.imageUrl ?? null;
  const events = approvedEvents.map((ev) => ({
    id: ev.id,
    date: ev.date,
    startTime: ev.startTime,
    endTime: ev.endTime,
    eventType: ev.eventType,
    location: ev.location,
    mentorName: ev.mentor?.name ?? null,
  }));

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <SchedulePassView
        traineeName={traineeName}
        imageUrl={imageUrl}
        events={events}
      />
    </div>
  );
}
