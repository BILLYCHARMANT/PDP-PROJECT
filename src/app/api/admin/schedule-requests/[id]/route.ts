import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ScheduleRequestStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    const body = await req.json();
    const status = body.status;
    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "status must be APPROVED or REJECTED" },
        { status: 400 }
      );
    }
    const event = await prisma.traineeScheduledEvent.findUnique({
      where: { id },
    });
    if (!event) {
      return NextResponse.json({ error: "Schedule request not found" }, { status: 404 });
    }
    await prisma.traineeScheduledEvent.update({
      where: { id },
      data: { status: status === "APPROVED" ? ScheduleRequestStatus.APPROVED : ScheduleRequestStatus.REJECTED },
    });
    return NextResponse.json({ success: true, status });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
