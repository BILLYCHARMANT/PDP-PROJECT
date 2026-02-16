// GET /api/admin/reports?programId=&cohortId=&from=&to=&status=&format=csv - Export report (admin only)
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getReportData, reportRowsToCsv } from "@/lib/report-service";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const programId = searchParams.get("programId") ?? undefined;
    const cohortId = searchParams.get("cohortId") ?? undefined;
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const status = searchParams.get("status") as "all" | "in_progress" | "completed" | null;
    const format = searchParams.get("format") ?? "json";

    const rows = await getReportData({
      programId,
      cohortId,
      fromDate: from ? new Date(from) : undefined,
      toDate: to ? new Date(to) : undefined,
      completionStatus: status ?? "all",
    });

    if (format === "csv") {
      const csv = reportRowsToCsv(rows);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="PROGRAMS-report-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json(rows);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
