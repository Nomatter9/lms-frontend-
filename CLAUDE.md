# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Vite HMR)
npm run build      # Type-check + production build (tsc -b && vite build)
npm run lint       # ESLint
npm run preview    # Preview production build locally
```

No test suite is configured. Type checking runs as part of `build`.

## Environment

Requires a `.env` file at the project root:

```
VITE_API_URL=http://localhost:5000/api
```

## Architecture

### Stack
- **React 19 + TypeScript** via Vite
- **Tailwind CSS v3** for styling; `cn()` (`src/lib/utils.ts`) merges class names via `clsx` + `tailwind-merge`
- **shadcn/ui** primitives in `src/components/ui/`
- **react-router-dom** (BrowserRouter) for routing
- **axios** via `src/axiosClient.ts` for all API calls
- **react-hook-form** + zod schemas in `src/schemas/` for form validation
- **sonner** for toast notifications
- **Quill** (`react-quilljs`) for rich text editing
- Path alias: `@/` maps to `src/`

### Auth & Session
Auth state lives entirely in `localStorage`:
- `token` — stored as a JSON-stringified string; `axiosClient` parses it and injects as `Bearer` header
- `role` — plain string: `admin`, `headmaster`, `teacher`, `parent`, `pupil`
- `user` — JSON-serialized user object (includes nested `school` data)

`src/hooks/useCurrentUser.ts` reads these synchronously. On a 401 response, `axiosClient` clears storage and redirects to `/login`, dispatching a `auth:logout` custom event.

After updating user/school data, dispatch `window.dispatchEvent(new CustomEvent("user-updated"))` so layouts re-read from storage.

### Routing & Access Control
`src/App.tsx` owns the route tree with two guard wrappers:
- `ProtectedRoute` — redirects unauthenticated users to `/login`; optionally enforces `allowedRoles`
- `GuestRoute` — redirects authenticated users to `/dashboard`

Role constants in `App.tsx`:
- `ADMIN_ROLES = ['admin', 'headmaster']`
- `TEACHER_ROLES = ['teacher']`
- `STUDENT_ROLES = ['pupil']`
- `PARENT_ROLES = ['parent']`

For conditional UI rendering (not route-level), use `<PermissionGate allowedRoles={[...]}>`  (`src/components/auth/PermissionGate.tsx`).

### Layouts
Two layout shells:
- `DashboardLayout` (`src/components/dashboard/DashboardLayout.tsx`) — used by headmaster/admin, parent, and student views; contains `Sidebar` + `Navbar`
- `TeacherLayout` (`src/components/dashboard/TeacherLayout.tsx`) — separate layout used by all teacher pages; accepts optional `title` and `subtitle` props

The `Sidebar` builds its navigation from the `NAV_BY_ROLE` map keyed by role string (`admin` aliases `headmaster`).

### Page Structure
```
src/pages/auth/          Auth flow (login, register, forgot/reset password, verify email)
src/pages/dashboard/     Headmaster/admin pages + shared DashboardOverview
src/pages/teacher/       Teacher-specific pages (all use TeacherLayout)
```

`DashboardOverview` renders a different sub-component depending on role using `<PermissionGate>`: `HeadmasterView`, `TeacherView`, `ParentView`, or `StudentView`.

### Types
All domain types are re-exported from `src/types/index.ts`. Key shapes:
- `User` / `School` — `src/types/user.ts`
- `UserRole` — `'admin' | 'headmaster' | 'teacher' | 'parent' | 'pupil'`
- Teaching entities (Lesson, Homework, Assessment, Attendance) — `src/types/teaching.ts`
- Form input types live in `src/types/forms/`

### API Conventions
All requests go through `axiosClient` (never raw `axios`). The base URL is `VITE_API_URL`. Endpoints follow a REST style; common prefixes: `/auth/`, `/students`, `/teacher/`, `/student/`, `/classes`, `/subjects`, `/grades`, `/academicYear`, `/terms`.
