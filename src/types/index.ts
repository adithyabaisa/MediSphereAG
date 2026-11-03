export type UserRole =
  | 'patient'
  | 'hospital_admin'
  | 'doctor'
  | 'lab_staff'
  | 'registrar'
  | 'platform_admin';

export type HospitalStatus =
  | 'submitted'
  | 'under_review'
  | 'verified'
  | 'rejected'
  | 'suspended';

export type StaffStatus = 'active' | 'invited' | 'deactivated';

export type ConsentStatus = 'active' | 'expired' | 'revoked';

export type ConsentScope =
  | 'all_records'
  | 'consultations_only'
  | 'diagnostics_only'
  | 'emergency_only';

export type ConsentMethod =
  | 'digital_app'
  | 'recorded_otp'
  | 'witnessed_signature';

export type ProvenanceType =
  | 'hospital_generated'
  | 'lab_generated'
  | 'patient_unverified'
  | 'hospital_scanned_on_behalf'
  | 'ai_generated_summary';

export type DocumentType =
  | 'prescription'
  | 'lab_report'
  | 'discharge_summary'
  | 'radiology'
  | 'consultation_note'
  | 'external_report';

export type DocumentStatus = 'draft' | 'finalized' | 'superseded';

export interface UserProfile {
  id: string;
  email: string;
  phone?: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  mfa_enabled?: boolean;
  hospital_id?: string; // Set if hospital staff
  created_at: string;
}

export interface Patient {
  id: string;
  profile_id: string;
  patient_code: string; // e.g. MSC-P-7F29A1
  full_name: string;
  email: string;
  phone: string;
  dob: string;
  gender?: string;
  blood_group?: string;
  allergies: string[];
  chronic_conditions: string[];
  address_line?: string;
  city?: string;
  locality?: string;
  pincode?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  created_at: string;
}

export interface Hospital {
  id: string;
  legal_name: string;
  hospital_type: string;
  registration_number: string;
  tax_id?: string;
  official_email: string;
  official_phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  status: HospitalStatus;
  accreditation: string[];
  signatory_name: string;
  signatory_designation: string;
  verified_at?: string;
  verified_by?: string;
  rejection_reason?: string;
  created_at: string;
}

export interface Department {
  id: string;
  hospital_id: string;
  name: string;
  description?: string;
}

export interface HospitalStaff {
  id: string;
  hospital_id: string;
  profile_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  department_id?: string;
  department_name?: string;
  professional_reg_no?: string;
  qualifications?: string;
  specialization?: string;
  experience_years: number;
  consultation_fee: number;
  status: StaffStatus;
  created_at: string;
}

export interface PatientConsent {
  id: string;
  patient_id: string;
  hospital_id: string;
  hospital_name: string;
  scope: ConsentScope;
  status: ConsentStatus;
  method: ConsentMethod;
  witness_staff_id?: string;
  witness_staff_name?: string;
  otp_evidence_hash?: string;
  expires_at: string;
  revoked_at?: string;
  revocation_reason?: string;
  created_at: string;
}

export interface MedicalDocument {
  id: string;
  patient_id: string;
  hospital_id?: string;
  hospital_name?: string;
  uploaded_by_profile_id: string;
  uploaded_by_name: string;
  document_type: DocumentType;
  title: string;
  file_url: string;
  file_hash: string;
  file_size_bytes: number;
  mime_type: string;
  provenance: ProvenanceType;
  status: DocumentStatus;
  version: number;
  parent_doc_id?: string;
  clinical_summary?: string;
  ai_analysis?: {
    key_findings: string[];
    abnormal_values: { parameter: string; value: string; normal_range: string; flag: string }[];
    recommendations: string[];
    disclaimer: string;
    source_pages: number[];
  };
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface LabResultParameter {
  test_parameter: string;
  measured_value: string;
  unit: string;
  reference_range: string;
  is_abnormal: boolean;
  critical_flag?: boolean;
}

export interface LabOrder {
  id: string;
  patient_id: string;
  patient_code: string;
  patient_name: string;
  hospital_id: string;
  doctor_staff_id: string;
  doctor_name: string;
  test_name: string;
  clinical_indication: string;
  priority: 'routine' | 'urgent' | 'stat';
  status: 'pending' | 'sample_collected' | 'in_progress' | 'finalized' | 'cancelled';
  results?: LabResultParameter[];
  technician_name?: string;
  pathologist_signoff_name?: string;
  document_id?: string;
  created_at: string;
  finalized_at?: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_code: string;
  hospital_id: string;
  hospital_name: string;
  doctor_staff_id: string;
  doctor_name: string;
  department: string;
  appointment_date: string; // YYYY-MM-DD
  appointment_time: string; // HH:mm
  status: 'upcoming' | 'completed' | 'cancelled' | 'in_progress';
  chief_complaint?: string;
  consultation_fee: number;
  created_at: string;
}

export interface DocumentAccessLog {
  id: string;
  patient_id: string;
  document_id?: string;
  document_title?: string;
  staff_id: string;
  staff_name: string;
  hospital_id: string;
  hospital_name: string;
  action_type: 'view' | 'download' | 'ai_summary' | 'copilot_rag' | 'consultation_access';
  accessed_at: string;
}

export interface AuditLog {
  id: string;
  actor_profile_id?: string;
  actor_name?: string;
  hospital_id?: string;
  hospital_name?: string;
  event_category: 'auth' | 'verification' | 'consent' | 'staff_management' | 'document';
  event_name: string;
  details: Record<string, unknown>;
  occurred_at: string;
}
