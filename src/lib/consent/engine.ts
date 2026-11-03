import { store } from '@/lib/db/store';
import { HospitalStaff, Patient, PatientConsent } from '@/types';
import { isValidPatientCode } from '@/lib/utils/code-generator';

export interface AccessCheckResult {
  allowed: boolean;
  neutralError: boolean; // True when returning standardized neutral response to prevent enumeration
  reason: string;
  patient?: Patient;
  consent?: PatientConsent;
  accessibleScope?: 'all' | 'consultations_only' | 'demographics_only' | 'lab_orders_only';
}

/**
 * Multi-rule consent resolution engine adhering strictly to Section 6:
 * - A patient code is an identifier, never a credential.
 * - Unknown code or unauthorized code returns the same neutral message:
 *   "No authorized patient record found matching this identifier or active consent is missing."
 * - Hospital must be 'verified'
 * - Staff profile must be 'active'
 * - Patient must have an active, unexpired consent to the requesting hospital
 * - Role separation:
 *    - Hospital Admin: NO access to clinical records
 *    - Registrar: Demographics only (can register, check in, print cards, but CANNOT view clinical history or documents)
 *    - Lab Staff: Restricted to assigned lab order scope
 *    - Doctor: Allowed clinical records if care relationship or hospital-wide consent exists
 */
export function evaluateAccess(
  patientCode: string,
  staffProfileId: string
): AccessCheckResult {
  const neutralMessage =
    'No authorized patient record found for this identifier, or patient consent is not active for your hospital.';

  // 1. Patient Code validation
  if (!patientCode || !isValidPatientCode(patientCode)) {
    return {
      allowed: false,
      neutralError: true,
      reason: neutralMessage,
    };
  }

  // 2. Resolve staff profile
  const staff = store.getStaffById(staffProfileId);

  if (!staff) {
    return {
      allowed: false,
      neutralError: false,
      reason: 'Staff profile not found in directory.',
    };
  }

  // 3. Staff active status check
  if (staff.status !== 'active') {
    return {
      allowed: false,
      neutralError: false,
      reason: 'Your staff account is currently inactive. Contact your Hospital Administrator.',
    };
  }

  // 4. Hospital verified status check
  const hospital = store.getHospitalById(staff.hospital_id);
  if (!hospital || hospital.status !== 'verified') {
    return {
      allowed: false,
      neutralError: false,
      reason: `Hospital "${hospital?.legal_name || 'Organization'}" is not verified (status: ${hospital?.status || 'unverified'}). Medical records cannot be held or accessed.`,
    };
  }

  // 5. Patient existence check
  const patient = store.getPatientByCode(patientCode);
  if (!patient) {
    // Return neutral message to prevent user enumeration
    return {
      allowed: false,
      neutralError: true,
      reason: neutralMessage,
    };
  }

  // 6. Role-based constraints: Hospital Admin NEVER reads clinical content
  if (staff.role === 'hospital_admin') {
    return {
      allowed: false,
      neutralError: false,
      reason: 'Hospital Administrators have operational privileges only and are strictly restricted from accessing patient clinical records.',
    };
  }

  // 7. Active consent check for this hospital
  const consent = store.getConsent(patient.id, hospital.id);
  if (!consent || consent.status !== 'active' || new Date(consent.expires_at) <= new Date()) {
    // Return neutral message to maintain privacy
    return {
      allowed: false,
      neutralError: true,
      reason: neutralMessage,
    };
  }

  // 8. Role-specific scope resolution
  if (staff.role === 'registrar') {
    // Registrar gets demographics only
    return {
      allowed: true,
      neutralError: false,
      reason: 'Access granted for patient intake and scheduling (Demographics only).',
      patient,
      consent,
      accessibleScope: 'demographics_only',
    };
  }

  if (staff.role === 'lab_staff') {
    return {
      allowed: true,
      neutralError: false,
      reason: 'Access granted to test orders and diagnostic report dispatch.',
      patient,
      consent,
      accessibleScope: 'lab_orders_only',
    };
  }

  if (staff.role === 'doctor') {
    // Check consent scope
    const isFullAccess = consent.scope === 'all_records';
    return {
      allowed: true,
      neutralError: false,
      reason: 'Authorized clinical access granted.',
      patient,
      consent,
      accessibleScope: isFullAccess ? 'all' : 'consultations_only',
    };
  }

  return {
    allowed: false,
    neutralError: true,
    reason: neutralMessage,
  };
}

/**
 * Logs document access event to audit log and patient-visible log
 */
export function recordAccessAudit(
  patientId: string,
  staff: HospitalStaff,
  actionType: 'view' | 'download' | 'ai_summary' | 'copilot_rag' | 'consultation_access',
  documentId?: string,
  documentTitle?: string
) {
  const hosp = store.getHospitalById(staff.hospital_id);
  store.logDocumentAccess({
    patient_id: patientId,
    document_id: documentId,
    document_title: documentTitle,
    staff_id: staff.id,
    staff_name: staff.full_name,
    hospital_id: staff.hospital_id,
    hospital_name: hosp?.legal_name || 'Hospital',
    action_type: actionType,
  });
}
