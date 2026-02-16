// Certificate generation: PDF with trainee name, program name, date, unique ID, QR code
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { prisma } from "./prisma";
import { getTraineeProgramProgress } from "./progress-service";

const CERT_PREFIX = "UNIPOD-PROGRAMS";

export async function getOrCreateCertificate(
  traineeId: string,
  programId: string,
  options?: { approvedById?: string; autoIssued?: boolean }
): Promise<{ certificateId: string; pdfUrl: string | null }> {
  const progress = await getTraineeProgramProgress(traineeId, programId);
  if (!progress.allCompleted) {
    throw new Error("Program not completed. Complete all modules to get certificate.");
  }
  const existing = await prisma.certificate.findUnique({
    where: {
      traineeId_programId: { traineeId, programId },
    },
  });
  if (existing) {
    return {
      certificateId: existing.certificateId,
      pdfUrl: existing.pdfUrl,
    };
  }
  const trainee = await prisma.user.findUnique({
    where: { id: traineeId },
  });
  const program = await prisma.program.findUnique({
    where: { id: programId },
  });
  if (!trainee || !program) {
    throw new Error("Trainee or program not found");
  }
  const certificateId = `${CERT_PREFIX}-${uuidv4().slice(0, 8).toUpperCase()}`;
  const pdfBuffer = await generateCertificatePDF({
    traineeName: trainee.name,
    programName: program.name,
    certificateId,
    issuedAt: new Date(),
  });
  const uploadDir = process.env.UPLOAD_DIR || "./uploads";
  const certDir = path.join(process.cwd(), uploadDir, "certificates");
  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true });
  }
  const filename = `${certificateId}.pdf`;
  const filePath = path.join(certDir, filename);
  fs.writeFileSync(filePath, pdfBuffer);
  const pdfUrl = `/api/certificates/file/${filename}`;

  await prisma.certificate.create({
    data: {
      traineeId,
      programId,
      certificateId,
      pdfUrl,
      approvedById: options?.approvedById ?? null,
      autoIssued: options?.autoIssued ?? true,
    },
  });
  return { certificateId, pdfUrl };
}

async function generateCertificatePDF(params: {
  traineeName: string;
  programName: string;
  certificateId: string;
  issuedAt: Date;
}): Promise<Buffer> {
  const { traineeName, programName, certificateId, issuedAt } = params;
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([595, 842]);
  const { width, height } = page.getSize();

  const verificationUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/verify?cert=${certificateId}`;
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
    width: 120,
    margin: 1,
  });
  const qrImageBytes = Buffer.from(
    qrDataUrl.replace(/^data:image\/png;base64,/, ""),
    "base64"
  );
  const qrImage = await doc.embedPng(qrImageBytes);
  page.drawImage(qrImage, {
    x: width - 150,
    y: height - 150,
    width: 120,
    height: 120,
  });

  const titleY = height - 120;
  page.drawText("Certificate of Completion", {
    x: 120,
    y: titleY,
    size: 24,
    font: bold,
    color: rgb(0.1, 0.2, 0.4),
  });
  page.drawText("UNIPOD Prototyping Development Program", {
    x: 120,
    y: titleY - 24,
    size: 12,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });

  const centerX = width / 2;
  let y = titleY - 80;
  page.drawText("This is to certify that", {
    x: centerX - font.widthOfTextAtSize("This is to certify that", 12) / 2,
    y,
    size: 12,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });
  y -= 28;
  page.drawText(traineeName, {
    x: centerX - bold.widthOfTextAtSize(traineeName, 20) / 2,
    y,
    size: 20,
    font: bold,
    color: rgb(0.1, 0.1, 0.2),
  });
  y -= 28;
  page.drawText("has successfully completed", {
    x: centerX - font.widthOfTextAtSize("has successfully completed", 12) / 2,
    y,
    size: 12,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });
  y -= 28;
  page.drawText(programName, {
    x: centerX - bold.widthOfTextAtSize(programName, 16) / 2,
    y,
    size: 16,
    font: bold,
    color: rgb(0.15, 0.25, 0.45),
  });
  y -= 50;
  const dateStr = issuedAt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  page.drawText(`Date of completion: ${dateStr}`, {
    x: 120,
    y,
    size: 10,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });
  page.drawText(`Certificate ID: ${certificateId}`, {
    x: 120,
    y: y - 16,
    size: 10,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });
  page.drawText("Verify at: " + verificationUrl, {
    x: 120,
    y: y - 32,
    size: 8,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}
