# CollabDock

CollabDock is a focused creator-operations workspace for independent Instagram creators in India. It keeps brand collaborations, deliverables, payments, WhatsApp follow-ups, and basic PDF invoices together without turning the creator's work into a CRM.

## What is included

- Firebase email/password and Google authentication, password reset, protected client routes, and server-side ID-token verification
- Three-step creator onboarding with reusable invoice defaults
- Fast collaboration creation, editing, deletion, search, filters, and mobile cards
- Checklist-style deliverables with due dates and computed dashboard deadlines
- Integer-paise financial data, atomic overpayment prevention, partial payments, and computed unpaid/partial/paid/overdue states
- User-confirmed WhatsApp payment reminders with a copy fallback
- Sequential per-creator invoice numbers, immutable invoice snapshots, and downloadable A4 PDFs
- Real database-backed dashboard metrics and useful empty/loading/error states
- Responsive light/dark UI with reduced-motion, reduced-transparency, keyboard, and contrast accommodations
- Owner-scoped MongoDB queries across every financial resource
- Firebase-claim-protected internal admin workspace with creator operations, account controls, audited corrections, and privacy-safe data projections

## Repository

```text
collabdock/
├── frontend/                 React, Vite, Tailwind CSS v4
│   ├── src/
│   │   ├── components/      Shell, guards, UI primitives and badges
│   │   ├── context/         Firebase auth state
│   │   ├── features/        Collaboration and payment workflows
│   │   ├── hooks/           Shared data hooks
│   │   ├── lib/             Firebase, money/date and WhatsApp helpers
│   │   ├── pages/           Product and authentication pages
│   │   └── services/        Authenticated Axios client
│   └── netlify.toml
├── backend/                  Express, MongoDB, Firebase Admin
│   └── src/
│       ├── config/          Environment, database and Firebase
│       ├── controllers/     Versioned API handlers
│       ├── middleware/      Auth, validation and errors
│       ├── models/          User, Collaboration, Deliverable, Payment, Invoice
│       ├── routes/          REST routes
│       ├── services/        Atomic payments and PDF generation
│       ├── validators/      Zod contracts
│       └── utils/           Finance rules and errors
├── netlify.toml
├── render.yaml
└── package.json             npm workspaces
```

## Local setup

Requirements: Node 20+, npm, MongoDB (local or Atlas), and a Firebase project. No production credentials are included.

```bash
npm install
copy frontend\.env.example frontend\.env
copy backend\.env.example backend\.env
npm run dev
```

The web app runs on `http://localhost:5173`; the API runs on `http://localhost:4000`. The single root command starts both. If MongoDB is not installed locally, set `USE_IN_MEMORY_DB=true` in `backend/.env`; this development-only database is erased when the process stops.

### Firebase

1. Create a Firebase project and enable **Email/Password** and **Google** in Authentication → Sign-in method.
2. Add `localhost` and the eventual Netlify hostname to Authentication → Settings → Authorized domains.
3. Create a Web App and copy its public configuration into `frontend/.env`.
4. In Project settings → Service accounts, create an Admin SDK key. Set its project ID, client email, and private key only in `backend/.env` (or Render secrets). Keep escaped newlines in the private key as `\\n`.
5. For local emulator use, set `VITE_USE_FIREBASE_EMULATOR=true` and `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099`.

Firebase's client SDK owns browser session persistence. CollabDock never writes ID tokens to `localStorage`; Axios requests a current ID token from the authenticated Firebase user for each request.

### Administrator access

The internal workspace is available at `/admin` and requires a Firebase custom claim named `admin`. The claim is always verified by the backend. A frontend route guard is provided for usability but is not treated as authorization.

Grant or revoke the first administrator from the repository root after configuring the Firebase Admin credentials:

```bash
node backend/src/scripts/setAdminClaim.js grant admin@example.com
node backend/src/scripts/setAdminClaim.js revoke admin@example.com
```

The affected account must sign out and sign in again after its claim changes. Administrator access cannot be granted from the dashboard.

Admin responses exclude bank details, UPI IDs, invoice payment instructions, and payment reference IDs. Mutations require a reason and are written to an immutable audit log.

#### Authentication troubleshooting

If the browser reports `CONFIGURATION_NOT_FOUND` or `auth/configuration-not-found`, the Firebase Web App values may be valid while Firebase Authentication itself has not been initialized. In Firebase Console, select the same project used by `frontend/.env`, open **Authentication**, click **Get started**, and then enable both **Email/Password** and **Google** under **Sign-in method**. Add `localhost` under **Authentication → Settings → Authorized domains** for local development. Projects created after April 28, 2025 do not include `localhost` automatically.

If the error continues, copy the complete Web App config again from **Project settings → General → Your apps → SDK setup and configuration**. Do not combine an API key from one Google Cloud project with the project ID, auth domain, or app ID from another.

### MongoDB

For local MongoDB, the example URI works as-is. For Atlas, create a database user, permit the Render outbound network as appropriate, and set:

```text
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/collabdock?retryWrites=true&w=majority
```

Indexes for owner, status, deadline, updated date, invoice number, and text search are declared on the Mongoose models.

### Environment variables

Frontend (`frontend/.env`):

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend base URL ending in `/api/v1` |
| `VITE_FIREBASE_*` | Firebase Web App public configuration |
| `VITE_USE_FIREBASE_EMULATOR` | Optional local auth emulator switch |
| `VITE_GA_MEASUREMENT_ID` | Optional GA4 web stream ID in `G-XXXXXXXXXX` format |
| `VITE_GA_ENABLE_IN_DEV` | Optional switch for sending analytics from local development |

Backend (`backend/.env`):

| Variable | Purpose |
|---|---|
| `NODE_ENV`, `PORT` | Runtime environment and Render port |
| `MONGODB_URI` | Private MongoDB connection string |
| `USE_IN_MEMORY_DB` | Optional development-only ephemeral MongoDB switch |
| `FRONTEND_URL` | Allowed CORS origin; comma-separate multiple origins |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Admin service account email |
| `FIREBASE_PRIVATE_KEY` | Admin private key, including escaped newlines |

## Commands

```bash
npm run dev       # frontend and backend together
npm run build     # production frontend and backend syntax checks
npm run lint      # both ESLint configurations
npm test          # backend and frontend tests
npm run seed      # development-only example creator data
```

### Development seed data

Create a test user in Firebase Authentication or its emulator, copy its UID to `DEV_FIREBASE_UID`, keep `NODE_ENV=development`, then run `npm run seed`. The seed creates four collaborations, deliverables, a fully paid deal, a partial/overdue deal, and one example invoice. It refuses to run in production and skips a development UID that already has collaboration data.

## API summary

All routes except health require `Authorization: Bearer <Firebase ID token>`. The owner UID is always read from the verified token, never from request input.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/health` | Service health |
| GET/PATCH | `/api/v1/me` | Creator profile and onboarding |
| GET | `/api/v1/dashboard` | Metrics, deadlines and recent work |
| GET/POST | `/api/v1/collaborations` | Search/list and create deals |
| GET/PATCH/DELETE | `/api/v1/collaborations/:id` | Deal detail and lifecycle |
| POST | `/api/v1/collaborations/:id/deliverables` | Add a deliverable |
| PATCH/DELETE | `/api/v1/deliverables/:id` | Update or remove a deliverable |
| GET | `/api/v1/payments` | Computed payment dashboard |
| POST | `/api/v1/collaborations/:id/payments` | Record a bounded payment |
| DELETE | `/api/v1/payments/:id` | Remove and reconcile a payment |
| GET/POST | `/api/v1/invoices` | List and create invoice snapshots |
| GET | `/api/v1/invoices/:id` | Invoice data |
| GET | `/api/v1/invoices/:id/pdf` | Download private PDF |

Administrator routes require a verified `admin: true` Firebase custom claim.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/admin/me` | Confirm administrator access |
| GET | `/api/v1/admin/overview` | Platform and financial metrics |
| GET | `/api/v1/admin/users` | Search and paginate creators |
| GET/PATCH/DELETE | `/api/v1/admin/users/:uid` | Inspect, update, or permanently remove a creator |
| POST | `/api/v1/admin/users/:uid/suspend` | Disable creator access and revoke sessions |
| POST | `/api/v1/admin/users/:uid/reactivate` | Restore creator access |
| GET | `/api/v1/admin/users/:uid/collaborations` | Creator collaboration records |
| GET/POST | `/api/v1/admin/users/:uid/payments` | Creator payment records and corrections |
| GET | `/api/v1/admin/users/:uid/invoices` | Creator invoice records |
| GET/PATCH/DELETE | `/api/v1/admin/collaborations/:id` | Manage a collaboration |
| PATCH/DELETE | `/api/v1/admin/deliverables/:id` | Manage a deliverable |
| PATCH/DELETE | `/api/v1/admin/payments/:id` | Correct or remove a payment |
| POST | `/api/v1/admin/invoices/:id/void-and-recreate` | Void an invoice and create a numbered replacement |
| GET | `/api/v1/admin/audit-logs` | Review administrator actions |

## Deployment

### Backend on Render

1. Push this repository to GitHub and create a Render Blueprint from `render.yaml`. For a manual Web Service, keep the repository root as the working directory, use `npm ci` to build, and `npm start -w backend` to start.
2. Set every private variable from `backend/.env.example` in Render. Do not expose Admin or MongoDB secrets to Netlify.
3. Set `FRONTEND_URL` to the exact Netlify production origin. Render provides `PORT`; the server reads it and binds to `0.0.0.0`.
4. Verify `https://<render-host>/api/v1/health`.

### Frontend on Netlify

1. Import the same repository. The root `netlify.toml` builds the frontend workspace, publishes the root `dist` directory, and includes the SPA fallback.
2. Add every `VITE_*` value from `frontend/.env.example`; set `VITE_API_BASE_URL=https://<render-host>/api/v1`.
3. Deploy, then add the Netlify hostname to Firebase Authorized domains and to Render's `FRONTEND_URL`.

### Google Analytics 4

1. In Google Analytics, create or open the CollabDock GA4 property and add a Web data stream for the production Netlify domain.
2. Copy its Measurement ID and set `VITE_GA_MEASUREMENT_ID` in Netlify. Trigger a new deploy because Vite reads this value at build time.
3. In the stream's Enhanced measurement settings, keep page loads enabled but disable page changes based on browser history. CollabDock sends sanitized SPA page views itself to avoid duplicate events and to keep record IDs out of Analytics.
4. Verify the deployment with Google Tag Assistant and the GA4 Realtime or DebugView report.

Analytics is disabled when the measurement ID is missing or invalid. Local development traffic is disabled unless `VITE_GA_ENABLE_IN_DEV=true`. The integration does not send creator emails, Firebase UIDs, database record IDs, brand names, deal values, payment references, or invoice contents. Google Signals and advertising personalization signals are disabled.

## Product constraints

- Invoices are intentionally tax-agnostic basic invoices. CollabDock does not calculate GST or claim GST compliance.
- WhatsApp reminders open a prefilled `wa.me` page; they are never sent automatically.
- Logo/file upload, payment gateways, bank reconciliation, teams, subscriptions, and social integrations are outside this MVP.
- A standard PDF font is used for portable rendering, so PDFs label currency as `INR`; the application UI uses the `₹` symbol.
