import {
  Hospital,
  HospitalStaff,
  Patient,
  PatientConsent,
  MedicalDocument,
  LabOrder,
  Appointment,
  DocumentAccessLog,
  AuditLog,
  UserProfile,
  HospitalStatus,
  StaffStatus,
  ConsentScope,
  ConsentMethod,
  ProvenanceType,
  DocumentType,
} from '@/types';
import {
  INITIAL_HOSPITALS,
  INITIAL_PROFILES,
  INITIAL_STAFF,
  INITIAL_PATIENTS,
  INITIAL_CONSENTS,
  INITIAL_DOCUMENTS,
  INITIAL_LAB_ORDERS,
  INITIAL_APPOINTMENTS,
  INITIAL_ACCESS_LOGS,
  INITIAL_AUDIT_LOGS,
} from './seed-data';
import { generatePatientCode, computeSimulatedSha256 } from '../utils/code-generator';

const STORAGE_KEY = 'medsphere_state_v4';

interface AppState {
  hospitals: Hospital[];
  profiles: UserProfile[];
  staff: HospitalStaff[];
  patients: Patient[];
  consents: PatientConsent[];
  documents: MedicalDocument[];
  labOrders: LabOrder[];
  appointments: Appointment[];
  accessLogs: DocumentAccessLog[];
  auditLogs: AuditLog[];
  currentUser: UserProfile | null;
}

function getDefaultState(): AppState {
  return {
    hospitals: JSON.parse(JSON.stringify(INITIAL_HOSPITALS)),
    profiles: JSON.parse(JSON.stringify(INITIAL_PROFILES)),
    staff: JSON.parse(JSON.stringify(INITIAL_STAFF)),
    patients: JSON.parse(JSON.stringify(INITIAL_PATIENTS)),
    consents: JSON.parse(JSON.stringify(INITIAL_CONSENTS)),
    documents: JSON.parse(JSON.stringify(INITIAL_DOCUMENTS)),
    labOrders: JSON.parse(JSON.stringify(INITIAL_LAB_ORDERS)),
    appointments: JSON.parse(JSON.stringify(INITIAL_APPOINTMENTS)),
    accessLogs: JSON.parse(JSON.stringify(INITIAL_ACCESS_LOGS)),
    auditLogs: JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS)),
    currentUser: JSON.parse(JSON.stringify(INITIAL_PROFILES[0])),
  };
}

class Store {
  private state: AppState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = getDefaultState();
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          this.state = { ...this.state, ...parsed };
        }
      } catch (e) {
        console.error('Error loading stored MedSphere state:', e);
      }
    }
  }

  private persist() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch (e) {
        console.error('Error persisting state:', e);
      }
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // --- Auth & Session ---
  public getCurrentUser(): UserProfile | null {
    return this.state.currentUser;
  }

  public setCurrentUser(user: UserProfile | null) {
    this.state.currentUser = user;
    this.persist();
  }

  public switchUserByRole(role: UserProfile['role'], hospitalId?: string): UserProfile | null {
    const user = this.state.profiles.find((p) => {
      if (role === 'patient') return p.role === 'patient';
      if (hospitalId) {
        return p.role === role && p.hospital_id === hospitalId;
      }
      return p.role === role;
    });
    if (user) {
      this.state.currentUser = user;
      this.persist();
      return user;
    }
    return null;
  }

  // --- Hospitals ---
  public getHospitals(): Hospital[] {
    return [...this.state.hospitals];
  }

  public getHospitalById(id: string): Hospital | undefined {
    return this.state.hospitals.find((h) => h.id === id);
  }

  public registerHospital(data: Omit<Hospital, 'id' | 'status' | 'created_at'>, adminData: { name: string; email: string; phone: string }): Hospital {
    const newHospital: Hospital = {
      ...data,
      id: `hosp-${Date.now()}`,
      status: 'submitted',
      created_at: new Date().toISOString(),
    };

    const adminProfile: UserProfile = {
      id: `prof-admin-${Date.now()}`,
      email: adminData.email,
      phone: adminData.phone,
      full_name: adminData.name,
      role: 'hospital_admin',
      hospital_id: newHospital.id,
      mfa_enabled: true,
      created_at: new Date().toISOString(),
    };

    const adminStaff: HospitalStaff = {
      id: `staff-${Date.now()}`,
      hospital_id: newHospital.id,
      profile_id: adminProfile.id,
      full_name: adminData.name,
      email: adminData.email,
      role: 'hospital_admin',
      specialization: 'Hospital Administration',
      experience_years: 10,
      consultation_fee: 0,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    this.state.hospitals.push(newHospital);
    this.state.profiles.push(adminProfile);
    this.state.staff.push(adminStaff);

    this.addAuditLog({
      actor_name: adminData.name,
      hospital_name: newHospital.legal_name,
      event_category: 'verification',
      event_name: 'HOSPITAL_APPLICATION_SUBMITTED',
      details: {
        registration_number: newHospital.registration_number,
        accreditations: newHospital.accreditation,
      },
    });

    this.persist();
    return newHospital;
  }

  public updateHospitalStatus(id: string, status: HospitalStatus, reason?: string, reviewerName = 'Platform Admin'): boolean {
    const hosp = this.state.hospitals.find((h) => h.id === id);
    if (!hosp) return false;
    hosp.status = status;
    if (status === 'verified') {
      hosp.verified_at = new Date().toISOString();
      hosp.rejection_reason = undefined;
    } else if (status === 'rejected' || status === 'suspended') {
      hosp.rejection_reason = reason;
    }

    this.addAuditLog({
      actor_name: reviewerName,
      hospital_name: hosp.legal_name,
      event_category: 'verification',
      event_name: `HOSPITAL_STATUS_${status.toUpperCase()}`,
      details: { reason },
    });

    this.persist();
    return true;
  }

  // --- Staff ---
  public getStaffByHospital(hospitalId: string): HospitalStaff[] {
    return this.state.staff.filter((s) => s.hospital_id === hospitalId);
  }

  public getStaffById(id: string): HospitalStaff | undefined {
    return this.state.staff.find((s) => s.id === id || s.profile_id === id);
  }

  public getDoctors(): HospitalStaff[] {
    return this.state.staff.filter((s) => s.role === 'doctor' && s.status === 'active');
  }

  public inviteStaff(
    hospitalId: string,
    data: {
      full_name: string;
      email: string;
      role: HospitalStaff['role'];
      specialization?: string;
      qualifications?: string;
      professional_reg_no?: string;
      department_name?: string;
      experience_years: number;
      consultation_fee: number;
    }
  ): HospitalStaff {
    const profileId = `prof-staff-${Date.now()}`;
    const newProfile: UserProfile = {
      id: profileId,
      email: data.email,
      full_name: data.full_name,
      role: data.role,
      hospital_id: hospitalId,
      mfa_enabled: true,
      created_at: new Date().toISOString(),
    };

    const newStaff: HospitalStaff = {
      id: `staff-${Date.now()}`,
      hospital_id: hospitalId,
      profile_id: profileId,
      full_name: data.full_name,
      email: data.email,
      role: data.role,
      department_name: data.department_name,
      professional_reg_no: data.professional_reg_no,
      qualifications: data.qualifications,
      specialization: data.specialization,
      experience_years: data.experience_years,
      consultation_fee: data.consultation_fee,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    this.state.profiles.push(newProfile);
    this.state.staff.push(newStaff);

    const hosp = this.getHospitalById(hospitalId);
    this.addAuditLog({
      actor_name: this.state.currentUser?.full_name || 'Hospital Admin',
      hospital_name: hosp?.legal_name || 'Hospital',
      event_category: 'staff_management',
      event_name: 'STAFF_MEMBER_INVITED',
      details: {
        staff_name: data.full_name,
        role: data.role,
        specialization: data.specialization,
      },
    });

    this.persist();
    return newStaff;
  }

  public setStaffStatus(staffId: string, status: StaffStatus): boolean {
    const staff = this.state.staff.find((s) => s.id === staffId);
    if (!staff) return false;
    staff.status = status;

    const hosp = this.getHospitalById(staff.hospital_id);
    this.addAuditLog({
      actor_name: this.state.currentUser?.full_name || 'Hospital Admin',
      hospital_name: hosp?.legal_name || 'Hospital',
      event_category: 'staff_management',
      event_name: `STAFF_STATUS_${status.toUpperCase()}`,
      details: { staff_name: staff.full_name, staff_id: staff.id },
    });

    this.persist();
    return true;
  }

  // --- Patients ---
  public getPatients(): Patient[] {
    return [...this.state.patients];
  }

  public getPatientByCode(patientCode: string): Patient | undefined {
    return this.state.patients.find(
      (p) => p.patient_code.trim().toUpperCase() === patientCode.trim().toUpperCase()
    );
  }

  public getPatientById(id: string): Patient | undefined {
    return this.state.patients.find((p) => p.id === id);
  }

  public registerPatient(data: {
    full_name: string;
    email: string;
    phone: string;
    dob: string;
    gender?: string;
    blood_group?: string;
    address_line?: string;
    city?: string;
    locality?: string;
    pincode?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
  }): Patient {
    const code = generatePatientCode();
    const profileId = `prof-pat-${Date.now()}`;

    const profile: UserProfile = {
      id: profileId,
      email: data.email,
      phone: data.phone,
      full_name: data.full_name,
      role: 'patient',
      created_at: new Date().toISOString(),
    };

    const newPatient: Patient = {
      id: `pat-${Date.now()}`,
      profile_id: profileId,
      patient_code: code,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      dob: data.dob,
      gender: data.gender,
      blood_group: data.blood_group,
      allergies: [],
      chronic_conditions: [],
      address_line: data.address_line,
      city: data.city,
      locality: data.locality,
      pincode: data.pincode,
      emergency_contact_name: data.emergency_contact_name,
      emergency_contact_phone: data.emergency_contact_phone,
      created_at: new Date().toISOString(),
    };

    this.state.profiles.push(profile);
    this.state.patients.push(newPatient);

    this.addAuditLog({
      actor_name: data.full_name,
      event_category: 'auth',
      event_name: 'PATIENT_REGISTERED',
      details: { patient_code: code },
    });

    this.persist();
    return newPatient;
  }

  // --- Consents ---
  public getConsentsByPatient(patientId: string): PatientConsent[] {
    return this.state.consents.filter((c) => c.patient_id === patientId);
  }

  public getConsent(patientId: string, hospitalId: string): PatientConsent | undefined {
    return this.state.consents.find(
      (c) =>
        c.patient_id === patientId &&
        c.hospital_id === hospitalId &&
        c.status === 'active' &&
        new Date(c.expires_at) > new Date()
    );
  }

  public grantConsent(
    patientId: string,
    hospitalId: string,
    scope: ConsentScope = 'all_records',
    method: ConsentMethod = 'digital_app',
    durationDays = 30,
    witnessStaffId?: string
  ): PatientConsent {
    const hospital = this.getHospitalById(hospitalId);
    const existing = this.state.consents.find(
      (c) => c.patient_id === patientId && c.hospital_id === hospitalId
    );

    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    if (existing) {
      existing.status = 'active';
      existing.scope = scope;
      existing.method = method;
      existing.expires_at = expiresAt;
      existing.revoked_at = undefined;
      existing.revocation_reason = undefined;
      existing.witness_staff_id = witnessStaffId;
      this.persist();
      return existing;
    }

    const newConsent: PatientConsent = {
      id: `consent-${Date.now()}`,
      patient_id: patientId,
      hospital_id: hospitalId,
      hospital_name: hospital?.legal_name || 'Hospital',
      scope,
      status: 'active',
      method,
      witness_staff_id: witnessStaffId,
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    };

    this.state.consents.push(newConsent);

    this.addAuditLog({
      actor_name: this.state.currentUser?.full_name || 'Patient',
      hospital_name: hospital?.legal_name,
      event_category: 'consent',
      event_name: 'CONSENT_GRANTED',
      details: { scope, method, expires_at: expiresAt },
    });

    this.persist();
    return newConsent;
  }

  public revokeConsent(consentId: string, reason = 'Revoked by patient'): boolean {
    const consent = this.state.consents.find((c) => c.id === consentId);
    if (!consent) return false;
    consent.status = 'revoked';
    consent.revoked_at = new Date().toISOString();
    consent.revocation_reason = reason;

    this.addAuditLog({
      actor_name: this.state.currentUser?.full_name || 'Patient',
      hospital_name: consent.hospital_name,
      event_category: 'consent',
      event_name: 'CONSENT_REVOKED',
      details: { reason },
    });

    this.persist();
    return true;
  }

  // --- Medical Documents (Immutable & Provenance Anchored) ---
  public getDocumentsByPatient(patientId: string): MedicalDocument[] {
    // Newest first sorting as required by prompt
    return this.state.documents
      .filter((d) => d.patient_id === patientId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public addDocument(data: {
    patient_id: string;
    hospital_id?: string;
    uploaded_by_profile_id: string;
    uploaded_by_name: string;
    document_type: DocumentType;
    title: string;
    file_url: string;
    file_name: string;
    file_size_bytes: number;
    mime_type: string;
    provenance: ProvenanceType;
    clinical_summary?: string;
    ai_analysis?: MedicalDocument['ai_analysis'];
  }): MedicalDocument {
    const hospital = data.hospital_id ? this.getHospitalById(data.hospital_id) : undefined;
    const fileHash = computeSimulatedSha256(data.file_name + Date.now());

    const newDoc: MedicalDocument = {
      id: `doc-${Date.now()}`,
      patient_id: data.patient_id,
      hospital_id: data.hospital_id,
      hospital_name: hospital?.legal_name,
      uploaded_by_profile_id: data.uploaded_by_profile_id,
      uploaded_by_name: data.uploaded_by_name,
      document_type: data.document_type,
      title: data.title,
      file_url: data.file_url,
      file_hash: fileHash,
      file_size_bytes: data.file_size_bytes,
      mime_type: data.mime_type,
      provenance: data.provenance,
      status: 'finalized',
      version: 1,
      clinical_summary: data.clinical_summary,
      ai_analysis: data.ai_analysis,
      created_at: new Date().toISOString(),
    };

    this.state.documents.unshift(newDoc);

    this.addAuditLog({
      actor_name: data.uploaded_by_name,
      hospital_name: hospital?.legal_name,
      event_category: 'document',
      event_name: 'DOCUMENT_UPLOADED',
      details: {
        document_id: newDoc.id,
        title: newDoc.title,
        provenance: newDoc.provenance,
        file_hash: fileHash,
      },
    });

    this.persist();
    return newDoc;
  }

  // --- Lab Orders ---
  public getLabOrders(hospitalId?: string): LabOrder[] {
    let orders = [...this.state.labOrders];
    if (hospitalId) {
      orders = orders.filter((o) => o.hospital_id === hospitalId);
    }
    return orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getLabOrderById(id: string): LabOrder | undefined {
    return this.state.labOrders.find((o) => o.id === id);
  }

  public finalizeLabOrder(
    orderId: string,
    data: {
      technician_name: string;
      pathologist_signoff_name: string;
      results: LabOrder['results'];
      uploaded_file_name?: string;
    }
  ): boolean {
    const order = this.state.labOrders.find((o) => o.id === orderId);
    if (!order) return false;

    order.status = 'finalized';
    order.technician_name = data.technician_name;
    order.pathologist_signoff_name = data.pathologist_signoff_name;
    order.results = data.results;
    order.finalized_at = new Date().toISOString();

    // Automatically generate finalized immutable document in patient record
    const summaryText = (data.results || [])
      .map((r) => `${r.test_parameter}: ${r.measured_value} ${r.unit} (${r.reference_range}) ${r.is_abnormal ? '[ABNORMAL]' : ''}`)
      .join('; ');

    const newDoc = this.addDocument({
      patient_id: order.patient_id,
      hospital_id: order.hospital_id,
      uploaded_by_profile_id: 'prof-lab-praveen',
      uploaded_by_name: `${data.technician_name} (Signed by ${data.pathologist_signoff_name})`,
      document_type: 'lab_report',
      title: `${order.test_name} - Finalized Diagnostic Report`,
      file_url: `/documents/lab_order_${order.id}.pdf`,
      file_name: data.uploaded_file_name || `${order.test_name}.pdf`,
      file_size_bytes: 650000,
      mime_type: 'application/pdf',
      provenance: 'lab_generated',
      clinical_summary: `Official laboratory report for ${order.test_name}. Summary: ${summaryText}`,
      ai_analysis: {
        key_findings: (data.results || []).map((r) => `${r.test_parameter}: ${r.measured_value} ${r.unit}`),
        abnormal_values: (data.results || [])
          .filter((r) => r.is_abnormal)
          .map((r) => ({
            parameter: r.test_parameter,
            value: `${r.measured_value} ${r.unit}`,
            normal_range: r.reference_range,
            flag: 'Out of normal physiological bounds',
          })),
        recommendations: [
          'Review abnormal values with primary physician',
          'Repeat test in 4-6 weeks if indicated by clinician',
        ],
        disclaimer: `Signed by Pathologist ${data.pathologist_signoff_name}. Verified against internal hospital quality calibration.`,
        source_pages: [1],
      },
    });

    order.document_id = newDoc.id;
    this.persist();
    return true;
  }

  // --- Appointments ---
  public getAppointmentsByPatient(patientId: string): Appointment[] {
    return this.state.appointments
      .filter((a) => a.patient_id === patientId)
      .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime());
  }

  public getAppointmentsByHospital(hospitalId: string): Appointment[] {
    return this.state.appointments.filter((a) => a.hospital_id === hospitalId);
  }

  public bookAppointment(data: Omit<Appointment, 'id' | 'status' | 'created_at'>): Appointment {
    const newAppt: Appointment = {
      ...data,
      id: `appt-${Date.now()}`,
      status: 'upcoming',
      created_at: new Date().toISOString(),
    };
    this.state.appointments.unshift(newAppt);
    this.persist();
    return newAppt;
  }

  public cancelAppointment(id: string): boolean {
    const appt = this.state.appointments.find((a) => a.id === id);
    if (!appt) return false;
    appt.status = 'cancelled';
    this.persist();
    return true;
  }

  // --- Access Logs ---
  public getAccessLogs(patientId: string): DocumentAccessLog[] {
    return this.state.accessLogs
      .filter((l) => l.patient_id === patientId)
      .sort((a, b) => new Date(b.accessed_at).getTime() - new Date(a.accessed_at).getTime());
  }

  public logDocumentAccess(entry: Omit<DocumentAccessLog, 'id' | 'accessed_at'>) {
    const log: DocumentAccessLog = {
      ...entry,
      id: `acc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      accessed_at: new Date().toISOString(),
    };
    this.state.accessLogs.unshift(log);
    this.persist();
  }

  // --- Audit Logs ---
  public getAuditLogs(hospitalId?: string): AuditLog[] {
    let logs = [...this.state.auditLogs];
    if (hospitalId) {
      const hosp = this.getHospitalById(hospitalId);
      if (hosp) {
        logs = logs.filter((l) => l.hospital_name === hosp.legal_name);
      }
    }
    return logs.sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
  }

  public addAuditLog(data: Omit<AuditLog, 'id' | 'occurred_at'>) {
    const log: AuditLog = {
      ...data,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      occurred_at: new Date().toISOString(),
    };
    this.state.auditLogs.unshift(log);
    this.persist();
  }

  // Reset to initial clean state
  public resetToSeed() {
    this.state = getDefaultState();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.notify();
  }
}

export const store = new Store();
