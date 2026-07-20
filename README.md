<div align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=40&pause=1000&color=2563EB&center=true&vCenter=true&width=600&lines=Welcome+to+DayFlow;The+Next-Gen+HRMS;Manage+Employees+with+Ease;Automated+Payroll+%26+Leaves" alt="Typing SVG" />

  <p align="center">
    <strong>A beautifully crafted, modern Human Resource Management System built with Next.js 16, React 19, and PostgreSQL.</strong>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" alt="Prisma" />
    <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  </p>
</div>

---



## ✨ Features That Empower

DayFlow is packed with enterprise-grade features wrapped in a consumer-grade UI.

| Feature | Description |
| :--- | :--- |
| 👥 **Employee Management** | Complete lifecycle management with role-based access control. |
| ⏱️ **Attendance Tracking** | Real-time check-in/check-out with visual calendar history. |
| 🏖️ **Leave Management** | Apply, approve, and track various types of leaves seamlessly. |
| 💸 **Payroll System** | Automated salary calculations and comprehensive payroll history. |
| 🔔 **Smart Notifications** | In-app notification center paired with email integration. |
| 💬 **Internal Helpdesk** | Real-time chat & ticketing between admins and employees. |
| 🤖 **AI Assistant** | Integrated AI chatbot to help employees find company policies instantly. |
| 🔒 **Enterprise Security** | JWT auth, CSRF protection, audit logging, and rate limiting. |

---

## 🛠️ Quick Start Guide

### Prerequisites
Make sure you have installed **Node.js 18+** and **PostgreSQL 15+**.

### 1. Clone & Install
```bash
git clone https://github.com/harshdodiya58/DayFlow-HRMS.git
cd DayFlow-HRMS
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/dayflow"
JWT_SECRET="your-super-secret-key"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
EMAIL_FROM="DayFlow HRMS <noreply@dayflow.com>"
```

### 3. Database Setup
```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Launch DayFlow
```bash
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000) and embark on a seamless HR experience! 🎉

---

## 📁 Architecture Overview

```text
src/
├── app/
│   ├── admin/          # Admin dashboard & management panels
│   ├── api/            # Next.js API Routes (Backend)
│   ├── auth/           # Secure authentication flows
│   └── dashboard/      # Employee self-service dashboard
├── components/         # Reusable, animated UI components
├── lib/                # Utilities (auth, email, prisma)
└── middleware.js       # Global authentication & CSRF protection
```

---

<div align="center">
  <b>Built with ❤️ for modern workplaces.</b><br><br>
  <img src="https://forthebadge.com/images/badges/built-with-love.svg" alt="Built with Love" />
  <img src="https://forthebadge.com/images/badges/uses-js.svg" alt="Uses JS" />
</div>
