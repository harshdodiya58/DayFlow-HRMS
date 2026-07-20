<div align="center">
  <img src="https://raw.githubusercontent.com/harshdodiya58/DayFlow-HRMS/master/public/logo.png" alt="DayFlow Logo" width="200" height="auto" />
  <h1>🚀 DayFlow HRMS - Enterprise-Grade HR Management System</h1>
  <p><strong>The Ultimate Open-Source Solution for Modern Workforces, Payroll, and Performance.</strong></p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
  [![Prisma](https://img.shields.io/badge/Prisma-5-1B222D?logo=prisma)](https://prisma.io)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?logo=postgresql)](https://neon.tech)
</div>

<br/>

<div align="center">
  <img src="https://via.placeholder.com/1000x500.png?text=DayFlow+Admin+Dashboard" alt="DayFlow Admin Dashboard" width="100%" style="border-radius: 12px; box-shadow: 0px 10px 20px rgba(0,0,0,0.2);" />
</div>

<br/>

## 🌟 Why DayFlow?

DayFlow is not just another HR tool. It's a comprehensive, highly-scalable, and beautifully designed **Human Resource Management System** built for multinational corporations and large Indian enterprises. From biometric integrations to complex statutory tax compliances, DayFlow handles it all.

### 🏢 Built for Scale & Security
- **Robust RBAC:** Multi-tier roles (Admin, HR, Manager, Employee) utilizing NextAuth and secure JWTs.
- **Audit Logging:** Every critical action (salary updates, leave approvals, policy changes) is meticulously logged for compliance.
- **Data Protection:** PostgreSQL (Neon) backend heavily secured with Prisma ORM validations.

---

## 🔥 Enterprise Features

### 1️⃣ Advanced Payroll & Tax Engine 💰
- **Dynamic Statutory Compliance:** Fully automated PF, ESI, Professional Tax, and TDS deductions.
- **Custom Salary Structures:** Configurable Base, HRA, LTA, and Performance Bonuses.
- **F&F (Full & Final) Settlement:** Automated severance, gratuity, and leave encashment calculations.

### 2️⃣ Performance & OKR Management 🎯
- **Company-wide OKRs:** Align organizational goals with individual targets.
- **Appraisal Cycles:** Initiate quarterly or annual review cycles.
- **Interactive Self-Assessments:** Employees can track progress and submit self-ratings seamlessly.

### 3️⃣ Automated Leave & Accrual Workflows 🗓️
- **Dynamic Policies:** Configure Casual, Sick, and Earned leaves specific to departments.
- **Automated Ledger:** Cron-based monthly accruals and automated carry-forward logic.
- **Action Center:** Unified queue for managers to approve/reject leaves with one click.

### 4️⃣ Organizational & Document Management 📂
- **Department Hierarchy:** Visual mapping of departments, managers, and employee chains.
- **Digital Onboarding:** Offer letter generations and document compliance tracking.

---

## 💻 Tech Stack

<table align="center">
  <tr>
    <td align="center" width="96">
      <img src="https://skillicons.dev/icons?i=nextjs" width="48" height="48" alt="Next.js" />
      <br>Next.js 16
    </td>
    <td align="center" width="96">
      <img src="https://skillicons.dev/icons?i=react" width="48" height="48" alt="React" />
      <br>React
    </td>
    <td align="center" width="96">
      <img src="https://skillicons.dev/icons?i=tailwind" width="48" height="48" alt="Tailwind" />
      <br>Tailwind
    </td>
    <td align="center" width="96">
      <img src="https://skillicons.dev/icons?i=prisma" width="48" height="48" alt="Prisma" />
      <br>Prisma
    </td>
    <td align="center" width="96">
      <img src="https://skillicons.dev/icons?i=postgres" width="48" height="48" alt="PostgreSQL" />
      <br>Neon DB
    </td>
  </tr>
</table>

---

## 🚀 Quick Start (Local Development)

Get DayFlow running locally in less than 5 minutes!

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database URL (We recommend [Neon.tech](https://neon.tech))

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/harshdodiya58/DayFlow-HRMS.git
   cd DayFlow-HRMS
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
   NEXTAUTH_SECRET="your-super-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Sync the Database Schema:**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 🎨 Stunning UI Previews

<div align="center">
  <img src="https://via.placeholder.com/1000x500.png?text=Employee+Portal" alt="Employee Portal" width="100%" style="border-radius: 12px; margin-bottom: 20px; box-shadow: 0px 10px 20px rgba(0,0,0,0.2);" />
  <img src="https://via.placeholder.com/1000x500.png?text=Performance+Appraisals" alt="Performance Appraisals" width="100%" style="border-radius: 12px; box-shadow: 0px 10px 20px rgba(0,0,0,0.2);" />
</div>

---

## 🛠️ Contribution Guidelines

We welcome all contributions from senior developers, architects, and open-source enthusiasts! 

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

<div align="center">
  <b>Built with ❤️ by Harsh Dodiya and the Open Source Community.</b><br/>
  <i>"Revolutionizing HR Management for the Modern Era"</i>
</div>
