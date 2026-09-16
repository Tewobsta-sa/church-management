# Sunday School & Church Management System (Web Application)

A modern, responsive, bilingual (Amharic & English) web application and Progressive Web App (PWA) built with **React 19**, **Vite 8**, and **Tailwind CSS**.

---

## ✨ Key Features

- **5 Canonical Roles Support**:
  - `super_admin`: Full management, security, and final promotion authorization.
  - `yesew_habt`: Student records, demographic tracking, and promotion endorsement.
  - `tmhrt_kfl`: Curriculum, schedules, teachers, grading, and promotion nomination.
  - `mezmur_kfl`: Hymn library, vocal tracking, and hymn exams.
  - `mereja_kfl`: Analytics, student records viewing, and reporting exports.

- **Bilingual Interface**:
  - Full native support for **Amharic (አማርኛ)** and **English** powered by `i18next`.
  - Ethiopian Calendar converter integration (`formatEthiopianDate`).

- **Progressive Web App (PWA) & Mobile Attendance**:
  - Fullscreen QR scanner optimized for mobile phone cameras (`/mobile/scanner`).
  - Mobile attendance viewer (`/mobile/viewer`) for on-the-go checks.
  - Offline-ready service worker caching.

- **Resilient Authentication & Session Security**:
  - Seamless Bearer token handling with automated silent refresh queue on `401 Unauthorized`.
  - 25-minute idle inactivity auto-logout guard with friendly bilingual alerts.
  - Global `ErrorBoundary` with graceful crash handling and one-click recovery.

- **High-Performance Architecture**:
  - Code-split routes utilizing `React.lazy()` and `Suspense`.
  - Optimized Rolldown bundle chunks (`vendor`, `pdf`, `charts`, `icons`) preventing memory pressure and ensuring sub-second initial load times.

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js**: v18.0 or higher (v22 LTS recommended)
- **npm**: v9.0 or higher

### Installation

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Create or edit `.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api
   ```
   *For production deployment, set `VITE_API_BASE_URL` to your backend API URL, e.g., `https://api.yourchurchdomain.org/api`.*

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Build for Production**:
   ```bash
   npm run build
   ```

5. **Preview Production Build**:
   ```bash
   npm run preview
   ```

---

## 📱 Mobile Installation (PWA)

When accessed on iOS Safari or Android Chrome, the app displays a native install prompt allowing users to add the application to their home screen as a standalone application.

---

## 📜 License
Private & Proprietary. All rights reserved by the Sunday School Administration.
