'use client'

/**
 * (gp)/deals/[id]/data-room/page.jsx
 * Document management for GP staff.
 */
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FileText, Trash2, ExternalLink, Shield, ChevronLeft, Download } from 'lucide-react';
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
      setDocs(dRes.data?.results ?? dRes.data ?? []);
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
      await api.delete(`/deals/documents/${docId}/`); // Assuming this endpoint exists or I'll need to add it
      toast.success('Document deleted');
      fetchDocs();
    } catch (err) {
      toast.error('Failed to delete document.');
    }
  };

  const handleDownload = async (fileKey) => {
    try {
      // Logic to get download URL and open it
      const res = await api.get(`/deals/documents/download-url/?key=${encodeURIComponent(fileKey)}`);
      window.open(res.data.url, '_blank');
    } catch (err) {
      toast.error('Could not get download link.');
    }
  };

  if (loading) return <div className="text-center py-20 text-white/20">Loading data room...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href={`/gp/deals/${id}`} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors">
          <ChevronLeft size={18} /> Back to Deal Overview
        </Link>
        {project && <StatusBadge status={project.status} />}
      </div>

      <div className="flex flex-col lg:row-row gap-8">
        {/* Document List */}
        <div className="flex-1 space-y-4">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Shield className="text-[#0B6EC3]" /> Data Room: {project?.legal_name}
          </h1>
          
          <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
            <table className="w-full text-left text-sm text-white/70">
              <thead className="bg-white/5 text-white/40 text-[10px] uppercase tracking-widest border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-semibold">Document Name</th>
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 font-semibold">Uploaded</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {docs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-white/2 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText size={18} className="text-[#F59F01]" />
                        <div>
                          <p className="text-white font-medium">{doc.filename}</p>
                          <p className="text-[10px] text-white/30">{(doc.file_size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] border border-white/10 uppercase">
                        {doc.category_display}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-white/40">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => handleDownload(doc.file_key)}
                        className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {docs.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-20 text-center text-white/20 italic">
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
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Quick Upload</h2>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] text-white/40 uppercase font-bold mb-2 block">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {['FINANCIAL', 'LEGAL', 'COMMERCIAL', 'OTHER'].map(cat => (
                    <button 
                      key={cat}
                      className="text-[10px] border border-white/10 rounded px-2 py-1.5 hover:bg-white/5 text-white/60 hover:text-white transition-all"
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
          
          <div className="rounded-xl border border-white/10 bg-[#0B6EC3]/5 p-6">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 mb-2 uppercase">
              <Shield size={14} className="text-[#0B6EC3]" /> Data Room Health
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Completeness</span>
                <span className="text-white font-bold">{project?.data_room_completeness}%</span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full">
                <div 
                  className="h-full bg-[#0B6EC3]" 
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
