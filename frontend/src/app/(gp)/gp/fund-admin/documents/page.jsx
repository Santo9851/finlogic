'use client';

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
  AlertCircle
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';
import FileUploader from '@/components/portal/FileUploader';

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
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Fund Document Management</h1>
          <p className="text-white/50 mt-1">Upload and manage SEBON-compliant reporting for LPs.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group">
            <select 
              value={selectedFundId}
              onChange={(e) => setSelectedFundId(e.target.value)}
              className="bg-[#08001a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-[#F59F01]/50 outline-none appearance-none pr-10 min-w-[200px]"
            >
              {funds.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
              <MoreVertical size={14} />
            </div>
          </div>
          
          <button 
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-[#F59F01] hover:bg-[#F59F01]/90 text-black px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-[#F59F01]/20 active:scale-95"
          >
            <Upload size={18} />
            Upload Document
          </button>
        </div>
      </div>

      {/* Stats / Quick Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#08001a] border border-white/8 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#F59F01]/5 rounded-bl-full -mr-4 -mt-4 transition-all group-hover:bg-[#F59F01]/10" />
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Total Documents</p>
          <p className="text-3xl font-bold text-white">{documents.length}</p>
        </div>
        <div className="bg-[#08001a] border border-white/8 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full -mr-4 -mt-4 transition-all group-hover:bg-emerald-500/10" />
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Published</p>
          <p className="text-3xl font-bold text-emerald-400">{documents.filter(d => d.is_published).length}</p>
        </div>
        <div className="bg-[#08001a] border border-white/8 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full -mr-4 -mt-4 transition-all group-hover:bg-amber-500/10" />
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Pending Acknowledgment</p>
          <p className="text-3xl font-bold text-amber-400">{documents.filter(d => d.requires_acknowledgment).length}</p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#08001a] border border-white/8 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-5 border-b border-white/8 flex items-center justify-between bg-white/2">
          <h3 className="font-semibold text-white">Fund Repository</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
              <input 
                type="text" 
                placeholder="Search documents..." 
                className="bg-white/5 border border-white/10 rounded-lg py-1.5 pl-9 pr-4 text-white text-xs focus:ring-1 focus:ring-[#F59F01]/50 outline-none w-48"
              />
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/2 border-b border-white/8">
                <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">Document</th>
                <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-20 text-white/30">Loading repository...</td></tr>
              ) : documents.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-20 text-white/30">No documents found for this fund.</td></tr>
              ) : (
                documents.map(doc => (
                  <tr key={doc.id} className="hover:bg-white/2 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/20 group-hover:text-[#F59F01] transition-colors">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white group-hover:text-[#F59F01] transition-colors">{doc.title}</p>
                          <p className="text-xs text-white/30 truncate max-w-[200px]">{doc.file_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-white/50 uppercase tracking-wider">
                        {doc.document_type_display}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-xs text-white/70">{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                        <span className="text-[10px] text-white/20">by {doc.uploaded_by_detail?.first_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${doc.is_published ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-white/20'}`} />
                        <span className={`text-xs font-medium ${doc.is_published ? 'text-emerald-400' : 'text-white/30'}`}>
                          {doc.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handlePublishToggle(doc.id, doc.is_published)}
                          className={`p-2 rounded-lg transition-colors ${doc.is_published ? 'text-amber-400 hover:bg-amber-400/10' : 'text-emerald-400 hover:bg-emerald-400/10'}`}
                          title={doc.is_published ? 'Unpublish' : 'Publish'}
                        >
                          {doc.is_published ? <Clock size={16} /> : <CheckCircle size={16} />}
                        </button>
                        <button 
                          onClick={() => handleDelete(doc.id)}
                          className="p-2 text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#08001a] border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative">
            <button 
              onClick={() => setShowUploadModal(false)}
              className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            
            <div className="p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Upload Fund Document</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 ml-1">Title</label>
                    <input 
                      type="text" 
                      value={newDoc.title}
                      onChange={(e) => setNewDoc({...newDoc, title: e.target.value})}
                      placeholder="e.g. Q4 2025 Progress Report"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-[#F59F01]/50 outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 ml-1">Document Type</label>
                    <select 
                      value={newDoc.document_type}
                      onChange={(e) => setNewDoc({...newDoc, document_type: e.target.value})}
                      className="w-full bg-[#08001a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#F59F01]/40 transition-all appearance-none"
                    >
                      {DOC_TYPES.map(t => (
                        <option key={t.value} value={t.value} className="bg-[#08001a] text-white">
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <input 
                      type="checkbox" 
                      id="requires_ack"
                      checked={newDoc.requires_acknowledgment}
                      onChange={(e) => setNewDoc({...newDoc, requires_acknowledgment: e.target.checked})}
                      className="w-4 h-4 accent-[#F59F01]"
                    />
                    <label htmlFor="requires_ack" className="text-sm text-white/80 cursor-pointer">Requires LP Acknowledgment</label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 ml-1">Description (Optional)</label>
                    <textarea 
                      value={newDoc.description}
                      onChange={(e) => setNewDoc({...newDoc, description: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:ring-2 focus:ring-[#F59F01]/50 outline-none h-24 resize-none"
                      placeholder="Context for LPs..."
                    />
                  </div>

                  {newDoc.document_type === 'CAPITAL_CALL' && (
                    <div className="p-4 bg-[#F59F01]/5 rounded-2xl border border-[#F59F01]/20 space-y-3 animate-in slide-in-from-top-2">
                      <div>
                        <label className="block text-[10px] font-bold text-[#F59F01]/60 uppercase tracking-widest mb-1">Total Call Amount (NPR)</label>
                        <input 
                          type="number" 
                          value={newDoc.capital_call_amount}
                          onChange={(e) => setNewDoc({...newDoc, capital_call_amount: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#F59F01]/60 uppercase tracking-widest mb-1">Due Date</label>
                        <input 
                          type="date" 
                          value={newDoc.capital_call_due_date}
                          onChange={(e) => setNewDoc({...newDoc, capital_call_due_date: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white/2 border border-white/5 rounded-2xl p-6">
                <FileUploader 
                  fundId={selectedFundId}
                  hideCategory={true}
                  onSuccess={handleUploadComplete}
                />
              </div>
              
              <div className="mt-8 flex items-center justify-between text-white/30 text-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>Max file size: 50MB (PDF, DOCX, XLSX)</span>
                </div>
                <span>Files are encrypted at rest on B2 Cloud</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
