'use client';

import React, { useState, useEffect } from 'react';
import { store } from '@/lib/db/store';
import { queryPatientDocumentsRAG, RagResponse } from '@/lib/ai/rag-pipeline';
import { Patient, MedicalDocument } from '@/types';
import {
  Bot,
  Send,
  Sparkles,
  AlertTriangle,
  FileCheck,
  ShieldAlert,
  Info,
  Building2,
  PhoneCall,
  User,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  citations?: RagResponse['citations'];
  emergencyAlert?: string;
  isUnverifiedWarning?: boolean;
}

export default function PatientAiChatPage() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [queryInput, setQueryInput] = useState('');
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: 'Hello Priya. I am your MedSphere AI Health Assistant. I can assist you in understanding your lab tests, consultation notes, and echocardiogram reports on file.\n\nNote: I am strictly advisory and grounded in your authorized medical records. I cannot issue definitive diagnoses or direct you to change prescriptions without your doctor.',
      timestamp: 'Just now',
    },
  ]);

  useEffect(() => {
    const user = store.getCurrentUser();
    const patients = store.getPatients();
    const pat = (user && patients.find((p) => p.email === user.email)) || patients[0];
    setPatient(pat);
    if (pat) {
      setDocuments(store.getDocumentsByPatient(pat.id));
    }
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || queryInput;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQueryInput('');
    setLoading(true);

    // Call RAG pipeline over patient's authorized documents
    const response = await queryPatientDocumentsRAG(query, documents);

    const hasUnverifiedCitation = response.citations.some((c) => c.isUnverified);

    const assistantMsg: ChatMessage = {
      id: `msg-ai-${Date.now()}`,
      sender: 'assistant',
      text: response.answer,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      citations: response.citations,
      emergencyAlert: response.emergencyAlert,
      isUnverifiedWarning: hasUnverifiedCitation,
    };

    setMessages((prev) => [...prev, assistantMsg]);
    setLoading(false);
  };

  const samplePrompts = [
    'What were the findings in my recent 2D Echocardiogram?',
    'What was my fasting blood glucose level on my last lab test?',
    'What medications were prescribed by Dr. Aisha Sen?',
    'I have sudden crushing chest pain and breathlessness.',
  ];

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 h-[calc(100vh-4rem)] flex flex-col">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs mb-4 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
              MedSphere AI Clinical Assistant
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                Source-Grounded RAG
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Assisting: <strong>{patient?.full_name || 'Priya Sharma'}</strong> • Grounded in {documents.length} verified records
            </p>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 hidden sm:block">
          Advisory Only • No Definitive Prescriptions
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.sender === 'user'
                  ? 'bg-slate-900 text-white'
                  : 'bg-teal-700 text-white'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[85%] sm:max-w-xl space-y-2`}>
              {/* Emergency Alert Banner if triggered */}
              {msg.emergencyAlert && (
                <div className="p-3 bg-rose-600 text-white rounded-2xl text-xs font-semibold flex items-start gap-2 shadow-md animate-bounce">
                  <PhoneCall className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">{msg.emergencyAlert}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <a
                        href="tel:108"
                        className="px-3 py-1 bg-white text-rose-700 font-bold rounded-lg text-xs hover:bg-rose-50"
                      >
                        Call 108 Emergency
                      </a>
                      <a
                        href="tel:112"
                        className="px-3 py-1 bg-slate-900 text-white font-bold rounded-lg text-xs"
                      >
                        Call 112
                      </a>
                    </div>
                  </div>
                </div>
              )}

              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-slate-900 text-white rounded-tr-none'
                    : 'bg-white border border-slate-200/90 text-slate-800 shadow-2xs rounded-tl-none whitespace-pre-line'
                }`}
              >
                {msg.text}
              </div>

              {/* Citations block for AI messages */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-xl space-y-1.5 text-[11px] text-teal-950">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-teal-800 flex items-center gap-1">
                    <FileCheck className="w-3.5 h-3.5 text-teal-700" /> Grounded In Source Records ({msg.citations.length}):
                  </span>
                  {msg.citations.map((c, i) => (
                    <div
                      key={i}
                      className="p-1.5 bg-white rounded-lg border border-teal-200 flex items-center justify-between gap-2"
                    >
                      <span className="font-semibold truncate">
                        • {c.documentTitle} (Page {c.pageNumber})
                      </span>
                      {c.isUnverified ? (
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 font-bold rounded text-[9px] shrink-0">
                          Patient Unverified
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[9px] shrink-0">
                          Hospital Verified
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <span className="text-[10px] text-slate-400 block px-1">
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-500 shadow-2xs">
              Retrieving authorized records and formulating source-grounded response...
            </div>
          </div>
        )}
      </div>

      {/* Preset sample questions */}
      <div className="py-2 overflow-x-auto flex gap-2 shrink-0">
        {samplePrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p)}
            className="px-3 py-1.5 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-full text-[11px] text-slate-700 hover:text-teal-900 transition-colors whitespace-nowrap shadow-2xs"
          >
            "{p}"
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="pt-2 shrink-0"
      >
        <div className="relative flex items-center">
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Ask a question about your lab tests, diagnosis, or prescriptions..."
            className="w-full pl-4 pr-12 py-3 rounded-2xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-xs sm:text-sm bg-white shadow-xs"
          />
          <button
            type="submit"
            disabled={!queryInput.trim() || loading}
            className="absolute right-2.5 p-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-40 text-white rounded-xl transition-colors shadow-xs"
            title="Send Query"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[11px] text-slate-400 text-center mt-1.5">
          MedSphere AI provides educational assistance grounded in your records. In emergencies, dial 108.
        </p>
      </form>
    </main>
  );
}
