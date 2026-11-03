-- ====================================================================
-- MedSphere Connect: Production PostgreSQL Database Schema (v4.0)
-- Target: Supabase PostgreSQL with RLS, pgvector, and Role-Based Logins
-- Modules: Patient Portal, Hospital Doctor, Lab Staff, Registrar Front-Desk,
--          Hospital Admin, and Platform Admin Governance Dashboards
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. ENUM TYPES
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'patient',
    'hospital_admin',
    'doctor',
    'lab_staff',
    'registrar',
    'platform_admin'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE hospital_status AS ENUM (
    'submitted',
    'under_review',
    'verified',
    'rejected',
    'suspended'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE staff_status AS ENUM (
    'active',
    'invited',
    'deactivated'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE consent_status AS ENUM (
    'active',
    'expired',
    'revoked'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE consent_scope AS ENUM (
    'all_records',
    'consultations_only',
    'diagnostics_only',
    'emergency_only'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE consent_method AS ENUM (
    'digital_app',
    'recorded_otp',
    'witnessed_signature'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE provenance_type AS ENUM (
    'hospital_generated',
    'lab_generated',
    'patient_unverified',
    'hospital_scanned_on_behalf',
    'ai_generated_summary'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE document_type AS ENUM (
    'prescription',
    'lab_report',
    'discharge_summary',
    'radiology',
    'consultation_note',
    'external_report'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE doc_status AS ENUM (
    'draft',
    'finalized',
    'superseded'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM (
    'upcoming',
    'in_progress',
    'completed',
    'cancelled',
    'no_show'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE order_priority AS ENUM (
    'routine',
    'urgent',
    'stat'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'pending',
    'sample_collected',
    'in_progress',
    'finalized',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE access_action_type AS ENUM (
    'view',
    'download',
    'ai_summary',
    'copilot_rag',
    'consultation_access'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE audit_category AS ENUM (
    'auth',
    'verification',
    'consent',
    'staff_management',
    'document',
    'clinical_access',
    'prescription'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- MODULE 1: AUTHENTICATION & CORE USER PROFILES
-- Shared by all 6 logins to anchor auth.users identity
-- ====================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  full_name TEXT NOT NULL,
  role user_role NOT NULL,
  avatar_url TEXT,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ====================================================================
-- MODULE 2: HOSPITALS & HEALTHCARE ESTABLISHMENTS
-- Used by: Hospital Admin, Platform Admin, Clinician Affiliations
-- ====================================================================
CREATE TABLE IF NOT EXISTS hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name TEXT NOT NULL,
  hospital_type VARCHAR(50) NOT NULL,
  registration_number TEXT UNIQUE NOT NULL, -- State Clinical Establishment License
  tax_id VARCHAR(50),
  official_email TEXT UNIQUE NOT NULL,
  official_phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  status hospital_status NOT NULL DEFAULT 'submitted',
  accreditation TEXT[] DEFAULT '{}',
  signatory_name TEXT NOT NULL,
  signatory_designation TEXT NOT NULL,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_hospitals_updated_at
  BEFORE UPDATE ON hospitals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Platform Admin Verification Audit Log
CREATE TABLE IF NOT EXISTS hospital_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  reviewer_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  previous_status hospital_status NOT NULL,
  new_status hospital_status NOT NULL,
  decision_notes TEXT,
  statutory_license_verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Hospital Clinical & Operational Departments
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(hospital_id, name)
);

-- ====================================================================
-- MODULE 3: HOSPITAL STAFF DIRECTORY & CREDENTIALS
-- Used by: Doctor, Lab Staff, Registrar, Hospital Admin
-- ====================================================================
CREATE TABLE IF NOT EXISTS hospital_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  professional_reg_no TEXT, -- Medical/Lab Council Reg Number
  qualifications TEXT,
  specialization TEXT,
  experience_years INT DEFAULT 0,
  consultation_fee NUMERIC(10, 2) DEFAULT 0,
  status staff_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(hospital_id, profile_id)
);

CREATE TRIGGER trg_hospital_staff_updated_at
  BEFORE UPDATE ON hospital_staff
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ====================================================================
-- MODULE 4: PATIENTS (SOVEREIGN MEDICAL IDENTIFIER & DEMOGRAPHICS)
-- Used by: Patient Dashboard, Registrar Intake, Doctor Lookup
-- ====================================================================
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  patient_code VARCHAR(20) UNIQUE NOT NULL, -- Non-sequential code e.g. MSC-P-7F29A1
  dob DATE NOT NULL,
  gender VARCHAR(20),
  blood_group VARCHAR(10),
  allergies TEXT[] DEFAULT '{}',
  chronic_conditions TEXT[] DEFAULT '{}',
  address_line TEXT,
  city TEXT,
  locality TEXT,
  pincode VARCHAR(10),
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ====================================================================
-- MODULE 5: CONSENT GOVERNANCE & ACCESS CONTROL
-- Used by: Patient Consent Dashboard, Registrar Witnessing, Doctor Gateway
-- ====================================================================
CREATE TABLE IF NOT EXISTS patient_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  scope consent_scope NOT NULL DEFAULT 'all_records',
  status consent_status NOT NULL DEFAULT 'active',
  method consent_method NOT NULL DEFAULT 'digital_app',
  otp_evidence_hash TEXT,
  witness_staff_id UUID REFERENCES hospital_staff(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_patient_consents_updated_at
  BEFORE UPDATE ON patient_consents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ====================================================================
-- MODULE 6: DIAGNOSTIC CATALOG & TARIFFS
-- Used by: Patient Diagnostics Finder, Doctor Lab Orders, Lab Operations
-- ====================================================================
CREATE TABLE IF NOT EXISTS diagnostic_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  code VARCHAR(50) NOT NULL,
  name TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  sample_required VARCHAR(100),
  turnaround_hours INT DEFAULT 24,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(hospital_id, code)
);

-- ====================================================================
-- MODULE 7: APPOINTMENTS & OPD CONSULTATION SCHEDULING
-- Used by: Patient Appointments, Registrar Check-in, Doctor Schedule
-- ====================================================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  doctor_staff_id UUID NOT NULL REFERENCES hospital_staff(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  appointment_time VARCHAR(20) NOT NULL, -- e.g. "10:30 AM"
  status appointment_status NOT NULL DEFAULT 'upcoming',
  chief_complaint TEXT,
  consultation_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  booked_by_role user_role DEFAULT 'patient',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ====================================================================
-- MODULE 8: CLINICAL ENCOUNTERS & PROGRESS NOTES
-- Used by: Doctor Workspace & Longitudinal Clinical Viewer
-- ====================================================================
CREATE TABLE IF NOT EXISTS encounters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  doctor_staff_id UUID NOT NULL REFERENCES hospital_staff(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  encounter_type VARCHAR(50) NOT NULL DEFAULT 'opd_consultation',
  chief_complaint TEXT,
  clinical_notes TEXT,
  diagnosis TEXT[] DEFAULT '{}',
  vitals JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- MODULE 9: PRESCRIPTIONS & MEDICATION ORDERS (WITH ALLERGY SCREENING)
-- Used by: Doctor Clinical Copilot, Patient History
-- ====================================================================
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID REFERENCES encounters(id) ON DELETE SET NULL,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  doctor_staff_id UUID NOT NULL REFERENCES hospital_staff(id) ON DELETE CASCADE,
  diagnosis TEXT,
  clinical_notes TEXT,
  allergy_screen_passed BOOLEAN DEFAULT TRUE,
  allergy_warnings TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prescription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL, -- e.g. '20mg'
  frequency TEXT NOT NULL, -- e.g. 'Once daily morning'
  duration_days INT NOT NULL DEFAULT 7,
  instructions TEXT, -- e.g. 'Take after breakfast'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- MODULE 10: MEDICAL DOCUMENTS & PROVENANCE LEDGER
-- Used by: Patient Health Timeline, Self-Uploads, Doctor Longitudinal Viewer
-- ====================================================================
CREATE TABLE IF NOT EXISTS medical_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  encounter_id UUID REFERENCES encounters(id) ON DELETE SET NULL,
  document_type document_type NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_hash VARCHAR(64) NOT NULL, -- SHA-256 hash for tamper evidence
  file_size_bytes BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  provenance provenance_type NOT NULL,
  status doc_status NOT NULL DEFAULT 'finalized',
  version INT NOT NULL DEFAULT 1,
  parent_doc_id UUID REFERENCES medical_documents(id) ON DELETE SET NULL,
  clinical_summary TEXT,
  ai_analysis JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_medical_documents_updated_at
  BEFORE UPDATE ON medical_documents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ====================================================================
-- MODULE 11: LAB ORDERS & STRUCTURED RESULTS (PATHOLOGIST SIGN-OFF)
-- Used by: Lab Staff Queue, Doctor Investigation Orders, Patient History
-- ====================================================================
CREATE TABLE IF NOT EXISTS lab_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  doctor_staff_id UUID NOT NULL REFERENCES hospital_staff(id) ON DELETE CASCADE,
  encounter_id UUID REFERENCES encounters(id) ON DELETE SET NULL,
  diagnostic_test_id UUID REFERENCES diagnostic_tests(id) ON DELETE SET NULL,
  test_name TEXT NOT NULL,
  clinical_indication TEXT,
  priority order_priority NOT NULL DEFAULT 'routine',
  status order_status NOT NULL DEFAULT 'pending',
  sample_collected_at TIMESTAMPTZ,
  technician_id UUID REFERENCES hospital_staff(id) ON DELETE SET NULL,
  pathologist_signoff_id UUID REFERENCES hospital_staff(id) ON DELETE SET NULL,
  document_id UUID REFERENCES medical_documents(id) ON DELETE SET NULL,
  finalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_lab_orders_updated_at
  BEFORE UPDATE ON lab_orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS lab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
  document_id UUID REFERENCES medical_documents(id) ON DELETE SET NULL,
  technician_id UUID REFERENCES hospital_staff(id) ON DELETE SET NULL,
  pathologist_signoff_id UUID REFERENCES hospital_staff(id) ON DELETE SET NULL,
  test_parameter TEXT NOT NULL,
  measured_value TEXT NOT NULL,
  unit TEXT,
  reference_range TEXT,
  is_abnormal BOOLEAN DEFAULT FALSE,
  critical_flag BOOLEAN DEFAULT FALSE,
  signed_off_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- MODULE 12: VECTOR RAG DOCUMENT CHUNKS (GROUNDED CLINICAL CITATIONS)
-- Used by: Patient Advisory AI Assistant, Doctor Clinical Copilot
-- ====================================================================
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES medical_documents(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  page_number INT NOT NULL,
  chunk_index INT NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- MODULE 13: ACCESS AUDITING & COMPLIANCE LEDGERS
-- Used by: Patient Consent Audit Log, Hospital Admin, Platform Admin
-- ====================================================================
CREATE TABLE IF NOT EXISTS document_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  document_id UUID REFERENCES medical_documents(id) ON DELETE SET NULL,
  staff_id UUID NOT NULL REFERENCES hospital_staff(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  action_type access_action_type NOT NULL,
  ip_address INET,
  user_agent TEXT,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL,
  event_category audit_category NOT NULL,
  event_name TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- 14. HIGH PERFORMANCE INDEXES (FOREIGN KEYS & QUERY PATTERNS)
-- Following Supabase Postgres Best Practices: Always index foreign keys
-- ====================================================================

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Hospitals & Verifications
CREATE INDEX IF NOT EXISTS idx_hospitals_status ON hospitals(status);
CREATE INDEX IF NOT EXISTS idx_hospitals_reg_no ON hospitals(registration_number);
CREATE INDEX IF NOT EXISTS idx_hospitals_verified_by ON hospitals(verified_by);
CREATE INDEX IF NOT EXISTS idx_hospital_verif_hospital ON hospital_verifications(hospital_id);
CREATE INDEX IF NOT EXISTS idx_hospital_verif_reviewer ON hospital_verifications(reviewer_profile_id);

-- Departments & Staff
CREATE INDEX IF NOT EXISTS idx_departments_hospital ON departments(hospital_id);
CREATE INDEX IF NOT EXISTS idx_staff_hospital ON hospital_staff(hospital_id);
CREATE INDEX IF NOT EXISTS idx_staff_profile ON hospital_staff(profile_id);
CREATE INDEX IF NOT EXISTS idx_staff_department ON hospital_staff(department_id);
CREATE INDEX IF NOT EXISTS idx_staff_hospital_role_status ON hospital_staff(hospital_id, role, status);

-- Patients
CREATE INDEX IF NOT EXISTS idx_patients_profile ON patients(profile_id);
CREATE INDEX IF NOT EXISTS idx_patients_code ON patients(patient_code);
CREATE INDEX IF NOT EXISTS idx_patients_city ON patients(city);

-- Patient Consents
CREATE INDEX IF NOT EXISTS idx_consents_patient ON patient_consents(patient_id);
CREATE INDEX IF NOT EXISTS idx_consents_hospital ON patient_consents(hospital_id);
CREATE INDEX IF NOT EXISTS idx_consents_witness ON patient_consents(witness_staff_id);
CREATE INDEX IF NOT EXISTS idx_consents_active_lookup ON patient_consents(patient_id, hospital_id, status, expires_at);

-- Diagnostic Tests
CREATE INDEX IF NOT EXISTS idx_diag_tests_hospital ON diagnostic_tests(hospital_id);
CREATE INDEX IF NOT EXISTS idx_diag_tests_department ON diagnostic_tests(department_id);
CREATE INDEX IF NOT EXISTS idx_diag_tests_category ON diagnostic_tests(category);

-- Appointments
CREATE INDEX IF NOT EXISTS idx_appts_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appts_hospital ON appointments(hospital_id);
CREATE INDEX IF NOT EXISTS idx_appts_doctor ON appointments(doctor_staff_id);
CREATE INDEX IF NOT EXISTS idx_appts_date ON appointments(appointment_date, status);

-- Encounters
CREATE INDEX IF NOT EXISTS idx_encounters_patient ON encounters(patient_id);
CREATE INDEX IF NOT EXISTS idx_encounters_hospital ON encounters(hospital_id);
CREATE INDEX IF NOT EXISTS idx_encounters_doctor ON encounters(doctor_staff_id);
CREATE INDEX IF NOT EXISTS idx_encounters_appointment ON encounters(appointment_id);

-- Prescriptions
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_encounter ON prescriptions(encounter_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON prescriptions(doctor_staff_id);
CREATE INDEX IF NOT EXISTS idx_rx_items_prescription ON prescription_items(prescription_id);

-- Medical Documents
CREATE INDEX IF NOT EXISTS idx_med_docs_patient_date ON medical_documents(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_med_docs_hospital ON medical_documents(hospital_id);
CREATE INDEX IF NOT EXISTS idx_med_docs_uploaded_by ON medical_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_med_docs_provenance ON medical_documents(provenance);
CREATE INDEX IF NOT EXISTS idx_med_docs_encounter ON medical_documents(encounter_id);
CREATE INDEX IF NOT EXISTS idx_med_docs_parent ON medical_documents(parent_doc_id);

-- Lab Orders & Results
CREATE INDEX IF NOT EXISTS idx_lab_orders_patient ON lab_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_hospital ON lab_orders(hospital_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_doctor ON lab_orders(doctor_staff_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_test ON lab_orders(diagnostic_test_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_status ON lab_orders(status);
CREATE INDEX IF NOT EXISTS idx_lab_results_order ON lab_results(order_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_doc ON lab_results(document_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_abnormal ON lab_results(is_abnormal);

-- Vector Document Chunks
CREATE INDEX IF NOT EXISTS idx_doc_chunks_doc ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_chunks_patient ON document_chunks(patient_id);

-- Logs
CREATE INDEX IF NOT EXISTS idx_doc_access_logs_patient ON document_access_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_doc_access_logs_doc ON document_access_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_access_logs_staff ON document_access_logs(staff_id);
CREATE INDEX IF NOT EXISTS idx_doc_access_logs_hospital ON document_access_logs(hospital_id);
CREATE INDEX IF NOT EXISTS idx_doc_access_logs_date ON document_access_logs(accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_profile_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_hospital ON audit_logs(hospital_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(event_category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_date ON audit_logs(occurred_at DESC);

-- ====================================================================
-- 15. ROW-LEVEL SECURITY (RLS) POLICIES
-- Performance Rule: Wrap (select auth.uid()) in a subquery to avoid per-row execution
-- Use TO authenticated / TO anon instead of deprecated auth.role()
-- ====================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------
-- PROFILES POLICIES
-- --------------------------------------------------------------------
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Staff can view peer profiles in same hospital" ON profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hospital_staff requester
      JOIN hospital_staff target ON target.hospital_id = requester.hospital_id
      WHERE requester.profile_id IN (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid()))
        AND target.profile_id = profiles.id
    )
  );

CREATE POLICY "Platform admins view all profiles" ON profiles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = (SELECT auth.uid())
        AND p.role = 'platform_admin'
    )
  );

-- --------------------------------------------------------------------
-- HOSPITALS POLICIES
-- --------------------------------------------------------------------
CREATE POLICY "Public can view verified hospitals" ON hospitals
  FOR SELECT TO anon, authenticated
  USING (status = 'verified');

CREATE POLICY "Hospital admins can view and update their own hospital" ON hospitals
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hospital_staff hs
      JOIN profiles p ON p.id = hs.profile_id
      WHERE p.user_id = (SELECT auth.uid())
        AND hs.hospital_id = hospitals.id
        AND hs.role = 'hospital_admin'
    )
  );

CREATE POLICY "Platform admins manage all hospitals" ON hospitals
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = (SELECT auth.uid())
        AND p.role = 'platform_admin'
    )
  );

-- --------------------------------------------------------------------
-- DEPARTMENTS & DIAGNOSTIC TESTS POLICIES
-- --------------------------------------------------------------------
CREATE POLICY "Public view departments of verified hospitals" ON departments
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hospitals h WHERE h.id = departments.hospital_id AND h.status = 'verified'
    )
  );

CREATE POLICY "Public view active diagnostic tests" ON diagnostic_tests
  FOR SELECT TO anon, authenticated
  USING (is_active = TRUE);

CREATE POLICY "Hospital admins manage diagnostic tests" ON diagnostic_tests
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hospital_staff hs
      JOIN profiles p ON p.id = hs.profile_id
      WHERE p.user_id = (SELECT auth.uid())
        AND hs.hospital_id = diagnostic_tests.hospital_id
        AND hs.role = 'hospital_admin'
    )
  );

-- --------------------------------------------------------------------
-- HOSPITAL STAFF POLICIES
-- --------------------------------------------------------------------
CREATE POLICY "Public view active clinicians and staff of verified hospitals" ON hospital_staff
  FOR SELECT TO anon, authenticated
  USING (
    status = 'active' AND EXISTS (
      SELECT 1 FROM hospitals h WHERE h.id = hospital_staff.hospital_id AND h.status = 'verified'
    )
  );

CREATE POLICY "Hospital admin manages staff of own hospital" ON hospital_staff
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hospital_staff admin_hs
      JOIN profiles p ON p.id = admin_hs.profile_id
      WHERE p.user_id = (SELECT auth.uid())
        AND admin_hs.hospital_id = hospital_staff.hospital_id
        AND admin_hs.role = 'hospital_admin'
    )
  );

-- --------------------------------------------------------------------
-- PATIENTS POLICIES
-- --------------------------------------------------------------------
CREATE POLICY "Patients view and update own patient record" ON patients
  FOR ALL TO authenticated
  USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid()))
  );

CREATE POLICY "Staff view patient record with active consent" ON patients
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hospital_staff hs
      JOIN hospitals h ON h.id = hs.hospital_id
      JOIN patient_consents pc ON pc.hospital_id = h.id
      JOIN profiles p ON p.id = hs.profile_id
      WHERE p.user_id = (SELECT auth.uid())
        AND hs.status = 'active'
        AND h.status = 'verified'
        AND pc.patient_id = patients.id
        AND pc.status = 'active'
        AND pc.expires_at > NOW()
    )
  );

CREATE POLICY "Registrars create walk-in patient profiles" ON patients
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hospital_staff hs
      JOIN profiles p ON p.id = hs.profile_id
      WHERE p.user_id = (SELECT auth.uid())
        AND hs.role = 'registrar'
        AND hs.status = 'active'
    )
  );

-- --------------------------------------------------------------------
-- PATIENT CONSENTS POLICIES
-- --------------------------------------------------------------------
CREATE POLICY "Patients manage own consents" ON patient_consents
  FOR ALL TO authenticated
  USING (
    patient_id IN (SELECT id FROM patients WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())))
  );

CREATE POLICY "Active staff view consents granted to their hospital" ON patient_consents
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hospital_staff hs
      JOIN profiles p ON p.id = hs.profile_id
      WHERE p.user_id = (SELECT auth.uid())
        AND hs.hospital_id = patient_consents.hospital_id
        AND hs.status = 'active'
    )
  );

CREATE POLICY "Registrars insert witnessed consent" ON patient_consents
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hospital_staff hs
      JOIN profiles p ON p.id = hs.profile_id
      WHERE p.user_id = (SELECT auth.uid())
        AND hs.hospital_id = patient_consents.hospital_id
        AND hs.role = 'registrar'
        AND hs.status = 'active'
    )
  );

-- --------------------------------------------------------------------
-- APPOINTMENTS POLICIES
-- --------------------------------------------------------------------
CREATE POLICY "Patients view and manage own appointments" ON appointments
  FOR ALL TO authenticated
  USING (
    patient_id IN (SELECT id FROM patients WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())))
  );

CREATE POLICY "Hospital staff view and manage appointments at their hospital" ON appointments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hospital_staff hs
      JOIN profiles p ON p.id = hs.profile_id
      WHERE p.user_id = (SELECT auth.uid())
        AND hs.hospital_id = appointments.hospital_id
        AND hs.status = 'active'
    )
  );

-- --------------------------------------------------------------------
-- CLINICAL ENCOUNTERS, PRESCRIPTIONS & DOCUMENTS POLICIES
-- Gated by: verified hospital, active staff, active consent
-- --------------------------------------------------------------------
CREATE POLICY "Patients view own encounters" ON encounters
  FOR SELECT TO authenticated
  USING (
    patient_id IN (SELECT id FROM patients WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())))
  );

CREATE POLICY "Doctors manage encounters with active consent" ON encounters
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hospital_staff hs
      JOIN hospitals h ON h.id = hs.hospital_id
      JOIN patient_consents pc ON pc.hospital_id = h.id
      JOIN profiles p ON p.id = hs.profile_id
      WHERE p.user_id = (SELECT auth.uid())
        AND hs.role = 'doctor'
        AND hs.status = 'active'
        AND h.status = 'verified'
        AND pc.patient_id = encounters.patient_id
        AND pc.status = 'active'
        AND pc.expires_at > NOW()
    )
  );

CREATE POLICY "Patients view own prescriptions" ON prescriptions
  FOR SELECT TO authenticated
  USING (
    patient_id IN (SELECT id FROM patients WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())))
  );

CREATE POLICY "Doctors manage prescriptions with active consent" ON prescriptions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hospital_staff hs
      JOIN hospitals h ON h.id = hs.hospital_id
      JOIN patient_consents pc ON pc.hospital_id = h.id
      JOIN profiles p ON p.id = hs.profile_id
      WHERE p.user_id = (SELECT auth.uid())
        AND hs.role = 'doctor'
        AND hs.status = 'active'
        AND h.status = 'verified'
        AND pc.patient_id = prescriptions.patient_id
        AND pc.status = 'active'
        AND pc.expires_at > NOW()
    )
  );

CREATE POLICY "Patients and doctors view prescription items" ON prescription_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prescriptions rx
      WHERE rx.id = prescription_items.prescription_id
    )
  );

CREATE POLICY "Patients view own medical documents" ON medical_documents
  FOR SELECT TO authenticated
  USING (
    patient_id IN (SELECT id FROM patients WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())))
  );

CREATE POLICY "Patients upload self unverified documents" ON medical_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    provenance = 'patient_unverified' AND
    patient_id IN (SELECT id FROM patients WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())))
  );

CREATE POLICY "Active staff consent-gated document access" ON medical_documents
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hospital_staff hs
      JOIN hospitals h ON h.id = hs.hospital_id
      JOIN patient_consents pc ON pc.hospital_id = h.id
      JOIN profiles p ON p.id = hs.profile_id
      WHERE p.user_id = (SELECT auth.uid())
        AND hs.status = 'active'
        AND h.status = 'verified'
        AND pc.patient_id = medical_documents.patient_id
        AND pc.status = 'active'
        AND pc.expires_at > NOW()
    )
  );

CREATE POLICY "Active clinical staff upload medical documents on behalf" ON medical_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hospital_staff hs
      JOIN hospitals h ON h.id = hs.hospital_id
      JOIN patient_consents pc ON pc.hospital_id = h.id
      JOIN profiles p ON p.id = hs.profile_id
      WHERE p.user_id = (SELECT auth.uid())
        AND hs.status = 'active'
        AND h.status = 'verified'
        AND pc.patient_id = medical_documents.patient_id
        AND pc.status = 'active'
        AND pc.expires_at > NOW()
    )
  );

-- --------------------------------------------------------------------
-- LAB ORDERS & RESULTS POLICIES
-- --------------------------------------------------------------------
CREATE POLICY "Patients view own lab orders" ON lab_orders
  FOR SELECT TO authenticated
  USING (
    patient_id IN (SELECT id FROM patients WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())))
  );

CREATE POLICY "Hospital staff manage lab orders" ON lab_orders
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hospital_staff hs
      JOIN profiles p ON p.id = hs.profile_id
      WHERE p.user_id = (SELECT auth.uid())
        AND hs.hospital_id = lab_orders.hospital_id
        AND hs.status = 'active'
    )
  );

CREATE POLICY "Patients view finalized lab results" ON lab_results
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lab_orders lo
      JOIN patients pat ON pat.id = lo.patient_id
      JOIN profiles p ON p.id = pat.profile_id
      WHERE lo.id = lab_results.order_id
        AND p.user_id = (SELECT auth.uid())
        AND lo.status = 'finalized'
    )
  );

CREATE POLICY "Lab staff and doctors manage lab results" ON lab_results
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lab_orders lo
      JOIN hospital_staff hs ON hs.hospital_id = lo.hospital_id
      JOIN profiles p ON p.id = hs.profile_id
      WHERE lo.id = lab_results.order_id
        AND p.user_id = (SELECT auth.uid())
        AND hs.status = 'active'
    )
  );

-- --------------------------------------------------------------------
-- LOGS POLICIES
-- --------------------------------------------------------------------
CREATE POLICY "Patients view own document access logs" ON document_access_logs
  FOR SELECT TO authenticated
  USING (
    patient_id IN (SELECT id FROM patients WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())))
  );

CREATE POLICY "Hospital staff record document access log" ON document_access_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hospital_staff hs
      JOIN profiles p ON p.id = hs.profile_id
      WHERE p.user_id = (SELECT auth.uid())
        AND hs.id = document_access_logs.staff_id
    )
  );

CREATE POLICY "Platform admins view all audit logs" ON audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = (SELECT auth.uid())
        AND p.role = 'platform_admin'
    )
  );

-- ====================================================================
-- 16. EXPOSE TABLES TO SUPABASE DATA API (POSTGREST GRANTS)
-- ====================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated, service_role;

