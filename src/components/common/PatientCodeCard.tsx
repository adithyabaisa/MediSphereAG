'use client';

import React, { useState } from 'react';
import { Copy, Check, QrCode, ShieldAlert, Printer } from 'lucide-react';
import { generateQrSvg } from '@/lib/utils/code-generator';

interface PatientCodeCardProps {
  patientCode: string;
  patientName: string;
  dob?: string;
  phone?: string;
  allowPrint?: boolean;
}

export const PatientCodeCard: React.FC<PatientCodeCardProps> = ({
  patientCode,
  patientName,
  dob,
  phone,
  allowPrint = true,
}) => {
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(patientCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const qrSvg = generateQrSvg(patientCode, 180);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-teal-700/50 relative overflow-hidden">
        {/* Background decorative circles */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 font-bold text-xs">
              MC
            </div>
            <span className="text-xs uppercase tracking-wider text-teal-200 font-semibold">
              MedSphere Patient ID Card
            </span>
          </div>
          <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full border border-teal-400/20">
            Identifier Only
          </span>
        </div>

        <div className="mb-4 relative z-10">
          <p className="text-xs text-teal-200/80 mb-0.5">Patient Name</p>
          <h3 className="text-lg font-bold tracking-tight text-white">{patientName}</h3>
          {(dob || phone) && (
            <p className="text-xs text-teal-300/80 mt-0.5">
              {dob ? `DOB: ${dob}` : ''} {phone ? `• ${phone}` : ''}
            </p>
          )}
        </div>

        {/* Code Bar */}
        <div className="bg-black/40 backdrop-blur-sm rounded-xl p-3 border border-teal-500/30 flex items-center justify-between mb-3 relative z-10">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-teal-300 font-semibold block">
              Unique Patient Code
            </span>
            <span className="font-mono text-xl sm:text-2xl font-bold tracking-wider text-teal-100">
              {patientCode}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg bg-teal-600/50 hover:bg-teal-500/60 text-white transition-colors flex items-center gap-1.5 text-xs border border-teal-400/30"
              title="Copy Patient Code"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={() => setShowQrModal(true)}
              className="p-2 rounded-lg bg-teal-600/50 hover:bg-teal-500/60 text-white transition-colors flex items-center gap-1.5 text-xs border border-teal-400/30"
              title="View QR Code"
            >
              <QrCode className="w-4 h-4 text-teal-200" />
              <span className="hidden sm:inline">QR</span>
            </button>

            {allowPrint && (
              <button
                onClick={handlePrint}
                className="p-2 rounded-lg bg-teal-600/50 hover:bg-teal-500/60 text-white transition-colors flex items-center gap-1.5 text-xs border border-teal-400/30"
                title="Print Patient Card"
              >
                <Printer className="w-4 h-4 text-teal-200" />
                <span className="hidden sm:inline">Print</span>
              </button>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <div className="flex items-start gap-1.5 text-[11px] text-teal-200/90 bg-teal-950/40 p-2 rounded-lg border border-teal-600/30">
          <ShieldAlert className="w-3.5 h-3.5 text-teal-300 shrink-0 mt-0.5" />
          <span>
            <strong>Identifier, never a credential:</strong> Sharing this code allows hospital lookups, but medical records can only be accessed with your explicit, active consent.
          </span>
        </div>
      </div>

      {/* QR Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h4 className="text-base font-bold text-slate-900 mb-1">Patient Check-In QR</h4>
            <p className="text-xs text-slate-500 mb-4">
              Scan at verified hospital front desk or clinical intake
            </p>

            <div
              className="inline-block p-4 bg-slate-50 border border-slate-200 rounded-xl mb-4"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />

            <p className="font-mono text-lg font-bold text-teal-800 mb-1">{patientCode}</p>
            <p className="text-xs font-medium text-slate-700 mb-5">{patientName}</p>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-800 text-white font-medium rounded-xl text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
