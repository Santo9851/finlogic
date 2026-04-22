'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Trash2, 
  Download, 
  CheckCircle,
  Clock,
  X,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

export default function GPIRDocumentsPage() {
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
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Shareholder IR Management</h1>
          <p className="text-white/50 mt-1">Manage global reports and notices for GP shareholders.</p>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 bg-[#F59F01] hover:bg-[#F59F01]/90 text-black px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-[#F59F01]/20"
        >
          <Plus size={18} />
          New Document
        </button>
      </div>

      <div className="bg-[#08001a] border border-white/8 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/2 border-b border-white/8">
                <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">Document</th>
                <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-20 text-white/30">Loading...</td></tr>
              ) : documents.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-20 text-white/30">No IR documents uploaded yet.</td></tr>
              ) : (
                documents.map(doc => (
                  <tr key={doc.id} className="hover:bg-white/2 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <FileText className="text-white/20 group-hover:text-[#F59F01]" size={20} />
                        <div>
                          <p className="text-sm font-semibold text-white">{doc.title}</p>
                          <p className="text-[10px] text-white/30">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] px-2 py-1 bg-white/5 border border-white/10 rounded-full text-white/60 font-bold uppercase tracking-wider">
                        {doc.category_display}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${doc.is_published ? 'bg-emerald-500' : 'bg-white/20'}`} />
                        <span className={`text-xs ${doc.is_published ? 'text-emerald-400' : 'text-white/30'}`}>
                          {doc.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handlePublishToggle(doc.id, doc.is_published)}
                        className={`p-2 rounded-lg ${doc.is_published ? 'text-amber-400 hover:bg-amber-400/10' : 'text-emerald-400 hover:bg-emerald-400/10'}`}
                      >
                        {doc.is_published ? <Clock size={16} /> : <CheckCircle size={16} />}
                      </button>
                      <button 
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 text-rose-400 hover:bg-rose-400/10 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#08001a] border border-white/10 w-full max-w-lg rounded-3xl p-8 relative shadow-2xl">
            <button onClick={() => setShowUploadModal(false)} className="absolute top-6 right-6 text-white/40 hover:text-white">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-white mb-6">Upload IR Document</h2>
            <form onSubmit={handleUpload} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 px-1">Document Title</label>
                <input 
                  type="text" 
                  required
                  value={newDoc.title}
                  onChange={(e) => setNewDoc({...newDoc, title: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#F59F01]/50"
                  placeholder="e.g. FY 2080/81 Annual Report"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 px-1">Category</label>
                <select 
                  value={newDoc.category}
                  onChange={(e) => setNewDoc({...newDoc, category: e.target.value})}
                  className="w-full bg-[#0a0014] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none"
                >
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 px-1">Select File</label>
                <input 
                  type="file" 
                  required
                  onChange={handleFileChange}
                  className="w-full text-sm text-white/40 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#F59F01]/10 file:text-[#F59F01] hover:file:bg-[#F59F01]/20"
                />
              </div>
              <button 
                type="submit"
                disabled={uploading}
                className="w-full bg-[#F59F01] text-black font-bold py-3 rounded-xl hover:bg-[#F59F01]/90 disabled:opacity-50 transition-all shadow-lg shadow-[#F59F01]/20"
              >
                {uploading ? 'Uploading...' : 'Publish Document'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
