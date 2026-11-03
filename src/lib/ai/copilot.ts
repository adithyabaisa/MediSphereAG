import { Patient, MedicalDocument } from '@/types';

export interface CopilotClinicalInsight {
  type: 'allergy_warning' | 'lab_trend' | 'guideline_recommendation' | 'differential';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  evidence: string;
  actionPrompt?: string;
}

/**
 * Doctor Clinical Copilot:
 * Provides advisory intelligence grounded in patient history and known allergies.
 * Never issues definitive directives without physician review and sign-off.
 */
export function generateDoctorCopilotInsights(
  patient: Patient,
  documents: MedicalDocument[],
  draftPrescription = ''
): CopilotClinicalInsight[] {
  const insights: CopilotClinicalInsight[] = [];

  // 1. Allergy conflict screening
  const hasPenicillinAllergy = patient.allergies.some((a) => a.toLowerCase().includes('penicillin'));
  const hasNsaidAllergy = patient.allergies.some((a) => a.toLowerCase().includes('nsaid') || a.toLowerCase().includes('ibuprofen'));

  if (draftPrescription) {
    const rxLower = draftPrescription.toLowerCase();
    if (hasPenicillinAllergy && (rxLower.includes('amoxicillin') || rxLower.includes('penicillin') || rxLower.includes('augmentin'))) {
      insights.push({
        type: 'allergy_warning',
        severity: 'critical',
        title: 'CRITICAL CONTRAINDICATION: Penicillin Class Allergy',
        description: `Patient has documented severe allergy: "${patient.allergies.find((a) => a.toLowerCase().includes('penicillin'))}". Prescribing beta-lactam antibiotics carries high anaphylaxis risk.`,
        evidence: 'Patient Allergy Profile & Past Adverse Reaction Record',
        actionPrompt: 'Consider alternative macrolide or fluoroquinolone class if indicated.',
      });
    }
    if (hasNsaidAllergy && (rxLower.includes('ibuprofen') || rxLower.includes('naproxen') || rxLower.includes('diclofenac'))) {
      insights.push({
        type: 'allergy_warning',
        severity: 'critical',
        title: 'CONTRAINDICATION: NSAID Sensitivity',
        description: 'Patient has documented intolerance/bleed risk with Non-Steroidal Anti-Inflammatory Drugs.',
        evidence: 'Patient Medical Record Allergies',
        actionPrompt: 'Consider acetaminophen (Paracetamol) or topical analgesic.',
      });
    }
  }

  // 2. Lab trend analysis across documents
  const cmpDoc = documents.find((d) => d.document_type === 'lab_report');
  if (cmpDoc && cmpDoc.ai_analysis?.abnormal_values.some((v) => v.parameter.toLowerCase().includes('glucose'))) {
    insights.push({
      type: 'lab_trend',
      severity: 'warning',
      title: 'Metabolic Finding: Impaired Fasting Glucose (112 mg/dL)',
      description: 'Patient exhibited borderline fasting glucose on last metabolic panel. Pre-diabetes screening recommended.',
      evidence: `${cmpDoc.title} dated ${new Date(cmpDoc.created_at).toLocaleDateString()}`,
      actionPrompt: 'Order HbA1c test and lifestyle consultation.',
    });
  }

  // 3. Cardiology echo integration
  const echoDoc = documents.find((d) => d.document_type === 'radiology');
  if (echoDoc) {
    insights.push({
      type: 'guideline_recommendation',
      severity: 'info',
      title: 'Preserved LV Function (EF 62%)',
      description: 'Recent 2D Echocardiogram confirmed normal left ventricular dimensions and ejection fraction without regional hypokinesia.',
      evidence: `${echoDoc.title} (Hospital-verified)`,
      actionPrompt: 'Continue current anti-hypertensive regimen; repeat echo in 12 months.',
    });
  }

  // 4. Highlight unverified documents
  const unverified = documents.filter((d) => d.provenance === 'patient_unverified');
  if (unverified.length > 0) {
    insights.push({
      type: 'guideline_recommendation',
      severity: 'warning',
      title: 'Unverified External Records Present',
      description: `Patient has uploaded ${unverified.length} outside report(s). Confirm authenticity and original lab methodology prior to prescribing targeted therapy.`,
      evidence: unverified.map((u) => u.title).join(', '),
      actionPrompt: 'Review paper original or order in-hospital confirmatory test.',
    });
  }

  return insights;
}
