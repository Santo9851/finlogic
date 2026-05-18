'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Plus, Search, Loader2, FileText, CheckCircle, Clock, File, AlertTriangle, Upload, Edit, RefreshCw } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { toast } from 'sonner';

function StatusBadge({ status }) {
  if (status === 'PUBLISHED') {
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"><CheckCircle size={10} /> Published</span>;
  }
  return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20"><Clock size={10} /> Draft</span>;
}

function AddEditModal({ isOpen, onClose, updateToEdit, onSaved }) {
  const [formData, setFormData] = useState({
    title: updateToEdit?.title || '',
    source_name: updateToEdit?.source_name || '',
    published_date: updateToEdit?.published_date || new Date().toISOString().split('T')[0],
    source_url: updateToEdit?.source_url || '',
    raw_text: updateToEdit?.raw_text || '',
    summary: updateToEdit?.summary || '',
  });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = new FormData();
      Object.keys(formData).forEach(k => {
        if (formData[k]) payload.append(k, formData[k]);
      });
      if (file) {
        payload.append('original_file', file);
      }

      if (updateToEdit) {
        await api.patch(`/market-intel/regulatory-updates/${updateToEdit.id}/`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/market-intel/regulatory-updates/', payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save update.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-card border border-border-theme rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-card/80 backdrop-blur-xl border-b border-border-theme p-6 z-10 flex items-center justify-between">
          <h2 className="text-xl font-black text-foreground uppercase tracking-tight">
            {updateToEdit ? 'Edit Regulatory Update' : 'New Regulatory Update'}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-foreground">✕</button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold flex items-center gap-2">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Title</label>
                <input
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border-theme rounded-xl text-xs font-bold text-foreground outline-none focus:border-ls-compliment"
                  placeholder="e.g., NRB Capital Requirement Directive"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Source</label>
                <select
                  value={formData.source_name}
                  onChange={e => setFormData({ ...formData, source_name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border-theme rounded-xl text-xs font-bold text-foreground outline-none focus:border-ls-compliment"
                  required
                >
                  <option value="">Select Source</option>
                  <option value="NRB">NRB</option>
                  <option value="SEBON">SEBON</option>
                  <option value="IRD">IRD</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Published Date</label>
                <input
                  type="date"
                  value={formData.published_date}
                  onChange={e => setFormData({ ...formData, published_date: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border-theme rounded-xl text-xs font-bold text-foreground outline-none focus:border-ls-compliment"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Source URL (Optional)</label>
                <input
                  value={formData.source_url}
                  onChange={e => setFormData({ ...formData, source_url: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border-theme rounded-xl text-xs font-bold text-foreground outline-none focus:border-ls-compliment"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Upload Document (Auto-extracts text)</label>
              <div className="relative border-2 border-dashed border-border-theme rounded-2xl p-6 text-center hover:border-ls-compliment/50 transition-colors">
                <input
                  type="file"
                  onChange={e => setFile(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".pdf,.png,.jpg,.jpeg,.docx"
                />
                <div className="flex flex-col items-center gap-2 pointer-events-none">
                  <Upload size={24} className="text-text-muted" />
                  <p className="text-xs font-bold text-foreground">
                    {file ? file.name : (updateToEdit?.original_file ? 'Replace existing file' : 'Click or drag file here to upload')}
                  </p>
                  <p className="text-[10px] text-text-muted">Supports PDF, DOCX, Images (OCR)</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted flex justify-between">
                <span>Raw Text (Pasted or Extracted)</span>
                {updateToEdit && <span className="text-amber-500 opacity-60">Editing this requires regenerating summary</span>}
              </label>
              <textarea
                value={formData.raw_text}
                onChange={e => setFormData({ ...formData, raw_text: e.target.value })}
                className="w-full h-40 px-4 py-3 bg-background border border-border-theme rounded-xl text-xs font-mono text-foreground outline-none focus:border-ls-compliment resize-none"
                placeholder="Paste the document text here if you don't have a file..."
              />
            </div>

            {updateToEdit && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Current Summary</label>
                <textarea
                  value={formData.summary}
                  onChange={e => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full h-32 px-4 py-3 bg-background border border-border-theme rounded-xl text-xs text-foreground outline-none focus:border-ls-compliment resize-none"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className={`
                w-full flex items-center justify-center gap-2 py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all
                ${saving
                  ? 'bg-foreground/10 text-text-muted/40 cursor-not-allowed'
                  : `${isDark ? 'bg-ls-compliment text-ls-primary' : 'bg-ls-primary text-white'} hover:opacity-90 active:scale-[0.98] shadow-lg`
                }
              `}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : 'Save Update'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default function RegulatoryUpdatesPage() {
  const [filterSource, setFilterSource] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updateToEdit, setUpdateToEdit] = useState(null);
  
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const queryClient = useQueryClient();

  const { data: updates = [], isLoading, refetch } = useQuery({
    queryKey: ['regulatory-updates', filterSource, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterSource) params.append('source', filterSource);
      if (filterStatus) params.append('status', filterStatus);
      const res = await api.get(`/market-intel/regulatory-updates/?${params}`);
      return res.data;
    },
  });

  const handlePublishToggle = async (update) => {
    try {
      const newStatus = update.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
      await api.patch(`/market-intel/regulatory-updates/${update.id}/`, { status: newStatus });
      refetch();
      toast.success(`Successfully updated update to ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleGenerateSummary = async (updateId) => {
    try {
      await api.post(`/market-intel/regulatory-updates/${updateId}/generate-summary/`);
      toast.success('Summary generation triggered! Check back in a moment.');
      refetch();
    } catch (err) {
      toast.error('Failed to trigger summary generation');
    }
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-10 h-10 text-ls-compliment animate-spin" />
        <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Loading Updates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight uppercase flex items-center gap-4">
            <ShieldCheck className="text-ls-compliment" size={32} />
            Regulatory Updates
          </h1>
          <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-2">Manage Regulatory Intelligence & Circulars</p>
        </div>
        <button
          onClick={() => { setUpdateToEdit(null); setIsModalOpen(true); }}
          className={`
            flex items-center gap-3 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95
            ${isDark ? 'bg-ls-compliment text-ls-primary hover:opacity-90' : 'bg-ls-primary text-white hover:opacity-90'}
          `}
        >
          <Plus size={16} />
          New Update
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          className="px-4 py-2.5 bg-card border border-border-theme rounded-xl text-xs font-bold text-foreground outline-none focus:border-ls-compliment min-w-[150px]"
        >
          <option value="">All Sources</option>
          <option value="NRB">NRB</option>
          <option value="SEBON">SEBON</option>
          <option value="IRD">IRD</option>
          <option value="OTHER">Other</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 bg-card border border-border-theme rounded-xl text-xs font-bold text-foreground outline-none focus:border-ls-compliment min-w-[150px]"
        >
          <option value="">All Statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
        </select>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {updates.length === 0 ? (
          <div className="col-span-2 py-20 text-center border-2 border-dashed border-border-theme rounded-3xl">
            <ShieldCheck size={48} className="mx-auto text-text-muted/20 mb-4" />
            <p className="text-xs font-bold text-foreground uppercase tracking-widest">No Updates Found</p>
            <p className="text-[10px] text-text-muted mt-2">Try adjusting your filters or adding a new regulatory update.</p>
          </div>
        ) : (
          updates.map((update) => (
            <motion.div
              key={update.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border-theme rounded-3xl p-6 shadow-sm flex flex-col h-full hover:border-ls-compliment/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-background border border-border-theme rounded-md text-[10px] font-black tracking-wider text-foreground">
                      {update.source_name}
                    </span>
                    <StatusBadge status={update.status} />
                  </div>
                  <h3 className="text-lg font-black text-foreground tracking-tight leading-tight mt-1">{update.title}</h3>
                  <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">
                    {new Date(update.published_date).toLocaleDateString()} • Added by {update.created_by_name}
                  </p>
                </div>
              </div>

              <div className="flex-1 my-4 p-4 bg-background border border-border-theme rounded-2xl">
                {update.summary ? (
                  <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                    {update.summary.split('\n').map((line, i) => {
                      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
                        // Very simple bolding for markdown like "**Action:** explanation"
                        const match = line.match(/\*\*(.*?)\*\*(.*)/);
                        if (match) {
                          return <li key={i} className="mb-2"><strong className="text-foreground">{match[1]}</strong>{match[2]}</li>;
                        }
                        return <li key={i} className="mb-2">{line.replace(/^[\*\-]\s/, '')}</li>;
                      }
                      return <p key={i} className="mb-2">{line}</p>;
                    })}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-text-muted/60 py-6">
                    <AlertTriangle size={24} className="mb-2" />
                    <p className="text-xs font-bold uppercase tracking-widest">No Summary Available</p>
                    <p className="text-[10px]">Generate a summary using AI.</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border-theme mt-auto">
                <button
                  onClick={() => handlePublishToggle(update)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    update.status === 'PUBLISHED' 
                      ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' 
                      : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                  }`}
                >
                  {update.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                </button>

                <button
                  onClick={() => { setUpdateToEdit(update); setIsModalOpen(true); }}
                  className="px-4 py-2 bg-background border border-border-theme hover:border-ls-compliment hover:text-ls-compliment rounded-xl text-[10px] font-black uppercase tracking-widest text-text-muted transition-all flex items-center gap-2"
                >
                  <Edit size={12} /> Edit
                </button>

                <button
                  onClick={() => handleGenerateSummary(update.id)}
                  className="px-4 py-2 bg-background border border-border-theme hover:border-ls-compliment hover:text-ls-compliment rounded-xl text-[10px] font-black uppercase tracking-widest text-text-muted transition-all flex items-center gap-2"
                >
                  <RefreshCw size={12} /> Regen Summary
                </button>

                {update.original_file && (
                  <a
                    href={update.original_file}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto p-2 bg-background border border-border-theme hover:border-ls-compliment rounded-xl text-text-muted transition-all"
                    title="View Original Source File"
                  >
                    <FileText size={16} />
                  </a>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <AddEditModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            updateToEdit={updateToEdit}
            onSaved={() => refetch()}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
