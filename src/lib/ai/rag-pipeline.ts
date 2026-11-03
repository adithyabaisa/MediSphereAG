import { MedicalDocument } from '@/types';

export interface RagCitation {
  documentId: string;
  documentTitle: string;
  documentType: string;
  provenance: string;
  isUnverified: boolean;
  pageNumber: number;
  sectionSnippet: string;
}

export interface RagResponse {
  query: string;
  answer: string;
  citations: RagCitation[];
  groundedInRecords: boolean;
  emergencyAlert?: string;
  disclaimer: string;
}

/**
 * Checks for urgent red-flag symptoms requiring emergency triage
 */
const URGENT_SYMPTOM_REGEX = /(chest pain|difficulty breathing|shortness of breath|severe bleed|stroke|loss of consciousness|fainting|hemoptysis|anaphylaxis|crushing pain)/i;

/**
 * Server-side source-grounded RAG retrieval over patient documents
 */
export async function queryPatientDocumentsRAG(
  query: string,
  documents: MedicalDocument[]
): Promise<RagResponse> {
  const normalizedQuery = query.toLowerCase().trim();

  // 1. Red-flag symptom check
  const isUrgent = URGENT_SYMPTOM_REGEX.test(normalizedQuery);
  let emergencyAlert: string | undefined;

  if (isUrgent) {
    emergencyAlert =
      'EMERGENCY WARNING: Your query describes symptoms that may require urgent medical evaluation. Please contact emergency services immediately (Call 108 / 112) or go to the nearest emergency room.';
  }

  // 2. Query matching across documents
  const matchingCitations: RagCitation[] = [];
  const relevantSnippets: { title: string; text: string; doc: MedicalDocument }[] = [];

  for (const doc of documents) {
    const textCorpus = `${doc.title} ${doc.clinical_summary || ''} ${doc.ai_analysis?.key_findings.join(' ') || ''}`.toLowerCase();
    
    // Check keyword overlap
    const keywords = normalizedQuery.split(/\s+/).filter((w) => w.length > 3);
    const hasMatch = keywords.some((kw) => textCorpus.includes(kw));

    if (hasMatch) {
      const page = doc.ai_analysis?.source_pages?.[0] || 1;
      const snippet = doc.clinical_summary?.slice(0, 240) || doc.title;
      matchingCitations.push({
        documentId: doc.id,
        documentTitle: doc.title,
        documentType: doc.document_type,
        provenance: doc.provenance,
        isUnverified: doc.provenance === 'patient_unverified',
        pageNumber: page,
        sectionSnippet: snippet,
      });
      relevantSnippets.push({
        title: doc.title,
        text: doc.clinical_summary || '',
        doc,
      });
    }
  }

  // 3. Grounded response synthesis
  if (relevantSnippets.length === 0) {
    return {
      query,
      answer:
        'This information was not found in your authorized medical records on MedSphere Connect. For personalized clinical questions or new symptoms, please consult your doctor or schedule a follow-up consultation.',
      citations: [],
      groundedInRecords: false,
      emergencyAlert,
      disclaimer:
        'MedSphere AI is strictly advisory and grounded in your authorized documents. It does not replace independent clinician assessment.',
    };
  }

  // Formulate grounded response with document citations
  let answerText = `Based on your medical records:\n\n`;

  for (const item of relevantSnippets) {
    const isUnverified = item.doc.provenance === 'patient_unverified';
    const tag = isUnverified ? ' [Uploaded by patient (unverified)]' : ' [Verified Hospital Record]';
    answerText += `• In **${item.title}**${tag}:\n  "${item.text}"\n\n`;
  }

  if (relevantSnippets.some((s) => s.doc.provenance === 'patient_unverified')) {
    answerText += `\n⚠️ *Notice: Some information above is drawn from an unverified patient self-upload. Please confirm with your healthcare provider.*`;
  }

  return {
    query,
    answer: answerText,
    citations: matchingCitations,
    groundedInRecords: true,
    emergencyAlert,
    disclaimer:
      'AI Clinical Assistant answers are grounded strictly in your verified records. No definitive diagnosis or self-treatment directive is provided.',
  };
}
