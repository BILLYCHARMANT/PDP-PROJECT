// GET /api/users - List users (admin: all; filter by role)
// Used for assigning mentors and enrolling trainees
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const where = role
      ? { role: role as "ADMIN" | "MENTOR" | "TRAINEE" }
      : {};
    const users = await prisma.user.findMany({
      where,
      orderBy: { name: "asc" },
      select: {
        id: true,
        email: true,
        name: true,
        imageUrl: true,
        phone: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });
    return NextResponse.json(users);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
