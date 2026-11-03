-- ====================================================================
-- MedSphere Connect: High-Fidelity Seed Data (v4.0)
-- Covers: All 6 Logins and Dashboards (Patient, Doctor, Lab, Registrar, Admin, Platform)
-- ====================================================================

-- 1. HOSPITALS
INSERT INTO hospitals (id, legal_name, hospital_type, registration_number, tax_id, official_email, official_phone, address, city, state, pincode, latitude, longitude, status, accreditation, signatory_name, signatory_designation, verified_at)
VALUES
(
  '11111111-1111-4111-8111-111111111111',
  'Max Super-Specialty Hospital Saket',
  'Super-Specialty',
  'DL-HOSP-2018-0914',
  'AAACM1094E',
  'admin@maxsaket.medsphere.io',
  '+91 11 2651 5050',
  '1, 2, Press Enclave Marg, Saket',
  'New Delhi',
  'Delhi',
  '110017',
  28.5273,
  77.2167,
  'verified',
  ARRAY['NABH', 'NABL', 'JCI'],
  'Dr. Harish K. Grover',
  'Medical Director',
  NOW() - INTERVAL '120 days'
),
(
  '22222222-2222-4222-8222-222222222222',
  'Apollo Multi-Specialty Hospital',
  'Tertiary Care',
  'DL-HOSP-2019-1422',
  'AAACA8842K',
  'contact@apollo-delhi.medsphere.io',
  '+91 11 2692 5858',
  'Delhi Mathura Road, Sarita Vihar',
  'New Delhi',
  'Delhi',
  '110076',
  28.5355,
  77.2910,
  'verified',
  ARRAY['NABH', 'NABL'],
  'Dr. Preetha Reddy',
  'Executive Vice Chairperson',
  NOW() - INTERVAL '90 days'
),
(
  '33333333-3333-4333-8333-333333333333',
  'Sunrise Community Clinic & Diagnostics',
  'Clinic',
  'DL-HOSP-2024-9912',
  'AAACS5512B',
  'admin@sunriseclinic.medsphere.io',
  '+91 11 4100 2233',
  'Block B, Hauz Khas Enclave',
  'New Delhi',
  'Delhi',
  '110016',
  28.5494,
  77.2001,
  'submitted',
  ARRAY['NABH (Applied)'],
  'Dr. Naveen Bansal',
  'Chief Managing Partner',
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- 2. DEPARTMENTS
INSERT INTO departments (id, hospital_id, name, description) VALUES
('d0000000-0000-0000-0000-000000000001', 'h0000000-0000-0000-0000-000000000001', 'Cardiology', 'Interventional & non-invasive adult cardiology'),
('d0000000-0000-0000-0000-000000000002', 'h0000000-0000-0000-0000-000000000001', 'Pathology & Diagnostics', 'Comprehensive laboratory medicine & clinical biochemistry'),
('d0000000-0000-0000-0000-000000000003', 'h0000000-0000-0000-0000-000000000001', 'Patient Registration & Front Desk', 'Admissions, OPD scheduling, and patient intake'),
('d0000000-0000-0000-0000-000000000004', 'h0000000-0000-0000-0000-000000000002', 'ENT & Head Neck Surgery', 'Comprehensive otolaryngology & head neck surgery')
ON CONFLICT (id) DO NOTHING;

-- 3. PROFILES (FOR 6 DISTINCT DEMO PERSONAS)
INSERT INTO profiles (id, email, phone, full_name, role, avatar_url, mfa_enabled) VALUES
(
  'p0000000-0000-0000-0000-000000000001',
  'patient@medsphere.io',
  '+91 98765 43210',
  'Priya Sharma',
  'patient',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
  false
),
(
  'p0000000-0000-0000-0000-000000000002',
  'doctor@maxsaket.medsphere.io',
  '+91 98111 44556',
  'Dr. Aisha Sen',
  'doctor',
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80',
  true
),
(
  'p0000000-0000-0000-0000-000000000003',
  'lab@maxsaket.medsphere.io',
  '+91 98333 55667',
  'Praveen Kumar',
  'lab_staff',
  NULL,
  true
),
(
  'p0000000-0000-0000-0000-000000000004',
  'registrar@maxsaket.medsphere.io',
  '+91 98444 66778',
  'Priya Nair',
  'registrar',
  NULL,
  true
),
(
  'p0000000-0000-0000-0000-000000000005',
  'admin@maxsaket.medsphere.io',
  '+91 98100 11223',
  'Dr. Harish K. Grover',
  'hospital_admin',
  NULL,
  true
),
(
  'p0000000-0000-0000-0000-000000000006',
  'platform@medsphere.io',
  '+91 98000 00000',
  'MedSphere Central Governance',
  'platform_admin',
  NULL,
  true
)
ON CONFLICT (id) DO NOTHING;

-- 4. HOSPITAL STAFF
INSERT INTO hospital_staff (id, hospital_id, profile_id, role, department_id, professional_reg_no, qualifications, specialization, experience_years, consultation_fee, status)
VALUES
(
  's0000000-0000-0000-0000-000000000001',
  'h0000000-0000-0000-0000-000000000001',
  'p0000000-0000-0000-0000-000000000005',
  'hospital_admin',
  NULL,
  'DMC-10024-DELHI',
  'MBBS, MHA (Hospital Administration)',
  'Healthcare Administration',
  22,
  0,
  'active'
),
(
  's0000000-0000-0000-0000-000000000002',
  'h0000000-0000-0000-0000-000000000001',
  'p0000000-0000-0000-0000-000000000002',
  'doctor',
  'd0000000-0000-0000-0000-000000000001',
  'DMC-18492-DELHI',
  'MBBS, MD (Medicine), DM (Cardiology), FACC',
  'Interventional Cardiology',
  14,
  1200.00,
  'active'
),
(
  's0000000-0000-0000-0000-000000000003',
  'h0000000-0000-0000-0000-000000000001',
  'p0000000-0000-0000-0000-000000000003',
  'lab_staff',
  'd0000000-0000-0000-0000-000000000002',
  'MLT-DL-7741',
  'B.Sc. MLT, Senior Clinical Biochemist',
  'Pathology & Biochemistry',
  8,
  0.00,
  'active'
),
(
  's0000000-0000-0000-0000-000000000004',
  'h0000000-0000-0000-0000-000000000001',
  'p0000000-0000-0000-0000-000000000004',
  'registrar',
  'd0000000-0000-0000-0000-000000000003',
  NULL,
  'B.Com, Hospital Administration Diploma',
  'Patient Intake & Front Desk Reception',
  5,
  0.00,
  'active'
)
ON CONFLICT (id) DO NOTHING;

-- 5. PATIENTS
INSERT INTO patients (id, profile_id, patient_code, dob, gender, blood_group, allergies, chronic_conditions, address_line, city, locality, pincode, emergency_contact_name, emergency_contact_phone)
VALUES
(
  'pat00000-0000-0000-0000-000000000001',
  'p0000000-0000-0000-0000-000000000001',
  'MSC-P-7F29A1',
  '1992-04-12',
  'Female',
  'B+',
  ARRAY['Penicillin (Anaphylactoid rash)', 'NSAIDs / Ibuprofen (Gastric bleed risk)'],
  ARRAY['Mild Essential Hypertension', 'Occasional Palpitations'],
  'Flat 402, Royal Palms, Saket',
  'New Delhi',
  'Saket',
  '110017',
  'Rajiv Sharma (Spouse)',
  '+91 98765 43211'
)
ON CONFLICT (id) DO NOTHING;

-- 6. PATIENT CONSENTS
INSERT INTO patient_consents (id, patient_id, hospital_id, scope, status, method, witness_staff_id, expires_at)
VALUES
(
  'c0000000-0000-0000-0000-000000000001',
  'pat00000-0000-0000-0000-000000000001',
  'h0000000-0000-0000-0000-000000000001',
  'all_records',
  'active',
  'digital_app',
  NULL,
  NOW() + INTERVAL '30 days'
),
(
  'c0000000-0000-0000-0000-000000000002',
  'pat00000-0000-0000-0000-000000000001',
  'h0000000-0000-0000-0000-000000000002',
  'consultations_only',
  'revoked',
  'digital_app',
  NULL,
  NOW() + INTERVAL '10 days'
)
ON CONFLICT (id) DO NOTHING;

-- 7. DIAGNOSTIC TESTS CATALOG
INSERT INTO diagnostic_tests (id, hospital_id, department_id, code, name, category, description, sample_required, turnaround_hours, price, is_active)
VALUES
(
  't0000000-0000-0000-0000-000000000001',
  'h0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000002',
  'CMP-001',
  'Comprehensive Metabolic Panel (CMP)',
  'Biochemistry',
  '14-test panel measuring glucose, electrolytes, kidney function, and liver enzymes.',
  'Fasting Venous Blood (Serum)',
  12,
  950.00,
  true
),
(
  't0000000-0000-0000-0000-000000000002',
  'h0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  'ECHO-001',
  'Transthoracic 2D Echocardiogram with Color Doppler',
  'Cardiology',
  'Ultrasound assessment of cardiac chambers, ejection fraction (LVEF), and valvular gradients.',
  'Non-invasive Ultrasound',
  4,
  2400.00,
  true
),
(
  't0000000-0000-0000-0000-000000000003',
  'h0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000002',
  'LIPID-001',
  'Fasting Lipid Profile with Calculated LDL & Non-HDL',
  'Biochemistry',
  'Measurement of total cholesterol, triglycerides, HDL, LDL, and VLDL.',
  '12-hr Fasting Venous Blood',
  12,
  650.00,
  true
)
ON CONFLICT (id) DO NOTHING;

-- 8. APPOINTMENTS
INSERT INTO appointments (id, patient_id, hospital_id, doctor_staff_id, department_id, appointment_date, appointment_time, status, chief_complaint, consultation_fee, booked_by_role)
VALUES
(
  'a0000000-0000-0000-0000-000000000001',
  'pat00000-0000-0000-0000-000000000001',
  'h0000000-0000-0000-0000-000000000001',
  's0000000-0000-0000-0000-000000000002',
  'd0000000-0000-0000-0000-000000000001',
  CURRENT_DATE + INTERVAL '1 day',
  '10:30 AM',
  'upcoming',
  'Follow-up on 2D Echo results & blood pressure titration',
  1200.00,
  'patient'
),
(
  'a0000000-0000-0000-0000-000000000002',
  'pat00000-0000-0000-0000-000000000001',
  'h0000000-0000-0000-0000-000000000001',
  's0000000-0000-0000-0000-000000000002',
  'd0000000-0000-0000-0000-000000000001',
  CURRENT_DATE - INTERVAL '10 days',
  '11:00 AM',
  'completed',
  'Initial consultation for palpitations and exertional fatigue',
  1200.00,
  'patient'
)
ON CONFLICT (id) DO NOTHING;

-- 9. CLINICAL ENCOUNTERS
INSERT INTO encounters (id, patient_id, hospital_id, doctor_staff_id, appointment_id, encounter_type, chief_complaint, clinical_notes, diagnosis, vitals, started_at, ended_at)
VALUES
(
  'e0000000-0000-0000-0000-000000000001',
  'pat00000-0000-0000-0000-000000000001',
  'h0000000-0000-0000-0000-000000000001',
  's0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000002',
  'opd_consultation',
  'Episodic palpitations during high-workload exertion',
  '34yo female presented with episodic palpitations. Resting BP 134/86 mmHg, HR 78 regular. S1 S2 heard. Prescribed Telmisartan 20mg OD.',
  ARRAY['Essential Hypertension (Mild)', 'Benign Premature Atrial Contractions'],
  '{"bp": "134/86", "pulse": 78, "temp": "98.4 F", "spo2": 99}'::jsonb,
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '10 days' + INTERVAL '30 minutes'
)
ON CONFLICT (id) DO NOTHING;

-- 10. PRESCRIPTIONS
INSERT INTO prescriptions (id, encounter_id, patient_id, hospital_id, doctor_staff_id, diagnosis, clinical_notes, allergy_screen_passed, allergy_warnings)
VALUES
(
  'rx000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000001',
  'pat00000-0000-0000-0000-000000000001',
  'h0000000-0000-0000-0000-000000000001',
  's0000000-0000-0000-0000-000000000002',
  'Essential Hypertension (Mild)',
  'Initiated ARB therapy. Patient warned against NSAIDs due to documented gastric bleed sensitivity.',
  true,
  ARRAY[]::TEXT[]
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO prescription_items (id, prescription_id, medication_name, dosage, frequency, duration_days, instructions)
VALUES
(
  'rxi00000-0000-0000-0000-000000000001',
  'rx000000-0000-0000-0000-000000000001',
  'Tab Telmisartan',
  '20 mg',
  'Once daily (morning)',
  30,
  'Take with water immediately after breakfast'
)
ON CONFLICT (id) DO NOTHING;

-- 11. MEDICAL DOCUMENTS (PROVENANCE-ANCHORED)
INSERT INTO medical_documents (id, patient_id, hospital_id, uploaded_by, encounter_id, document_type, title, file_url, file_hash, file_size_bytes, mime_type, provenance, status, version, clinical_summary)
VALUES
(
  'm0000000-0000-0000-0000-000000000001',
  'pat00000-0000-0000-0000-000000000001',
  'h0000000-0000-0000-0000-000000000001',
  'p0000000-0000-0000-0000-000000000002',
  'e0000000-0000-0000-0000-000000000001',
  'radiology',
  'Transthoracic 2D Echocardiogram with Color Doppler',
  '/documents/echocardiogram_priya_sharma.pdf',
  'e814a0f4439c29801824a73bc9e73d3289a9f24b89211a7f050b15ca85ec3f2a',
  1420500,
  'application/pdf',
  'hospital_generated',
  'finalized',
  1,
  'Normal left ventricular cavity dimensions and systolic function. LVEF visually estimated at 62%. No regional wall motion abnormality.'
),
(
  'm0000000-0000-0000-0000-000000000002',
  'pat00000-0000-0000-0000-000000000001',
  'h0000000-0000-0000-0000-000000000001',
  'p0000000-0000-0000-0000-000000000003',
  NULL,
  'lab_report',
  'Comprehensive Metabolic Panel (CMP) & Renal Function',
  '/documents/lab_cmp_priya_sharma.pdf',
  '77c2891f90aa186640cdd3924719875bb23801a61c563065d64e3c233c4ef4e1',
  820000,
  'application/pdf',
  'lab_generated',
  'finalized',
  1,
  'Serum Creatinine 0.9 mg/dL. Fasting Serum Glucose 112 mg/dL (Impaired Fasting Glucose). Serum Potassium 4.4 mmol/L.'
),
(
  'm0000000-0000-0000-0000-000000000003',
  'pat00000-0000-0000-0000-000000000001',
  NULL,
  'p0000000-0000-0000-0000-000000000001',
  NULL,
  'external_report',
  'Lipid Profile Report - Outside Diagnostic Center',
  '/documents/patient_upload_lipid_sept.pdf',
  '339d91a92e850b14798114a872605d33f7210e340b064972e731178229bfa529',
  340000,
  'application/pdf',
  'patient_unverified',
  'finalized',
  1,
  'Total Cholesterol 194 mg/dL. Triglycerides 142 mg/dL. HDL Cholesterol 48 mg/dL. LDL Cholesterol 118 mg/dL.'
)
ON CONFLICT (id) DO NOTHING;

-- 12. LAB ORDERS & RESULTS
INSERT INTO lab_orders (id, patient_id, hospital_id, doctor_staff_id, diagnostic_test_id, test_name, clinical_indication, priority, status, document_id, finalized_at)
VALUES
(
  'lo000000-0000-0000-0000-000000000001',
  'pat00000-0000-0000-0000-000000000001',
  'h0000000-0000-0000-0000-000000000001',
  's0000000-0000-0000-0000-000000000002',
  't0000000-0000-0000-0000-000000000001',
  'Comprehensive Metabolic Panel (CMP)',
  'Evaluation before initiating anti-hypertensive regimen',
  'routine',
  'finalized',
  'm0000000-0000-0000-0000-000000000002',
  NOW() - INTERVAL '15 days'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lab_results (id, order_id, test_parameter, measured_value, unit, reference_range, is_abnormal, critical_flag)
VALUES
('lr000000-0000-0000-0000-000000000001', 'lo000000-0000-0000-0000-000000000001', 'Serum Creatinine', '0.9', 'mg/dL', '0.6 - 1.2', false, false),
('lr000000-0000-0000-0000-000000000002', 'lo000000-0000-0000-0000-000000000001', 'Fasting Plasma Glucose', '112', 'mg/dL', '70 - 99', true, false),
('lr000000-0000-0000-0000-000000000003', 'lo000000-0000-0000-0000-000000000001', 'Serum Potassium (K+)', '4.4', 'mmol/L', '3.5 - 5.1', false, false),
('lr000000-0000-0000-0000-000000000004', 'lo000000-0000-0000-0000-000000000001', 'Serum Sodium (Na+)', '141', 'mmol/L', '136 - 145', false, false)
ON CONFLICT (id) DO NOTHING;

-- 13. AUDIT & DOCUMENT ACCESS LOGS
INSERT INTO document_access_logs (id, patient_id, document_id, staff_id, hospital_id, action_type)
VALUES
(
  'al000000-0000-0000-0000-000000000001',
  'pat00000-0000-0000-0000-000000000001',
  'm0000000-0000-0000-0000-000000000001',
  's0000000-0000-0000-0000-000000000002',
  'h0000000-0000-0000-0000-000000000001',
  'view'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO audit_logs (id, actor_profile_id, hospital_id, event_category, event_name, details)
VALUES
(
  'aud00000-0000-0000-0000-000000000001',
  'p0000000-0000-0000-0000-000000000006',
  'h0000000-0000-0000-0000-000000000001',
  'verification',
  'HOSPITAL_VERIFIED',
  '{"registration_number": "DL-HOSP-2018-0914", "accreditation": ["NABH", "NABL", "JCI"]}'::jsonb
)
ON CONFLICT (id) DO NOTHING;
