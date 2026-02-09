// GET /api/certificates?programId= - List my certificates or for trainee (admin)
// POST /api/certificates - Generate/download certificate (trainee: own; admin: any)
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateCertificate } from "@/lib/certificate-service";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const programId = searchParams.get("programId");
    let traineeId = searchParams.get("traineeId");
    if (session.user.role === "TRAINEE") {
      traineeId = session.user.id;
    }
    const where: Record<string, string> = {};
    if (traineeId) where.traineeId = traineeId;
    if (programId) where.programId = programId;
    const certs = await prisma.certificate.findMany({
      where,
      include: {
        program: { select: { id: true, name: true } },
        trainee: { select: { id: true, name: true, email: true } },
      },
    });
    return NextResponse.json(certs);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const programId = body.programId as string | undefined;
    let traineeId = body.traineeId as string | undefined;
    if (!programId) {
      return NextResponse.json(
        { error: "programId is required" },
        { status: 400 }
      );
    }
    if (session.user.role === "TRAINEE") {
      traineeId = session.user.id;
    } else if (!traineeId) {
      traineeId = session.user.id;
    }
    const result = await getOrCreateCertificate(traineeId!, programId);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error";
    if (message.includes("not completed")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
