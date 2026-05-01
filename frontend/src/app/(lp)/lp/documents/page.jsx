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

export default function LPDocumentsPage() {
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
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-[#F59F01]/10 flex items-center justify-center text-[#F59F01]">
            <FileCheck size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight text-glow">Fund Repository</h1>
            <p className="text-white/50 text-sm mt-0.5">Access official fund reports, legal documents, and capital notices.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-white/5 border border-white/10 rounded-xl p-1 flex">
            {['ALL', 'LPA', 'CAPITAL_CALL', 'QUARTERLY_REPORT', 'CAPITAL_ACCOUNT'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterType === type 
                  ? 'bg-[#F59F01] text-black shadow-lg shadow-[#F59F01]/20' 
                  : 'text-white/40 hover:text-white'
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
          <div className="bg-[#08001a] border border-white/8 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4">Security Notice</h3>
            <div className="flex items-start gap-3 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
              <ShieldCheck className="text-emerald-500 mt-0.5 shrink-0" size={16} />
              <p className="text-[11px] text-white/60 leading-relaxed">
                All document access is logged for audit purposes. Pre-signed download links are valid for 60 minutes.
              </p>
            </div>
            
            <div className="mt-6 space-y-2">
              <p className="text-xs text-white/30 font-medium ml-1 mb-2">Recent Activities</p>
              {documents.slice(0, 3).map(doc => (
                <div key={doc.id} className="flex items-center gap-3 text-[11px] py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#F59F01]" />
                  <span className="text-white/40 truncate">{doc.title}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#08001a] border border-white/8 rounded-2xl p-6 shadow-xl">
            <p className="text-xs font-bold text-[#F59F01] uppercase tracking-wider mb-2">Help Center</p>
            <p className="text-xs text-white/50 leading-relaxed mb-4">Questions about your quarterly reports or capital calls?</p>
            <button className="w-full py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2">
              Contact LP Support
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Document List */}
        <div className="lg:col-span-3 space-y-4">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-24 bg-white/5 border border-white/10 rounded-2xl animate-pulse" />
            ))
          ) : filteredDocs.length === 0 ? (
            <div className="bg-[#08001a] border border-white/8 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 text-white/10">
                <FileText size={32} />
              </div>
              <h3 className="text-white font-semibold">No documents available</h3>
              <p className="text-white/30 text-sm mt-1">Check back later for new fund updates.</p>
            </div>
          ) : (
            filteredDocs.map(doc => (
              <div key={doc.id} className="bg-[#08001a] border border-white/8 hover:border-[#F59F01]/30 rounded-2xl p-5 shadow-lg group transition-all duration-300">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/30 group-hover:text-[#F59F01] transition-colors shrink-0">
                      <FileText size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-bold text-white group-hover:text-[#F59F01] transition-colors truncate">{doc.title}</h3>
                        {isNew(doc.publish_date) && (
                          <span className="bg-emerald-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-[0_0_10px_rgba(16,185,129,0.5)]">New</span>
                        )}
                        {doc.requires_acknowledgment && !doc.has_acknowledged && (
                          <span className="bg-amber-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded animate-pulse">Action Required</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5 text-white/40">
                          <Building2 size={12} />
                          <span>{doc.fund_name || 'Finlogic Fund'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-white/40">
                          <Calendar size={12} />
                          <span>{new Date(doc.publish_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-white/20">
                          <Clock size={12} />
                          <span>{(doc.file_size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {doc.requires_acknowledgment && !doc.has_acknowledged && (
                      <button 
                        onClick={() => handleAcknowledge(doc.id)}
                        className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-500 hover:text-black transition-all"
                      >
                        <CheckCircle2 size={14} />
                        Acknowledge
                      </button>
                    )}
                    {doc.has_acknowledged && (
                      <div className="flex items-center gap-2 text-emerald-500 px-3 py-2 text-xs font-bold bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                        <CheckCircle2 size={14} />
                        Signed
                      </div>
                    )}
                    <button 
                      onClick={() => handleDownload(doc.id, doc.file_name, doc.document_type)}
                      className="p-3 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                      title="Download"
                    >
                      <Download size={18} />
                    </button>
                  </div>
                </div>
                
                {doc.document_type === 'CAPITAL_CALL' && (
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-[#F59F01]/5 border border-[#F59F01]/10 rounded-lg px-3 py-1.5">
                        <p className="text-[10px] text-[#F59F01]/60 font-bold uppercase tracking-widest">Call Amount</p>
                        <p className="text-sm font-bold text-white">NPR {parseFloat(doc.capital_call_amount).toLocaleString()}</p>
                      </div>
                      <div className="bg-rose-500/5 border border-rose-500/10 rounded-lg px-3 py-1.5">
                        <p className="text-[10px] text-rose-400/60 font-bold uppercase tracking-widest">Due Date</p>
                        <p className="text-sm font-bold text-white">{new Date(doc.capital_call_due_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button className="text-xs text-[#F59F01] font-bold flex items-center gap-2 hover:underline">
                      Payment Instructions
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
