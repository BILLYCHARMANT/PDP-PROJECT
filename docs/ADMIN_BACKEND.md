# Admin Backend – Flow & Business Logic

Backend-only summary of admin responsibilities, system behavior, and APIs. No UI.

---

## 1. Program initialization

- **Create program:** `POST /api/programs` with `name`, `description`, `duration`, `skillOutcomes`.
- **Behavior:** Stored with `status: INACTIVE`. Becomes **ACTIVE** when the first cohort for that program is created (`createCohort` calls `ensureProgramActiveIfHasCohort`).
- **Activate explicitly:** `POST /api/admin/programs/[id]/activate` (allowed only if at least one cohort exists).

---

## 2. Learning structure (Program → Modules → Lessons → Assignment)

- **Rules enforced in backend:**
  - A module must have **at least one lesson**.
  - A module must have **exactly one mandatory assignment** (enforced in `POST /api/assignments`: if the module already has one mandatory, new ones are forced to `mandatory: false`).
- **Validation:** `GET /api/admin/learning-structure/validate?programId=` returns per-module status (`complete` / `incomplete`) and errors.
- **Module completion (progress):** All lessons accessed (see Lesson access) + mandatory assignment **APPROVED** by mentor. Rejection resets completion for that module until a new submission is approved.

---

## 3. Cohort creation & access

- **Create cohort:** `POST /api/cohorts` (name, programId, startDate, endDate, mentorId). Uses `createCohort`; program is activated if it’s the first cohort.
- **Trainee access:** `canTraineeAccessCohortContent(traineeId, cohortId)`:
  - Must be enrolled.
  - If cohort has `startDate`, content not allowed before that date.
  - If cohort has `endDate` (or enrollment `extendedEndDate`), content not allowed after that date.
- **Lesson access:** `POST /api/lessons/[id]/access` (trainee only) records `LessonAccess` and is used for “lesson completion” and thus module completion.

---

## 4. User management

- **List users:** `GET /api/users?role=` (includes `active`).
- **Activate / deactivate:** `PATCH /api/admin/users/[id]/active` with `{ "active": true | false }`. Deactivated users fail login (`authorize` in auth checks `user.active`).
- **Rule:** Admin cannot deactivate their own account.

---

## 5. Progress (read-only for admin)

- Progress is **only** computed:
  - Lesson completion = trainee has called lesson access (or equivalent).
  - Module completion = all lessons in module accessed + mandatory assignment approved.
  - Program completion = all modules completed.
- **Admin can:**
  - View progress (existing `GET /api/progress`).
  - Flag enrollment as at risk: `PATCH /api/admin/enrollments/[id]/at-risk` with `{ "atRisk": true | false }`.
  - Extend deadline: `PATCH /api/admin/enrollments/[id]/extend-deadline` with `{ "extendedEndDate": "<ISO date>" }` (no score change).

---

## 6. Submission oversight

- **View submissions:** Use existing `GET /api/submissions` (admin can see all with appropriate filters).
- **Reassign reviewer:** `PATCH /api/admin/submissions/[id]/reassign` with `{ "reviewerId": "<mentor userId>" }`. Only that mentor (or admin) can then add feedback; mentor approval logic is unchanged.
- **Feedback:** `POST /api/feedback` allowed only if the current user is the submission’s `assignedReviewer` or no reviewer is assigned (cohort mentor). Admin cannot change submission **content**.

---

## 7. Certification

- **Eligibility:** All modules completed (and final assessment if any is part of that).
- **Check eligibility:** `GET /api/admin/certificates/eligibility?traineeId=&programId=`.
- **Approve issuance:** `POST /api/admin/certificates/approve` with `{ "traineeId", "programId" }` (creates certificate with `approvedById`, `autoIssued: false`).
- **Auto-issuance:** Trainee request `POST /api/certificates` creates certificate with `autoIssued: true` when eligible.
- **Revoke:** `POST /api/admin/certificates/revoke` with `{ "certificateId", "reason" }`. Sets `revokedAt` and `revokedReason`. Public `GET /api/verify?cert=` returns `valid: false` when revoked.
- Certificate data is not modified after issuance; revocation only marks it revoked.

---

## 8. Reporting & export

- **Report data:** `GET /api/admin/reports?programId=&cohortId=&from=&to=&status=&format=`
  - `status`: `all` | `in_progress` | `completed`.
  - `format=json` (default): array of report rows.
  - `format=csv`: CSV download (trainee identity, progress %, completion state, certification status).
- Rows include: traineeId, traineeName, traineeEmail, programId, programName, cohortId, cohortName, enrolledAt, atRisk, progressPercent, completionState, certificateId, certificateIssuedAt, certificateRevoked.

---

## 9. Audit log

- **List:** `GET /api/admin/audit?entityType=&limit=` (admin only). Returns recent `AuditLog` entries with actor info.
- **Logged actions:** PROGRAM_CREATE, PROGRAM_UPDATE, PROGRAM_ACTIVATE, COHORT_CREATE, USER_DEACTIVATE, USER_ACTIVATE, ENROLLMENT_AT_RISK, ENROLLMENT_EXTEND_DEADLINE, SUBMISSION_REASSIGN, CERTIFICATE_APPROVE, CERTIFICATE_REVOKE, TRAINEE_ENROLL (from cohort enroll).

---

## 10. Data models (additions / changes)

| Entity       | Additions / changes |
|-------------|----------------------|
| User        | `active` (default true) |
| Program     | `duration`, `skillOutcomes`, `status` (INACTIVE / ACTIVE) |
| Enrollment  | `atRisk`, `extendedEndDate` |
| Assignment  | `mandatory` (default true) |
| Submission  | `assignedReviewerId` (optional; reassigned mentor) |
| Certificate | `revokedAt`, `revokedReason`, `approvedById`, `autoIssued` |
| LessonAccess| `traineeId`, `lessonId`, `firstAccessedAt` (unique per trainee/lesson) |
| AuditLog    | `actorId`, `action`, `entityType`, `entityId`, `details`, `createdAt` |

---

## Applying schema changes

After pulling these changes, run:

```bash
npx prisma generate
npx prisma db push
```

(Or use migrations if you prefer.)
