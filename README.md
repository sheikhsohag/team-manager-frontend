# Frontend — Task Manager

Next.js (App Router) + React. Talks to the backend API; auth token stored in
`localStorage`. All permission enforcement is on the backend — the UI only hides or
disables what the current user can't do.

## Setup

```bash
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL (default http://localhost:4000/api)
npm install
npm run dev                        # http://localhost:3000
```

Start the backend first (`cd ../backend && npm run dev`).

## Sign in

The login screen lists demo accounts (seeded with `SEED_DEMO_DATA=true`):

| Account | Email | Password |
| --- | --- | --- |
| Super Admin | `superadmin@example.com` | `ChangeMe@123` |
| Admin A (extra powers) | `admina@acme.test` | `Password@123` |
| Admin B (restricted) | `adminb@acme.test` | `Password@123` |
| Team Member | `mary@acme.test` | `Password@123` |

> Admin A and Admin B share the **Company Admin** role but have different effective
> permissions — open either one's **Manage Permissions** page to see why.

## Routes

**Super Admin:** `/super-admin/dashboard`, `/companies`, `/admins`, `/users`, `/roles`,
`/permissions`, `/audit-logs`, `/settings` (+ `/admins/[id]`, `/users/[id]` permission editors).

**Company Admin / User:** `/dashboard`, `/admin/users`, `/admin/admins`, `/admin/roles`,
`/admin/permissions`, `/admin/company-permissions`, `/admin/audit-logs`, `/my-tasks`,
`/my-permissions`.

## Where the requested features live

| Feature | Location |
| --- | --- |
| Admin management table (allowed/denied counts) | `components/screens/Admins.js` |
| Permission matrix | `PermissionManager.js` → "Matrix" tab |
| Grouped + searchable permissions | `PermissionManager.js` → "Grouped" tab |
| Permission source / inheritance | per-row "Source:" chip |
| Effective permissions | "Effective" tab + `/my-permissions` |
| Simulation / preview | "Permission Preview" button |
| Change history | `components/screens/Audit.js` |
| Copy permissions / templates / bulk | `PermissionManager.js` + `Users.js` bulk modal |
| Live summary (allowed/denied/overrides…) | right-hand `SummaryPanel` |
| Company boundary | `Companies.js` (super) + `CompanyBoundarySelf.js` (admin) |
