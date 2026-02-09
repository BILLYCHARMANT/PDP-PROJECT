// GET /api/upload/serve/[filename] - Serve uploaded file (authenticated)
// ?inline=1 = display in browser (e.g. PDF viewer) instead of download
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import path from "path";
import fs from "fs";

const MIME_BY_EXT: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { filename } = await params;
  if (!filename || !/^[a-f0-9\-]+\.?[a-z0-9]*$/i.test(filename)) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }
  const { searchParams } = new URL(req.url);
  const inline = searchParams.get("inline") === "1";

  const uploadDir = process.env.UPLOAD_DIR || "./uploads";
  const filePath = path.join(process.cwd(), uploadDir, "submissions", filename);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filename).toLowerCase();
  const contentType = MIME_BY_EXT[ext] || "application/octet-stream";

  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "Content-Disposition": inline ? "inline" : `attachment; filename="${filename}"`,
  };
  return new NextResponse(buffer, { headers });
}
