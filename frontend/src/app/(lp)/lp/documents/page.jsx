'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Loader2,
  FileCheck,
  Building2,
  Calendar,
  ArrowRight
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import LPNoProfileError from '@/components/portal/LPNoProfileError';

export default function LPDocumentsPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [errorStatus, setErrorStatus] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/deals/lp/documents/');
      setDocuments(res.data.results || res.data || []);
    } catch (err) {
      if (err.response?.status === 404) {
        setErrorStatus(404);
      } else {
        toast.error('Failed to load your documents');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (docId, fileName, docType) => {
    try {
      const endpoint = docType === 'CAPITAL_ACCOUNT'
        ? `/deals/lp/me/statements/${docId}/download/`
        : `/deals/lp/documents/${docId}/download/`;
      const res = await api.get(endpoint);
      const link = document.createElement('a');
      link.href = res.data.url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started');
    } catch (err) {
      toast.error('Failed to generate download link');
    }
  };

  const handleAcknowledge = async (docId) => {
    try {
      await api.post(`/deals/lp/documents/${docId}/acknowledge/`);
      toast.success('Document acknowledged successfully');
      fetchDocuments();
    } catch (err) {
      toast.error('Failed to acknowledge document');
    }
  };

  const filteredDocs = filterType === 'ALL'
    ? documents
    : documents.filter(d => d.document_type === filterType);

  const isNew = (dateStr) => {
    const uploaded = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((now - uploaded) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-12 theme-transition">
      <Loader2 className="w-12 h-12 text-ls-compliment animate-spin opacity-40" />
      <p className="text-text-muted text-[10px] font-bold uppercase tracking-[0.4em] animate-pulse">Syncing Archival Vault...</p>
    </div>
  );

  if (errorStatus === 404) {
    return <LPNoProfileError />;
  }

  return (
    <div className="space-y-20 animate-in fade-in duration-1000 pb-32 max-w-7xl mx-auto">
      {/* Header - Institutional Vault */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-border-theme pb-12">
        <div className="space-y-6">
          <div className="flex items-center gap-4 text-ls-compliment text-[10px] font-bold uppercase tracking-[0.5em]">
            <FileCheck size={14} /> Strategic Archival Vault
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-light text-foreground tracking-tight leading-tight">
            Fund <span className="italic">Repository</span>
          </h1>
          <p className="text-xl text-text-muted font-serif font-light italic max-w-xl">
            A secure gateway to official fund intelligence, legal frameworks, and capital commitment notices.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-border-theme/20 p-px border border-border-theme shadow-sm">
          {['ALL', 'LPA', 'CAPITAL_CALL', 'QUARTERLY_REPORT', 'CAPITAL_ACCOUNT'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-6 py-3 text-[9px] font-bold uppercase tracking-[0.3em] transition-all ${filterType === type
                  ? 'bg-ls-primary text-ls-white shadow-xl'
                  : 'text-text-muted/60 hover:text-foreground'
                }`}
            >
              {type === 'ALL' ? 'ARCHIVE' : type === 'CAPITAL_ACCOUNT' ? 'STATEMENTS' : type.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-16">
        {/* Sidebar - Governance & Security */}
        <div className="lg:col-span-1 space-y-12">
          <div className="bg-card border border-border-theme p-10 shadow-2xl relative group overflow-hidden theme-transition">
            <div className="absolute top-0 right-0 w-24 h-24 bg-ls-compliment/5 blur-[50px] rounded-full -mr-12 -mt-12 pointer-events-none" />
            <h3 className="text-[10px] font-bold text-text-muted/40 uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
              <ShieldCheck size={14} className="text-ls-compliment" /> Governance Notice
            </h3>
            <div className="p-8 border border-ls-compliment/30 bg-ls-compliment/5 shadow-inner relative group/audit overflow-hidden transition-all hover:bg-ls-compliment/10">
              <div className="absolute top-0 left-0 w-1 h-full bg-ls-compliment" />
              <p className="text-[11px] text-foreground font-serif italic leading-relaxed">
                <span className="text-ls-compliment font-bold not-italic mr-2">SECURE_LOG:</span>
                Institutional access is logged per audit protocols. Pre-signed retrieval links expire in 60 minutes.
              </p>
            </div>

            <div className="mt-12 pt-12 border-t border-border-theme space-y-4">
              <p className="text-[9px] text-text-muted/30 font-bold uppercase tracking-[0.4em] mb-4">Registry Timeline</p>
              {documents.slice(0, 3).map((doc, i) => (
                <div key={doc.id} className="flex items-start gap-4 text-[10px] py-2 group/item cursor-pointer">
                  <span className="text-ls-compliment/40 group-hover/item:text-ls-compliment font-mono">0{i + 1}</span>
                  <span className="text-text-muted/60 group-hover/item:text-foreground truncate font-serif italic transition-colors">{doc.title}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-ls-primary text-ls-white p-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-ls-compliment/10 blur-[60px] rounded-full -mr-16 -mb-16 pointer-events-none" />
            <p className="text-[9px] font-bold text-ls-compliment uppercase tracking-[0.5em] mb-6">Institutional Support</p>
            <p className="text-base font-serif italic text-ls-white/60 leading-relaxed mb-10">Request clarification on quarterly statements or capital commitment schedules.</p>
            <button className="w-full py-5 bg-ls-compliment text-ls-primary text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-ls-white transition-all flex items-center justify-center gap-4 shadow-xl">
              Initiate Inquiry
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Document Ledger */}
        <div className="lg:col-span-3 space-y-8">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-border-theme/5 border border-border-theme animate-pulse" />
            ))
          ) : filteredDocs.length === 0 ? (
            <div className="bg-card border border-border-theme p-24 text-center shadow-2xl">
              <div className="w-20 h-20 border border-border-theme flex items-center justify-center mx-auto mb-10 opacity-20">
                <FileText size={32} />
              </div>
              <h3 className="text-2xl font-serif font-light text-foreground uppercase tracking-tight">No records identified</h3>
              <p className="text-text-muted/40 text-[10px] font-bold uppercase tracking-[0.4em] mt-4 font-serif italic">Check back later for newly issued fund updates.</p>
            </div>
          ) : (
            filteredDocs.map(doc => (
              <div key={doc.id} className="bg-card border border-border-theme hover:border-ls-compliment/40 p-8 shadow-2xl group transition-all duration-700 relative overflow-hidden">
                <div className="flex items-center justify-between gap-12">
                  <div className="flex items-center gap-10 flex-1 min-w-0">
                    <div className="w-16 h-16 border border-border-theme flex items-center justify-center text-text-muted/20 group-hover:text-ls-compliment group-hover:border-ls-compliment/40 transition-all shrink-0">
                      <FileText size={32} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-4">
                      <div className="flex items-center gap-6">
                        <h3 className="text-2xl font-serif font-light text-foreground group-hover:text-ls-compliment transition-colors truncate uppercase tracking-tight">{doc.title}</h3>
                        {isNew(doc.publish_date) && (
                          <span className="text-ls-up text-[9px] font-bold uppercase tracking-widest px-3 py-1 border border-ls-up/30 bg-ls-up/5">New Entry</span>
                        )}
                        {doc.requires_acknowledgment && !doc.has_acknowledged && (
                          <span className="text-ls-compliment text-[9px] font-bold uppercase tracking-widest px-3 py-1 border border-ls-compliment/30 bg-ls-compliment/5 animate-pulse">Action Required</span>
                        )}
                      </div>
                      <div className="flex items-center gap-8 text-[9px] font-bold uppercase tracking-[0.3em] font-mono">
                        <div className="flex items-center gap-3 text-text-muted/40 group-hover:text-text-muted/60">
                          <Building2 size={12} className="text-ls-compliment" />
                          <span>{doc.fund_name || 'FINLOGIC_INSTITUTIONAL_FUND'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-text-muted/40">
                          <Calendar size={12} />
                          <span>{new Date(doc.publish_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-3 text-text-muted/20">
                          <Clock size={12} />
                          <span>{(doc.file_size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {doc.requires_acknowledgment && !doc.has_acknowledged && (
                      <button
                        onClick={() => handleAcknowledge(doc.id)}
                        className="bg-ls-compliment text-ls-primary text-[9px] font-bold uppercase tracking-[0.4em] px-8 py-4 hover:bg-ls-white transition-all shadow-xl shadow-ls-compliment/10"
                      >
                        Execute Protocol
                      </button>
                    )}
                    {doc.has_acknowledged && (
                      <div className="flex items-center gap-3 text-ls-up px-6 py-4 text-[9px] font-bold uppercase tracking-widest bg-ls-up/5 border border-ls-up/20 shadow-inner">
                        <CheckCircle2 size={14} />
                        Verified
                      </div>
                    )}
                    <button
                      onClick={() => handleDownload(doc.id, doc.file_name, doc.document_type)}
                      className="p-5 border border-border-theme text-text-muted/40 hover:text-ls-compliment hover:border-ls-compliment/40 transition-all active:scale-90 group/btn"
                      title="Archival Retrieval"
                    >
                      <Download size={24} className="group-hover/btn:translate-y-0.5 transition-transform" />
                    </button>
                  </div>
                </div>

                {doc.document_type === 'CAPITAL_CALL' && (
                  <div className="mt-10 pt-10 border-t border-border-theme flex items-center justify-between">
                    <div className="flex items-center gap-12">
                      <div className="space-y-2">
                        <p className="text-[9px] text-text-muted/40 font-bold uppercase tracking-[0.4em]">Obligation Balance</p>
                        <p className="text-xl font-serif font-light text-foreground tabular-nums">रू {parseFloat(doc.capital_call_amount).toLocaleString()}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[9px] text-ls-compliment/40 font-bold uppercase tracking-[0.4em]">Maturity Threshold</p>
                        <p className="text-xl font-serif font-light text-foreground tabular-nums">{new Date(doc.capital_call_due_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Link 
                      href="/lp/dashboard"
                      className="text-[10px] text-ls-compliment font-bold uppercase tracking-[0.4em] flex items-center gap-3 group/link"
                    >
                      <span className="border-b border-ls-compliment/30 group-hover/link:border-ls-compliment transition-colors">Settlement Protocols</span>
                      <ExternalLink size={14} />
                    </Link>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
