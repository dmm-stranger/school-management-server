# School ERP — Progress Log

Keep this file updated after every phase. Upload the latest version to the
Claude Project's knowledge so future chats pick up exactly where this left off.

---

## Project Setup

- **Stack decided:** Next.js (frontend) + Express.js + MongoDB (backend) — two separate repos
- **Repos:**
  - `school-erp-backend` — Node.js + Express + MongoDB + Mongoose
  - `school-erp-frontend` — Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- **Package manager:** Yarn (both repos ship with `yarn.lock`, use `yarn install` / `yarn dev`)
- **Source of truth docs:** uploaded `school-ERP-files.zip`
  - `CLAUDE-MASTER-PROMPT.md`
  - `Color_pallte.md`
  - `school_erp_roles_and_dashboards.md` (9 roles)
  - `Core School ERP. Backend. Business. Database/00-29` (full module specs, roadmap, folder structure)
  - `UI. UX. Frontend. Interaction/` (UI instructions + demo images)

---

## Phase 0 — Project Foundation ✅ COMPLETE

**Date:** 2026-08-17

### Backend (`school-erp-backend`)
- Folder structure created exactly per `03-folder-structure.md`
  (config, routes, modules, middlewares, services, utils, helpers,
  constants, validators, database, jobs, sockets, storage, emails,
  templates, types, shared)
- `src/config/`: server.js, database.js, jwt.js, cookie.js, cors.js, security.js, logger.js (winston)
- `src/database/connection.js`: Mongoose connection with error/disconnect handling + graceful shutdown
- `src/shared/`: ApiError.js, ApiResponse.js, asyncHandler.js
- `src/middlewares/`: error.middleware.js, notFound.middleware.js, rateLimit.middleware.js
- `src/routes/v1/index.js`: API versioning entry point (`/api/v1/health`)
- `src/app.js`: Express app — helmet, cors, hpp, rate limiting, morgan logging, body/cookie parsing
- `src/server.js`: entry point with graceful shutdown (SIGTERM/SIGINT) + unhandled rejection handling
- `package.json` with dependencies: express, mongoose, jsonwebtoken, bcryptjs, cookie-parser,
  cors, helmet, hpp, express-rate-limit, morgan, winston, zod, dotenv
- `.env.example`, `.gitignore`, `README.md`
- **Verified:** dependencies install cleanly, `app.js` loads with no syntax/import errors

### Frontend (`school-erp-frontend`)
- Scaffolded with `create-next-app`: TypeScript, Tailwind CSS 4, App Router, `src/` dir, ESLint
- Full design system wired into `src/app/globals.css` from `Color_pallte.md`:
  primary/accent/neutral/typography/chart/status colors, dark mode palette,
  border radius tokens (12px card / 8px control / pill)
- Fonts: Poppins (headings) + Inter (body) via `next/font/google`
- Folder structure: `components/ui`, `components/layout`, `features`, `lib`, `hooks`, `store`, `types`, `config`
- `src/lib/api-client.ts`: typed fetch wrapper matching backend's `ApiResponse` shape
- `.env.local.example` with `NEXT_PUBLIC_API_URL`
- Homepage (`src/app/page.tsx`) demonstrating the wired-in design tokens
- **Verified:** `tsc --noEmit` clean, `eslint` clean, production build succeeds

### Not yet done (deliberately out of scope for Phase 0)
- No auth, no database models, no real UI screens yet — that's Phase 1+
- Demo images / UI instruction docs not yet reviewed screen-by-screen — do this before Phase 1 UI work starts

---

## Phase 1 — Authentication & RBAC ✅ COMPLETE

**Date:** 2026-08-19

### Backend (`school-erp-backend`)
- **Models:** `User` (bcrypt hashing, tokenVersion, accountStatus), `Role`, `Permission`
  (`resource:action` key), `Session` (hashed refresh tokens, device/IP tracking), `OtpRequest`
  (email verification + password reset, 10-min expiry), `ActivityLog` (all auth actions logged)
- **Utils:** `token.util.js` (JWT access/refresh generation+verification, token hashing),
  `otp.util.js` (6-digit OTP generation/hashing/expiry), `cookie.util.js` (HttpOnly/Secure/
  SameSite cookie helpers)
- **Middleware:** `authenticate.middleware.js` (cookie/Bearer token → load user → tokenVersion
  check), `authorize.middleware.js` (`resource:action` permission check, SUPER_ADMIN bypass),
  `validate.middleware.js` (generic Zod validator)
- **Auth module** (`src/modules/auth/`): service covers all 10 flows from `04-authentication.md`
  — register, login, logout, refresh-token, forgot-password, reset-password, change-password,
  verify-email, resend-otp, me. Controller stays thin, routes match spec exactly.
- **Seeds:** `role-permission.seed.js` (21 resources × 10 actions, 12 roles incl. Receptionist/
  Sport Officer), `super-admin.seed.js` (bootstrap first login) — run via `yarn seed`
- **Verified:** 20 DB-independent unit tests passing (token round-trip, OTP hashing/expiry,
  Zod password-strength validation, bcrypt hash/compare, ApiError/ApiResponse shapes). Full
  live-MongoDB integration test was attempted but blocked by sandbox network restrictions
  (fastdl.mongodb.org unreachable) — **run `yarn seed && yarn dev` locally to verify the live
  DB flow end-to-end before Phase 2.**

### Frontend (`school-erp-frontend`)
- **`features/auth/`**: `auth.types.ts` (mirrors backend contract exactly), `auth.api.ts`
  (typed API functions), `AuthContext.tsx` (session state, login/logout, role→dashboard
  routing map), `RequireAuth.tsx` (route guard — UX convenience only, not a security boundary)
- **`components/ui/`**: `Button.tsx`, `Input.tsx` — first reusable primitives, token-driven
  styling, accessible (labels, aria-invalid, aria-describedby)
- **Pages:** `/login`, `/forgot-password`, `/reset-password` (OTP flow), `/403`, `/dashboard`
  (placeholder, demonstrates `RequireAuth`), `/` (redirects by auth status)
- **Verified:** `tsc --noEmit` clean, `eslint` clean (0 warnings), full production build
  succeeds — all 7 routes compile.

### Not yet done (deliberately out of scope for Phase 1)
- No role-specific dashboard shells yet (Admin/Teacher/Student/... ) — Phase 2
- No Student/Teacher/Staff/Guardian profile CRUD yet — Phase 2 (User Management)
- Email sending is currently a **logger stub** (`sendOtpEmail` in `auth.service.js` just logs
  the OTP) — real SMTP/nodemailer wiring is part of the Communication module (Phase 12/13)
- Live end-to-end DB test not run in this sandbox (network-restricted) — verify locally

---

## Phase 2 — User Management ✅ COMPLETE

**Date:** 2026-08-30

### Backend (`school-erp-backend`)
- **Models:** `Student`, `Teacher`, `Staff`, `Guardian` — with shared `personalInfo`/
  `contactInfo` sub-schemas (`shared/profileSubSchemas.js`) reused across all three staff-like
  profiles, per `06-user-management.md`. Guardian's `userId` is optional (record-only guardians
  supported without portal access). Student's academic info is history-only — current class/
  section is deliberately NOT stored here, it belongs to `StudentEnrollment` (Phase 5).
- **`utils/idGenerator.util.js`**: atomic counter-based sequential ID generation
  (`STU-2026-00001`, `EMP-T-2026-00001`, `EMP-S-2026-00001`) — race-condition safe via
  `findByIdAndUpdate` + `$inc`.
- **`modules/user/user.service.js`**: the reusable transactional core of the User Creation Flow
  (`Create User → Hash Password → Assign Role → Create Profile → Update User.profileId → Send
  Verification Email`), used identically by Student/Teacher/Staff/Guardian creation — implemented
  with real MongoDB transactions (`withTransaction` helper) per `02-database-design.md` §3.4.
- **Full CRUD** for all 4 profile modules + generic `/users` endpoints (list/get/update/delete +
  self `/users/profile`), permission-gated via `resource:action` keys matching the Phase 1 RBAC
  seed (`student:create`, `teacher:list`, `guardian:update`, etc.)
- **`auth.service.js` `sanitizeUser`**: now returns a flattened `permissions: string[]` array
  (`["*"]` for SUPER_ADMIN) so the frontend can resolve nav/UI visibility without guessing —
  population depth fixed everywhere (`roleIds` → nested `permissions`) to support this.
- **Verified:** full backend loads cleanly with all Phase 2 modules wired into `/api/v1`; all
  routes confirmed registered correctly (`/students`, `/teachers`, `/staff`, `/guardians`,
  `/users` — matching spec exactly, including Guardian having no DELETE route per spec).

### Frontend (`school-erp-frontend`)
- **`config/navigation.ts`**: single source of truth nav tree (per `24-navigation-system.md`
  §66 — no per-role duplication), grouped by People/Academic/Operations/System, each item gated
  by a `permission` or `roles` field.
- **`hooks/useNavigation.ts`**: resolves visible nav items from the logged-in user's flattened
  `permissions` — UX-visibility layer only, backend remains the real authority (per
  `FRONTEND-WORKING-FLOW.md` §13).
- **`components/layout/`**: `Sidebar` (collapsible, active-state aware), `Header` (search,
  notifications, user menu), `MobileDrawer` (mobile nav per §25-27 of the nav spec),
  `Breadcrumbs` (auto-derived from route segments), `AppShell` (ties them all together).
- **`app/(dashboard)/layout.tsx`**: route-group layout — wraps every authenticated page in
  `RequireAuth` + `AppShell` automatically, so individual pages don't repeat that boilerplate.
- **10 role dashboards** (`/dashboard/admin`, `/principal`, `/teacher`, `/student`, `/guardian`,
  `/accountant`, `/librarian`, `/staff`, `/receptionist`, `/sport-officer`) — all built on one
  shared `RoleDashboard` component (per `FRONTEND-WORKING-FLOW.md` §6.3), each just passing its
  own title/description/KPI set. `/dashboard` is a generic fallback that redirects to the
  correct role-specific one.
- **`/people/students`**: first real module list page — full list pattern from
  `FRONTEND-WORKING-FLOW.md` §6.1 (debounced search, status filter chips with "Clear all",
  skeleton loading, distinct empty vs error states with retry, pagination, avatar-initials,
  `StatusBadge` using the design system's status color tokens).
- **Verified:** `tsc --noEmit` clean, `eslint` clean (0 warnings), full production build
  succeeds — all 20 routes compile.

### Notable fixes made along the way
- Role dashboard pages needed explicit `"use client"` — passing Lucide icon *components* as
  props from a Server Component into a Client Component isn't allowed in Next.js App Router.
- `KpiCard`'s icon type needed `style?: CSSProperties` added since dashboard cards color icons
  dynamically from the chart-color tokens.
- Two components triggered the `react-hooks/set-state-in-effect` lint rule (calling setState
  synchronously as the first statement of a function invoked directly in a `useEffect` body) —
  fixed in `AuthContext` via an in-effect async IIFE with a `cancelled` guard, and in the
  Students page via deferring the initial fetch with `queueMicrotask`.

### Not yet done (deliberately out of scope for Phase 2)
- Student/Teacher/Staff/Guardian **create/edit forms** — only List + the service/API layer are
  built; the "Add Student" button links to `/people/students/new`, which doesn't exist yet
  (build this alongside Phase 3+ as the form patterns from `FRONTEND-WORKING-FLOW.md` §6.2 get
  established, likely revisited once Campus/Academic exist since forms need class/section pickers)
- Teacher/Staff/Guardian list pages — only Students list is built as the reference
  implementation; the same pattern needs replicating for the other three
  (`/people/teachers`, `/people/staff`, `/people/guardians`)
- Dashboard KPI cards still show placeholder `"—"` values — real data wiring happens once the
  relevant modules (attendance, finance, etc.) exist in later phases
- Live end-to-end DB test still not run in this sandbox (network-restricted) — verify locally

---

## Bugfix — "Schema hasn't been registered for model 'Permission'" (2026-09-02)

**Symptom:** Login / `/auth/me` (and anything else populating `Role.permissions`) threw
`Schema hasn't been registered for model "Permission". Use mongoose.model(name, schema)`.

**Root cause:** Mongoose only registers a schema when the file that calls `mongoose.model(name,
schema)` is actually imported by the running process. `Permission`'s model file was only ever
imported directly by the role/permission seed script — never by anything the live server
actually loads — so when `Role.permissions` (a `ref: "Permission"`) got populated at runtime,
there was no registered schema to resolve against. Any model reachable only via another
schema's `ref` (not imported directly by a route/service) is at risk of this.

**Fix:**
- Added `src/database/models.registry.js` — imports every model file once, with a comment
  explaining why this file exists and the instruction to add new models here going forward.
- Imported the registry from **`src/database/connection.js`**, not just `server.js` — this is
  the true chokepoint every entry point (server, seed scripts, future scripts/tests) already
  passes through via `connectDatabase()`, so registration is guaranteed regardless of which
  script initiates it. (`server.js` also imports it directly as a defense-in-depth belt-and-
  suspenders measure, but `connection.js` is what actually closes the gap.)
- Seed scripts also import the registry directly for clarity, though they're covered either way.

**Verified:** reproduced the exact error in isolation (only importing `Role`, not `Permission`
directly), confirmed the registry fixes it, and confirmed importing *only* `connection.js` (as
any entry point would) is now sufficient to register all 11 models. Full app boot and frontend
build re-verified clean after the fix.

---

## Phase 3 — Campus Management ✅ COMPLETE

**Date:** 2026-09-03

### Spec correction worth noting
`07-campus-building-room.md` models this more flatly than "Campus → Building → Floor → Room"
as four separate collections — there's a **single `academies` collection where each document
IS one room** (fields: `buildingName`, `roomNumber`, `floor`, `roomType`, `status`, `capacity`,
`description`, `facilities`, `relatedUsers`). Campus itself isn't a separate collection yet
(spec: "Current Version: Single Campus... Future: Support Multiple Campuses"). Built exactly to
this — no separate Campus/Building/Floor models invented.

### Backend (`school-erp-backend`)
- **`Academy` model** (`modules/academy/`) — all fields/enums exactly per spec: 2 buildings
  (ACA-RED, ACA-GREEN), 4 floors, 16 room types, 5 statuses, 10 facilities. Room number format
  enforced via regex (`RM01`–`RM70`). Unique index on `(buildingName, roomNumber)` per the
  spec's uniqueness rule.
- **Full CRUD** + the 3 spec-required aggregate endpoints: `GET /academies/buildings` (room
  count + total capacity + floors per building), `GET /academies/floors` (room count per floor,
  optionally scoped to a building), `GET /academies/rooms` (explicit alias of the main list).
  **Route ordering verified**: static routes (`/buildings`, `/floors`, `/rooms`) registered
  before `/:id` so they aren't swallowed as an `:id` param — confirmed via runtime route-stack
  inspection, not just by inspection of the code.
- **`room.seed.js`** — seeds all 70 rooms × 2 buildings from the spec's exact Classroom
  Allocation / Principal Office / Teacher Rooms / Auditorium / Labs / Store Rooms / Finance
  Rooms / Cafeteria / Mosque / Washrooms / Bathrooms tables, with sensible per-type capacity
  defaults. Added as `yarn seed:rooms` (also runs as part of `yarn seed`).
- **Bugfix along the way:** Student/Teacher/Staff models had a stale `ref: "Campus"` on their
  `academy` field left over from Phase 2 (a model that was never actually built) — corrected to
  `ref: "Academy"` to point at the model that actually exists now.
- **Verified:** full backend boots cleanly with Academy wired into `/api/v1/academies`; route
  ordering confirmed correct at runtime; seed script syntax-checked and its room-type values
  cross-verified against the model's enum (13 types used, all valid).

### Frontend (`school-erp-frontend`)
- **`features/academy/`**: types mirroring every backend enum exactly (as `as const` tuples for
  full autocomplete), typed API functions.
- **New `components/ui/Select.tsx`** — first form `<select>` primitive, matching `Input`'s
  label/error/hint/accessibility pattern (this will be reused by every future form).
- **`/academic/rooms`**: list page — building/type/status filter dropdowns + debounced search,
  same skeleton/empty/error states as the Students list.
- **`/academic/rooms/new`**: the project's **first real create form** — validates on submit
  (required fields, room-number regex, capacity > 0), maps backend field-level errors onto the
  right inputs, facility multi-select as toggleable pills, redirects to the detail page on
  success.
- **`/academic/rooms/[id]`**: detail + inline edit — building/room number shown read-only
  (immutable after creation), everything else editable, delete with an inline (not modal)
  confirm-then-confirm pattern per the "destructive actions never one-click" UX rule.
- **Nav**: added "Rooms & Buildings" under the Academic group, gated on `room:list`.
- **Bugfix along the way:** `ApiClientError.errors` was typed as `string[]` but the backend
  actually always returns `{field, message}[]` (per `validate.middleware.js`) — fixed the type
  in `lib/api-client.ts` itself, which benefits every form built from here on, not just this one.
- **Verified:** `tsc --noEmit` clean, `eslint` clean (0 warnings), full production build
  succeeds — all 22 routes compile (20 static + 1 new dynamic `/academic/rooms/[id]`).

### Not yet done (deliberately out of scope for Phase 3)
- `relatedUsers` (assigning teachers/students to a room) has no UI yet — the field exists on the
  model and is populated in API responses, but assignment happens once Teacher Assignment /
  Student Enrollment (Phase 4/5) exist and there's a natural place to trigger it from
- No capacity-vs-assignment enforcement yet ("routine generation must check room capacity" —
  spec's rule, relevant once the Routine engine (Phase 5) exists)
- Live end-to-end DB test still not run in this sandbox (network-restricted) — verify locally,
  including running `yarn seed:rooms` and confirming rooms actually appear in the UI

---

## Phase 4 — Academic Structure ✅ COMPLETE

**Date:** 2026-09-05

The densest phase so far — 4 interlocking specs with several hard business rules.

### Backend (`school-erp-backend`)
- **`AcademicYear`** — full CRUD, "only one ACTIVE at a time" enforced in the service (setting
  a year ACTIVE auto-deactivates any other). Deleting the currently-ACTIVE year is blocked.
- **`Class` / `Section` / `Group`** — modeled as **GET-only reference data** per spec (the spec
  only lists GET endpoints for these — no POST/PATCH/DELETE — so they're seeded, not
  admin-created via API). 12 classes (Class 0–10 + SSC), sections per class (A/B for Class 0–8,
  A/B/C for Class 9–SSC, per spec), 3 global groups (Science/Commerce/Humanities).
- **`Subject`** — full CRUD, unique subject codes, no duplicate subject name within the same
  class, optional `group` ref (null = common/mandatory, set = group-specific — only meaningful
  for Class 9/10/SSC). `GET /subjects/class/:classLevel` and `GET /subjects/group/:group`
  convenience endpoints, registered before `/:id` to avoid route-order collisions.
- **`TeacherAssignment`** — duplicate-assignment prevention (same teacher+class+section+subject+
  year rejected with a clean 409, backed by a unique index too), **one class teacher per section**
  rule enforced on both create and update, group-requirement validated against the target class's
  `hasGroups` flag.
- **`StudentEnrollment`** — the most rule-dense model: roll number unique per
  (academicYear+class+section), **one ACTIVE enrollment per student per academic year**, section
  capacity checked before enrolling, plus transactional **`POST /promote`** and **`POST
  /transfer`** endpoints that create a new enrollment while marking the source as `PROMOTED` /
  `TRANSFERRED` respectively — never deleting or overwriting historical enrollment data, per spec.
- **RBAC seed updated**: added `academic`, `assignment`, `enrollment` as new permission
  resources (previously these had no dedicated resource at all); wired into
  PRINCIPAL/VICE_PRINCIPAL/TEACHER/STUDENT/GUARDIAN role permission sets appropriately.
- **`academic-structure.seed.js`**: seeds all 12 classes, all sections, all 3 groups, and real
  subject data for every class — Class 1–8 subject lists straight from spec; Class 9/10/SSC
  split into common (10) + Science-specific (5) + Commerce-specific (3) + Humanities-specific (4)
  subjects. **Spec discrepancy noted in code comments**: the spec labels this "Total Subjects: 23"
  but only enumerates 22 — seeded the 22 actually listed rather than inventing a 23rd. The
  common-vs-group split itself is a documented interpretation (standard NCTB curriculum
  grouping), since the spec lists all 22 together without explicit per-subject group tags.
- **Verified:** full backend boots cleanly with all 19 models registered; route ordering
  confirmed correct at runtime across every new router; all Phase 4 Zod validation schemas
  (date-range ordering, URL format, required-field combinations, promote/transfer payloads)
  pass targeted tests.

### Frontend (`school-erp-frontend`)
- **`/academic/years`**: list + inline create form + "Set Active" action per row (no modal —
  inline toggle, since it's a single low-risk state change).
- **`/academic/classes`**: read-only browser — each class shown as a card with its seeded
  sections and capacities; explicit empty-state message pointing at `yarn seed:academic` if
  nothing's been seeded yet, since there's no create UI for this reference data by design.
- **`/academic/subjects`**: list with class/group filter dropdowns + a create form whose Group
  select is disabled and explains itself when the selected class doesn't use groups.
- **Nav fix**: Academic Years/Classes nav items were still pointing at the stale `subject:list`
  permission key from before `academic` existed as its own resource — corrected to `academic:list`.
- **Verified:** `tsc --noEmit` clean, `eslint` clean (0 warnings), full production build
  succeeds — all 25 routes compile.

### Not yet done (deliberately out of scope for Phase 4)
- **Teacher Assignment UI** and **Student Enrollment UI** (including the promote/transfer
  flows) have no frontend yet — backend is fully built and testable via API, but the screens
  are deferred to be built alongside Phase 5 (Routine), since assignment/enrollment pickers
  naturally belong next to routine-building UI and it keeps this phase's frontend scope sane
  (same pattern as deferring Teacher/Staff/Guardian list pages in Phase 2)
- No edit/delete UI for Subjects yet (create + list only) — same reasoning, low-risk to defer
- Live end-to-end DB test still not run in this sandbox (network-restricted) — verify locally,
  including running `yarn seed:academic` and confirming classes/sections/subjects appear in the UI

---

## Phase 5 — Class Routine Engine ✅ COMPLETE

**Date:** 2026-09-06

The most algorithmically complex phase so far — conflict detection across 5 dimensions, a
greedy auto-generator, and a DRAFT → ACTIVE → LOCKED publish workflow.

### Backend (`school-erp-backend`)
- **`Period`** — GET-only reference data (like Class/Section/Group), seeded with 10 slots (8
  teaching periods + break + lunch) matching the spec's exact example timing.
- **`ClassRoutine`** — all spec fields exactly (academicYear/class/section/group/day/period/
  subject/teacher/room/startTime/endTime/status). Three compound unique indexes prevent
  Duplicate Class Period, Teacher Conflict, and Room Conflict **at the database level**, not
  just in application logic — a double-booking literally cannot be inserted.
- **`classRoutine.conflicts.js`**: dedicated conflict-detection module implementing all 5
  checks the spec requires before publishing (Teacher Conflict, Room Conflict, Duplicate Class
  Period, Duplicate Subject Period, Invalid Assignment) — the first 3 are defensive re-checks
  of what the indexes already prevent; Duplicate Subject Period and Invalid Assignment are
  genuine cross-collection business rules the schema can't enforce on its own (a teacher must
  hold an actual `TeacherAssignment` for the subject/class/section, and a room must not be
  under maintenance/closed).
- **Full CRUD** + **`POST /generate`** (auto-scheduler), **`POST /publish`** (blocks if
  conflicts exist, moves DRAFT→ACTIVE), **`POST /lock`** / **`POST /unlock`** (bulk status
  toggle per scope), plus `GET /class/:classId`, `/teacher/:teacherId`, `/room/:roomId`, and an
  added-value `GET /conflicts` endpoint (not explicitly in the spec's API list, but directly
  serves the spec's own "must detect conflicts" requirement as a reusable report).
- **Lock enforcement**: `update`/`delete` both check `status !== "LOCKED"` before allowing any
  change, per spec ("no modification allowed unless unlocked").
- **Auto-generator** (`generateRoutine`): a documented, intentionally simple greedy scheduler —
  for every active `TeacherAssignment` in the target class/section, places one weekly slot per
  subject into the first day+period where the class, teacher, and a single caller-supplied room
  are all free. The spec explicitly lists "AI Based Routine Generator" as **Future Scope**, so
  this greedy v1 baseline is scoped correctly, not a placeholder mistake — documented as such
  in code comments.
- **RBAC**: no new resources needed — `routine` already existed from the original seed, and its
  actions (`create/read/update/delete/list/publish/assign`) already covered every route.
- **`period.seed.js`** added; `yarn seed` now runs it too.
- **Verified:** full backend boots cleanly with all 21 models registered; route ordering
  confirmed correct at runtime (`/generate`, `/publish`, `/lock`, `/unlock`, `/conflicts` all
  registered before `/:id`); all Phase 5 Zod validation schemas pass targeted tests (time-format
  regex, day enum, endTime-after-startTime).

### Frontend (`school-erp-frontend`)
- **Deferred-from-Phase-4 screens finally built**, since they belong naturally alongside
  routine-building UI:
  - **`/academic/assignments`**: list + create form (teacher/year/class/section/group/subject
    pickers, group select auto-disables for non-grouped classes, class-teacher checkbox).
  - **`/academic/enrollments`**: list + create form, plus **Promote**/**Transfer** actions per
    row (modal with its own class/section/group/roll-number picker) — both explicitly message
    "this creates a new enrollment; the current one is preserved as history" to match the
    backend's non-destructive design.
- **`/academic/routine`**: scope picker (year/class/section/group) → period × day grid, cells
  color-coded by status (DRAFT/ACTIVE/LOCKED), room picker + Generate/Check Conflicts/Publish/
  Lock/Unlock action bar, conflicts rendered as a readable list when found.
- **New minimal `features/teacher/`**: a lightweight `teacherApi.list()` for dropdown use only
  (full Teacher CRUD/detail pages remain a later phase, per the Phase 2 deferral — this just
  unblocks the assignment/routine pickers that need to reference a teacher by name).
- **Verified:** `tsc --noEmit` clean, `eslint` clean (0 warnings), full production build
  succeeds — all 28 routes compile.

### Not yet done (deliberately out of scope for Phase 5)
- No edit UI for individual routine cells yet (generate/publish/lock act on a whole scope;
  editing/deleting one specific period slot has no dedicated UI, only the underlying API)
- Full Teacher/Staff/Guardian list+detail pages are still deferred (Phase 2's original
  deferral) — the new `teacherApi.list()` is intentionally minimal, dropdown-only
- Live end-to-end DB test still not run in this sandbox (network-restricted) — verify locally,
  including running `yarn seed:periods` and generating a real routine end-to-end

---

## Phase 6 — Examination ✅ COMPLETE

**Date:** 2026-09-08

### Spec interpretation worth noting
The spec lists `grade`/`gpa` as required Result Fields but doesn't provide the actual grading
table, and separately lists "Automatic GPA Calculation" under Future Scope (referring to a more
advanced board-integrated system, not basic per-exam grading). To make Result generation
actually functional now, implemented the standard Bangladesh NCTB percentage→grade/GPA scale
(A+ 80%+ / A 70%+ / A- 60%+ / B 50%+ / C 40%+ / D 33%+ / F below) as a documented v1 baseline in
`grading.util.js`, plus the standard "fail any subject → fail overall" rule. Both are explicit
interpretations, not verbatim spec text — flagged in code comments.

### Backend (`school-erp-backend`)
- **`Exam`** — full CRUD; a PUBLISHED exam can only be archived, never edited/deleted, per spec.
- **`ExamSchedule`** — duplicate-schedule prevention (one subject, one schedule, per exam/class/
  section/group) plus **genuine time-overlap room-conflict detection** (not just exact-match —
  correctly catches partially-overlapping slots of different lengths, verified with 5 targeted
  overlap-logic tests). `passMarks ≤ fullMarks` enforced at both the Mongoose and Zod layers.
- **`ExamInvigilator`** — nested under exam-schedules (`POST/DELETE .../invigilators`) since the
  spec defines the collection and its fields but never lists a top-level API for it — a
  documented gap-fill, not a spec deviation. Same time-overlap logic prevents a teacher being
  double-booked as invigilator across two overlapping exams.
- **`ExamMark`** — bounds-checked against the schedule's `fullMarks`, requires an ACTIVE
  enrollment, blocked entirely while the schedule is still `DRAFT` (per spec's "must be
  finalized" rule). Corrections **append an embedded revision entry** (previous value + who +
  when + reason) rather than silently overwriting — satisfies the spec's "any correction must
  create a new revision log" rule without standing up a separate top-level revision collection.
  Added `POST /exam-marks/bulk` for whole-class entry in one request (not explicitly listed in
  the spec's API section, but a direct, obvious need once you look at the actual UI workflow).
- **`ExamResult`** — `generateResults` aggregates every mark a student has across all of an
  exam's schedules for a class/section/(group), requires marks to be complete for all subjects
  (skips + reports students with incomplete entry rather than silently guessing), computes
  percentage/grade/GPA, and dense-ranks the cohort by obtained marks. `publishResults` locks all
  DRAFT results to PUBLISHED and flips the parent Exam to PUBLISHED too — no update endpoint
  exists after that point, matching the spec's immutability rule structurally (there's simply
  nothing to call).
- **RBAC**: no seed changes needed — `exam` and `result` resources already existed from the
  original seed and already covered every action these routes needed.
- **Verified:** full backend boots cleanly with all 26 models registered; route ordering
  confirmed correct everywhere (`/bulk`, `/generate`, `/publish`, `/student/:id`,
  `/:id/invigilators` all ahead of `/:id`); grading scale tested across all 7 bands plus boundary
  conditions; time-overlap logic tested with 5 cases (adjacent-but-not-overlapping, fully
  contained, identical ranges, etc.); all Zod validation schemas tested.

### Frontend (`school-erp-frontend`)
- **`/examination/exams`**: list + create form, links through to that exam's schedules.
- **`/examination/schedules`**: list (filterable by exam, deep-linkable via `?examId=`) + create
  form — class/section/group/subject cascading selects reuse the same pattern established in
  Phase 5's assignment/enrollment forms.
- **`/examination/marks`**: schedule picker → a real marks-entry grid (one row per student, one
  number input per row, bulk-saves in a single request) rather than a one-student-at-a-time form
  — this is the workflow a teacher would actually want.
- **`/examination/results`**: generate/publish action panel (exam + class/section/group scope)
  and a separate "view a student's results" lookup rendering the full grade/GPA/position table.
- **Verified:** `tsc --noEmit` clean, `eslint` clean (0 warnings after fixing one unused-import
  warning caught during review), full production build succeeds — all 32 routes compile.

### Not yet done (deliberately out of scope for Phase 6)
- No dedicated invigilator-assignment UI (the API exists and is wired for it; assigning
  invigilators from the schedule list is a natural addition once schedule detail pages exist)
- No transcript/report-card rendering yet — that's `20-report-system.md` territory, a later
  phase, though `ExamResult` now has everything a transcript would need to pull from
- Live end-to-end DB test still not run in this sandbox (network-restricted) — verify locally

---

## Phase 7 — Attendance ✅ COMPLETE

**Date:** 2026-09-10

### Backend (`school-erp-backend`)
- **`StudentAttendance` / `TeacherAttendance` / `StaffAttendance`** — one record per person per
  day (unique index), Draft → Submitted → Verified → Locked status flow with lock enforcement on
  update/delete, checkout-after-checkin validated at both the Mongoose and Zod layers. Student
  attendance additionally requires an ACTIVE enrollment matching the class/section/year before
  it can be marked.
- **`POST /student-attendances/bulk`**: marks a whole class/section in one request — added
  because the spec's own described workflow ("Select Class → Select Section → Mark Attendance →
  Save") is clearly a whole-roster action, even though only singular CRUD endpoints were listed
  explicitly; same gap-fill pattern as the exam-marks bulk endpoint in Phase 6.
- **`attendance-summary` module**: daily/monthly/yearly summaries are **computed on read rather
  than persisted** as a separate `attendanceSummaries` collection (which the spec's core
  collections list does include). Documented as an explicit implementation choice: a
  materialized summary can silently drift out of sync every time an underlying record is
  corrected, while computing on demand is always accurate and cheap at this data scale. The same
  daily/monthly/yearly summaries the spec calls for are still produced, just via aggregation.
  Percentage calculation excludes HOLIDAY days from the denominator and counts HALF_DAY as 0.5
  present — both documented interpretations, verified with targeted tests including a
  divide-by-zero guard for all-holiday periods.
- **Known gap, explicitly flagged**: "approved leave automatically marks attendance as LEAVE"
  is not implemented — no Leave Request module exists anywhere in the project yet (it isn't part
  of any phase built so far). This is a hook to wire in once a Leave module is built in a later
  phase, not an oversight in this one.
- **RBAC**: no seed changes needed — `attendance` resource already existed and already covered
  every action these routes needed.
- **Verified:** full backend boots cleanly with all 29 models registered; route ordering
  confirmed correct everywhere (`/bulk` ahead of `/:id`, summary sub-routes all distinct); summary
  percentage math tested (holiday exclusion, half-day weighting, divide-by-zero guard); all Zod
  validation schemas tested (checkout-before-checkin rejection, invalid status enum rejection,
  bulk payload acceptance).

### Frontend (`school-erp-frontend`)
- **`/attendance`**: the main daily workflow — year/class/section/group/date scope picker loads
  the active roster (pre-filling any attendance already marked that day), a "mark all as…" bar
  for the common case (whole class present), and per-student status pill-buttons for exceptions,
  bulk-saving in one request.
- **`/attendance/summary`**: student + year lookup rendering the yearly overview (big percentage,
  status counts) plus a month-by-month breakdown table.
- **Verified:** `tsc --noEmit` clean, `eslint` clean (0 warnings — fixed one
  `react-hooks/exhaustive-deps` warning properly via `useCallback` rather than suppressing it),
  full production build succeeds — all 34 routes compile.

### Not yet done (deliberately out of scope for Phase 7)
- No Teacher/Staff attendance marking UI yet — backend is fully built and identical in pattern
  to Student attendance, but the UI is deferred since Teacher/Staff list/detail pages themselves
  are still deferred from Phase 2
- No class-level daily summary UI (the `GET /attendance-summary/class` endpoint exists and
  works, just no page consumes it yet — student-level summary was prioritized as the more
  immediately useful view)
- Live end-to-end DB test still not run in this sandbox (network-restricted) — verify locally

---

## Phase 8 — Finance ✅ COMPLETE

**Date:** 2026-09-13

The first phase touching real money — every write path was built around the spec's core rule:
**financial records are never deleted, only adjusted**, and **every successful payment must
atomically create a Payment + Transaction + Receipt**.

### Backend (`school-erp-backend`)
- **`FeeStructure`** — full CRUD, the *only* deletable record in this whole phase (it's a
  template, not an executed financial transaction) — soft-deleted like everywhere else in the app.
- **`StudentFee`** — validates the Fee Structure exists and the student holds an ACTIVE
  enrollment before creating. **Auto-generates a DRAFT `Invoice`** in the same transaction as
  creation (the spec defines an Invoice collection and a `GET /invoices/:invoiceNumber` lookup,
  but no `POST /invoices` — auto-creating alongside StudentFee is the natural trigger point,
  documented as a gap-fill). Corrections to discount/fine **append an adjustment entry**
  (previous value + who + when + reason) rather than overwriting, mirroring the exam-mark
  revision pattern from Phase 6.
- **`Payment`** — the critical piece. `createPayment` runs inside a single MongoDB transaction
  that creates the Payment, a `Transaction` (INCOME), and a `Receipt` (sequential `RCPT-YYYY-
  NNNNN` number) together, then updates the parent `StudentFee`'s paid/due amounts and status,
  and flips any linked DRAFT/SENT invoice to PAID once the fee is fully settled. Rejects any
  payment amount exceeding the fee's current due amount. No update or delete endpoint exists for
  Payment at all — matching the spec's immutability rule structurally, same as Exam Results in
  Phase 6.
- **`SalaryStructure`** (documented gap-fill, same reasoning as ExamInvigilator in Phase 6 — the
  spec's API list only shows salary-*payments*, but without some record of an employee's agreed
  salary there'd be nothing for a payment to reference) + **`SalaryPayment`** — applies the exact
  same atomic Payment+Transaction+Receipt pattern, since a salary payment is a "successful
  payment" in the same general sense the spec's Business Rules describe. One payment per
  employee per month enforced via a unique index.
- **`Expense`** — auto-creates an EXPENSE-type `Transaction` on creation. Categories modeled as
  a fixed enum directly on the model rather than a separate `expenseCategories` collection +
  CRUD, since the spec lists no dedicated API for categories and the example list reads as fixed
  reference data — documented choice, not a spec deviation.
- **`Transaction`** — read-only ledger (`GET /transactions`), populated internally by every
  payment/expense flow above, never written to directly.
- **`Receipt`** / **`Invoice`** — looked up by their human-readable sequential numbers
  (`RCPT-2026-00001`, `INV-2026-00001`), not Mongo `_id`, exactly per spec.
- **RBAC**: no seed changes needed — `finance` resource already existed and already covered
  every action these 9 modules needed.
- **Verified:** full backend boots cleanly with all 38 models registered; route ordering
  confirmed correct everywhere; due-amount/status-transition math tested (fresh → partial →
  paid, discount+fine combined, overpayment-rejection bound); net-salary formula tested; all
  Zod validation schemas tested (negative-amount rejection, invalid YYYY-MM rejection, zero-
  amount fee structure rejection).

### Frontend (`school-erp-frontend`)
- **`/finance/fee-structures`**: list + create form (year/class/group scoping, group select
  auto-disables for non-grouped classes) + delete.
- **`/finance/student-fees`**: the main day-to-day screen — assign a fee-structure to a student,
  see amount/paid/due/status per row, and a **Record Payment** modal that pre-fills the full due
  amount, validates client-side against it before submitting, and shows the backend's rejection
  message inline if the amount still somehow exceeds due (defense in depth, not just trusting
  the client check).
- **`/finance/expenses`**: create form + running total card + list.
- **Verified:** `tsc --noEmit` clean, `eslint` clean (0 warnings), full production build
  succeeds — all 37 routes compile.

### Not yet done (deliberately out of scope for Phase 8)
- No Salary Structure/Payment UI yet — backend is fully built (including the atomic
  payment+transaction+receipt flow, identical in pattern to student fee payments), but the
  screens are deferred since they depend on a real employee-picker UI, which itself depends on
  the still-deferred Teacher/Staff detail pages from Phase 2
- No Receipt/Invoice lookup or print view yet — the `GET /receipts/:receiptNumber` and `GET
  /invoices/:invoiceNumber` endpoints work, just no page consumes them yet
- No Transactions ledger view (ledger data exists and is queryable, no page built)
- Live end-to-end DB test still not run in this sandbox (network-restricted) — verify locally

---

## Next: Sample/Demo Data Seed Script

Per explicit user request: build a `yarn seed:demo` script populating realistic data across
everything built so far — enrolled students, teacher assignments, a generated+published routine,
an exam with entered marks and published results, several days of attendance history, and sample
fee/payment records — so the app is immediately explorable rather than empty after a fresh
`yarn seed`. Keep this clearly separated from the structural seeds (roles/rooms/academic-
structure/periods) so it can be wiped and re-run independently.

## ✅ Demo Data Seed Script — COMPLETE

**Date:** 2026-09-14

Added `src/database/seed/demo-data.seed.js`, run via `yarn seed:demo` — deliberately **not**
part of the main `yarn seed` chain, so structural setup and demo content stay independently
re-runnable.

**What it creates, all linked together (not isolated/orphaned records):**
- 5 teachers, 3 staff, guardians, and 18 students (10 in Class 6 Section A, 8 in Class 9 Section
  A / Science group) — every student created through the real transactional user-creation flow
  from Phase 2, not a shortcut.
- All 18 students **enrolled** (Phase 4) into their class/section/group with sequential roll
  numbers.
- 5 **teacher assignments** for Class 6-A (one subject each), with the first teacher marked as
  Class Teacher.
- A **routine generated and published** for Class 6-A via the actual auto-generator and
  publish-with-conflict-check flow from Phase 5 (falls back to leaving it in DRAFT with a
  warning if conflicts are detected, rather than force-publishing).
- One **exam** ("Monthly Test - Demo") with 3 subject schedules, marks entered for all 10
  Class 6-A students via the real bulk-marks endpoint (varied realistic scores, 55-94), then
  **results generated and published** — so grade/GPA/rank are all visible immediately.
- **10 school days of attendance** history for Class 6-A (skips Fridays, mostly PRESENT with a
  few scripted ABSENT/LATE entries for realism) via the real bulk-attendance endpoint.
- A **fee structure** assigned to all 10 Class 6-A students, with the first 6 paying in full,
  the next 2 paying half (visible PARTIAL status), and the rest left PENDING — so every fee
  status value is represented. Plus 2 sample expenses.

**Idempotent by design**: every creation step checks for an existing matching record first and
skips it if found, so `yarn seed:demo` can be run multiple times safely without duplicate-key
errors or doubled-up data — useful if a later phase's seed needs re-running after this one.

**Verified without a live database** (this sandbox has no MongoDB access): confirmed every
import path and every service function name resolves correctly (the script runs cleanly up to
the actual `mongoose.connect()` call, failing only on the expected "no MongoDB reachable"
error) — this specifically catches the class of bug that broke past features silently (like the
Permission model registration issue). Additionally, **all 15 payload shapes used in the script
were independently tested against the real Zod validation schemas** for every module it touches
(teacher, staff, guardian, student, assignment, enrollment, exam, schedule, marks, routine,
attendance, fee structure, student fee, payment, expense) — every one parses successfully. Time-
string formatting and the marks-generation formula were also bounds-checked (all scores land
55-94, safely under the 100 fullMarks cap; all times are valid zero-padded HH:mm with end after
start).

**To use:**
```bash
yarn seed            # structural: roles, rooms, academic structure, periods, super admin
yarn seed:demo        # realistic linked sample data across every module
```
Demo accounts use the password pattern `Teacher@123` / `Staff@123` / `Student@123`, emails like
`teacher1@schoolerp.demo`, `student.c6.1@schoolerp.demo` — logged in `demo-data.seed.js` itself
for reference.

---

## ✅ Frontend Server-State Infrastructure: TanStack Query — COMPLETE

**Date:** 2026-09-15

Per explicit user request, before starting Phase 9: every page up to this point managed API
data with manual `useState` + `useEffect` + `fetch` + hand-rolled loading/error state — ~30+
pages duplicating the same boilerplate, no caching, no automatic refetch after a mutation, no
request deduping. **TanStack Query (`@tanstack/react-query` v5)** replaces this, and is now the
standard pattern for every future page (starting with Phase 9).

### What was built
- **`src/lib/query-client.ts`**: central `QueryClient` config — 30s `staleTime` (avoids refetch
  storms when the same reference data, e.g. the Class dropdown, is used across many forms),
  5min `gcTime`, retry policy that never retries 4xx (retrying a validation error won't fix it)
  but retries network/5xx up to twice, `refetchOnWindowFocus` on (self-heals stale data in an
  admin tool left open all day).
- **`src/features/query/QueryProvider.tsx`**: wraps the app, wired into `layout.tsx` as the
  outermost provider (ahead of `AuthProvider`), so any component anywhere can use
  `useQuery`/`useMutation`.
- **`src/lib/query-keys.ts`**: one centralized factory for every cache key in the app — keeps
  invalidation calls consistent and gives a single place to see everything that's cached.
- **A `.queries.ts` hooks file added to all 16 feature modules that had an existing `.api.ts`**
  (academic-year, subject, academy, student, teacher, teacher-assignment, student-enrollment,
  routine, exam, exam-schedule, exam-mark, exam-result, student-attendance, attendance-summary,
  fee-structure, student-fee, expense, academic-structure) — each exposes `useX()` /
  `useCreateX()` / `useUpdateX()` / `useDeleteX()` hooks that wrap the existing `.api.ts`
  functions (which are untouched — the HTTP layer didn't change, only how pages consume it) and
  invalidate the right cache keys on success.

### Reference-implementation pages converted (prove the pattern end-to-end)
- **`/academic/years`** — simplest CRUD example (list + create + one-field update).
- **`/people/students`** — the highest-traffic page in the app; demonstrates query-param-keyed
  caching (page/status/search all become part of the cache key automatically) and
  `isFetching`-driven UI (table dims slightly during background refetch instead of a full
  loading-state flash).
- **`/finance/fee-structures`** — demonstrates create + delete mutations together.

**Bug caught and fixed during conversion**: the Students page's original filter-reset logic used
a second `useEffect` that synchronously called `setPage(1)` — this is exactly the
`react-hooks/set-state-in-effect` class of issue this project has hit and fixed several times
before (AuthContext in Phase 1, the Students/Rooms list pages in Phase 2/3). Fixed the same way
each time: moved the state update into the actual event handler (button `onClick`) or an already-
deferred callback (`setTimeout`) instead of a bare synchronous effect body.

### Deliberately not converted yet (migration plan, not a gap)
The remaining ~30 pages (Rooms, Subjects, Classes, Teacher Assignments, Student Enrollments,
Routine, all 4 Examination pages, Attendance + Summary, Student Fees, Expenses, all 10 role
dashboards) **still use the old manual-fetch pattern** and work correctly as-is — this was a
deliberate scope decision, not an oversight, for two reasons: (1) the three conversions above
already prove every pattern needed (simple CRUD, paginated+filtered list, create+delete) so
converting the rest is now mechanical, and (2) **every page built from Phase 9 onward will use
TanStack Query from the start**, so the remaining older pages can be migrated opportunistically
(e.g. whenever a page is touched for an unrelated reason) rather than as one large disruptive
pass. If a dedicated migration pass is wanted instead, it's straightforward: each old page's
`useState`+`useEffect`+`fetchX` block gets replaced with the matching hook from that module's
new `.queries.ts` file, following the exact pattern in the 3 converted pages above.

**Verified:** `tsc --noEmit` clean, `eslint` clean (0 warnings/errors after fixing the caught
set-state-in-effect issue), full production build succeeds — all 37 routes compile with
`QueryProvider` wired into the real (Poppins/Inter) font layout.

---

## 🐛 Critical Bugfix — Frontend showed no data anywhere after ~15 minutes

**Date:** 2026-09-18

**Symptom:** every page (old-pattern and TanStack-Query-converted alike) stopped showing any
data — confirmed via browser DevTools Network tab: every API call was returning **401
Unauthorized**, not a connectivity/CORS/empty-database issue.

**Root cause:** the backend's access token cookie is intentionally short-lived (15 minutes, per
`JWT_ACCESS_EXPIRY`) — it's meant to be silently renewed using the 7-day refresh token, not
something the user re-enters. **The frontend never implemented that renewal.** `api-client.ts`
had no handling for a 401 response at all, so exactly 15 minutes after login, every subsequent
request failed and every page appeared empty — this was a real gap in Phase 1's auth work that
went unnoticed because earlier testing/verification happened within a single 15-minute session.

**Fix**, entirely in `src/lib/api-client.ts`:
- On any 401 (except from `/auth/login`, `/auth/refresh-token`, `/auth/register` themselves, to
  avoid loops), the client now calls `POST /auth/refresh-token` once, then **retries the original
  request exactly once** with the new cookie.
- **Deduplicated**: if several requests 401 at the same moment (e.g. a page firing multiple API
  calls, exactly like the Rooms page in the bug report), they all share one in-flight refresh
  call instead of each independently hitting `/auth/refresh-token` — verified with a standalone
  concurrency simulation (3 concurrent 401s → exactly 1 refresh call).
- If the refresh itself fails (refresh token also expired/invalid — a real 7-day-old session),
  the user is redirected to `/login?redirect=<path>` with a full page reload (intentional — this
  is a plain module, not a component, so `useRouter()` isn't available, and a full reload
  correctly clears any stale in-memory state rather than leaving the old session's data lingering).

This fix applies globally — every page, old-pattern or TanStack-Query-based, calls through
`apiClient`, so this one change fixes the symptom everywhere at once with no per-page changes
needed.

**Verified:** `tsc --noEmit` clean, `eslint` clean (0 warnings after justifying the one legitimate
`window.location` use with a comment), full production build succeeds (all 37 routes), and the
deduplication logic specifically was verified with a standalone concurrency test.

**Action for local testing:** if you were mid-session when this bug was hit, do a hard refresh /
re-login once after pulling this update — the fix only applies going forward, it doesn't retroactively
fix an already-expired session sitting in the browser.

---

## Phase 9: Library — Complete

`16-library.md` was not available in this environment, so this phase was built from
`BACKEND-WORKING-FLOW.md` §10 (the Library Flow section) and `28-roadmap.md`'s one-line summary,
plus the established conventions from Phases 1–8 (soft delete, Zod validation, transactional
money/stock movements, `.queries.ts` TanStack hooks). **Re-read this phase against the real
`16-library.md` once it's available** — the interpretations below are the most likely gaps.

### Backend — 9 new modules, 41 routes

- **Catalog lookups** (`book-category`, `author`, `publisher`): identical CRUD shape, so built
  once as a `createLookupCrud` factory (`shared/lookupCrud.js`) rather than copy-pasted three
  times. Case-insensitive unique name; delete is blocked while any book still references the
  record (`countInUse`), matching the Phase 3–8 pattern of never deleting a referenced record out
  from under its dependents.
- **Book** (`book`): title/ISBN/category/author(s)/publisher/shelf/price. ISBN unique only among
  non-deleted books (partial index), so a soft-deleted book never blocks re-cataloguing the same
  ISBN. `initialCopies` creates the book and its first `BookCopy` rows in one transaction.
- **BookCopy** (`book-copy`): each physical copy gets its own barcode (`BK-000001`, global
  sequence — a label printed on a physical book must never repeat or reset, unlike the per-year
  IDs used elsewhere). Status: `AVAILABLE / ISSUED / LOST / DAMAGED / MAINTENANCE / RETIRED`.
  `ISSUED` can only be set by the issue flow, never by hand.
- **BookIssue** (`book-issue`) — the core of this phase:
  - A partial unique index on `{ copyId: 1 }` where `status: "ISSUED"` makes "one copy, one
    borrower at a time" a database-level guarantee, not just application logic.
  - `issueBook`/`returnBook`/`renewBook` all run inside `withTransaction` (new shared helper,
    `shared/withTransaction.js`) — copy status + issue record (+ fine + Transaction + Receipt on
    return) move together or not at all, same reasoning as Finance's payment flow in Phase 8.
  - **OVERDUE is deliberately not a stored status.** It's derived on every read as
    `status === "ISSUED" && dueDate < now` (`utils/library.util.js`), so it can never go stale
    between nightly jobs — same reasoning as the attendance-summary computed-on-read pattern from
    Phase 7.
  - Due date = end of the loan day in UTC, not midnight at its start, so a same-day return is
    never wrongly flagged overdue (`endOfDayUTC` in `utils/library.util.js`, unit tested).
  - Fine = overdue days × `finePerDay`, optionally capped at `maxFinePerIssue`. Lost-book penalty
    uses the book's `price` when known and enabled, else a flat fallback — both configurable.
  - The borrower snapshot (`name`, `code`, `profileId`) is copied onto the issue record at issue
    time, same reasoning as Finance's immutable snapshots: deleting or renaming a student/teacher
    must never corrupt past loan history.
  - A borrower's own eligibility (`getBorrowerStatus`) is one function used by *both* the issue
    desk (to show reasons before scanning) and `issueBook` (to enforce them) — they can't drift
    out of sync with each other.
- **LibraryFine** (`library-fine`): `OVERDUE / DAMAGED / LOST`, `PENDING / PAID / WAIVED`. Paying
  a fine creates a `Transaction` (INCOME) and a `Receipt` with `referenceType: "LIBRARY_FINE"` in
  the same transaction, reusing Finance's existing models — added `"LIBRARY_FINE"` to both
  enums rather than building a parallel payment record type. Waiving is a recorded decision
  (`waivedBy`/`waivedAt`/`waiveReason`), never a deletion, same as every other financial record.
- **LibrarySetting** (`library-setting`): a singleton collection (`key: "default"`), created now
  because Issue/Return can't run without borrow limits. Interpreted defaults — **please confirm
  against the real spec**: Students 3 books / 14 days, Teachers 5 / 30, Staff 3 / 14, ৳5/day fine,
  2 renewals, lost-book charge = book price when known else a flat ৳500. All configurable via
  `PATCH /library-settings`, restricted to `settings:update` (Super Admin only), matching how
  every other `*Settings` collection in `BACKEND-WORKING-FLOW.md` §15 is gated.
- **LibrarySummary** (`library-summary`): computed on read (titles, copies by status, active/
  overdue loans, today's issued/returned, pending fine total, most-borrowed in the last 30 days)
  — same "never materialize a counter that can drift" reasoning as attendance-summary.
- **RBAC**: `STUDENT`/`TEACHER`/`STAFF` roles gained `library:read` + `library:list` (browse the
  catalog, see their *own* loans/fines only — enforced in the service layer, not just the route).
  `LIBRARIAN` already had `library:create/read/update/list`; it deliberately does **not** have
  `library:delete` or `library:approve` (waiving a fine), matching the existing pattern that
  Librarian can run circulation day-to-day but Admin/Super Admin approve money being forgiven or
  catalog records being removed.
- **Demo seed**: extended `demo-data.seed.js` with 5 catalog books (with copies) and 6 scripted
  loans run through the *real* services — 1 active, 1 overdue (active), 1 clean return, 1 late
  return (real computed fine, left pending), 1 damaged return (with a fine), 1 teacher loan. This
  doubles as an end-to-end smoke test of the transactional issue/return/fine code path.

**Verified:** `node --test` — 9 unit tests covering the due-date/overdue/fine-cap math (the exact
boundary: due day itself is NOT overdue, 1ms past it IS) and every new Zod schema. A route-loading
script confirmed all 41 routes register and that every static route (`/my`, `/overdue`,
`/borrowers/search`, `/barcode/:barcode`) is declared before its sibling `/:id`, so Express can't
swallow it. **Not yet verified:** a live run against real MongoDB — no `mongod` is available in
this sandbox. Run `yarn seed:roles && yarn seed:demo` locally before relying on this phase; that
exercises every transaction (issue/return/renew/fine) for real.

### Frontend — 7 new pages, TanStack Query throughout (per the Phase 8 commitment)

- `/library` — catalog, searchable/filterable by category and availability; KPI strip for
  managers (titles, copies available, overdue, unpaid fines) linking into the relevant page.
- `/library/books/new`, `/library/books/[id]` — add a book (with initial copies), view/edit, add
  more copies, change an individual copy's status, soft-delete (blocked while any copy is out).
- `/library/issues` — the circulation desk: borrower search → live eligibility check (reasons
  shown *before* scanning, backed by `getBorrowerStatus`) → barcode → issue; loans list with
  Active/Overdue/Returned/All tabs, renew, and a return modal (condition + optional damage fine,
  surfaces the fine that gets recorded).
- `/library/fines` — pending/paid/waived list; `Collect` records a payment (method + receipt),
  `Waive` requires a reason and is only shown to users with `library:approve`.
- `/library/my` — self-service loan history for students/teachers/staff (their own records only;
  enforced server-side, not just hidden client-side).
- `/library/setup` — tabbed CRUD for categories/authors/publishers, one shared form component.
- `/library/settings` — borrow limits, fine rate/cap, renewals, lost-book rule; read-only unless
  the viewer has `settings:update`.
- `usePermission()` (new shared hook) mirrors the backend's flattened permission list for
  show/hide only — every rule it mirrors is still enforced server-side.
- Sidebar: added as flat sibling items (`Library`, `Issue / Return`, `Library Fines`,
  `My Library`), matching the existing Fee Structures / Student Fees / Expenses pattern — **not**
  nested under a parent, because `Sidebar.tsx` doesn't render `NavItem.children` for any item
  today. Setup and Settings are one level deeper and reached from the Library page's header
  instead of cluttering the sidebar further.
- Librarian dashboard (`/dashboard/librarian`) now shows real KPIs from `/library-summary`
  instead of placeholder dashes.

**Verified:** `tsc --noEmit` clean, `eslint` clean on every new/changed file, and a full
`next build` succeeded — all 44 routes (37 prior + 7 new Library pages) compiled, typed, and
statically generated with zero errors.

---

## Next Up — Phase 10: Transport

Per `BACKEND-WORKING-FLOW.md` §22: vehicles, drivers, routes, ordered stops, student assignments,
and transport fees (reusing the Finance module, same as Library's fines did). The relevant spec
doc (`17-transport.md` or similar) was not available in this environment either — re-read it
first if it becomes available, otherwise expect the same interpret-and-flag approach used here.
