'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { store } from '@/lib/db/store';
import { LabOrder, LabResultParameter } from '@/types';
import {
  FlaskConical,
  Upload,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export default function LabUploadPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId as string;

  const [order, setOrder] = useState<LabOrder | null>(null);
  const [technicianName, setTechnicianName] = useState('Praveen Kumar (LT-49102)');
  const [pathologistName, setPathologistName] = useState('Dr. Neeraj Mehra (MD Pathology)');
  const [fileName, setFileName] = useState('diagnostic_test_results.pdf');

  // Structured test parameter rows
  const [parameters, setParameters] = useState<LabResultParameter[]>([
    {
      test_parameter: 'Glycated Hemoglobin (HbA1c)',
      measured_value: '5.6',
      unit: '%',
      reference_range: '4.0 - 5.6',
      is_abnormal: false,
    },
    {
      test_parameter: 'Estimated Average Glucose (eAG)',
      measured_value: '114',
      unit: 'mg/dL',
      reference_range: '70 - 126',
      is_abnormal: false,
    },
    {
      test_parameter: 'Total Cholesterol',
      measured_value: '188',
      unit: 'mg/dL',
      reference_range: '125 - 200',
      is_abnormal: false,
    },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const o = store.getLabOrderById(orderId) || store.getLabOrders()[0];
    if (o) setOrder(o);
  }, [orderId]);

  const handleAddRow = () => {
    setParameters([
      ...parameters,
      {
        test_parameter: '',
        measured_value: '',
        unit: 'mg/dL',
        reference_range: '',
        is_abnormal: false,
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const handleUpdateRow = (index: number, field: keyof LabResultParameter, value: any) => {
    const updated = [...parameters];
    updated[index] = { ...updated[index], [field]: value };
    setParameters(updated);
  };

  const handleFinalizeReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setSubmitting(true);

    setTimeout(() => {
      store.finalizeLabOrder(order.id, {
        technician_name: technicianName,
        pathologist_signoff_name: pathologistName,
        results: parameters,
        uploaded_file_name: fileName,
      });

      setSubmitting(false);
      setSuccess(true);
      setTimeout(() => {
        router.push('/hospital/lab');
      }, 1500);
    }, 600);
  };

  if (!order) return null;

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        href="/hospital/lab"
        className="text-xs font-semibold text-slate-500 hover:text-indigo-700 flex items-center gap-1.5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Lab Queue
      </Link>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        {/* Order Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                Order #{order.id}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500">Priority: {order.priority}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">{order.test_name}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Patient: <strong>{order.patient_name}</strong> ({order.patient_code}) • Ordering Doctor: {order.doctor_name}
            </p>
          </div>
          <span className="px-3 py-1 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-full font-bold text-xs self-start sm:self-auto">
            Lab Upload & Sign-Off
          </span>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Report Published Successfully!</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              The finalized diagnostic report has been committed to the patient record with immutable SHA-256 integrity hash and certified pathologist sign-off.
            </p>
          </div>
        ) : (
          <form onSubmit={handleFinalizeReport} className="space-y-6 text-xs">
            {/* 1. File Upload Section */}
            <div>
              <h3 className="font-bold text-slate-800 uppercase tracking-wider mb-2">
                1. Attach Original Diagnostic Report PDF
              </h3>
              <div className="p-6 border-2 border-dashed border-indigo-200 rounded-2xl bg-indigo-50/20 text-center">
                <FileText className="w-8 h-8 text-indigo-700 mx-auto mb-2" />
                <p className="font-bold text-slate-900">{fileName}</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Supported formats: PDF, Scanned TIFF, JPG (Max 25MB). Auto-computed SHA-256 on save.
                </p>
              </div>
            </div>

            {/* 2. Structured Biochemical Values */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-bold text-slate-800 uppercase tracking-wider">
                    2. Structured Biochemical & Physiological Values
                  </h3>
                  <p className="text-slate-500 text-[11px]">
                    Allows longitudinal trending, AI comparison, and normal-range alerting
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Parameter Row
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Parameter Name</th>
                      <th className="p-3">Measured Value</th>
                      <th className="p-3">Unit</th>
                      <th className="p-3">Reference Interval</th>
                      <th className="p-3">Flag</th>
                      <th className="p-3 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parameters.map((param, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2.5">
                          <input
                            type="text"
                            required
                            value={param.test_parameter}
                            onChange={(e) => handleUpdateRow(idx, 'test_parameter', e.target.value)}
                            placeholder="e.g. Fasting Glucose"
                            className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                          />
                        </td>
                        <td className="p-2.5 w-28">
                          <input
                            type="text"
                            required
                            value={param.measured_value}
                            onChange={(e) => handleUpdateRow(idx, 'measured_value', e.target.value)}
                            placeholder="5.6"
                            className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs font-bold"
                          />
                        </td>
                        <td className="p-2.5 w-24">
                          <input
                            type="text"
                            value={param.unit}
                            onChange={(e) => handleUpdateRow(idx, 'unit', e.target.value)}
                            placeholder="mg/dL"
                            className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                          />
                        </td>
                        <td className="p-2.5 w-36">
                          <input
                            type="text"
                            value={param.reference_range}
                            onChange={(e) => handleUpdateRow(idx, 'reference_range', e.target.value)}
                            placeholder="70 - 99"
                            className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                          />
                        </td>
                        <td className="p-2.5 w-32">
                          <select
                            value={param.is_abnormal ? 'abnormal' : 'normal'}
                            onChange={(e) => handleUpdateRow(idx, 'is_abnormal', e.target.value === 'abnormal')}
                            className="w-full p-2 rounded-lg border border-slate-300 text-xs bg-white"
                          >
                            <option value="normal">Normal</option>
                            <option value="abnormal">Abnormal (Flag)</option>
                          </select>
                        </td>
                        <td className="p-2.5 text-right w-12">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Formal Sign-Off */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider">
                3. Pathologist Verification & Sign-Off
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Analyzing Lab Technician
                  </label>
                  <input
                    type="text"
                    required
                    value={technicianName}
                    onChange={(e) => setTechnicianName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Certified Pathologist Sign-Off *
                  </label>
                  <input
                    type="text"
                    required
                    value={pathologistName}
                    onChange={(e) => setPathologistName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  required
                  defaultChecked
                  className="rounded-sm text-indigo-600 focus:ring-indigo-500 mt-0.5"
                />
                <span className="text-slate-600">
                  I certify that all measurements have been calibrated against certified laboratory controls. Upon finalization, this report becomes immutable and immediately appears in the patient's longitudinal dashboard.
                </span>
              </label>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                href="/hospital/lab"
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white rounded-xl font-bold shadow-md transition-colors"
              >
                {submitting ? 'Committing & Publishing...' : 'Finalize & Publish to Patient Record'}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
