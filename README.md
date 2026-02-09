# UNIPOD PDP Dashboard

Web-based Professional Development Program (PDP) dashboard for UNIPOD: learning content, trainee assessment, progress tracking, and certificate generation.

## Tech stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS
- **Backend:** Next.js API routes, NextAuth (JWT)
- **Database:** PostgreSQL with Prisma ORM

## Roles

- **Admin:** Manage programs, cohorts, modules, lessons, assignments; enroll trainees; assign mentors; view analytics; issue certificates
- **Mentor:** Review trainee submissions; approve, reject, or request resubmission; give feedback
- **Trainee:** View dashboard; access lessons; submit assignments; view feedback; download certificate when program is complete

## Setup

### 1. Environment

Copy `.env.example` to `.env.local` and set:

- `DATABASE_URL` – PostgreSQL connection string (e.g. `postgresql://user:password@localhost:5432/pdp`)
- `NEXTAUTH_URL` – App URL (e.g. `http://localhost:3000`)
- `NEXTAUTH_SECRET` – Random string for JWT (e.g. `openssl rand -base64 32`)
- `UPLOAD_DIR` – (optional) Directory for uploads and certificates, default `./uploads`

### 2. Database

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
```

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Sample logins (after seed)

| Role    | Email             | Password   |
|---------|-------------------|------------|
| Admin   | admin@unipod.org  | admin123   |
| Mentor  | mentor@unipod.org | mentor123  |
| Trainee | trainee@unipod.org| trainee123 |

## Usage

1. **Admin:** Sign in → Programs → create program → add modules → add lessons and assignments → Cohorts → create cohort and assign mentor → Cohorts → [cohort] → Enroll trainees. Users → Register user (for new mentors/trainees).
2. **Mentor:** Sign in → Submissions → review pending → Approve / Reject / Request resubmission with feedback.
3. **Trainee:** Sign in → My progress / Learning → open module → read lessons → submit assignments → after all modules completed, Certificates → certificate is generated on first request; download PDF.

## Certificate verification

Public page: `/verify?cert=UNIPOD-PDP-XXXXXXXX`. Certificate PDF includes a QR code linking to this URL.

## API overview

- `POST /api/auth/register` – Register user (admin or self as trainee)
- `GET/POST /api/programs`, `GET/PATCH/DELETE /api/programs/[id]`
- `GET/POST /api/cohorts`, `GET/PATCH /api/cohorts/[id]`, `POST /api/cohorts/[id]/enroll`
- `GET/POST /api/modules`, `GET/PATCH/DELETE /api/modules/[id]`
- `POST /api/lessons`, `GET/PATCH/DELETE /api/lessons/[id]`
- `POST /api/assignments`, `GET/PATCH /api/assignments/[id]`
- `GET/POST /api/submissions`, `GET/PATCH /api/submissions/[id]`
- `POST /api/feedback` – Mentor feedback and status (APPROVED/REJECTED/RESUBMIT_REQUESTED)
- `GET /api/progress?programId=&traineeId=`
- `GET/POST /api/certificates`, `GET /api/certificates/file/[filename]`
- `GET /api/verify?cert=` – Public certificate verification
- `GET /api/users?role=`
- `GET /api/analytics` – Admin analytics
- `POST /api/upload` – File upload for submissions

## Progress rules

- Module progress: percentage of assignments approved for that module.
- Module is **Completed** when all its assignments are **Approved** for the trainee.
- Program is complete when all modules are completed; then the trainee can generate a certificate.

## License

Private / UNIPOD.
