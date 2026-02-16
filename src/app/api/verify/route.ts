// GET /api/verify?cert=UNIPOD-PROGRAMS-XXXX - Public certificate verification
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const certId = searchParams.get("cert");
    if (!certId) {
      return NextResponse.json(
        { error: "Certificate ID is required" },
        { status: 400 }
      );
    }
    const cert = await prisma.certificate.findUnique({
      where: { certificateId: certId },
      include: {
        trainee: { select: { name: true } },
        program: { select: { name: true } },
      },
    });
    if (!cert) {
      return NextResponse.json(
        { valid: false, error: "Certificate not found" },
        { status: 404 }
      );
    }
    if (cert.revokedAt) {
      return NextResponse.json({
        valid: false,
        error: "Certificate has been revoked",
        certificateId: cert.certificateId,
        revokedAt: cert.revokedAt,
        revokedReason: cert.revokedReason,
      });
    }
    return NextResponse.json({
      valid: true,
      certificateId: cert.certificateId,
      traineeName: cert.trainee.name,
      programName: cert.program.name,
      issuedAt: cert.issuedAt,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
