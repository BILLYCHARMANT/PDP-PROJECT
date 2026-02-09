// POST /api/lessons - Create lesson (admin)
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  moduleId: z.string().min(1),
  title: z.string().min(1),
  content: z.string().optional(),
  videoUrl: z.string().url().optional().or(z.literal("")),
  resourceUrl: z.string().optional(),
  order: z.number().int().min(0).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MENTOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const data = { ...parsed.data };
    if (data.videoUrl === "") data.videoUrl = undefined;
    const lesson = await prisma.lesson.create({
      data,
      include: { module: { select: { id: true, title: true } } },
    });
    return NextResponse.json(lesson);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
