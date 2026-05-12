'use client';

/**
 * (gp)/ir-documents/page.jsx
 * GP-specific IR Document Management.
 */
import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Trash2, 
  Download, 
  CheckCircle,
  Clock,
  X,
  Plus,
  Search,
  Filter,
  Loader2,
  ShieldAlert
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

export default function GPIRDocumentsPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [newDoc, setNewDoc] = useState({
    title: '',
    category: 'GENERAL',
    file: null,
  });

  const CATEGORIES = [
    { value: 'FINANCIAL', label: 'Financial Report' },
    { value: 'LEGAL', label: 'Legal/Regulatory' },
    { value: 'MEETING', label: 'Board/Shareholder Meeting' },
    { value: 'GENERAL', label: 'General Announcement' },
  ];

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/deals/admin/ir-documents/');
      setDocuments(res.data.results || res.data || []);
    } catch (err) {
      toast.error('Failed to load IR documents');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishToggle = async (docId, currentState) => {
    try {
      await api.patch(`/deals/admin/ir-documents/${docId}/`, {
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
      await api.delete(`/deals/admin/ir-documents/${docId}/`);
      toast.success('Document deleted');
      fetchDocuments();
    } catch (err) {
      toast.error('Failed to delete document');
    }
  };

  const handleFileChange = (e) => {
    setNewDoc({ ...newDoc, file: e.target.files[0] });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!newDoc.file || !newDoc.title) {
        toast.error("Please provide a title and select a file");
        return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', newDoc.file);
    formData.append('title', newDoc.title);
    formData.append('category', newDoc.category);

    try {
      await api.post('/deals/admin/ir-documents/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Document uploaded successfully');
      setShowUploadModal(false);
      setNewDoc({ title: '', category: 'GENERAL', file: null });
      fetchDocuments();
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8 theme-transition animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-ls-compliment/10 flex items-center justify-center text-ls-compliment shadow-inner">
            <FileText size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Investor Relations</h1>
            <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-1">Institutional Communication & Report Repository</p>
          </div>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className={`flex items-center gap-3 ${isDark ? 'bg-ls-compliment' : 'bg-ls-secondary'} text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95`}
        >
          <Plus size={18} />
          Publish Intelligence
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-card border border-border-theme rounded-[3rem] overflow-hidden shadow-2xl theme-transition">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-foreground/[0.01] border-b border-border-theme">
                <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Document Specification</th>
                <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Category</th>
                <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Registry Status</th>
                <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em] text-right">Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-theme/50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-10 py-32 text-center">
                    <Loader2 className="w-10 h-10 text-ls-compliment animate-spin mx-auto mb-6" />
                    <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Syncing Repository...</p>
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-10 py-32 text-center">
                    <div className="w-20 h-20 bg-foreground/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-border-theme shadow-inner">
                      <ShieldAlert className="text-text-muted/10" size={40} />
                    </div>
                    <p className="text-text-muted font-black uppercase tracking-widest text-xs">No IR records discovered</p>
                    <p className="text-text-muted/20 text-[10px] uppercase font-black tracking-[0.3em] mt-2">Initialize communication by publishing institutional reports</p>
                  </td>
                </tr>
              ) : (
                documents.map(doc => (
                  <tr key={doc.id} className="hover:bg-foreground/[0.01] transition-all group">
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-text-muted/20 group-hover:text-ls-compliment transition-all shadow-inner">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-foreground leading-tight tracking-tight uppercase group-hover:text-ls-compliment transition-all">{doc.title}</p>
                          <p className="text-[10px] text-text-muted/40 font-black uppercase tracking-widest mt-1 font-mono">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <span className="text-[9px] px-4 py-1.5 bg-foreground/5 border border-border-theme rounded-full text-text-muted/60 font-black uppercase tracking-widest">
                        {doc.category_display}
                      </span>
                    </td>
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full shadow-inner ${doc.is_published ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-foreground/10'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${doc.is_published ? 'text-emerald-500' : 'text-text-muted/30'}`}>
                          {doc.is_published ? 'Published' : 'Archived Draft'}
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
          <div className="bg-card border border-border-theme w-full max-w-2xl rounded-[3rem] p-12 relative shadow-[0_48px_96px_-24px_rgba(0,0,0,0.5)] theme-transition">
            <button onClick={() => setShowUploadModal(false)} className="absolute top-8 right-8 p-3 bg-foreground/5 rounded-2xl text-text-muted hover:text-foreground transition-all active:scale-95">
              <X size={24} />
            </button>
            
            <div className="mb-10">
              <h2 className="text-3xl font-black text-foreground tracking-tight uppercase">Ingest IR Intelligence</h2>
              <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-2">Publish proprietary reports to the institutional network</p>
            </div>

            <form onSubmit={handleUpload} className="space-y-8">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em] mb-1 px-1">Institutional Title</label>
                <input 
                  type="text" 
                  required
                  value={newDoc.title}
                  onChange={(e) => setNewDoc({...newDoc, title: e.target.value})}
                  className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl px-6 py-4 text-foreground text-sm outline-none focus:border-ls-compliment/40 transition-all shadow-inner font-medium"
                  placeholder="e.g. FY 2080/81 Annual Audit"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em] mb-1 px-1">Taxonomy Class</label>
                  <select 
                    value={newDoc.category}
                    onChange={(e) => setNewDoc({...newDoc, category: e.target.value})}
                    className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl px-6 py-4 text-foreground text-sm outline-none focus:border-ls-compliment/40 transition-all shadow-inner font-medium appearance-none"
                  >
                    {CATEGORIES.map(c => <option key={c.value} value={c.value} className="bg-background">{c.label}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em] mb-1 px-1">Cryptographic Asset</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      required
                      onChange={handleFileChange}
                      className="w-full text-xs text-text-muted/40 file:mr-6 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-ls-compliment/10 file:text-ls-compliment hover:file:bg-ls-compliment/20 transition-all cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={uploading}
                className={`w-full ${isDark ? 'bg-ls-compliment' : 'bg-ls-secondary'} text-white font-black py-5 rounded-[1.5rem] shadow-2xl shadow-ls-compliment/20 hover:scale-[1.01] transition-all active:scale-95 disabled:opacity-50 text-[10px] uppercase tracking-[0.3em]`}
              >
                {uploading ? 'Executing Upload Protocol...' : 'Commit to Repository'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
