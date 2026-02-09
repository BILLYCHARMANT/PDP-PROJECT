// GET /api/admin/certificates/eligibility?traineeId=&programId= (admin only)
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCertificateEligibility } from "@/lib/certificate-admin-service";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const traineeId = searchParams.get("traineeId");
    const programId = searchParams.get("programId");
    if (!traineeId || !programId) {
      return NextResponse.json(
        { error: "traineeId and programId required" },
        { status: 400 }
      );
    }
    const result = await getCertificateEligibility(traineeId, programId);
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
