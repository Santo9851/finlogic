'use client'

/**
 * (gp)/deals/[id]/data-room/page.jsx
 * Document management for GP staff.
 */
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FileText, Trash2, Shield, ChevronLeft, Download } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';
import Link from 'next/link';
import FileUploader from '@/components/portal/FileUploader';
import { StatusBadge } from '@/components/portal/PortalShell';

export default function GPDataRoomPage() {
  const { id } = useParams();
  const [docs, setDocs] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDocs = async () => {
    try {
      const [pRes, dRes] = await Promise.all([
        api.get(`/deals/projects/${id}/`),
        api.get(`/deals/projects/${id}/documents/`)
      ]);
      setProject(pRes.data);
      const data = dRes.data?.results ?? dRes.data;
      setDocs(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Failed to load data room.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [id]);

  const handleDelete = async (docId) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.delete(`/deals/documents/${docId}/`);
      toast.success('Document deleted');
      fetchDocs();
    } catch (err) {
      toast.error('Failed to delete document.');
    }
  };

  const handleDownload = async (fileKey) => {
    try {
      const res = await api.get(`/deals/documents/download-url/?key=${encodeURIComponent(fileKey)}`);
      window.open(res.data.url, '_blank');
    } catch (err) {
      toast.error('Could not get download link.');
    }
  };

  if (loading) return <div className="text-center py-20 text-text-muted">Loading data room...</div>;

  return (
    <div className="space-y-6 theme-transition">
      <div className="flex items-center justify-between">
        <Link href={`/gp/deals/${id}`} className="flex items-center gap-2 text-text-muted hover:text-foreground transition-colors text-xs font-bold uppercase tracking-widest">
          <ChevronLeft size={16} /> Back to Deal Overview
        </Link>
        {project && <StatusBadge status={project.status} />}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Document List */}
        <div className="flex-1 space-y-4">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Shield className="text-[#0B6EC3]" /> Data Room: {project?.legal_name}
          </h1>
          
          <div className="rounded-xl border border-border-theme bg-card overflow-hidden shadow-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-foreground/[0.03] text-text-muted text-[10px] uppercase tracking-[0.2em] border-b border-border-theme">
                <tr>
                  <th className="px-6 py-4 font-black">Document Name</th>
                  <th className="px-6 py-4 font-black">Category</th>
                  <th className="px-6 py-4 font-black">Uploaded</th>
                  <th className="px-6 py-4 font-black text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-theme">
                {docs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-foreground/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText size={18} className="text-[#F59F01]" />
                        <div>
                          <p className="text-foreground font-bold">{doc.filename}</p>
                          <p className="text-[10px] text-text-muted">{(doc.file_size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded bg-foreground/5 text-[10px] border border-border-theme uppercase font-black tracking-widest">
                        {doc.category_display}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-text-muted font-medium">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => handleDownload(doc.file_key)}
                        className="p-2 hover:bg-foreground/5 rounded-lg text-text-muted hover:text-foreground transition-all"
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 hover:bg-foreground/5 rounded-lg text-text-muted hover:text-red-500 transition-all"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {docs.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-20 text-center text-text-muted/40 italic font-medium">
                      No documents found in the data room.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upload Sidebar */}
        <div className="w-full lg:w-80 space-y-6">
          <div className="rounded-xl border border-border-theme bg-card p-6 shadow-xl">
            <h2 className="text-sm font-black text-foreground uppercase tracking-widest mb-6">Quick Upload</h2>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-4 block opacity-60">Category Selection</label>
                <div className="grid grid-cols-2 gap-2">
                  {['FINANCIAL', 'LEGAL', 'COMMERCIAL', 'OTHER'].map(cat => (
                    <button 
                      key={cat}
                      className="text-[10px] font-bold border border-border-theme rounded-lg px-2 py-2 hover:bg-foreground/5 text-text-muted hover:text-foreground transition-all uppercase tracking-tighter"
                      onClick={() => toast.info(`Now drop file in ${cat} uploader`)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <FileUploader 
                projectId={id} 
                category="OTHER" 
                onSuccess={fetchDocs} 
                label="Drop files here"
              />
            </div>
          </div>
          
          <div className="rounded-xl border border-[#0B6EC3]/20 bg-[#0B6EC3]/5 p-6 shadow-lg">
            <h3 className="text-xs font-black text-foreground flex items-center gap-2 mb-4 uppercase tracking-widest">
              <Shield size={16} className="text-[#0B6EC3]" /> Data Room Health
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-text-muted">Completeness</span>
                <span className="text-foreground">{project?.data_room_completeness}%</span>
              </div>
              <div className="h-1.5 w-full bg-foreground/5 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-[#0B6EC3] transition-all duration-1000" 
                  style={{ width: `${project?.data_room_completeness}%` }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
