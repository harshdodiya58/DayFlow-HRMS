# DayFlow HRMS — Enterprise Transformation Plan

> **Goal**: Transform DayFlow from a mid-tier HR tool into a production-grade, enterprise-class HRMS that can compete with BambooHR, Keka, greytHR, Darwinbox, and Zoho People — ready for adoption by Indian and multinational companies with 50 to 10,000+ employees.

---

## Current State Audit

### What We Already Have (20 DB Models, ~45 pages)

| Module | Status | Maturity |
| :--- | :--- | :--- |
| Employee Management (CRUD, Departments) | ✅ Done | Decent |
| Attendance (Check-in/out, Calendar, History) | ✅ Done | Good |
| Leave Management (Apply, Approve, Policies, Balances) | ✅ Done | Good |
| Payroll (Auto-calc, Payslips, Monthly Processing) | ✅ Done | Decent |
| Notifications (In-app + Email) | ✅ Done | Good |
| Internal Chat / Messaging | ✅ Done | Basic |
| Announcements (Admin → All Employees) | ✅ Done | Good |
| Support Tickets / Helpdesk | ✅ Done | Good |
| Document Management (Upload/Download per employee) | ✅ Done | Basic |
| Holidays (CRUD, Calendar view) | ✅ Done | Good |
| Admin Settings (Company, Departments, Security) | ✅ Done | Basic |
| Audit Logging | ✅ Done | Basic |
| AI Chat Assistant | ✅ Done | Basic |
| Reports (Admin side) | ✅ Done | Basic |
| Leaderboard | ✅ Done | Basic |

---

## What's Missing — The Gap Analysis

Below is every module, feature, and security layer that enterprise platforms like **Workday**, **BambooHR**, **Keka HR**, **Darwinbox**, and **greytHR** offer that DayFlow currently **does not have**.

---

## Phase 1: Security & Infrastructure Hardening

> [!CAUTION]
> These are **non-negotiable** for any company handling employee PII (Personally Identifiable Information). Without these, no serious company will adopt the platform.

### 1.1 Next.js Middleware (Authentication Gateway)

**Problem**: DayFlow has **no `middleware.js`** file. Every API route manually checks tokens. There is no centralized auth gate.

#### [NEW] `src/middleware.js`
- Centralized JWT verification for ALL routes
- Route-based role enforcement (ADMIN routes blocked for EMPLOYEE)
- CSRF token validation on all POST/PUT/DELETE
- Auto-redirect unauthenticated users to `/login`
- Rate limiting headers per route group
- Security headers: `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Content-Security-Policy`

---

### 1.2 Session Management Overhaul

**Problem**: Current sessions are basic. No device tracking, no concurrent session limits, no remote logout.

#### [MODIFY] `prisma/schema.prisma` — Enhance `Session` model
- Add `deviceName`, `deviceType` (mobile/desktop/tablet), `browser`, `os`
- Add `lastActiveAt` timestamp
- Add `isRevoked` boolean

#### [NEW] `src/app/api/auth/sessions/route.js`
- GET: List all active sessions for current user
- DELETE: Revoke specific session (remote logout)
- DELETE (bulk): "Log out of all other devices"

#### [NEW] `src/app/dashboard/settings/security/page.js`
- UI showing all active sessions with device info
- "This device" badge on current session
- One-click "Log out everywhere" button

---

### 1.3 Two-Factor Authentication (2FA)

**Problem**: 2FA code generation exists in `security.js` but is **never used anywhere**.

#### [NEW] `src/app/api/auth/2fa/setup/route.js`
- Generate TOTP secret, return QR code URL
- Verify initial 2FA code to activate

#### [NEW] `src/app/api/auth/2fa/verify/route.js`
- Verify 2FA code during login flow

#### [MODIFY] `src/app/api/auth/login/route.js`
- After password verification, check if 2FA is enabled
- If yes, return `requiresTwoFactor: true` instead of token
- Second step: verify 2FA code, then issue token

#### [NEW] `src/app/dashboard/settings/security/two-factor/page.js`
- Setup wizard with QR code display
- Backup recovery codes generation
- Enable/Disable toggle

---

### 1.4 Password Policy & Rotation

#### [NEW] `prisma/schema.prisma` — `PasswordHistory` model
- Store last 5 password hashes per user
- Prevent password reuse

#### [MODIFY] `src/lib/security.js`
- Password expiry check (configurable: 30/60/90 days)
- Force password change on first login
- Block commonly breached passwords (top 10k list)

---

### 1.5 Data Export & DPDP/GDPR Compliance

#### [NEW] `src/app/api/admin/compliance/data-export/route.js`
- Export all data for a specific employee (Right to Data Portability)
- JSON + CSV format

#### [NEW] `src/app/api/admin/compliance/data-deletion/route.js`
- Anonymize employee data (Right to Erasure)
- Retain only legally required records

#### [NEW] `src/app/admin/compliance/page.js`
- Data retention policy configuration
- Consent management dashboard
- Audit trail viewer with filters (date, user, action)

---

## Phase 2: Recruitment & Onboarding (Hire-to-Day-1)

> [!IMPORTANT]
> Every enterprise HRMS starts the employee lifecycle **before** the employee joins. DayFlow currently has zero recruitment or onboarding capability.

### 2.1 Applicant Tracking System (ATS)

#### New DB Models
```
model JobPosting {
  id, title, description, department, location,
  employmentType (FULL_TIME/PART_TIME/CONTRACT/INTERN),
  experienceMin, experienceMax, salaryRangeMin, salaryRangeMax,
  skills[], status (DRAFT/OPEN/ON_HOLD/CLOSED),
  postedBy, postedAt, closingDate,
  applications → Application[]
}

model Application {
  id, jobPostingId, candidateName, candidateEmail,
  candidatePhone, resumeUrl, coverLetterUrl,
  source (WEBSITE/LINKEDIN/REFERRAL/NAUKRI/INDEED),
  status (NEW/SCREENING/INTERVIEW/OFFER/HIRED/REJECTED),
  stage, rating, notes, referredBy,
  interviewSchedules → InterviewSchedule[]
}

model InterviewSchedule {
  id, applicationId, interviewerId, roundName,
  scheduledAt, duration, meetingLink,
  status (SCHEDULED/COMPLETED/CANCELLED),
  feedback, rating, recommendation (HIRE/NO_HIRE/MAYBE)
}
```

#### Pages
- `src/app/admin/recruitment/page.js` — Job postings board (Kanban view)
- `src/app/admin/recruitment/[jobId]/page.js` — Application pipeline
- `src/app/admin/recruitment/new/page.js` — Create job posting form
- `src/app/careers/page.js` — **Public** careers page (no auth needed)
- `src/app/careers/[jobId]/page.js` — Public job detail + apply form

---

### 2.2 Employee Onboarding Workflow

#### New DB Models
```
model OnboardingTemplate {
  id, name, departmentId, tasks → OnboardingTask[]
}

model OnboardingTask {
  id, templateId, title, description, assignedRole,
  dueInDays, isRequired, category
  (DOCUMENT/IT_SETUP/TRAINING/POLICY_ACK/BUDDY/WELCOME)
}

model OnboardingProgress {
  id, employeeId, taskId, status (PENDING/COMPLETED/SKIPPED),
  completedAt, completedBy, notes
}
```

#### Pages
- `src/app/admin/onboarding/templates/page.js` — Create/manage templates
- `src/app/admin/onboarding/[employeeId]/page.js` — Track new hire progress
- `src/app/dashboard/onboarding/page.js` — Employee onboarding checklist (Day 1 experience)

#### Features
- Automated welcome email with login credentials
- Document collection checklist (ID proof, bank details, offer letter acknowledgement)
- IT asset request trigger
- Buddy assignment
- Policy acknowledgement with e-signature
- Progress tracker visible to both admin and employee

---

### 2.3 Employee Offboarding

#### New DB Models
```
model OffboardingProcess {
  id, employeeId, initiatedBy, lastWorkingDate,
  reason (RESIGNATION/TERMINATION/RETIREMENT/CONTRACT_END),
  status (INITIATED/IN_PROGRESS/COMPLETED),
  exitInterviewCompleted, assetReturnStatus,
  knowledgeTransferStatus, finalSettlementStatus
}

model ExitInterview {
  id, employeeId, conductedBy, feedback,
  reasonForLeaving, wouldRecommend, suggestions
}
```

#### Pages
- `src/app/admin/offboarding/page.js` — Active offboarding list
- `src/app/admin/offboarding/[employeeId]/page.js` — Exit checklist
- Employee self-service exit interview form

---

## Phase 3: Performance & Growth

### 3.1 Performance Management System (PMS)

#### New DB Models
```
model PerformanceReview {
  id, employeeId, reviewerId, reviewCycle,
  period (Q1/Q2/Q3/Q4/ANNUAL), year,
  selfRating, managerRating, finalRating,
  selfComments, managerComments,
  status (SELF_REVIEW/MANAGER_REVIEW/CALIBRATION/COMPLETED),
  goals → PerformanceGoal[]
}

model PerformanceGoal {
  id, reviewId, title, description,
  metric, targetValue, achievedValue,
  weight, rating, comments
}

model Feedback360 {
  id, employeeId, feedbackFromId,
  relationship (PEER/SUBORDINATE/MANAGER/EXTERNAL),
  strengths, areasOfImprovement, overallRating,
  isAnonymous
}
```

#### Pages
- `src/app/admin/performance/page.js` — Review cycles dashboard
- `src/app/admin/performance/cycles/new/page.js` — Create review cycle
- `src/app/admin/performance/calibration/page.js` — Rating calibration (bell curve)
- `src/app/dashboard/performance/page.js` — Employee self-review
- `src/app/dashboard/performance/feedback/page.js` — Give/receive 360 feedback

---

### 3.2 OKR (Objectives & Key Results) Tracking

#### New DB Models
```
model Objective {
  id, title, description, ownerId, parentId,
  level (COMPANY/DEPARTMENT/TEAM/INDIVIDUAL),
  quarter, year, progress, status,
  keyResults → KeyResult[]
}

model KeyResult {
  id, objectiveId, title, metricType (PERCENTAGE/NUMBER/CURRENCY/BOOLEAN),
  startValue, targetValue, currentValue,
  status, checkIns → KRCheckIn[]
}

model KRCheckIn {
  id, keyResultId, value, comment, createdAt
}
```

#### Pages
- `src/app/admin/okrs/page.js` — Company-wide OKR tree view
- `src/app/dashboard/okrs/page.js` — Personal OKRs + check-in UI

---

### 3.3 Learning Management System (LMS)

#### New DB Models
```
model Course {
  id, title, description, category, instructor,
  duration, thumbnailUrl, contentUrl, contentType
  (VIDEO/PDF/SCORM/LINK), isRequired,
  departmentId, enrollments → Enrollment[]
}

model Enrollment {
  id, courseId, employeeId, progress, score,
  status (NOT_STARTED/IN_PROGRESS/COMPLETED/FAILED),
  enrolledAt, completedAt, certificateUrl
}

model LearningPath {
  id, title, description, courses → LearningPathCourse[]
}
```

#### Pages
- `src/app/admin/learning/page.js` — Course management
- `src/app/admin/learning/new/page.js` — Create/upload course
- `src/app/dashboard/learning/page.js` — My courses, learning paths
- `src/app/dashboard/learning/[courseId]/page.js` — Course viewer

---

## Phase 4: Workforce Operations

### 4.1 Shift Management & Roster Planning

#### New DB Models
```
model Shift {
  id, name, startTime, endTime, graceMinutes,
  isNightShift, isFlexible, color
}

model ShiftAssignment {
  id, employeeId, shiftId, date, isOverride,
  swapRequestedWith, swapStatus
}

model ShiftRotationTemplate {
  id, name, pattern, cycleDays
}
```

#### Pages
- `src/app/admin/shifts/page.js` — Weekly/monthly roster builder (drag-and-drop grid)
- `src/app/dashboard/shifts/page.js` — My shift schedule + swap requests

---

### 4.2 Expense & Reimbursement Management

#### New DB Models
```
model ExpenseClaim {
  id, employeeId, title, category
  (TRAVEL/FOOD/ACCOMMODATION/EQUIPMENT/CLIENT_MEETING/OTHER),
  amount, currency, receiptUrl, description,
  status (DRAFT/SUBMITTED/APPROVED/REJECTED/PAID),
  submittedAt, approvedBy, approvedAt, paidAt,
  items → ExpenseItem[]
}

model ExpenseItem {
  id, claimId, description, amount, date, receiptUrl
}

model ExpensePolicy {
  id, category, maxAmount, requiresReceipt,
  requiresPreApproval, autoApproveBelow
}
```

#### Pages
- `src/app/admin/expenses/page.js` — Approve/reject claims
- `src/app/dashboard/expenses/page.js` — Submit new claim, view history
- `src/app/dashboard/expenses/new/page.js` — Multi-item expense form with receipt upload

---

### 4.3 Asset Management

#### New DB Models
```
model Asset {
  id, name, type (LAPTOP/MONITOR/PHONE/KEYBOARD/MOUSE/HEADSET/
  ACCESS_CARD/OTHER), brand, model, serialNumber,
  purchaseDate, purchaseCost, warrantyExpiry,
  status (AVAILABLE/ASSIGNED/UNDER_REPAIR/RETIRED),
  condition, location, assignedTo, assignedAt
}

model AssetAssignment {
  id, assetId, employeeId, assignedAt, returnedAt,
  condition, acknowledgementSigned
}
```

#### Pages
- `src/app/admin/assets/page.js` — Full asset inventory with filters
- `src/app/admin/assets/new/page.js` — Add new asset
- `src/app/admin/assets/assign/page.js` — Assign/return asset to employee
- `src/app/dashboard/assets/page.js` — "My Assets" view for employees

---

### 4.4 Timesheet & Project Tracking

#### New DB Models
```
model Project {
  id, name, code, clientName, startDate, endDate,
  status, budgetHours, managerId
}

model Timesheet {
  id, employeeId, projectId, date,
  hours, description, billable, status
  (DRAFT/SUBMITTED/APPROVED/REJECTED)
}
```

#### Pages
- `src/app/admin/projects/page.js` — Project list + hours summary
- `src/app/dashboard/timesheet/page.js` — Weekly timesheet grid entry

---

## Phase 5: Organization & Culture

### 5.1 Organization Chart (Interactive)

#### [NEW] `src/app/dashboard/org-chart/page.js`
- Hierarchical tree view of the entire company
- Zoom, pan, search employee
- Click employee node → profile popup
- Auto-generated from `reportsTo` field

#### [MODIFY] `prisma/schema.prisma`
- Add `managerId` / `reportsTo` field on `User` or `EmployeeDetails`

---

### 5.2 Employee Directory & People Search

#### [NEW] `src/app/dashboard/directory/page.js`
- Grid/list view of all employees with avatars
- Search by name, department, skill, location
- Click → mini profile card
- Birthday and work anniversary badges

---

### 5.3 Employee Engagement

#### New DB Models
```
model Survey {
  id, title, description, createdBy, isAnonymous,
  startsAt, endsAt, status, questions → SurveyQuestion[]
}

model SurveyQuestion {
  id, surveyId, question, type (RATING/TEXT/MCQ/YES_NO), options[]
}

model SurveyResponse {
  id, surveyId, employeeId, answers → SurveyAnswer[]
}

model Recognition {
  id, fromId, toId, message, badge
  (TEAM_PLAYER/INNOVATOR/CUSTOMER_HERO/ABOVE_AND_BEYOND),
  points, createdAt
}
```

#### Pages
- `src/app/admin/surveys/page.js` — Create and manage engagement surveys
- `src/app/dashboard/surveys/page.js` — Take surveys
- `src/app/dashboard/recognition/page.js` — Give/receive kudos, recognition wall
- `src/app/admin/engagement/page.js` — eNPS scores, survey analytics

---

### 5.4 Company Policy Hub

#### [NEW] `src/app/dashboard/policies/page.js`
- Categorized list of all company policies (HR, IT, Finance, Safety)
- Read acknowledgement tracking
- Version history for each policy document
- Search within policies

---

## Phase 6: Analytics & Intelligence

### 6.1 Advanced HR Analytics Dashboard

#### [NEW] `src/app/admin/analytics/page.js`
- **Headcount Analytics**: Growth over time, by department, by location
- **Attrition Dashboard**: Monthly/quarterly attrition rate, reasons, risk prediction
- **Diversity Metrics**: Gender ratio, age distribution
- **Attendance Analytics**: Late trends, absenteeism rate, department comparison
- **Leave Analytics**: Most used leave types, peak leave months
- **Payroll Analytics**: Total cost, department-wise salary distribution
- **Recruitment Funnel**: Source effectiveness, time-to-hire, offer acceptance rate

### 6.2 Custom Report Builder

#### [NEW] `src/app/admin/reports/builder/page.js`
- Drag-and-drop report builder
- Select data source (Employees, Attendance, Leaves, Payroll)
- Add filters, grouping, sorting
- Export to PDF, Excel, CSV
- Save and schedule recurring reports via email

---

## Phase 7: Compliance & Statutory (India-specific)

### 7.1 Statutory Compliance Module

#### New DB Models
```
model StatutoryConfig {
  id, type (PF/ESI/PT/LWF/TDS/GRATUITY),
  employeeContribution, employerContribution,
  ceiling, isActive, effectiveFrom, state
}

model Form16 {
  id, employeeId, financialYear, generatedAt, fileUrl
}
```

#### Pages
- `src/app/admin/compliance/statutory/page.js` — PF/ESI/PT configuration per state
- `src/app/admin/compliance/tds/page.js` — TDS declarations, investment proofs
- `src/app/dashboard/tax/page.js` — Employee investment declaration (80C, 80D, HRA)
- Auto-generate Form 16, PF return files

---

### 7.2 Full & Final Settlement

#### [NEW] `src/app/admin/settlements/[employeeId]/page.js`
- Auto-calculate: Remaining salary, leave encashment, bonus, gratuity
- Deduct: Notice period recovery, asset damage, loan balance
- Generate settlement letter (PDF)

---

## Phase 8: Integrations & Infrastructure

### 8.1 Webhook & Integration Framework

#### New DB Models
```
model WebhookEndpoint {
  id, url, events[], secret, isActive, companyId
}

model WebhookLog {
  id, endpointId, event, payload, responseCode,
  responseBody, deliveredAt, retryCount
}
```

- Event triggers: `employee.created`, `leave.approved`, `payroll.generated`, `attendance.checkin`
- Retry with exponential backoff
- Webhook signature verification (HMAC-SHA256)

---

### 8.2 API Rate Limiting (per-tenant)

#### [MODIFY] `src/lib/security.js`
- Move from in-memory Map to Redis-compatible store (or Vercel KV)
- Per-user, per-IP, per-endpoint rate limits
- `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers

---

### 8.3 Background Job Processing

#### [NEW] `src/lib/queue.js`
- Job queue for long-running tasks (payroll processing, bulk emails, report generation)
- Using Vercel Cron or Bull/BullMQ pattern
- Status tracking, retry on failure

---

### 8.4 File Storage Abstraction

#### [NEW] `src/lib/storage.js`
- Abstract file uploads behind a storage interface
- Support local disk (dev) and S3/Cloudflare R2 (production)
- Pre-signed URL generation for secure downloads
- Virus/malware scanning hook

---

## Phase 9: UI/UX Polish (Enterprise-grade)

### 9.1 Multi-language Support (i18n)

- English, Hindi, Gujarati, Tamil, Telugu (start with English + Hindi)
- Language selector in user settings
- All UI strings externalized to translation files

### 9.2 Dark Mode

- System-level dark mode toggle
- All components theme-aware
- Persist preference per user

### 9.3 Mobile-Responsive Redesign

- Every page tested on 375px width
- Bottom navigation on mobile (already done via FloatingNavbar)
- Touch-friendly date pickers and modals
- PWA support (install as app on phone)

### 9.4 Accessibility (WCAG 2.1 AA)

- All interactive elements have `aria-labels`
- Keyboard navigation for all modals and forms
- Color contrast ratio ≥ 4.5:1
- Screen reader announcements for dynamic content

### 9.5 Onboarding Tour

- First-time user interactive walkthrough
- Highlight key features with tooltip overlays
- "Skip tour" option

---

## Phase 10: DevOps & Production Readiness

### 10.1 Error Monitoring & Logging

- Sentry integration for runtime error tracking
- Structured JSON logging for API routes
- Health check endpoint (`/api/health`)

### 10.2 Database Optimization

- Add database indexes on all frequently queried columns
- Connection pooling via PgBouncer or Prisma Accelerate
- Query performance monitoring

### 10.3 CI/CD Pipeline

- GitHub Actions workflow: Lint → Test → Build → Deploy
- Preview deployments on PRs (Vercel)
- Database migration safety checks

### 10.4 Environment Management

- Separate staging and production environments
- Feature flags for gradual rollouts
- Seed scripts for demo data

---

## Implementation Priority Matrix

| Priority | Phase | Effort | Business Impact |
| :--- | :--- | :--- | :--- |
| 🔴 P0 — Critical | Phase 1 (Security) | 2 weeks | Blocks enterprise adoption |
| 🔴 P0 — Critical | Phase 7 (Statutory Compliance) | 2 weeks | Required for Indian companies |
| 🟠 P1 — High | Phase 2 (Recruitment & Onboarding) | 3 weeks | Core HRMS differentiator |
| 🟠 P1 — High | Phase 3 (Performance & OKRs) | 2 weeks | Major feature gap |
| 🟡 P2 — Medium | Phase 4 (Workforce Ops) | 3 weeks | Operational efficiency |
| 🟡 P2 — Medium | Phase 5 (Culture & Engagement) | 2 weeks | Employee retention |
| 🟡 P2 — Medium | Phase 6 (Analytics) | 2 weeks | Decision-making power |
| 🟢 P3 — Nice-to-have | Phase 8 (Integrations) | 2 weeks | Enterprise scalability |
| 🟢 P3 — Nice-to-have | Phase 9 (UI Polish) | 2 weeks | User experience |
| 🟢 P3 — Nice-to-have | Phase 10 (DevOps) | 1 week | Production stability |

---

## Summary of New Additions

| Category | New Models | New Pages | New APIs |
| :--- | :--- | :--- | :--- |
| Security & Auth | 1 | 3 | 5 |
| Recruitment | 3 | 5 | 4 |
| Onboarding/Offboarding | 5 | 4 | 3 |
| Performance/OKRs | 6 | 5 | 4 |
| LMS | 3 | 4 | 3 |
| Shift Management | 3 | 2 | 2 |
| Expenses | 3 | 3 | 2 |
| Assets | 2 | 4 | 2 |
| Timesheets | 2 | 2 | 2 |
| Org Chart/Directory | 0 | 2 | 1 |
| Surveys/Recognition | 4 | 4 | 3 |
| Compliance/Tax | 2 | 4 | 3 |
| Webhooks | 2 | 1 | 2 |
| Analytics | 0 | 2 | 3 |
| **TOTAL** | **~36** | **~45** | **~39** |

## Implementation Status

All 6 phases of the enterprise architecture plan have been successfully implemented:
- **Phase 1**: Role-Based Access Control (RBAC) & NextAuth Integration - [Completed]
- **Phase 2**: Organizational Hierarchy & Document Management - [Completed]
- **Phase 3**: Advanced Payroll & Tax Compliance - [Completed]
- **Phase 4**: Performance & OKR Management - [Completed]
- **Phase 5**: Leave Policies & Time-Off Accruals - [Completed]
- **Phase 6**: Advanced Multi-Level Approvals & Workflows - [Completed]

## Verification Plan

### Automated Tests
- `npm run lint` and `npm run build` to ensure no build errors.
- Verify Prisma schema compiles correctly with `npx prisma format`.

### Manual Verification
- Start development server (`npm run dev`) and test creating a multi-step workflow.
- Simulate an approval request and ensure it correctly cascades from Manager to HR.

**After completion**: DayFlow now features **~56 DB models**, **~90 pages**, and **~55+ API routes** — making it a truly enterprise-grade HRMS.

---

## Verification Plan

### Automated Tests
- API route tests using Jest + Supertest for every new endpoint
- `npx prisma migrate dev` to validate schema changes

### Manual Verification
- Test each module end-to-end in browser
- Verify mobile responsiveness on Chrome DevTools
- Security audit: test CSRF, XSS, SQL injection, rate limiting
- Performance: Lighthouse scores > 90
- Cross-browser testing: Chrome, Firefox, Safari, Edge

---

> [!IMPORTANT]
> **Recommended execution order**: Phase 1 → Phase 7 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 8 → Phase 9 → Phase 10
> 
> Security first. Compliance second. Features third. Polish last.

