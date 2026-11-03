'use client';

import React, { useState } from 'react';
import {
  Building2,
  Search,
  Filter,
  MapPin,
  CheckCircle2,
  Phone,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface DiagnosticCenter {
  id: string;
  name: string;
  address: string;
  city: string;
  distance: string;
  accreditation: string[];
  contact: string;
  openingHours: string;
  verifiedPrices: { test: string; price: number; turnaround: string }[];
}

const SAMPLE_CENTERS: DiagnosticCenter[] = [
  {
    id: 'diag-1',
    name: 'Max Labs & Diagnostics Saket',
    address: 'Press Enclave Marg, Saket',
    city: 'New Delhi',
    distance: '1.2 km away',
    accreditation: ['NABL Certified', 'ISO 15189'],
    contact: '+91 11 2651 5050',
    openingHours: '24x7 Sample Collection',
    verifiedPrices: [
      { test: 'Complete Blood Count (CBC)', price: 450, turnaround: '4 Hours' },
      { test: 'Comprehensive Metabolic Panel (CMP)', price: 1100, turnaround: '6 Hours' },
      { test: 'HbA1c Glycated Hemoglobin', price: 600, turnaround: '4 Hours' },
      { test: 'Lipid Profile', price: 750, turnaround: '6 Hours' },
      { test: '2D Echocardiogram with Doppler', price: 2800, turnaround: 'Immediate' },
    ],
  },
  {
    id: 'diag-2',
    name: 'Apollo Diagnostics & Advanced Imaging',
    address: 'Sarita Vihar, Mathura Road',
    city: 'New Delhi',
    distance: '3.8 km away',
    accreditation: ['NABL', 'CAP Accredited'],
    contact: '+91 11 2692 5858',
    openingHours: '07:00 AM - 09:00 PM',
    verifiedPrices: [
      { test: 'Complete Blood Count (CBC)', price: 420, turnaround: '4 Hours' },
      { test: 'Comprehensive Metabolic Panel (CMP)', price: 1050, turnaround: '5 Hours' },
      { test: 'Thyroid Panel (T3, T4, TSH)', price: 650, turnaround: '6 Hours' },
      { test: 'Vitamin D3 & B12 Panel', price: 1400, turnaround: 'Same Day' },
    ],
  },
  {
    id: 'diag-3',
    name: 'South Extension Imaging & MRI Center',
    address: 'Part 2, South Extension Market',
    city: 'New Delhi',
    distance: '5.1 km away',
    accreditation: ['AERB Certified', 'NABH'],
    contact: '+91 11 4164 8899',
    openingHours: '08:00 AM - 08:00 PM',
    verifiedPrices: [
      { test: 'High-Resolution Chest CT', price: 3500, turnaround: '2 Hours' },
      { test: 'Brain MRI (1.5 Tesla)', price: 5200, turnaround: '4 Hours' },
      { test: 'Whole Abdomen Ultrasound', price: 1600, turnaround: 'Immediate' },
    ],
  },
];

export default function DiagnosticCenterFinderPage() {
  const [searchTest, setSearchTest] = useState('');
  const [maxPrice, setMaxPrice] = useState(6000);

  const filteredCenters = SAMPLE_CENTERS.map((center) => {
    const matchingTests = center.verifiedPrices.filter((t) => {
      const matchName = t.test.toLowerCase().includes(searchTest.toLowerCase());
      const matchPrice = t.price <= maxPrice;
      return matchName && matchPrice;
    });

    return {
      ...center,
      visibleTests: matchingTests,
    };
  }).filter((c) => c.visibleTests.length > 0 || !searchTest);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-teal-700" />
          <h1 className="text-2xl font-extrabold text-slate-900">Diagnostic Center Finder</h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Explore accredited pathology and radiology centers nearby with published, verified tariffs.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTest}
              onChange={(e) => setSearchTest(e.target.value)}
              placeholder="Search by test name (e.g. CBC, CMP, Echocardiogram, MRI, HbA1c)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 shrink-0">
            <span>Max Price: ₹{maxPrice}</span>
            <input
              type="range"
              min="500"
              max="6000"
              step="250"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-24 accent-teal-600"
            />
          </div>
        </div>
      </div>

      {/* Centers Cards */}
      <div className="space-y-6">
        {filteredCenters.map((center) => (
          <div
            key={center.id}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-lg font-bold text-slate-900">{center.name}</h3>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Center
                  </span>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {center.address}, {center.city} • <strong className="text-teal-700">{center.distance}</strong>
                </p>
                <p className="text-[11px] text-slate-600 mt-1">
                  Accreditation: {center.accreditation.join(' • ')} • Hours: {center.openingHours}
                </p>
              </div>

              <a
                href={`tel:${center.contact}`}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors self-start"
              >
                <Phone className="w-3.5 h-3.5 text-slate-500" /> {center.contact}
              </a>
            </div>

            {/* Verified Tariffs Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Verified Published Test Tariffs
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Test Procedure</th>
                      <th className="p-3">Verified Tariff</th>
                      <th className="p-3">Turnaround Time</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {(center.visibleTests.length > 0 ? center.visibleTests : center.verifiedPrices).map((t, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3 font-semibold">{t.test}</td>
                        <td className="p-3 font-mono font-bold text-teal-800">₹{t.price}</td>
                        <td className="p-3 text-slate-500">{t.turnaround}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => alert(`Order request dispatched to ${center.name} for ${t.test}.`)}
                            className="px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-[11px] font-semibold"
                          >
                            Order Test
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
