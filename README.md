# MedSphere Connect (v4.0 Enterprise)

> **Patient Portal + Hospital Portal, Consent-First Medical Records with AI Clinical Intelligence**  
> Built strictly adhering to Master Prompt v4: Hospital-anchored verified organization entry, universal patient dashboard, patient code identifier sovereignty, immutable provenance tracking, and source-grounded advisory clinical AI.

---

## 1. Core Architectural Principles

1. **Organization-Anchored Clinician Gateway**: Doctors, lab staff, and registrars never register publicly. They are authenticated staff profiles belonging to a verified healthcare organization holding a state clinical establishment license.
2. **Universal Patient Dashboard**: Identical, accessible interface for every patient. Hospital-origin reports are uploaded directly by hospital staff into the patient's record under the hospital's authority. Walk-in patients registered by front-desk registrars receive the same standard dashboard.
3. **Identifier ≠ Credential**: A patient code (e.g. `MSC-P-7F29A1`) is an identifier, never a credential. Record access requires a verified hospital, active staff member, active care encounter, and unexpired patient consent.
4. **Immutable Provenance**: Every record carries an unalterable origin signature: `hospital_generated`, `lab_generated`, `patient_unverified`, or `hospital_scanned_on_behalf`. Originals are never overwritten.
5. **Advisory, Source-Grounded AI**: Clinical intelligence services cite exact document names, page numbers, and section boundaries. The system explicitly refuses to guess if data is absent and automatically triggers emergency triage warnings for acute symptoms.

---

## 2. Tech Stack

- **Framework**: Next.js 15 (App Router with Server Actions & Suspense boundaries), React 19, TypeScript
- **Styling**: Tailwind CSS with custom MedSphere healthcare tokens (calm teal, soft cyan, alert amber/rose)
- **Database & Storage**: PostgreSQL schema with Row-Level Security (RLS), `pgvector` extension for semantic search, SHA-256 document hashing, and fallback state engine
- **Testing**: Vitest with unit test coverage for consent rules, patient code generation, role boundaries, and copilot contraindication screening
- **Clinical AI Services**: Source-grounded RAG retrieval, structured report summarizer, and clinician advisory copilot

---

## 3. Project Structure

```plaintext
medsphere-connect/
├── supabase/
│   ├── seed.sql                               # Realistic seed database
│   └── migrations/
│       └── 20261102_000001_medsphere_core.sql # PostgreSQL schema with RLS & pgvector
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── signin/page.tsx                # Unified single sign-in + staff MFA
│   │   │   ├── register/patient/page.tsx      # Patient registration + OTP + code generator
│   │   │   └── register/hospital/page.tsx     # Hospital registration + statutory documents
│   │   ├── (patient)/patient/
│   │   │   ├── layout.tsx                     # Header, slide-out drawer, Profile & QR card modal
│   │   │   ├── dashboard/page.tsx             # Universal dashboard, search, doctors, emergency 108/112
│   │   │   ├── history/page.tsx               # Longitudinal timeline (newest first) + provenance
│   │   │   ├── ai-chat/page.tsx               # Advisory AI assistant + urgent symptom escalation
│   │   │   ├── rag-documents/page.tsx         # Natural-language document query citing page & snippet
│   │   │   ├── report-summary/page.tsx        # Structured summary preserving abnormal values
│   │   │   ├── appointments/page.tsx          # Appointments scheduling & cancellation
│   │   │   ├── diagnostics/page.tsx           # Diagnostic center finder with verified tariffs
│   │   │   ├── consent/page.tsx               # Access & consent governance + audit log
│   │   │   └── uploads/page.tsx               # Patient self-uploads (labeled unverified)
│   │   ├── (hospital)/hospital/
│   │   │   ├── layout.tsx                     # Hospital shell with verification status badge
│   │   │   ├── doctor/page.tsx                # Doctor workspace & neutral patient code lookup
│   │   │   ├── doctor/records/[code]/page.tsx # Longitudinal viewer, AI copilot, allergy alerts, Rx
│   │   │   ├── lab/page.tsx                   # Lab order queue & published reports
│   │   │   ├── lab/upload/[orderId]/page.tsx  # Structured test parameters & pathologist sign-off
│   │   │   ├── registrar/page.tsx             # Walk-in intake, witnessed consent, demographics lookup
│   │   │   └── admin/page.tsx                 # Hospital admin operations (metadata only, zero clinical)
│   │   └── (platform-admin)/platform-admin/
│   │       └── verifications/page.tsx         # Hospital verification queue & audit decisions
│   ├── components/
│   │   └── common/
│   │       ├── ProvenanceBadge.tsx            # Visual origin indicators
│   │       ├── PatientCodeCard.tsx            # Printable card with copy feedback & QR preview
│   │       └── RoleSwitcher.tsx               # Interactive persona switcher for reviewer testing
│   ├── lib/
│   │   ├── consent/engine.ts                  # Multi-rule consent resolution engine
│   │   ├── ai/
│   │   │   ├── rag-pipeline.ts                # Grounded retrieval with page citations
│   │   │   ├── summarizer.ts                  # Structured medical summarization
│   │   │   └── copilot.ts                     # Clinician advisory copilot & allergy checks
│   │   ├── db/
│   │   │   ├── store.ts                       # Persistent state engine with localStorage sync
│   │   │   └── seed-data.ts                   # Realistic verified hospitals, staff & documents
│   │   └── utils/code-generator.ts            # Non-sequential patient code generator & SVG QR
│   └── types/index.ts                         # Complete domain types and interfaces
└── tests/
    └── unit/core-rules.test.ts                # 10 Vitest architectural rule tests
```

---

## 4. Setup and Quick Start

### 4.1 Prerequisites
- Node.js >= 18 (Tested on Node v24.16.0)
- npm >= 9

### 4.2 Installation
```bash
# Clone or navigate to the project directory
cd "medsphere-connect"

# Install dependencies
npm install
```

### 4.3 Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

| Variable | Description | Default / Fallback |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Application base URL | `http://localhost:3000` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Connected if provided; otherwise in-memory storage |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase API key | Optional for local mode |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase secret | Server-side only; never exposed to browser |
| `AI_PROVIDER` | LLM & Embedding provider | `mock_embedded`, `gemini`, `openai` |
| `AI_API_KEY` | Provider API key | Server-side only |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox token for clinic map | Optional; fallback to Google Maps directions link |
| `SMS_PROVIDER` | SMS OTP Dispatch provider | `twilio`, `mock_sandbox` |

### 4.4 Running Locally
```bash
# Run local development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4.5 Production Build Validation
```bash
# Run full Next.js production build and type-checking
npm run build
```

### 4.6 Running Automated Test Suite
```bash
# Execute all architectural and consent rule tests
npm test
```

---

## 5. Reviewer Demo Personas & Test Credentials

Use the floating **"Switch Persona"** button at the bottom-right of any page to seamlessly test each role:

1. **Patient**: Priya Sharma (`patient@medsphere.io` / `MSC-P-7F29A1`)
   - Longitudinal medical history with echocardiogram, CMP lab test, and external lipid report
   - Active consent link with Max Super-Specialty Hospital Saket
   - Documented critical allergies: Penicillin and NSAIDs
2. **Doctor**: Dr. Aisha Sen (`doctor@maxsaket.medsphere.io`)
   - Cardiologist at Max Super-Specialty Hospital Saket (Verified)
   - Patient search with neutral enumeration protection
   - Clinical copilot screening prescriptions against Penicillin/NSAID allergies
3. **Lab Staff**: Praveen Kumar (`lab@maxsaket.medsphere.io`)
   - Diagnostic test queue, structured biochemical parameter entry, and pathologist sign-off
4. **Registrar**: Priya Nair (`registrar@maxsaket.medsphere.io`)
   - Walk-in patient registration, witnessed consent capture, printable patient card, and demographics-only lookup
5. **Hospital Admin**: Dr. Harish K. Grover (`admin@maxsaket.medsphere.io`)
   - Hospital credential overview, staff profile invitation and instant deactivation
   - Zero access to patient clinical records
6. **Platform Admin**: MedSphere Central Governance (`platform@medsphere.io`)
   - Hospital verification queue: approve, reject, or suspend establishments with audit-logged reasons

---

## 6. External Integrations & Fallbacks

- **Maps & Navigation**: Hospital cards generate direct external navigation links (`https://maps.google.com/?q=...`) with optional Mapbox integration via `NEXT_PUBLIC_MAPBOX_TOKEN`.
- **OTP Verification**: Patient and hospital registration includes simulated verification tokens (`724915`, `891240`) ready for live SMS provider hooks via Twilio or MSG91.
- **Statutory Registry Verification**: Hospital registration status is flagged "Requires External Registry Integration" in the platform admin review queue for state medical establishment API sync.
# MediSphereAG
