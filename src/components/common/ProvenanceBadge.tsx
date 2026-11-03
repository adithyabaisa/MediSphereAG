import React from 'react';
import { ProvenanceType } from '@/types';
import { Building2, FlaskConical, AlertTriangle, Scan, Sparkles } from 'lucide-react';

interface ProvenanceBadgeProps {
  provenance: ProvenanceType;
  showIcon?: boolean;
  className?: string;
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({
  provenance,
  showIcon = true,
  className = '',
}) => {
  switch (provenance) {
    case 'hospital_generated':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-xs ${className}`}
        >
          {showIcon && <Building2 className="w-3.5 h-3.5 text-emerald-600" />}
          Hospital-generated
        </span>
      );

    case 'lab_generated':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-200/80 shadow-xs ${className}`}
        >
          {showIcon && <FlaskConical className="w-3.5 h-3.5 text-indigo-600" />}
          Lab-generated
        </span>
      );

    case 'patient_unverified':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-300 shadow-xs ${className}`}
          title="This document was uploaded by the patient without verified hospital specimen chain-of-custody."
        >
          {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
          Uploaded by patient (unverified)
        </span>
      );

    case 'hospital_scanned_on_behalf':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-800 border border-sky-200 shadow-xs ${className}`}
        >
          {showIcon && <Scan className="w-3.5 h-3.5 text-sky-600" />}
          Scanned by hospital on patient behalf
        </span>
      );

    case 'ai_generated_summary':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-800 border border-purple-200 shadow-xs ${className}`}
        >
          {showIcon && <Sparkles className="w-3.5 h-3.5 text-purple-600" />}
          AI-generated summary (Advisory)
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 ${className}`}
        >
          Document
        </span>
      );
  }
};
