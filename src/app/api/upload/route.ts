// POST /api/upload - Handle file upload for assignment submissions
// Returns fileUrl path to store with submission
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "No file or invalid file" },
        { status: 400 }
      );
    }
    const type = formData.get("type") as string | null;
    const subdir = type === "avatar" ? "avatars" : (type === "course" || type === "program") ? "courses" : "submissions";
    const ext = (path.extname(file.name) || "").toLowerCase();
    if (subdir === "submissions") {
      const allowed = [".pdf", ".doc", ".docx"];
      if (!allowed.includes(ext)) {
        return NextResponse.json(
          { error: "Only PDF and Word documents (.pdf, .doc, .docx) are allowed" },
          { status: 400 }
        );
      }
    }
    const safeExt = ext || (subdir === "avatars" ? ".png" : ".bin");
    const safeName = `${uuidv4()}${safeExt}`;
    const uploadDir = process.env.UPLOAD_DIR || "./uploads";
    const dir = path.join(process.cwd(), uploadDir, subdir);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = path.join(dir, safeName);
    const bytes = await file.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(bytes));
    const fileUrl =
      subdir === "avatars"
        ? `/api/upload/serve/avatar/${safeName}`
        : subdir === "courses"
          ? `/api/upload/serve/course/${safeName}`
          : `/api/upload/serve/${safeName}`;
    return NextResponse.json({ fileUrl, filename: file.name });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
