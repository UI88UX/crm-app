<div align="center">

<img src="./public/banner.png" alt="CRM for Audiology Clinic" width="100%" />

<br/>
<br/>

<p>
  A full-stack CRM built for audiology clinics — patient records, appointments, sales, SMS campaigns, and call follow-ups in one dashboard.
</p>

<p>
  <a href="https://crm-app-zeta-peach.vercel.app">
    <strong>🔗 Live Demo</strong>
  </a>
  &nbsp;·&nbsp;
  <a href="https://github.com/UI88UX/crm-app">
    <strong>📦 Source Code</strong>
  </a>
</p>

<br/>

<hr/>

<h3>⚠️ Active Development</h3>

<p>
  This project is under active development. Features are being added and refined continuously.<br/>
  The database schema and API may change without notice.
</p>

<hr/>

</div>

<br/>

## About

This CRM was built specifically for audiology practices. It covers the daily workflow of a clinic: from a patient's first hearing test to follow-up calls months later.

The application is designed for Persian-speaking users. The entire UI is in Persian with full RTL support and Jalali calendar integration. Behind the scenes, it uses PostgreSQL with row-level security to keep data isolated per clinic.

This is a real tool used in a real clinic, not a demo project. Every feature was built to solve an actual problem.

<br/>

## Tech Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | Next.js 15 (App Router), React 18, TypeScript |
| **UI** | Tailwind CSS, shadcn/ui, Radix UI, Lucide Icons |
| **State & Forms** | TanStack React Query, React Hook Form, Zod |
| **Backend** | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| **Integrations** | Melipayamak (Iranian SMS gateway) |
| **Utilities** | moment-jalaali, react-multi-date-picker |
| **Deployment** | Vercel |

<br/>

## Features

### Patient Management
Create and maintain patient profiles with contact details, national ID, address, emergency contacts, and attached files (images, PDFs). Search by name, national code, or phone number.

### Appointment Scheduling
Book appointments with Jalali calendar support. Each appointment has a type (visit, consultation, follow-up) and a status workflow: scheduled → confirmed → completed / cancelled / no-show. Quick appointment creation is available directly from a patient's profile.

### Sales Tracking
Record sales tied to specific patients. Filter and search sales history. The dashboard shows monthly revenue and sales trends.

### SMS Campaigns
Build audience segments using filters like last visit date, hearing aid brand, purchase history, city, gender, and SMS consent status. Preview the recipient count before sending. Schedule campaigns for a future date. Message templates support patient variable substitution such as `{{patient.first_name}}`.

### Call Follow-ups
Schedule follow-up calls with a due date. Log call results (successful, callback, no answer, cancelled). The dashboard shows reminders for calls that are due. A complete audit trail of past follow-ups is maintained.

### Admin & Permissions
Role-based access control with three levels: Super Admin, Admin, and User. Each clinic (tenant) has its own isolated data. Super Admins can manage tenants and impersonate users for support purposes.

### Authentication
Email/password authentication via Supabase Auth, with email confirmation, password recovery, and protected routes that redirect based on user role.

<br/>

## Architecture Notes

### Database-level security
Access rules are enforced at the database level using PostgreSQL Row Level Security (RLS) policies. Every table has explicit policies that restrict access based on the authenticated user's role and tenant. Hiding something in the UI is not the same as preventing access to it.

### Auto-synced user profiles
Supabase stores authentication records in `auth.users`, which is not directly queryable from the client. A PostgreSQL trigger automatically creates a matching row in the public `users` table when a new user registers. This keeps profile data consistent without relying on every registration flow to remember a second operation.

### Server state with React Query
All server interactions go through TanStack React Query, with defined query keys for caching and invalidation. This keeps server data separate from UI state and gives consistent loading and error handling across the app.

### Multi-tenant by design
Every major table (patients, appointments, sales, campaigns) includes a `tenant_id` column. RLS policies ensure users can only access data belonging to their own clinic. A Super Admin role can operate across tenants when needed.

<br/>

## Getting Started

### Prerequisites

- Node.js 20 or later
- npm, yarn, or pnpm
- A Supabase project (free tier works)

### Installation

```bash
git clone https://github.com/UI88UX/crm-app.git
cd crm-app
npm install
cp .env.example .env.local
npm run dev
```

The app should be available at http://localhost:3000.

### Environment Variables

Create a `.env.local` file at the root of the project:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# SMS (Melipayamak)
MELIPAYAMAK_USERNAME=your_username
MELIPAYAMAK_PASSWORD=your_password
MELIPAYAMAK_FROM=your_sender_number
MELIPAYAMAK_BODY_ID=your_template_id

# Internal
BACKUP_CRON_SECRET=your_random_secret
```

> **Security note:** The `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to the client. Use it only in server-side code such as API routes, cron jobs, and server actions.

### Project Structure

```text
src/
├── app/                    # Next.js App Router
│   ├── dashboard/          # Protected dashboard routes
│   │   ├── patients/       # Patient management
│   │   ├── appointments/   # Appointment scheduling
│   │   ├── sales/          # Sales tracking
│   │   ├── sms/            # SMS campaigns
│   │   ├── call-followups/ # Call follow-up workflow
│   │   └── users/          # User management
│   ├── admin/              # Super-admin area
│   ├── login/              # Authentication pages
│   └── api/                # Route handlers
├── components/             # Reusable UI components
│   ├── ui/                 # shadcn/ui primitives
│   ├── appointments/       # Appointment-specific components
│   ├── call-followups/     # Follow-up components
│   └── providers/          # Context providers
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities, Supabase client, validations
├── slices/                 # Redux slices (UI state only)
└── types/                  # Shared TypeScript types
```

<br/>

## Roadmap

- [ ] Complete responsive audit across all dashboard pages
- [ ] Comprehensive test coverage (Vitest + Playwright)
- [ ] Export reports to Excel / PDF
- [ ] Full migration scripts for one-command database setup
- [ ] CI/CD pipeline with automated preview deployments
- [ ] Detailed API documentation

<br/>

## Contact

**Hossein** — Frontend & Full-stack Developer

- GitHub: [@UI88UX](https://github.com/UI88UX)
- Live app: [crm-app-zeta-peach.vercel.app](https://crm-app-zeta-peach.vercel.app)

<br/>

## License

This project is not licensed for public distribution. For inquiries about usage or collaboration, please reach out directly.

<br/>

<div align="center">
<sub>Built with Next.js and Supabase. Still a work in progress.</sub>

</div>