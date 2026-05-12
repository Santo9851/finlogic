'use client';

/**
 * (gp)/fund-admin/documents/page.jsx
 * GP-specific Fund Document Management (SEBON Compliant).
 */
import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Download, 
  Eye, 
  CheckCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  MoreVertical,
  X,
  AlertCircle,
  Loader2,
  Building2,
  Lock
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';
import FileUploader from '@/components/portal/FileUploader';
import { useTheme } from 'next-themes';

const DOC_TYPES = [
  { value: 'LPA', label: 'Limited Partnership Agreement' },
  { value: 'PPM', label: 'Private Placement Memorandum' },
  { value: 'CAPITAL_CALL', label: 'Capital Call Notice' },
  { value: 'DISTRIBUTION', label: 'Distribution Notice' },
  { value: 'QUARTERLY_REPORT', label: 'Quarterly Progress Report' },
  { value: 'ANNUAL_REPORT', label: 'Annual Audited Report' },
  { value: 'TAX_DOCUMENT', label: 'Tax Document' },
  { value: 'KYC_AML', label: 'KYC/AML' },
  { value: 'OTHER', label: 'Other' },
];

export default function GPFundDocumentsPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [funds, setFunds] = useState([]);
  const [selectedFundId, setSelectedFundId] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // New Doc Form
  const [newDoc, setNewDoc] = useState({
    title: '',
    description: '',
    document_type: 'OTHER',
    requires_acknowledgment: false,
    capital_call_amount: '',
    capital_call_due_date: '',
    file: null,
  });

  useEffect(() => {
    fetchFunds();
  }, []);

  useEffect(() => {
    if (selectedFundId) {
      fetchDocuments();
    }
  }, [selectedFundId]);

  const fetchFunds = async () => {
    try {
      const res = await api.get('/deals/funds/');
      const fundList = res.data.results || res.data || [];
      setFunds(fundList);
      if (fundList.length > 0) setSelectedFundId(fundList[0].id);
    } catch (err) {
      toast.error('Failed to load funds');
    }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/deals/funds/${selectedFundId}/documents/`);
      setDocuments(res.data.results || res.data || []);
    } catch (err) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishToggle = async (docId, currentState) => {
    try {
      await api.patch(`/deals/funds/documents/${docId}/`, {
        is_published: !currentState
      });
      toast.success(currentState ? 'Document unpublished' : 'Document published');
      fetchDocuments();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (docId) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.delete(`/deals/funds/documents/${docId}/`);
      toast.success('Document deleted');
      fetchDocuments();
    } catch (err) {
      toast.error('Failed to delete document');
    }
  };

  const handleUploadComplete = async (fileData) => {
    try {
      // Clean up payload: Convert empty strings to null for numeric/date fields
      const payload = {
        title: newDoc.title,
        description: newDoc.description,
        document_type: newDoc.document_type,
        requires_acknowledgment: newDoc.requires_acknowledgment,
        capital_call_amount: newDoc.document_type === 'CAPITAL_CALL' && newDoc.capital_call_amount ? newDoc.capital_call_amount : null,
        capital_call_due_date: newDoc.document_type === 'CAPITAL_CALL' && newDoc.capital_call_due_date ? newDoc.capital_call_due_date : null,
        file_key: fileData.file_key,
        file_name: fileData.file_name,
        file_size: fileData.file_size,
        mime_type: fileData.mime_type
      };

      await api.post(`/deals/funds/${selectedFundId}/documents/`, payload);
      toast.success('Document uploaded successfully');
      setShowUploadModal(false);
      setNewDoc({
        title: '',
        description: '',
        document_type: 'OTHER',
        requires_acknowledgment: false,
        capital_call_amount: '',
        capital_call_due_date: '',
        file: null,
      });
      fetchDocuments();
    } catch (err) {
      toast.error('Failed to save document record');
    }
  };

  return (
    <div className="space-y-8 theme-transition animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-ls-compliment/10 flex items-center justify-center text-ls-compliment shadow-inner">
            <Building2 size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Fund Repository</h1>
            <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-1">SEBON-Compliant Institutional Document Control</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group">
            <select 
              value={selectedFundId}
              onChange={(e) => setSelectedFundId(e.target.value)}
              className="bg-foreground/[0.03] border border-border-theme rounded-xl px-6 py-3 text-foreground text-[10px] font-black uppercase tracking-widest focus:border-ls-compliment/40 outline-none appearance-none pr-12 min-w-[240px] shadow-inner theme-transition"
            >
              {funds.map(f => (
                <option key={f.id} value={f.id} className="bg-background">{f.name}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted/30">
              <ChevronRight size={16} className="rotate-90" />
            </div>
          </div>
          
          <button 
            onClick={() => setShowUploadModal(true)}
            className={`flex items-center gap-3 ${isDark ? 'bg-ls-compliment' : 'bg-ls-secondary'} text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95`}
          >
            <Plus size={18} />
            Ingest Document
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Total Records', value: documents.length, icon: FileText, color: 'text-ls-compliment', bg: 'bg-ls-compliment/10' },
          { label: 'Active Distribution', value: documents.filter(d => d.is_published).length, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Pending Signature', value: documents.filter(d => d.requires_acknowledgment).length, icon: Lock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-card border border-border-theme rounded-[2.5rem] p-10 hover:bg-foreground/[0.02] transition-all group shadow-xl relative overflow-hidden theme-transition">
            <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bg} blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none opacity-50`} />
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl shadow-inner`}>
                <stat.icon size={24} />
              </div>
              <ChevronRight size={20} className="text-text-muted/10 group-hover:text-text-muted/40 transition-colors" />
            </div>
            <p className="text-text-muted/40 text-[10px] font-black uppercase tracking-[0.3em] mb-2 relative z-10">{stat.label}</p>
            <p className="text-3xl font-black text-foreground uppercase tracking-tighter relative z-10">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-card border border-border-theme rounded-[3rem] overflow-hidden shadow-2xl theme-transition">
        <div className="px-10 py-8 border-b border-border-theme flex flex-col md:flex-row md:items-center justify-between gap-6 bg-foreground/[0.01]">
          <div>
            <h3 className="font-black text-foreground uppercase tracking-widest text-sm">Asset Registry</h3>
            <p className="text-[9px] text-text-muted font-black uppercase tracking-[0.2em] mt-1">Institutional Grade Document Ledger</p>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/20 group-focus-within:text-ls-compliment transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Query Repository..." 
              className="bg-foreground/[0.03] border border-border-theme rounded-xl py-3 pl-12 pr-6 text-foreground text-xs focus:border-ls-compliment/40 outline-none w-full md:w-72 shadow-inner font-medium"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-foreground/[0.01] border-b border-border-theme">
                <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Document Specification</th>
                <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Taxonomy</th>
                <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Temporal Index</th>
                <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Visibility</th>
                <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em] text-right">Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-theme/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-10 py-32 text-center">
                    <Loader2 className="w-10 h-10 text-ls-compliment animate-spin mx-auto mb-6" />
                    <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Syncing Secure Vault...</p>
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-10 py-32 text-center">
                    <div className="w-20 h-20 bg-foreground/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-border-theme shadow-inner">
                      <AlertCircle className="text-text-muted/10" size={40} />
                    </div>
                    <p className="text-text-muted font-black uppercase tracking-widest text-xs">Repository Empty</p>
                    <p className="text-text-muted/20 text-[10px] uppercase font-black tracking-[0.3em] mt-2">Initialize the fund vehicle by uploading relevant LPA or PPM data</p>
                  </td>
                </tr>
              ) : (
                documents.map(doc => (
                  <tr key={doc.id} className="hover:bg-foreground/[0.01] transition-all group">
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center text-text-muted/20 group-hover:text-ls-compliment transition-all shadow-inner">
                          <FileText size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-foreground uppercase tracking-tight group-hover:text-ls-compliment transition-all">{doc.title}</p>
                          <p className="text-[10px] text-text-muted/40 font-black uppercase tracking-widest mt-1 font-mono truncate max-w-[240px]">{doc.file_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <span className="px-4 py-1.5 bg-foreground/5 border border-border-theme rounded-full text-[9px] font-black text-text-muted/60 uppercase tracking-widest shadow-inner">
                        {doc.document_type_display}
                      </span>
                    </td>
                    <td className="px-10 py-7 font-mono text-[10px] text-text-muted/40">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-2"><Clock size={12} className="opacity-20" /> {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                        <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-ls-compliment/40' : 'text-ls-secondary/40'}`}>BY: {doc.uploaded_by_detail?.first_name}</span>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full shadow-inner ${doc.is_published ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-foreground/10'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${doc.is_published ? 'text-emerald-500' : 'text-text-muted/30'}`}>
                          {doc.is_published ? 'Public' : 'Encrypted Draft'}
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-7 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button 
                          onClick={() => handlePublishToggle(doc.id, doc.is_published)}
                          className={`p-3 rounded-xl transition-all active:scale-95 border border-transparent shadow-sm hover:shadow-lg ${doc.is_published ? 'text-amber-500 hover:bg-amber-500/5 hover:border-amber-500/20' : 'text-emerald-500 hover:bg-emerald-500/5 hover:border-emerald-500/20'}`}
                          title={doc.is_published ? 'Unpublish' : 'Publish'}
                        >
                          {doc.is_published ? <Clock size={18} /> : <CheckCircle size={18} />}
                        </button>
                        <button 
                          onClick={() => handleDelete(doc.id)}
                          className="p-3 text-rose-500 hover:bg-rose-500/5 hover:border-rose-500/20 border border-transparent rounded-xl transition-all active:scale-95 shadow-sm hover:shadow-lg"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 md:p-12 bg-background/90 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="bg-card border border-border-theme w-full max-w-4xl rounded-[3rem] p-12 relative shadow-[0_48px_96px_-24px_rgba(0,0,0,0.5)] theme-transition overflow-y-auto max-h-[90vh]">
            <button onClick={() => setShowUploadModal(false)} className="absolute top-8 right-8 p-3 bg-foreground/5 rounded-2xl text-text-muted hover:text-foreground transition-all active:scale-95">
              <X size={24} />
            </button>
            
            <div className="mb-12">
              <h2 className="text-3xl font-black text-foreground tracking-tight uppercase">Ingest Fund Document</h2>
              <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-2">Initialize cryptographic storage for institutional reporting</p>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em] mb-1 px-1">Institutional Title</label>
                    <input 
                      type="text" 
                      value={newDoc.title}
                      onChange={(e) => setNewDoc({...newDoc, title: e.target.value})}
                      placeholder="e.g. Q4 2025 Progress Report"
                      className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl px-6 py-4 text-foreground text-sm focus:border-ls-compliment/40 outline-none shadow-inner font-medium theme-transition"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em] mb-1 px-1">Taxonomy Class</label>
                    <select 
                      value={newDoc.document_type}
                      onChange={(e) => setNewDoc({...newDoc, document_type: e.target.value})}
                      className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl px-6 py-4 text-foreground text-sm outline-none focus:border-ls-compliment/40 transition-all shadow-inner font-medium appearance-none"
                    >
                      {DOC_TYPES.map(t => (
                        <option key={t.value} value={t.value} className="bg-background">
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-4 p-6 bg-foreground/[0.03] rounded-[2rem] border border-border-theme shadow-inner group">
                    <input 
                      type="checkbox" 
                      id="requires_ack"
                      checked={newDoc.requires_acknowledgment}
                      onChange={(e) => setNewDoc({...newDoc, requires_acknowledgment: e.target.checked})}
                      className={`w-5 h-5 rounded border-border-theme text-ls-compliment focus:ring-ls-compliment/40 cursor-pointer`}
                    />
                    <label htmlFor="requires_ack" className="text-[10px] font-black uppercase tracking-widest text-text-muted/80 cursor-pointer select-none">LP Digital Acknowledgment Protocol</label>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em] mb-1 px-1">Institutional Context (Optional)</label>
                    <textarea 
                      value={newDoc.description}
                      onChange={(e) => setNewDoc({...newDoc, description: e.target.value})}
                      className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl px-6 py-4 text-foreground text-sm focus:border-ls-compliment/40 outline-none h-[12.5rem] resize-none shadow-inner font-medium theme-transition"
                      placeholder="Context for LPs..."
                    />
                  </div>

                  {newDoc.document_type === 'CAPITAL_CALL' && (
                    <div className="p-8 bg-ls-compliment/5 rounded-[2.5rem] border border-ls-compliment/20 space-y-6 animate-in slide-in-from-right-4 shadow-xl">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-ls-compliment uppercase tracking-[0.2em] mb-1">Notional Call Amount (NPR)</label>
                        <input 
                          type="number" 
                          value={newDoc.capital_call_amount}
                          onChange={(e) => setNewDoc({...newDoc, capital_call_amount: e.target.value})}
                          className="w-full bg-background border border-ls-compliment/20 rounded-xl px-5 py-3 text-foreground text-sm outline-none focus:border-ls-compliment shadow-inner"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-ls-compliment uppercase tracking-[0.2em] mb-1">Maturity Date</label>
                        <input 
                          type="date" 
                          value={newDoc.capital_call_due_date}
                          onChange={(e) => setNewDoc({...newDoc, capital_call_due_date: e.target.value})}
                          className="w-full bg-background border border-ls-compliment/20 rounded-xl px-5 py-3 text-foreground text-sm outline-none focus:border-ls-compliment shadow-inner"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-foreground/[0.03] border border-border-theme rounded-[3rem] p-10 shadow-inner">
                <FileUploader 
                  fundId={selectedFundId}
                  hideCategory={true}
                  onSuccess={handleUploadComplete}
                />
              </div>
              
              <div className="flex flex-col md:flex-row items-center justify-between text-text-muted/40 text-[9px] font-black uppercase tracking-[0.2em] gap-4">
                <div className="flex items-center gap-3">
                  <Lock size={14} className="text-emerald-500" />
                  <span>Encrypted Storage Protocol Active (B2 Cloud)</span>
                </div>
                <div className="flex items-center gap-3">
                  <AlertCircle size={14} />
                  <span>Max Payload: 50MB (PDF, XLSX, DOCX)</span>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
