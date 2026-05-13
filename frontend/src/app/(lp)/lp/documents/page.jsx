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
  FileCheck,
  Building2,
  Calendar,
  ArrowRight
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

export default function LPDocumentsPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/lp/documents/');
      setDocuments(res.data.results || res.data || []);
    } catch (err) {
      toast.error('Failed to load your documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (docId, fileName, docType) => {
    try {
      const endpoint = docType === 'CAPITAL_ACCOUNT' 
        ? `/lp/me/statements/${docId}/download/` 
        : `/lp/documents/${docId}/download/`;
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
      await api.post(`/lp/documents/${docId}/acknowledge/`);
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

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700 pb-20 theme-transition">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-[1.5rem] bg-ls-compliment/10 flex items-center justify-center text-ls-compliment shadow-inner">
            <FileCheck size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Fund Repository</h1>
            <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-1">Access official fund reports, legal documents, and capital notices.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-foreground/[0.03] border border-border-theme rounded-2xl p-1.5 flex shadow-inner">
            {['ALL', 'LPA', 'CAPITAL_CALL', 'QUARTERLY_REPORT', 'CAPITAL_ACCOUNT'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filterType === type 
                  ? 'bg-ls-compliment text-white shadow-lg shadow-ls-compliment/20' 
                  : 'text-text-muted/40 hover:text-foreground'
                }`}
              >
                {type === 'ALL' ? 'All Files' : type === 'CAPITAL_ACCOUNT' ? 'Statements' : type.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar / Filters */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border border-border-theme rounded-[2rem] p-8 shadow-xl theme-transition overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-ls-compliment/5 blur-[30px] rounded-full -mr-10 -mt-10 pointer-events-none" />
            <h3 className="text-[10px] font-black text-text-muted/40 uppercase tracking-[0.2em] mb-6">Security Notice</h3>
            <div className="flex items-start gap-4 p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl shadow-inner">
              <ShieldCheck className="text-emerald-500 mt-0.5 shrink-0" size={16} />
              <p className="text-[11px] text-text-muted/60 leading-relaxed font-medium">
                All document access is logged for institutional audit. Pre-signed links expire in 60 minutes.
              </p>
            </div>
            
            <div className="mt-8 space-y-3">
              <p className="text-[10px] text-text-muted/30 font-black uppercase tracking-widest ml-1 mb-2">Recent Activities</p>
              {documents.slice(0, 3).map(doc => (
                <div key={doc.id} className="flex items-center gap-3 text-[11px] py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-ls-compliment" />
                  <span className="text-text-muted/50 truncate font-medium">{doc.title}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-card border border-border-theme rounded-[2rem] p-8 shadow-xl theme-transition relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-full h-1 bg-ls-compliment/20" />
            <p className="text-[10px] font-black text-ls-compliment uppercase tracking-[0.2em] mb-3">Institutional Support</p>
            <p className="text-[11px] text-text-muted/60 leading-relaxed mb-6 font-medium">Questions regarding your quarterly statements or capital commitment schedules?</p>
            <button className="w-full py-4 bg-foreground/[0.03] border border-border-theme rounded-xl text-foreground text-[10px] font-black uppercase tracking-widest hover:bg-foreground/[0.08] transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95">
              Contact LP Support
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Document List */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-28 bg-foreground/[0.03] border border-border-theme rounded-[2rem] animate-pulse" />
            ))
          ) : filteredDocs.length === 0 ? (
            <div className="bg-card border border-border-theme rounded-[2.5rem] p-20 text-center shadow-xl theme-transition">
              <div className="w-20 h-20 rounded-full bg-foreground/[0.03] flex items-center justify-center mx-auto mb-6 text-text-muted/10 shadow-inner">
                <FileText size={40} />
              </div>
              <h3 className="text-xl font-black text-foreground uppercase tracking-tight">No records available</h3>
              <p className="text-text-muted/40 text-[10px] font-black uppercase tracking-widest mt-2">Check back later for newly issued fund updates.</p>
            </div>
          ) : (
            filteredDocs.map(doc => (
              <div key={doc.id} className="bg-card border border-border-theme hover:border-ls-compliment/30 rounded-[2rem] p-6 shadow-xl group transition-all duration-300 theme-transition relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-ls-compliment opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-6 flex-1 min-w-0">
                    <div className="w-14 h-14 rounded-2xl bg-foreground/[0.03] flex items-center justify-center text-text-muted/30 group-hover:text-ls-compliment transition-colors shrink-0 shadow-inner">
                      <FileText size={28} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-lg font-black text-foreground group-hover:text-ls-compliment transition-colors truncate uppercase tracking-tight">{doc.title}</h3>
                        {isNew(doc.publish_date) && (
                          <span className="bg-emerald-500 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full shadow-[0_4px_10px_rgba(16,185,129,0.3)]">New</span>
                        )}
                        {doc.requires_acknowledgment && !doc.has_acknowledged && (
                          <span className="bg-amber-500 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full animate-pulse shadow-[0_4px_10px_rgba(245,159,1,0.3)]">Action Required</span>
                        )}
                      </div>
                      <div className="flex items-center gap-5 text-[10px] font-black uppercase tracking-widest">
                        <div className="flex items-center gap-2 text-text-muted/40">
                          <Building2 size={14} className="text-ls-secondary" />
                          <span>{doc.fund_name || 'Finlogic Institutional Fund'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-text-muted/40">
                          <Calendar size={14} />
                          <span>{new Date(doc.publish_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-text-muted/20">
                          <Clock size={14} />
                          <span>{(doc.file_size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {doc.requires_acknowledgment && !doc.has_acknowledged && (
                      <button 
                        onClick={() => handleAcknowledge(doc.id)}
                        className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all shadow-lg active:scale-95"
                      >
                        <CheckCircle2 size={14} />
                        Execute Acknowledge
                      </button>
                    )}
                    {doc.has_acknowledged && (
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 px-4 py-3 text-[10px] font-black uppercase tracking-widest bg-emerald-500/5 rounded-xl border border-emerald-500/10 shadow-inner">
                        <CheckCircle2 size={14} />
                        Identity Verified
                      </div>
                    )}
                    <button 
                      onClick={() => handleDownload(doc.id, doc.file_name, doc.document_type)}
                      className="p-4 bg-foreground/[0.03] border border-border-theme rounded-xl text-text-muted/60 hover:text-ls-compliment hover:bg-ls-compliment/5 transition-all active:scale-90 shadow-md group/btn"
                      title="Ingest Document"
                    >
                      <Download size={20} className="group-hover/btn:translate-y-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
                
                {doc.document_type === 'CAPITAL_CALL' && (
                  <div className="mt-6 pt-6 border-t border-border-theme/50 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="bg-ls-compliment/5 border border-ls-compliment/10 rounded-xl px-5 py-2.5 shadow-inner">
                        <p className="text-[9px] text-ls-compliment/60 font-black uppercase tracking-[0.2em] mb-1">Call Obligation</p>
                        <p className="text-sm font-black text-foreground font-mono">NPR {parseFloat(doc.capital_call_amount).toLocaleString()}</p>
                      </div>
                      <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl px-5 py-2.5 shadow-inner">
                        <p className="text-[9px] text-rose-500/60 font-black uppercase tracking-[0.2em] mb-1">Maturity Date</p>
                        <p className="text-sm font-black text-foreground font-mono">{new Date(doc.capital_call_due_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button className="text-[10px] text-ls-compliment font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:underline transition-all">
                      Settlement Protocols
                      <ExternalLink size={12} />
                    </button>
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
