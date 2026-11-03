'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { store } from '@/lib/db/store';
import { LabOrder } from '@/types';
import {
  FlaskConical,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Upload,
  ArrowRight,
  FileText,
  User,
  Building2,
} from 'lucide-react';

export default function LabWorkspacePage() {
  const [orders, setOrders] = useState<LabOrder[]>([]);

  useEffect(() => {
    loadOrders();
    const unsub = store.subscribe(loadOrders);
    return unsub;
  }, []);

  const loadOrders = () => {
    setOrders(store.getLabOrders('hosp-max-saket'));
  };

  const pendingOrders = orders.filter((o) => o.status !== 'finalized');
  const finalizedOrders = orders.filter((o) => o.status === 'finalized');

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-indigo-700" />
            <h1 className="text-2xl font-extrabold text-slate-900">Hospital Laboratory Workspace</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Diagnostic order dispatch queue, report document upload, structured biochemical value capture, and pathologist sign-off.
          </p>
        </div>

        <div className="text-xs text-slate-600 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          Technician: <strong>Praveen Kumar</strong> (Certified Pathologist Desk)
        </div>
      </div>

      {/* Pending Orders Queue */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Pending Lab Test Orders</h2>
            <p className="text-xs text-slate-500">
              Orders placed by attending clinicians requiring specimen collection, analysis, and report generation.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            {pendingOrders.length} Pending Analysis
          </span>
        </div>

        <div className="space-y-3">
          {pendingOrders.length > 0 ? (
            pendingOrders.map((order) => (
              <div
                key={order.id}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 hover:bg-indigo-50/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{order.test_name}</span>
                    <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                      Order #{order.id}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                      Priority: {order.priority}
                    </span>
                  </div>

                  <p className="text-slate-600">
                    Patient: <strong>{order.patient_name}</strong> (Code: <span className="font-mono text-teal-800 font-bold">{order.patient_code}</span>)
                  </p>

                  <div className="flex items-center gap-4 text-slate-500 text-[11px] pt-1">
                    <span>Ordering Doctor: {order.doctor_name}</span>
                    <span>Indication: {order.clinical_indication}</span>
                    <span>Received: {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <Link
                  href={`/hospital/lab/upload/${order.id}`}
                  className="px-4 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors shadow-xs self-start sm:self-auto shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" /> Enter Results & Sign Off
                </Link>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">No pending lab orders in queue.</p>
          )}
        </div>
      </div>

      {/* Finalized & Dispatched Reports */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Finalized Diagnostic Reports</h2>
            <p className="text-xs text-slate-500">
              Published directly to patient's longitudinal record with immutable SHA-256 hash.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            {finalizedOrders.length} Published
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {finalizedOrders.map((order) => (
            <div key={order.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{order.test_name}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Finalized & Immutable
                  </span>
                </div>
                <p className="text-slate-600">
                  Patient: {order.patient_name} ({order.patient_code}) • Ordering Doctor: {order.doctor_name}
                </p>
                <p className="text-[11px] text-slate-400">
                  Technician: {order.technician_name} • Sign-off: {order.pathologist_signoff_name} • Dispatched:{' '}
                  {order.finalized_at ? new Date(order.finalized_at).toLocaleDateString() : 'Today'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/patient/history"
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" /> View in Patient Timeline
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
