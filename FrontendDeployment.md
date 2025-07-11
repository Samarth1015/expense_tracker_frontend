# Frontend Deployment Documentation

## Overview
This document describes the deployment and technology stack of the Expense Tracker frontend application.

---

## Access Link
- **Frontend Website/App:** [http://103.192.198.15:30006/](http://103.192.198.15:30006/)

---

## Technologies & Tools Used

- **Framework:** Next.js (React)
- **Authentication:** Clerk (for user authentication), custom JWT (for backend API access)
- **UI Libraries:** Tailwind CSS, Radix UI, Framer Motion, Lucide Icons, Recharts (for analytics/graphs)
- **State & Data:** React state, Axios (API calls)
- **Other Libraries:** react-hot-toast (notifications), class-variance-authority, clsx
- **TypeScript:** Used throughout the codebase
- **Build & Lint:** ESLint, PostCSS, Autoprefixer
- **Environment:** Uses environment variables for API base URL and Clerk keys

---

## Deployment
- **Containerization:** Docker (see Dockerfile in this directory)
- **Image Distribution:** Docker Hub (for storing and distributing images)
- **Orchestration:** Kubernetes (deployed as a pod alongside backend)
- **CI/CD:** Integrated with Jenkins (see backend documentation for pipeline details)

---

## Notes
- The frontend communicates securely with the backend using JWT tokens issued after Clerk authentication.
- All sensitive configuration is managed via environment variables and Kubernetes secrets.
- For more details, refer to the Dockerfile and configuration files in this directory.

image.png
image.png
image.png