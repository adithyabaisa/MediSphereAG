'use client';

import React, { useState, useEffect } from 'react';
import { store } from '@/lib/db/store';
import { Hospital, HospitalStaff, AuditLog, UserRole } from '@/types';
import {
  Building2,
  Users,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  Lock,
  Stethoscope,
  FlaskConical,
  ClipboardList,
  Building,
  Plus,
} from 'lucide-react';

export default function HospitalAdminPage() {
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [staffList, setStaffList] = useState<HospitalStaff[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('doctor');
  const [inviteSpecialization, setInviteSpecialization] = useState('Neurology');
  const [inviteQualifications, setInviteQualifications] = useState('MBBS, MD, DM');
  const [inviteRegNo, setInviteRegNo] = useState('DMC-44912-DELHI');
  const [inviteFee, setInviteFee] = useState(1500);

  useEffect(() => {
    loadHospitalAdminData();
    const unsub = store.subscribe(loadHospitalAdminData);
    return unsub;
  }, []);

  const loadHospitalAdminData = () => {
    const hosp = store.getHospitalById('hosp-max-saket') || store.getHospitals()[0];
    setHospital(hosp);
    if (hosp) {
      setStaffList(store.getStaffByHospital(hosp.id));
      setAuditLogs(store.getAuditLogs(hosp.id));
    }
  };

  const handleToggleStaffStatus = (staffId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'deactivated' : 'active';
    store.setStaffStatus(staffId, newStatus);
    loadHospitalAdminData();
  };

  const handleInviteStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospital || !inviteName.trim() || !inviteEmail.trim()) return;

    store.inviteStaff(hospital.id, {
      full_name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      specialization: inviteSpecialization,
      qualifications: inviteQualifications,
      professional_reg_no: inviteRegNo,
      department_name: inviteSpecialization,
      experience_years: 10,
      consultation_fee: Number(inviteFee),
    });

    setShowInviteModal(false);
    setInviteName('');
    setInviteEmail('');
    loadHospitalAdminData();
  };

  if (!hospital) return null;

  const isVerified = hospital.status === 'verified';

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-slate-800" />
            <h1 className="text-2xl font-extrabold text-slate-900">Hospital Administration & Operations</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Organization credentials, clinical staff lifecycle, permissions, and operational audit metadata.
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="self-start sm:self-auto px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
        >
          <UserPlus className="w-4 h-4" /> Provision / Invite Staff Profile
        </button>
      </div>

      {/* Operational Privilege Notice (Section 5 Requirement) */}
      <div className="p-4 bg-slate-100 border border-slate-300 rounded-2xl flex items-start gap-3 text-xs text-slate-800">
        <Lock className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Operational Governance (Zero Clinical Access)</p>
          <p className="text-slate-600 mt-0.5">
            Hospital Administrators manage facilities, staff credentials, and compliance logs. In accordance with healthcare privacy standards, administrators have no access to patient medical records, consultation notes, or diagnostic documents.
          </p>
        </div>
      </div>

      {/* Hospital Establishment Credentials Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{hospital.legal_name}</h2>
              {isVerified ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> State Verified Facility
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800">
                  {hospital.status.toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Type: {hospital.hospital_type} • Reg: {hospital.registration_number}
            </p>
          </div>

          <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            Signatory: <strong>{hospital.signatory_name}</strong> ({hospital.signatory_designation})
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block mb-0.5">Active Clinicians</span>
            <span className="text-lg font-bold text-slate-900">
              {staffList.filter((s) => s.status === 'active').length}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block mb-0.5">Clinical Specialities</span>
            <span className="text-lg font-bold text-slate-900">12 Active</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block mb-0.5">Accreditation</span>
            <span className="text-xs font-bold text-teal-800">
              {hospital.accreditation?.join(', ') || 'State Licensed'}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block mb-0.5">MFA Enforcement</span>
            <span className="text-xs font-bold text-emerald-700">100% Active Staff</span>
          </div>
        </div>
      </div>

      {/* Staff Management Directory */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Staff Profiles & Role Directory</h2>
            <p className="text-xs text-slate-500">
              Personal logins linked to hospital. Deactivation terminates access immediately.
            </p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-700 font-medium px-3 py-1 rounded-full">
            {staffList.length} Accounts
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {staffList.map((staff) => {
            const isActive = staff.status === 'active';

            return (
              <div
                key={staff.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{staff.full_name}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {staff.role.replace('_', ' ')}
                    </span>
                    {isActive ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Active Profile
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                        Deactivated
                      </span>
                    )}
                  </div>

                  <p className="text-slate-600">
                    {staff.email} • {staff.specialization || 'Clinical Services'} {staff.qualifications ? `(${staff.qualifications})` : ''}
                  </p>

                  {staff.professional_reg_no && (
                    <p className="text-[11px] text-teal-800 font-mono">
                      License #{staff.professional_reg_no} • Consultation Fee: ₹{staff.consultation_fee}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleStaffStatus(staff.id, staff.status)}
                    className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
                      isActive
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {isActive ? 'Deactivate Instantly' : 'Reactivate Profile'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Operational Audit Log (Metadata only) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-700" />
            <h2 className="text-base font-bold text-slate-900">Hospital Operational Audit Log</h2>
          </div>
          <span className="text-xs text-slate-400">Metadata Only • Non-Clinical</span>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs flex items-center justify-between gap-4"
            >
              <div>
                <span className="font-bold text-slate-800">{log.event_name}</span>
                <p className="text-slate-500 text-[11px]">
                  Actor: {log.actor_name || 'System'} • {JSON.stringify(log.details)}
                </p>
              </div>
              <span className="text-[11px] text-slate-400 font-mono shrink-0">
                {new Date(log.occurred_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Provision Staff Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-1">Provision Clinician / Staff Account</h3>
            <p className="text-xs text-slate-500 mb-4">
              Invites a verified staff member linked to {hospital.legal_name}.
            </p>

            <form onSubmit={handleInviteStaff} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Dr. Rohan Kapoor"
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Email *</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="rohan@maxsaket.medsphere.io"
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role *</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="doctor">Doctor</option>
                    <option value="lab_staff">Lab Staff (Technician / Pathologist)</option>
                    <option value="registrar">Registrar (Front Desk)</option>
                    <option value="hospital_admin">Hospital Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department / Specialty</label>
                  <input
                    type="text"
                    value={inviteSpecialization}
                    onChange={(e) => setInviteSpecialization(e.target.value)}
                    placeholder="Neurology"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {inviteRole === 'doctor' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Medical Council Reg # *
                      </label>
                      <input
                        type="text"
                        required
                        value={inviteRegNo}
                        onChange={(e) => setInviteRegNo(e.target.value)}
                        placeholder="DMC-9021-DELHI"
                        className="w-full p-2.5 rounded-xl border border-slate-300"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Qualifications
                      </label>
                      <input
                        type="text"
                        value={inviteQualifications}
                        onChange={(e) => setInviteQualifications(e.target.value)}
                        placeholder="MBBS, MD, DM"
                        className="w-full p-2.5 rounded-xl border border-slate-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Consultation Fee (₹)
                    </label>
                    <input
                      type="number"
                      value={inviteFee}
                      onChange={(e) => setInviteFee(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-300"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold shadow-xs"
                >
                  Provision Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
