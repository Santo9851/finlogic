'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Search, 
  Filter,
  FileDown,
  Clock,
  ChevronRight,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

export default function GPInvestorDocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');

  const CATEGORIES = [
    { value: 'ALL', label: 'ALL RECORDS' },
    { value: 'FINANCIAL', label: 'FINANCIAL_REPORTS' },
    { value: 'LEGAL', label: 'COMPLIANCE' },
    { value: 'MEETING', label: 'BOARD_SESSIONS' },
  ];

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/deals/gp-investor/ir-documents/');
      setDocuments(res.data.results || res.data || []);
    } catch (error) {
      console.error('Failed to fetch IR documents:', error);
      toast.error('Could not load document repository');
    } finally {
      setLoading(false);
    }
  };

  const filteredDocs = activeCategory === 'ALL' 
    ? documents 
    : documents.filter(d => d.category === activeCategory);

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-12 theme-transition">
      <Loader2 className="w-12 h-12 text-ls-compliment animate-spin opacity-40" />
      <p className="text-text-muted text-[10px] font-bold uppercase tracking-[0.4em] animate-pulse">Syncing Archival Sequence...</p>
    </div>
  );

  return (
    <div className="space-y-20 animate-in fade-in duration-1000 pb-32 max-w-7xl mx-auto">
      {/* Header - Institutional Archival Vault */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-border-theme pb-12">
        <div className="space-y-6">
          <div className="flex items-center gap-4 text-ls-compliment text-[10px] font-bold uppercase tracking-[0.5em]">
            <FileText size={14} /> Corporate Archival Sequence
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-light text-foreground tracking-tight leading-tight">
            Investor <span className="italic">Relations</span>
          </h1>
          <p className="text-xl text-text-muted font-serif font-light italic max-w-xl">
            Official corporate intelligence, financial declarations, and confidential shareholder sessions.
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-border-theme/20 p-px border border-border-theme shadow-sm">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-6 py-3 text-[9px] font-bold uppercase tracking-[0.3em] transition-all ${
                activeCategory === cat.value 
                ? 'bg-ls-primary text-ls-white shadow-xl' 
                : 'text-text-muted/60 hover:text-foreground'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Document Grid - Re-envisioned as Ledger */}
      {filteredDocs.length === 0 ? (
        <div className="bg-card border border-border-theme p-24 text-center shadow-2xl theme-transition">
          <div className="w-20 h-20 border border-border-theme flex items-center justify-center mx-auto mb-10 opacity-20">
            <FileText size={32} />
          </div>
          <h3 className="text-2xl font-serif font-light text-foreground uppercase tracking-tight">Vault Entry Empty</h3>
          <p className="text-text-muted/40 text-[10px] font-bold uppercase tracking-[0.4em] mt-4 font-serif italic">No corporate records identified in this archival sequence.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border-theme border border-border-theme shadow-2xl">
          {filteredDocs.map(doc => (
            <div key={doc.id} className="group relative bg-card p-10 hover:bg-ls-primary transition-all duration-700 overflow-hidden cursor-pointer flex flex-col justify-between">
              <div className="space-y-8">
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 border border-border-theme flex items-center justify-center text-text-muted/20 group-hover:text-ls-compliment group-hover:border-ls-compliment/40 transition-all">
                    <FileText size={24} />
                  </div>
                  <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-text-muted/40 group-hover:text-ls-white/30 border border-border-theme group-hover:border-ls-white/10 px-3 py-1 font-mono">
                    {doc.category_display}
                  </span>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-2xl font-serif font-light text-foreground group-hover:text-ls-white transition-all uppercase tracking-tight line-clamp-2 leading-none">
                    {doc.title}
                  </h3>
                  <div className="flex items-center gap-3 text-text-muted/40 group-hover:text-ls-white/20 transition-all font-mono text-[9px] font-bold uppercase tracking-widest">
                    <Clock size={12} />
                    <span>REC_DATE: {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-border-theme group-hover:border-ls-white/10 flex items-center justify-between">
                <p className="text-[8px] text-text-muted/20 group-hover:text-ls-white/10 uppercase tracking-[0.5em] font-bold">SHARES_ENCRYPTED_PDF</p>
                <a 
                  href={doc.file} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-ls-compliment group-hover:text-ls-white text-[10px] font-bold uppercase tracking-[0.3em] transition-all group-hover:underline"
                >
                  <FileDown size={14} />
                  Retrieve
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confidentiality Mandate */}
      <div className="bg-ls-primary p-12 shadow-2xl relative overflow-hidden group border-l-4 border-ls-compliment">
        <div className="absolute top-0 right-0 w-32 h-32 bg-ls-compliment/10 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />
        <div className="flex flex-col md:flex-row gap-10 items-start">
          <div className="w-12 h-12 border border-ls-compliment/40 flex items-center justify-center text-ls-compliment flex-shrink-0 bg-ls-compliment/10">
            <ShieldCheck size={20} />
          </div>
          <div className="space-y-4">
            <h4 className="text-ls-white font-serif font-light text-xl uppercase tracking-widest leading-none">Confidentiality Mandate</h4>
            <p className="text-[11px] text-ls-white/50 leading-relaxed font-serif italic max-w-4xl">
              Investor Relations documents are strictly proprietary to GP Shareholders. Redistribution, dissemination, or unauthorized publication of these corporate records without explicit prior consent is strictly prohibited and subject to institutional audit under the Management Shareholder's Protocol.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
