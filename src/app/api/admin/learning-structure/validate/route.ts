// GET /api/admin/learning-structure/validate?programId= - Validate program structure (admin)
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { validateProgramStructure } from "@/lib/learning-structure-service";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const programId = searchParams.get("programId");
    if (!programId) {
      return NextResponse.json(
        { error: "programId required" },
        { status: 400 }
      );
    }
    const result = await validateProgramStructure(programId);
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
