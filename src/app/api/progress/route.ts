// GET /api/progress?traineeId=&programId= - Get progress for trainee in program
// Admin/mentor can pass traineeId; trainee uses own id
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTraineeProgramProgress } from "@/lib/progress-service";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const programId = searchParams.get("programId");
    let traineeId = searchParams.get("traineeId");
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
    const progress = await getTraineeProgramProgress(traineeId, programId);
    return NextResponse.json(progress);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
