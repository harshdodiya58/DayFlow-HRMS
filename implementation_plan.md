# 🚀 DayFlow HRMS — Production-Level Roadmap

## Current System Audit

### ✅ Features Already Built (What You Have)

| Module | Features | Status |
|---|---|---|
| **Authentication** | Login (Employee ID + Email), JWT tokens, Password Reset, Email Verification, First-Login Password Change, Account Lockout, Rate Limiting, CSRF Protection | ✅ Solid |
| **Employee Management** | Add/Edit Employee, Auto-generate Employee IDs, Salary Structure Setup, Profile Photos, Department & Job Title | ✅ Basic |
| **Attendance** | Check-In / Check-Out, Live Timer, Auto Checkout (Cron), Today's Attendance Table (Admin), Attendance Calendar (Employee), Attendance History | ✅ Good |
| **Leave Management** | Apply Leave (Sick/Paid/Unpaid), Admin Approve/Reject with Comments, Leave History | ✅ Basic |
| **Payroll** | Salary Structure (Basic/HRA/PF/Prof Tax etc.), Auto Payroll Generation (Cron), Payslip PDF Download, Salary Simulator (Optimistic/Realistic/Pessimistic), Payroll History | ✅ Good |
| **Chat** | Real-time Messaging (polling-based), Read Receipts, Message Editing, Typing Indicators | ✅ Basic |
| **Notifications** | In-App Notifications, Email Notifications, Notification Preferences, Notification Bell UI | ✅ Good |
| **Reports** | PDF/Excel Export, Attendance Reports, Leave Reports, Payroll Reports | ✅ Basic |
| **Leaderboard** | Top Performers by Attendance, Multiple Categories | ✅ Basic |
| **Security** | Password Strength Validation, XSS Input Sanitization, Audit Logging, Session Management, 2FA (partial – schema ready, not fully implemented) | ✅ Partial |
| **Landing Page** | Animated hero, Feature cards, Bento grid layout | ✅ Good |

### ❌ Critical Gaps for Production

| Gap | Impact |
|---|---|
| No **HR Helpdesk / Ticket System** — Employees can't raise issues to HR | 🔴 High |
| No **Document Management** — No offer letters, ID proofs, policy docs | 🔴 High |
| No **Organization Hierarchy** — No departments model, no reporting structure | 🔴 High |
| No **Holiday Calendar** — System doesn't know public holidays | 🔴 High |
| No **Leave Balance Tracking** — No annual entitlement/carry-forward | 🔴 High |
| No **Onboarding Workflow** — No task checklists for new joiners | 🟡 Medium |
| No **Performance Reviews / Appraisals** — No goal setting, no KPIs | 🟡 Medium |
| No **Announcements Board** — Admin can't broadcast company-wide messages | 🟡 Medium |
| No **Employee Self-Service Portal** — Limited self-service options | 🟡 Medium |
| No **Multi-tenancy / Company Settings** — Single company hardcoded | 🟡 Medium |
| No **File Upload / Storage** (Profile pics are just strings) | 🟡 Medium |
| No **AI Agent / Chatbot** for employee queries | 🟡 Medium |
| No **Shift Management** — Fixed 9-to-5 assumption | 🟢 Low initially |
| No **Expense Management** | 🟢 Low initially |
| No **Recruitment / ATS** | 🟢 Low initially |
| 2FA is schema-only, not fully implemented | 🟡 Medium |
| No **Unit Tests** at all | 🔴 High |
| No proper **Error Boundaries** in React | 🟡 Medium |
| **Rate limiting is in-memory** (resets on restart) | 🟡 Medium |
| **CSRF tokens are in-memory** (resets on restart) | 🟡 Medium |

---

## Proposed Roadmap — 6 Phases

---

### 🏗️ Phase 1: Foundation & Data Integrity (Week 1-2)
> Make the existing features production-solid before adding new ones.

#### Database Schema Enhancements

##### [MODIFY] [schema.prisma](file:///d:/project/DayFlow---HRMS-master/prisma/schema.prisma)
- Add `Department` model (id, name, description, headId, parentDepartmentId)
- Add `Holiday` model (id, name, date, type: NATIONAL/REGIONAL/COMPANY, isOptional)
- Add `CompanySettings` model (name, logo, address, timezone, workStartTime, workEndTime, weekends)
- Add `LeavePolicy` model (leaveType, annualEntitlement, carryForwardLimit, maxConsecutiveDays)
- Add `LeaveBalance` model (userId, leaveType, year, entitled, used, remaining, carryForward)
- Add `Document` model (userId, type: OFFER_LETTER/ID_PROOF/POLICY etc., name, url, uploadedBy, uploadedAt)
- Add `SupportTicket` model (id, employeeId, category, subject, description, priority, status, assignedTo, messages[])
- Add `TicketMessage` model (id, ticketId, senderId, content, attachments, createdAt)
- Add `Announcement` model (id, title, content, priority, createdBy, startsAt, expiresAt, targetDepartment)
- Extend `EmployeeDetails` → add `emergencyContact`, `bloodGroup`, `dateOfBirth`, `gender`, `bankAccountNo`, `ifscCode`, `panNumber`, `aadharNumber`
- Extend `User` → add `managerId` (self-relation for reporting hierarchy)
- Add `enum TicketStatus { OPEN, IN_PROGRESS, RESOLVED, CLOSED }`
- Add `enum TicketPriority { LOW, MEDIUM, HIGH, URGENT }`
- Add `enum DocumentType { OFFER_LETTER, ID_PROOF, POLICY, PAYSLIP, TAX_FORM, OTHER }`

#### Validation & Error Handling

##### [MODIFY] Multiple API route files
- Add Zod/manual validation on every API endpoint (email format, phone format, required fields)
- Add proper `try-catch` error boundaries in all React pages
- Add global error boundary component
- Fix the `NEXT_PUBLIC_APP_URL` to be required in `.env` (not fallback to localhost)
- Replace in-memory rate limiter with DB-backed or Redis-backed solution
- Add input length limits to prevent abuse

#### Company Settings

##### [NEW] `src/app/api/admin/settings/route.js`
- CRUD for company name, logo, work hours, timezone, weekend days configuration

##### [NEW] `src/app/admin/settings/page.js`
- Admin settings UI for company configuration

---

### 📋 Phase 2: HR Helpdesk & Communication (Week 3-4)
> The #1 feature employees need — a way to reach HR with problems.

#### Support Ticket System

##### [NEW] `src/app/api/tickets/route.js`
- Employee: Create ticket (category, subject, description, priority, attachments)
- Employee: View own tickets, add messages, close ticket
- Admin: View all tickets, assign, update status, reply

##### [NEW] `src/app/api/tickets/[id]/route.js`
- GET single ticket with message thread
- PUT to update status/assignment
- POST to add message to ticket thread

##### [NEW] `src/app/dashboard/helpdesk/page.js`
- Employee helpdesk UI — "Raise a Ticket" form + ticket list + ticket detail with chat-like message thread
- Categories: Payroll Issue, Leave Discrepancy, IT Support, Policy Question, Harassment/Complaint, Other

##### [NEW] `src/app/admin/helpdesk/page.js`
- Admin ticket management — filterable table, assign to self, resolve, escalate
- Dashboard stats: Open tickets, Average resolution time, SLA breach count

#### Announcements System

##### [NEW] `src/app/api/admin/announcements/route.js`
- Admin: Create/Edit/Delete announcements with priority levels and expiry dates
- Employee: Fetch active announcements

##### [NEW] `src/app/admin/announcements/page.js`
- Admin UI to manage announcements

##### [MODIFY] `src/app/dashboard/page.js`
- Add announcements banner/feed to employee dashboard

---

### 📅 Phase 3: Leave & Holiday Management Overhaul (Week 5-6)
> Real-world leave management with balances, holidays, and policies.

#### Holiday Calendar

##### [NEW] `src/app/api/admin/holidays/route.js`
- CRUD for holidays (national, regional, company-specific, optional)
- Bulk import holidays from government list

##### [NEW] `src/app/admin/holidays/page.js`
- Interactive calendar view for managing holidays
- Import/Export holiday list

#### Leave Balance System

##### [MODIFY] `src/app/api/leaves/route.js`
- Integrate leave balance checking before approval
- Auto-deduct balance on approval, restore on rejection
- Prevent leave application if balance insufficient
- Block overlapping leave dates

##### [NEW] `src/app/api/admin/leave-policy/route.js`
- Define leave policies per leave type (annual entitlement, carry forward, max consecutive)
- Year-end carry forward processing

##### [MODIFY] `src/app/dashboard/leaves/page.js`
- Show leave balance breakdown (entitled, used, remaining per type)
- Show holiday calendar integration
- Improve leave application form with date validation

##### [MODIFY] `src/app/admin/leaves/page.js`
- Bulk approve/reject
- Leave balance overview for all employees

---

### 📊 Phase 4: Performance, Documents & Onboarding (Week 7-9)

#### Document Management

##### [NEW] `src/app/api/documents/route.js`
- File upload/download API using cloud storage (Cloudinary/S3/Vercel Blob)
- Document categorization (Offer Letter, ID Proof, Policy Document, Tax Forms)
- Admin: Upload company policies accessible to all employees

##### [NEW] `src/app/dashboard/documents/page.js`
- Employee: View own documents, upload personal docs
- Download offer letters, payslips, tax forms

##### [NEW] `src/app/admin/documents/page.js`
- Admin: Manage employee documents, upload company-wide policies

#### Onboarding Workflow

##### [NEW] `src/app/api/admin/onboarding/route.js`
- Onboarding checklist templates (customizable by admin)
- Auto-assign tasks to new joiners (submit ID, bank details, sign policies etc.)
- Track onboarding progress per employee

##### [NEW] `src/app/dashboard/onboarding/page.js`
- New employee onboarding wizard — step-by-step guided setup

#### Performance Reviews (Basic)

##### [NEW] Prisma models: `PerformanceReview`, `Goal`, `ReviewCycle`
##### [NEW] `src/app/api/admin/reviews/route.js`
- Create review cycles (quarterly/annual)
- Set employee goals with measurable targets
- Self-assessment + Manager assessment scoring

##### [NEW] `src/app/dashboard/reviews/page.js`
- Employee: View goals, submit self-assessment
- See review history and ratings

##### [NEW] `src/app/admin/reviews/page.js`
- Admin: Create review cycles, view all reviews, generate reports

---

### 🤖 Phase 5: AI Agent & Smart Features (Week 10-11)

#### HR AI Agent / Chatbot

##### [NEW] `src/app/api/agent/route.js`
- AI-powered chatbot that can answer employee queries:
  - "How many leaves do I have left?"
  - "What is the holiday list for this month?"
  - "Show me my payslip for June"
  - "I want to apply for leave from 15th to 18th"
  - "What is the company's WFH policy?"
- Uses context from: leave balances, attendance records, company policies, FAQ database
- Powered by LLM API with RAG over company documents

##### [NEW] `src/app/api/admin/agent/knowledge/route.js`
- Admin: Upload FAQ entries and policy documents that the AI agent can reference

##### [NEW] `src/components/AIAssistant.js`
- Floating AI assistant widget accessible from every page
- Chat-like interface with typing indicators
- Quick action buttons for common requests

#### Smart Notifications & Insights

##### [MODIFY] `src/lib/notifications.js`
- Automated reminders: "You haven't checked in today"
- Weekly summary emails: attendance %, leave balance, upcoming holidays
- Birthday/anniversary auto-notifications
- Anomaly detection: "X employee has been absent 5 days in a row"

---

### 🔒 Phase 6: Security Hardening & Production Readiness (Week 12-13)

#### Security Enhancements

##### [MODIFY] `src/lib/auth.js`
- Complete 2FA implementation (TOTP with QR code setup)
- Refresh token rotation
- Session management with device tracking

##### [MODIFY] `src/lib/security.js`
- Move rate limiting to database/Redis
- Add request payload size limits
- Add Content Security Policy (CSP) headers
- Add CORS configuration

##### [NEW] `src/middleware.js` (replace proxy.js)
- Proper Next.js middleware with all security checks
- API route protection with role-based access
- Request logging middleware

#### Production Infrastructure

##### [MODIFY] `package.json`
- Add testing framework (Jest + React Testing Library)
- Add Zod for runtime schema validation
- Add `@vercel/blob` or `cloudinary` for file uploads

##### [NEW] Test files across all modules
- Unit tests for payroll calculator
- API integration tests for all routes
- Component tests for critical UI flows

##### [NEW] `.env.example` update
- Document all required environment variables
- Add `NEXT_PUBLIC_APP_URL` as mandatory
- Add cloud storage config variables
- Add AI API key config

---

## User Review Required

> [!IMPORTANT]
> This is a massive undertaking. I recommend we execute it **one phase at a time**, starting with **Phase 1** (Foundation) and **Phase 2** (Helpdesk/Communication) as these have the highest impact.

> [!WARNING]
> Phase 5 (AI Agent) requires an external LLM API key (OpenAI/Google AI/etc.). We need to decide which AI provider to use.

## Open Questions

1. **Which phases do you want me to start with?** I recommend Phase 1 + Phase 2 first.
2. **AI Provider for Phase 5**: Which LLM do you want to power the AI chatbot? (OpenAI GPT, Google Gemini, or local model?)
3. **File Storage**: For document uploads, should we use Vercel Blob (free tier), Cloudinary, or AWS S3?
4. **Do you want multi-tenancy?** (Multiple companies using the same DayFlow instance) — this would be a big architectural change.
5. **Mobile App**: Are you planning a React Native / Flutter mobile app later? This affects API design decisions.

## Verification Plan

### After Each Phase
- Run the dev server and test all new features end-to-end
- Verify existing features still work (no regressions)
- Test responsive design on mobile/tablet
- Verify database migrations run cleanly

### Automated Tests (Phase 6)
- `npm test` — Unit & integration test suite
- `npx prisma validate` — Schema validation
- Build verification: `npm run build`
