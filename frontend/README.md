# ATM SENTINEL — Malawi-Focused ATM Monitoring Prototype

**Frontend monitoring dashboard (prototype)** · Student: **Desire Chimtsitsi**

> Intelligent Detection. Safer Transactions.

ATM SENTINEL is a Malawi-focused monitoring prototype. It displays synthetic
Malawi ATM transactions with separately generated Isolation Forest results; it
is not connected to a Malawian bank or national ATM network.

---

## Current status

The frontend reads precomputed Isolation Forest results from
`public/data/malawi_anomaly_results.csv`, generated from
`../dataset/atm_transactions_malawi_synthetic.csv`. The selected source has
50,000 individual synthetic transaction records across 100 generated ATM
identifiers and 2,500 injected ground-truth labels for demonstration only.
Those labels are not evidence of actual fraud and are never model inputs.
`dataset/atm_transactions.csv` is not present in this checkout;
`public/data/anomaly_results.csv` is a separate legacy dataset with a different
schema and is not used by the Malawi model. No record represents real banking
activity or a verified ATM installation.
Supabase Authentication and profile-backed route access remain implemented;
live Supabase connectivity is reported only when verified at runtime in
Settings. The Malawi CSV is a static public asset; frontend route protection
does not make that file private.

The Network page groups the synthetic transactions by their generated ATM IDs
and plots their simulated Malawi town locations and coordinates. These
locations are not verified ATM installations. Map tiles
require internet access and are subject to the OpenStreetMap tile usage policy;
the map displays attribution and has an offline/error fallback with the city
coordinates. The app uses `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
without an API key; the public tile service has no availability guarantee.
Keep the on-map attribution visible and follow the
[OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/).
For production or sustained high-volume use, select a tile provider with an
appropriate service agreement. No live bank integration or verified Malawi ATM
location source is configured.

City-center reference coordinates are drawn from the coordinates reported on the linked
Wikimedia/Wikipedia city pages in `src/config/geography.js`; these are city
centers, not ATM coordinates.

The selected synthetic dataset labels transaction amount and balance values as
simulated MWK. They do not represent real banking activity. Its generated
timestamps cover 1 January through 31 December 2025; other legacy datasets in
the repository are not used by the Malawi model pipeline.

---

## 1. Technology stack

| Layer | Technology |
| --- | --- |
| UI library | React 19 (JavaScript / JSX — **no TypeScript**) |
| Build tool | Vite 8 |
| Styling | Tailwind CSS 4 (`@tailwindcss/vite`, `@theme` design tokens) |
| Routing | React Router 7 |
| Charts | Recharts 3 |
| Icons | Lucide React |
| Lint | Oxlint |
| Authentication and profiles | Supabase Auth + `public.profiles` (requires project setup below) |

No new frontend runtime dependencies were added. The Python model uses
NumPy, pandas and scikit-learn, which are already listed in the root
`requirements.txt`.

---

## 2. Current frontend features

- **Application shell** — persistent sidebar, sticky header, mobile drawer navigation, footer, 404 fallback.
- **Dashboard** (`/dashboard`) — KPI cards, transaction activity chart, anomaly distribution donut, anomaly trend with window average, risk breakdown, recent anomaly alerts.
- **Transaction explorer** (`/transactions`) — synthetic transaction search, filters (ATM, simulated Malawi location, type, risk, status, period, anomalies only), sorting, pagination, responsive table with MWK amounts, transaction detail drawer.
- **Anomalies** (`/anomalies`) — model-flagged transaction summaries, anomaly trend, risk distribution, ATM/location filters and paginated anomaly table. Model predictions remain distinct from injected labels.
- **Anomaly investigation** (`/anomalies/:id`) — transaction facts, MWK amount and balance, model score, separate ground-truth label, simulated ATM context and related anomalies.
- **Analytics** (`/analytics`) — transaction-volume and anomaly-rate trends, MWK amount distribution, transaction-hour and anomaly-score distributions, anomalies by ATM/location and normal-vs-flagged comparisons.
- **ATM network** (`/atm-network`) — Leaflet/OpenStreetMap map and risk summaries for simulated Malawi ATM locations; no verified Malawi ATM locations.
- **ML model** (`/ml-model`) — precomputed Isolation Forest predictions, anomaly scores and behavioral input descriptions; the browser does not train or evaluate models.
- **Reports** (`/reports`) — browser-generated Malawi synthetic-data CSV reports with separate model and injected ground-truth fields and an anomaly-not-fraud caveat; no PDF export.
- **Settings** (`/settings`) — compact mode, auto refresh, alert visibility, data-source and Supabase status, system information, About.
- **Global search** in the header (transactions, anomaly IDs, ATM IDs) with deep links such as `/transactions?txn=TXN-000123` and `/atm-network?atm=ATM-004`.
- **UX states** — loading skeletons, refreshing indicator, empty states, error states with retry, 404 page.
- **Accessibility** — semantic landmarks, labelled controls, keyboard-operable rows/dropdowns, visible focus rings, `aria-*` where useful, status always conveyed by icon **and** text (never colour alone), `prefers-reduced-motion` respected.
- **Responsive** — tested layouts for desktop, laptop, tablet and mobile (≥320 px, no horizontal page overflow).

---

## 3. Installation and scripts

```bash
cd frontend
npm install

npm run dev      # Vite dev server (http://localhost:5173)
npm run build    # production build into dist/
npm run preview  # preview the production build
npm run lint     # Oxlint
npm test         # Focused Node.js built-in provenance and data consistency tests
```

---

## 4. Available routes

| Route | Screen |
| --- | --- |
| `/` | redirects to `/dashboard` |
| `/dashboard` | Synthetic Malawi overview (KPI cards, charts, recent alerts) |
| `/transactions` | Transaction explorer |
| `/anomalies` | Synthetic transactions flagged as anomalous |
| `/anomalies/:id` | Anomaly investigation detail |
| `/analytics` | Behavioural analytics |
| `/atm-network` | Simulated Malawi ATM map and network summary |
| `/ml-model` | Precomputed Isolation Forest results and input-feature description |
| `/reports` | Synthetic transaction reporting interface |
| `/settings` | Frontend settings |
| `/404`, `*` | Not-found fallback |

---

## 5. Project structure

```
frontend/
├── public/data/malawi_anomaly_results.csv
├── src/
│   ├── auth/                # Supabase session, profile roles and route gates
│   ├── components/         # dashboard, analytics, anomaly, ATM and common UI
│   ├── context/            # display preferences
│   ├── hooks/              # service queries, pagination and UI helpers
│   ├── pages/              # Login, protected views, access denied and NotFound
│   ├── services/           # CSV adapter/services and Supabase client
│   ├── utils/              # formatting, filters, aggregation and navigation
│   ├── App.jsx             # authenticated route table
│   ├── index.css           # Tailwind entry + design tokens (@theme)
│   └── main.jsx            # React entry (BrowserRouter)
├── .env.example
├── index.html
└── vite.config.js
```

---

## 6. CSV data architecture

The frontend reads `/data/malawi_anomaly_results.csv` through
`src/services/mlDataAdapter.js` and the service layer. Each row is one
synthetic transaction in MWK; the adapter maps the transaction fields and
model outputs while retaining injected ground truth separately. The model
feature pipeline excludes transaction/account identifiers and all injected
labels. Dashboard pages use the shared services; Supabase Authentication does
not replace or fabricate the dataset. The CSV is located under `public/`, so it
is publicly downloadable and must not contain data requiring access control.

## 6.1. Regenerating Isolation Forest results

The model is a local Python preprocessing step, not a frontend service. From
the project root, use the existing virtual environment (or an equivalent
Python 3.12 environment) and install the three required packages if they are
not already available:

```powershell
.\.venv\Scripts\python.exe -m pip install numpy pandas scikit-learn
.\.venv\Scripts\python.exe -m unittest ml.test_generate_malawi_model_results
.\.venv\Scripts\python.exe ml\generate_malawi_model_results.py
```

The script reads the synthetic source CSV and overwrites
`frontend/public/data/malawi_anomaly_results.csv`. It excludes rows missing
valid model inputs and reports how many were excluded. After regeneration,
start the frontend from `frontend` with `npm run dev`; the browser loads the
generated CSV and does not retrain the model automatically.

Isolation Forest learns without fraud labels by isolating observations that
differ from the overall feature patterns. The model uses log-transformed
transaction amount and balance, cyclic hour and weekday values, the
weekend indicator, and one-hot transaction type and status. Identifiers and
injected synthetic labels are excluded. With the current data, the model uses
15 engineered columns and a fixed random seed. Its anomaly score is a decision
score (higher means more unusual), not a fraud probability. The optional
MWK 100,000 withdrawal rule is calculated separately and does not determine
the model prediction.

Risk tiers are also score-derived: the generator calculates score quantiles
over all eligible transactions, assigning Low at or above the 90th percentile,
Medium at or above the 95th percentile, and High at or above the 99th
percentile (the higher tier takes precedence). With the current 5% Isolation
Forest contamination setting, the 2,500 flagged rows fall into Medium and
High; no flagged rows fall into Low. These percentile bands are a simple
demonstration review-priority convention, not calibrated risk or fraud
probabilities. A more defensible operational tiering rule would set cutoffs
from a documented training/reference population and validate them on independent
labeled data before using them for decisions. This project has no such
independent validation, so the existing bands remain unchanged.

The source is generated synthetic data, not real Malawi bank activity. The
injected labels were designed for demonstration and are not independent
ground-truth validation; this project does not claim model accuracy, precision,
recall, or fraud-detection effectiveness.

---

## 7. Supabase Authentication setup

The frontend accepts only the project URL and a publishable/anon key. Never put
a `service_role` or `sb_secret_` key in frontend environment variables.

1. Create a Supabase project and copy its project URL and publishable key.
2. Copy `frontend/.env.example` to `frontend/.env.local`; set
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. `.env.local` is ignored
   by Git. Restart the Vite server after changing it.
3. In Supabase Dashboard → SQL Editor, run
   `supabase/migrations/20261012000000_create_profiles_and_role_rls.sql`.
4. In Authentication settings, disable public sign-ups. Create/invite accounts
   through the approved administrator onboarding flow.
5. For every invited Auth user, use the Auth user's UUID to create a profile in
   the SQL Editor. Replace the example values with the actual UUID and approved
   role:

   ```sql
   insert into public.profiles (id, full_name, role)
   values ('AUTH_USER_UUID', 'Approved user name', 'bank_security_officer');
   ```

   Allowed roles are `system_administrator`, `bank_security_officer`, and
   `atm_operations_manager`. Role changes are performed by an administrator
   through a trusted database operation, not by the frontend user.
6. Verify RLS is enabled and test profile reads/updates with separate test users
   before using this for operational access. The migration protects the profile
   table; it does **not** protect the static CSV or other client-delivered assets.

The route visibility matrix is intentionally explicit: System Administrators
can access all pages; Bank Security Officers can access Dashboard, ATM
Observations, Anomalies, Analytics, Reports, and Settings; ATM Operations
Managers can access Dashboard, ATM Observations, ATM Network, and Settings.
This frontend matrix is a user-interface gate, not a substitute for RLS on
database-backed operational data.

### Environment example

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

`VITE_SUPABASE_ANON_KEY` is also accepted for projects using the legacy anon-key
name. Both values are browser-visible public configuration, not secrets.

---

## 8. Security and current limitations

- Live Supabase authentication requires project configuration and an applied,
  verified migration. Missing profiles, unrecognized roles, and profile service
  errors deny access.
- Authenticated route protection and role-aware navigation are client-side UX
  controls. Authorization is not secure until policies are also configured on
  every protected data source and tested with representative accounts.
- The current CSV is served from `public/data` and can be fetched without
  signing in. Supabase RLS cannot protect a static file; move sensitive data
  behind a server or RLS-protected database/API before production use.
- The browser consumes precomputed CSV outputs. Training/evaluation metadata is
  not verified by this frontend; anomalies are unusual patterns, not confirmed
  fraud.
- No verified Malawi ATM locations, Malawi observation dataset, or live bank
  connection is configured. City locations are illustrative city-center points.
- The Malawi basemap depends on external OpenStreetMap tile availability and
  network access. OSM tile requests must follow the published usage policy;
  there is no offline basemap bundle or guaranteed tile service.
- Source currency/units are undocumented. Do not interpret source balance or
  income/outcome values as MWK without authoritative documentation.
- Charts are client-rendered and the bundle is a single chunk; route-level
  code-splitting is a possible future optimisation.
- `npm test` runs focused tests for source provenance, city points, units, date
  handling, report totals against the supplied CSV, and exact research metrics.

---

## 9. Next implementation steps

1. Obtain a documented, authorized real transaction dataset before making claims about real-world performance.
2. Validate model behavior against independently verified labels before proposing operational use.
3. Review the current engineered features and risk bands with domain experts.
4. Migrate any data requiring confidentiality from the public CSV to a backend
   with verified Row Level Security before production deployment.

---

## 10. Academic honesty statement

This build asserts nothing it cannot support. It shows no accuracy, precision, recall,
F1 or false-positive rate, and uses the academically correct vocabulary of
**unsupervised anomaly detection**: "flagged as anomalous", "anomaly score",
"behavioural deviation" — never "confirmed fraud". Authentication and database
authorization are not considered production-ready until the project setup and
RLS policies are verified.
