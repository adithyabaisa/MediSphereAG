import { describe, it, expect, beforeEach } from 'vitest';
import { generatePatientCode, isValidPatientCode } from '@/lib/utils/code-generator';
import { store } from '@/lib/db/store';
import { evaluateAccess } from '@/lib/consent/engine';
import { queryPatientDocumentsRAG } from '@/lib/ai/rag-pipeline';
import { generateStructuredReportSummary } from '@/lib/ai/summarizer';
import { generateDoctorCopilotInsights } from '@/lib/ai/copilot';

describe('MedSphere Connect Core Architectural Rules', () => {
  beforeEach(() => {
    store.resetToSeed();
  });

  // 1. Patient Code Rule
  it('generates non-sequential, valid patient codes matching standard format', () => {
    const code = generatePatientCode();
    expect(code.startsWith('MSC-P-')).toBe(true);
    expect(code.length).toBe(12);
    expect(isValidPatientCode(code)).toBe(true);

    // Invalid codes
    expect(isValidPatientCode('')).toBe(false);
    expect(isValidPatientCode('12345')).toBe(false);
    expect(isValidPatientCode('MSC-P-INVALID123')).toBe(false);
  });

  // 2. Neutral Response for Enumeration Protection
  it('returns neutral error response for invalid or non-existent patient codes', () => {
    const resultInvalid = evaluateAccess('MSC-P-000000', 'staff-aisha');
    expect(resultInvalid.allowed).toBe(false);
    expect(resultInvalid.neutralError).toBe(true);
    expect(resultInvalid.reason).toContain('No authorized patient record found');
  });

  // 3. Hospital Verification Gate
  it('blocks clinical access if the requesting hospital is not verified', () => {
    // Unverified hospital: Sunrise Community Clinic
    const unverifiedHosp = store.getHospitalById('hosp-sunrise-clinic')!;
    expect(unverifiedHosp.status).toBe('submitted');

    // Create staff at unverified hospital
    const staff = store.inviteStaff('hosp-sunrise-clinic', {
      full_name: 'Dr. Unverified Clinician',
      email: 'unverified@sunriseclinic.medsphere.io',
      role: 'doctor',
      experience_years: 5,
      consultation_fee: 500,
    });

    const result = evaluateAccess('MSC-P-7F29A1', staff.id);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('is not verified');
  });

  // 4. Staff Deactivation Rule
  it('immediately blocks access if a staff profile is deactivated', () => {
    const doctor = store.getDoctors()[0];
    expect(doctor.status).toBe('active');

    // Deactivate doctor
    store.setStaffStatus(doctor.id, 'deactivated');

    const result = evaluateAccess('MSC-P-7F29A1', doctor.id);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('inactive');
  });

  // 5. Consent Revocation Takes Effect Immediately
  it('immediately denies access when patient revokes hospital consent', () => {
    const doctor = store.getDoctors()[0];
    const initialResult = evaluateAccess('MSC-P-7F29A1', doctor.id);
    expect(initialResult.allowed).toBe(true);

    // Patient revokes consent
    const consent = store.getConsent('pat-priya-sharma', 'hosp-max-saket')!;
    store.revokeConsent(consent.id, 'Revocation test');

    const revokedResult = evaluateAccess('MSC-P-7F29A1', doctor.id);
    expect(revokedResult.allowed).toBe(false);
    expect(revokedResult.neutralError).toBe(true);
  });

  // 6. Role Clinical Boundary (Admin & Registrar cannot read clinical content)
  it('prevents Hospital Admin and Registrar from accessing clinical records', () => {
    const admin = store.getStaffByHospital('hosp-max-saket').find((s) => s.role === 'hospital_admin')!;
    const adminResult = evaluateAccess('MSC-P-7F29A1', admin.id);
    expect(adminResult.allowed).toBe(false);
    expect(adminResult.reason).toContain('restricted from accessing patient clinical records');

    // Registrar gets demographics only
    const registrar = store.getStaffByHospital('hosp-max-saket').find((s) => s.role === 'registrar')!;
    const regResult = evaluateAccess('MSC-P-7F29A1', registrar.id);
    expect(regResult.allowed).toBe(true);
    expect(regResult.accessibleScope).toBe('demographics_only');
  });

  // 7. Lab Finalization & Immutable Publication
  it('publishes finalized lab orders directly to patient medical history with pathologist sign-off', () => {
    const order = store.getLabOrders()[0];
    const initialDocCount = store.getDocumentsByPatient(order.patient_id).length;

    store.finalizeLabOrder(order.id, {
      technician_name: 'Praveen Kumar',
      pathologist_signoff_name: 'Dr. Neeraj Mehra',
      results: [
        {
          test_parameter: 'Glycated Hemoglobin',
          measured_value: '5.5',
          unit: '%',
          reference_range: '4.0 - 5.6',
          is_abnormal: false,
        },
      ],
    });

    const updatedOrder = store.getLabOrderById(order.id)!;
    expect(updatedOrder.status).toBe('finalized');

    const updatedDocs = store.getDocumentsByPatient(order.patient_id);
    expect(updatedDocs.length).toBe(initialDocCount + 1);
    expect(updatedDocs[0].provenance).toBe('lab_generated');
    expect(updatedDocs[0].title).toContain('Finalized Diagnostic Report');
  });

  // 8. Patient Self-Upload Provenance
  it('tags patient uploaded documents with patient_unverified provenance', () => {
    const patient = store.getPatients()[0];
    const doc = store.addDocument({
      patient_id: patient.id,
      uploaded_by_profile_id: patient.profile_id,
      uploaded_by_name: patient.full_name,
      document_type: 'external_report',
      title: 'Outside Blood Panel',
      file_url: '/documents/outside.pdf',
      file_name: 'outside.pdf',
      file_size_bytes: 120000,
      mime_type: 'application/pdf',
      provenance: 'patient_unverified',
    });

    expect(doc.provenance).toBe('patient_unverified');
    const summary = generateStructuredReportSummary(doc);
    expect(summary.provenanceNotice).toContain('marked as Unverified');
  });

  // 9. AI RAG Retrieval with Page Citations
  it('performs grounded RAG retrieval citing document name and page number', async () => {
    const docs = store.getDocumentsByPatient('pat-priya-sharma');
    const response = await queryPatientDocumentsRAG('echocardiogram ejection fraction', docs);

    expect(response.groundedInRecords).toBe(true);
    expect(response.citations.length).toBeGreaterThan(0);
    expect(response.citations[0].documentTitle).toContain('Echocardiogram');
    expect(response.citations[0].pageNumber).toBeDefined();
  });

  // 10. Doctor Clinical Copilot Allergy Contraindication Screening
  it('flags critical allergy warnings when doctor prescribes beta-lactams to Penicillin-allergic patient', () => {
    const patient = store.getPatients()[0]; // Has Penicillin allergy
    const docs = store.getDocumentsByPatient(patient.id);

    const insights = generateDoctorCopilotInsights(patient, docs, 'Tab Amoxicillin 500mg TDS');
    const allergyWarning = insights.find((i) => i.type === 'allergy_warning');

    expect(allergyWarning).toBeDefined();
    expect(allergyWarning?.severity).toBe('critical');
    expect(allergyWarning?.title).toContain('Penicillin Class Allergy');
  });
});
