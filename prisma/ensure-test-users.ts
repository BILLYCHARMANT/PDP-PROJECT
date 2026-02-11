/**
 * Ensure test users exist: Creates test users if they don't exist
 * Run: npx tsx prisma/ensure-test-users.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set.");

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function ensureTestUsers() {
  console.log("Ensuring test users exist...");

  const adminPassword = await hash("admin123", 12);
  const mentorPassword = await hash("mentor123", 12);
  const traineePassword = await hash("trainee123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@unipod.org" },
    update: {},
    create: {
      email: "admin@unipod.org",
      password: adminPassword,
      name: "Admin User",
      role: "ADMIN",
      phone: "+250788100001",
    },
  });

  const mentor = await prisma.user.upsert({
    where: { email: "mentor@unipod.org" },
    update: {},
    create: {
      email: "mentor@unipod.org",
      password: mentorPassword,
      name: "Mentor User",
      role: "MENTOR",
      phone: "+250788200002",
    },
  });

  const trainee = await prisma.user.upsert({
    where: { email: "trainee@unipod.org" },
    update: {},
    create: {
      email: "trainee@unipod.org",
      password: traineePassword,
      name: "Trainee User",
      role: "TRAINEE",
      phone: "+250788300003",
    },
  });

  console.log("Test users ready:");
  console.log("Admin: admin@unipod.org / admin123");
  console.log("Mentor: mentor@unipod.org / mentor123");
  console.log("Trainee: trainee@unipod.org / trainee123");
}

ensureTestUsers()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
