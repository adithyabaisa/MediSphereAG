-- ====================================================================
-- MedSphere Connect: Production PostgreSQL Schema with RLS and pgvector
-- Version: 4.0.0
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('patient', 'hospital_admin', 'doctor', 'lab_staff', 'registrar', 'platform_admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE hospital_status AS ENUM ('submitted', 'under_review', 'verified', 'rejected', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE staff_status AS ENUM ('active', 'invited', 'deactivated');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE consent_status AS ENUM ('active', 'expired', 'revoked');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE consent_scope AS ENUM ('all_records', 'consultations_only', 'diagnostics_only', 'emergency_only');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE consent_method AS ENUM ('digital_app', 'recorded_otp', 'witnessed_signature');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE provenance_type AS ENUM (
    'hospital_generated',
    'lab_generated',
    'patient_unverified',
    'hospital_scanned_on_behalf',
    'ai_generated_summary'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE doc_status AS ENUM ('draft', 'finalized', 'superseded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. CORE PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  full_name TEXT NOT NULL,
  role user_role NOT NULL,
  avatar_url TEXT,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PATIENTS
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  patient_code VARCHAR(20) UNIQUE NOT NULL,
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. HOSPITALS
CREATE TABLE IF NOT EXISTS hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name TEXT NOT NULL,
  hospital_type VARCHAR(50) NOT NULL,
  registration_number TEXT UNIQUE NOT NULL,
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
  verified_by UUID REFERENCES profiles(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(hospital_id, name)
);

-- 7. HOSPITAL STAFF PROFILES
CREATE TABLE IF NOT EXISTS hospital_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  department_id UUID REFERENCES departments(id),
  professional_reg_no TEXT,
  qualifications TEXT,
  specialization TEXT,
  experience_years INT DEFAULT 0,
  consultation_fee NUMERIC(10, 2) DEFAULT 0,
  status staff_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. PATIENT CONSENTS
CREATE TABLE IF NOT EXISTS patient_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  scope consent_scope NOT NULL DEFAULT 'all_records',
  status consent_status NOT NULL DEFAULT 'active',
  method consent_method NOT NULL DEFAULT 'digital_app',
  otp_evidence_hash TEXT,
  witness_staff_id UUID REFERENCES hospital_staff(id),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. CLINICAL ENCOUNTERS
CREATE TABLE IF NOT EXISTS encounters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  hospital_id UUID NOT NULL REFERENCES hospitals(id),
  staff_id UUID NOT NULL REFERENCES hospital_staff(id),
  encounter_type VARCHAR(50) NOT NULL,
  chief_complaint TEXT,
  clinical_notes TEXT,
  diagnosis TEXT[] DEFAULT '{}',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- 10. MEDICAL DOCUMENTS (PROVENANCE-ANCHORED)
CREATE TABLE IF NOT EXISTS medical_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  hospital_id UUID REFERENCES hospitals(id),
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  encounter_id UUID REFERENCES encounters(id),
  document_type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_hash VARCHAR(64) NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  provenance provenance_type NOT NULL,
  status doc_status NOT NULL DEFAULT 'finalized',
  version INT NOT NULL DEFAULT 1,
  parent_doc_id UUID REFERENCES medical_documents(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. LAB ORDERS & STRUCTURED RESULTS
CREATE TABLE IF NOT EXISTS lab_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  hospital_id UUID NOT NULL REFERENCES hospitals(id),
  doctor_staff_id UUID NOT NULL REFERENCES hospital_staff(id),
  test_name TEXT NOT NULL,
  clinical_indication TEXT,
  priority VARCHAR(20) DEFAULT 'routine',
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
  document_id UUID REFERENCES medical_documents(id),
  technician_id UUID NOT NULL REFERENCES hospital_staff(id),
  pathologist_signoff_id UUID REFERENCES hospital_staff(id),
  test_parameter TEXT NOT NULL,
  measured_value TEXT NOT NULL,
  unit TEXT,
  reference_range TEXT,
  is_abnormal BOOLEAN DEFAULT FALSE,
  critical_flag BOOLEAN DEFAULT FALSE,
  signed_off_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. DOCUMENT CHUNKS FOR VECTOR RAG
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES medical_documents(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id),
  page_number INT NOT NULL,
  chunk_index INT NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. AUDIT & ACCESS LOGS
CREATE TABLE IF NOT EXISTS document_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  document_id UUID REFERENCES medical_documents(id),
  staff_id UUID NOT NULL REFERENCES hospital_staff(id),
  hospital_id UUID NOT NULL REFERENCES hospitals(id),
  action_type VARCHAR(50) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_profile_id UUID REFERENCES profiles(id),
  hospital_id UUID REFERENCES hospitals(id),
  event_category VARCHAR(50) NOT NULL,
  event_name TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Patients can read and update their own profile
CREATE POLICY "Patients view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Patients can view their own medical documents
CREATE POLICY "Patients view own documents" ON medical_documents
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
  );

-- Staff can view documents ONLY if hospital is verified, staff is active, and patient has active consent
CREATE POLICY "Staff consent-gated document access" ON medical_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM hospital_staff hs
      JOIN hospitals h ON h.id = hs.hospital_id
      JOIN patient_consents pc ON pc.hospital_id = h.id
      JOIN profiles p ON p.id = hs.profile_id
      WHERE p.user_id = auth.uid()
        AND hs.status = 'active'
        AND h.status = 'verified'
        AND pc.patient_id = medical_documents.patient_id
        AND pc.status = 'active'
        AND pc.expires_at > NOW()
    )
  );

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_patients_code ON patients(patient_code);
CREATE INDEX IF NOT EXISTS idx_consents_patient_hospital ON patient_consents(patient_id, hospital_id, status);
CREATE INDEX IF NOT EXISTS idx_med_docs_patient_date ON medical_documents(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_staff_hospital ON hospital_staff(hospital_id, role, status);
