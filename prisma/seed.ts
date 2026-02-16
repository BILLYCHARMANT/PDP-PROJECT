/**
 * Seed script: creates sample admin, mentor, trainee, program, cohort, module, lesson, assignment.
 * Run: npm run db:seed (after db:push and with DATABASE_URL in .env.local or .env)
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local.");

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPassword = await hash("admin123", 12);
  const mentorPassword = await hash("mentor123", 12);
  const traineePassword = await hash("trainee123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@unipod.org" },
    update: { password: adminPassword, phone: "+250788100001" },
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
    update: { phone: "+250788200002" },
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
    update: { phone: "+250788300003" },
    create: {
      email: "trainee@unipod.org",
      password: traineePassword,
      name: "Trainee User",
      role: "TRAINEE",
      phone: "+250788300003",
    },
  });

  let program = await prisma.program.findFirst({
    where: { name: "Introduction to PROGRAMS" },
  });
  if (!program) {
    program = await prisma.program.create({
      data: {
        name: "Introduction to PROGRAMS",
        description: "Sample UNIPOD PROGRAMS program with one module.",
      },
    });
  }

  let course1 = await prisma.course.findFirst({
    where: { programId: program.id, name: { contains: program.name } },
  });
  if (!course1) {
    course1 = await prisma.course.create({
      data: {
        programId: program.id,
        name: `${program.name} Course`,
        description: program.description ?? undefined,
        status: "ACTIVE",
      },
    });
  }
  let module1 = await prisma.module.findFirst({
    where: { courseId: course1.id, title: "Module 1: Foundations" },
  });
  if (!module1) {
    module1 = await prisma.module.create({
      data: {
        courseId: course1.id,
        title: "Module 1: Foundations",
        description: "First module",
        order: 0,
      },
    });
    await prisma.lesson.create({
      data: {
        moduleId: module1.id,
        title: "Welcome",
        content: "Welcome to the program. This is sample content.",
        order: 0,
      },
    });
    await prisma.assignment.create({
      data: {
        moduleId: module1.id,
        title: "First assignment",
        description: "Submit a short reflection.",
        instructions: "Write 2-3 sentences about your goals.",
        order: 0,
      },
    });
  }

  let cohort = await prisma.cohort.findFirst({
    where: { programId: program.id, name: "Cohort 2025-01" },
  });
  if (!cohort) {
    cohort = await prisma.cohort.create({
      data: {
        programId: program.id,
        name: "Cohort 2025-01",
        mentorId: mentor.id,
      },
    });
  }

  await prisma.enrollment.upsert({
    where: {
      traineeId_cohortId: { traineeId: trainee.id, cohortId: cohort.id },
    },
    update: {},
    create: {
      traineeId: trainee.id,
      cohortId: cohort.id,
    },
  });

  await prisma.progress.upsert({
    where: {
      traineeId_moduleId: { traineeId: trainee.id, moduleId: module1.id },
    },
    update: {},
    create: {
      traineeId: trainee.id,
      moduleId: module1.id,
      status: "ACTIVE",
      percentComplete: 0,
    },
  });

  // Second program (course) so trainee sees two courses when enrolled in its cohort
  let program2 = await prisma.program.findFirst({
    where: { name: "Advanced PROGRAMS" },
  });
  if (!program2) {
    program2 = await prisma.program.create({
      data: {
        name: "Advanced PROGRAMS",
        description: "Second UNIPOD PROGRAMS program. Visible when you are enrolled in a cohort for this course.",
      },
    });
    const course2 = await prisma.course.create({
      data: {
        programId: program2.id,
        name: `${program2.name} Course`,
        description: program2.description ?? undefined,
        status: "ACTIVE",
      },
    });
    const module2 = await prisma.module.create({
      data: {
        courseId: course2.id,
        title: "Module 1: Next steps",
        description: "Advanced module",
        order: 0,
      },
    });
    await prisma.lesson.create({
      data: {
        moduleId: module2.id,
        title: "Getting started",
        content: "Welcome to the advanced program.",
        order: 0,
      },
    });
    const cohort2 = await prisma.cohort.create({
      data: {
        programId: program2.id,
        name: "Cohort 2025-02",
        mentorId: mentor.id,
      },
    });
    await prisma.enrollment.upsert({
      where: {
        traineeId_cohortId: { traineeId: trainee.id, cohortId: cohort2.id },
      },
      update: {},
      create: {
        traineeId: trainee.id,
        cohortId: cohort2.id,
      },
    });
  }

  console.log("Seed completed.");
  console.log("Admin: admin@unipod.org / admin123");
  console.log("Mentor: mentor@unipod.org / mentor123");
  console.log("Trainee: trainee@unipod.org / trainee123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
