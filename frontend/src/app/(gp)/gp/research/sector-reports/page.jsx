'use client';

/**
 * GP Portal – Sector Research Reports Management
 * 
 * Lists all sector reports with status badges, allows creating new reports
 * with file upload, and provides editing/publishing capabilities.
 */
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen, Plus, Search, Filter, Clock, CheckCircle, Edit3,
  Upload, FileText, Loader2, X, ChevronRight, Eye, Send,
  BarChart3, Globe, AlertTriangle, Sparkles, Download
} from 'lucide-react';
import { StatusBadge } from '@/components/portal/PortalShell';
import api from '@/services/api';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';

const QUARTERS = [
  { value: 1, label: 'Q1 (Jan–Mar)' },
  { value: 2, label: 'Q2 (Apr–Jun)' },
  { value: 3, label: 'Q3 (Jul–Sep)' },
  { value: 4, label: 'Q4 (Oct–Dec)' },
];

function SectorReportStatusBadge({ status }) {
  const isDraft = status === 'DRAFT';
  return (
    <span className={`
      inline-flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] rounded-full border
      ${isDraft
        ? 'border-amber-400/30 text-amber-500 bg-amber-500/10'
        : 'border-emerald-400/30 text-emerald-500 bg-emerald-500/10'
      }
    `}>
      {isDraft ? <Clock size={10} /> : <CheckCircle size={10} />}
      {isDraft ? 'Draft' : 'Published'}
    </span>
  );
}

function NewReportModal({ isOpen, onClose, sectors, onCreated }) {
  const [sector, setSector] = useState('');
  const [quarter, setQuarter] = useState(1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sector) {
      setError('Please select a sector.');
      return;
    }
    setCreating(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('sector', sector);
      formData.append('quarter', quarter);
      formData.append('year', year);
      if (file) formData.append('source_file', file);

      const res = await api.post('/market-intel/sector-reports/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onCreated(res.data);
      onClose();
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.source_file?.[0] || 'Failed to create report.';
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally {
      setCreating(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-card border border-border-theme rounded-[2rem] shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="p-8 pb-0 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-foreground uppercase tracking-tight">New Sector Report</h2>
            <p className="text-[10px] text-text-muted/60 uppercase tracking-[0.2em] font-bold mt-1">AI-Powered Research Generation</p>
          </div>
          <button onClick={onClose} className="p-2 text-text-muted/30 hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          {/* Sector */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted/60 uppercase tracking-[0.3em]">Sector</label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full px-4 py-3 bg-foreground/[0.03] border border-border-theme rounded-xl text-sm font-medium text-foreground outline-none focus:border-ls-compliment transition-colors"
              required
            >
              <option value="">Select sector...</option>
              {sectors.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Quarter & Year */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-muted/60 uppercase tracking-[0.3em]">Quarter</label>
              <select
                value={quarter}
                onChange={(e) => setQuarter(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-foreground/[0.03] border border-border-theme rounded-xl text-sm font-medium text-foreground outline-none focus:border-ls-compliment transition-colors"
              >
                {QUARTERS.map(q => (
                  <option key={q.value} value={q.value}>{q.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-muted/60 uppercase tracking-[0.3em]">Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                min={2020}
                max={2100}
                className="w-full px-4 py-3 bg-foreground/[0.03] border border-border-theme rounded-xl text-sm font-medium text-foreground outline-none focus:border-ls-compliment transition-colors"
              />
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted/60 uppercase tracking-[0.3em]">
              Data File <span className="text-text-muted/30">(Optional)</span>
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                ${dragActive
                  ? 'border-ls-compliment bg-ls-compliment/5'
                  : 'border-border-theme hover:border-text-muted/30 hover:bg-foreground/[0.02]'
                }
              `}
              onClick={() => document.getElementById('sector-file-input').click()}
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText size={20} className="text-ls-compliment" />
                  <span className="text-sm font-bold text-foreground">{file.name}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="text-text-muted/30 hover:text-red-400 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload size={28} className="mx-auto text-text-muted/20" />
                  <p className="text-xs font-bold text-text-muted/40 uppercase tracking-widest">Drop CSV, PDF, or Image</p>
                  <p className="text-[10px] text-text-muted/20">Data will be extracted and fed to the AI</p>
                </div>
              )}
              <input
                id="sector-file-input"
                type="file"
                accept=".csv,.pdf,.png,.jpg,.jpeg"
                onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                className="hidden"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={creating}
            className={`
              w-full flex items-center justify-center gap-3 py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all
              ${creating
                ? 'bg-foreground/10 text-text-muted/40 cursor-not-allowed'
                : `${isDark ? 'bg-ls-compliment text-ls-primary' : 'bg-ls-primary text-white'} hover:opacity-90 active:scale-[0.98] shadow-lg`
              }
            `}
          >
            {creating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate AI Report
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function EditDraftModal({ isOpen, onClose, report, onSaved }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    if (report) {
      setTitle(report.title || '');
      setContent(report.content || '');
      setSummary(report.summary || '');
    }
  }, [report]);

  const handleSave = async (publish = false) => {
    publish ? setPublishing(true) : setSaving(true);
    try {
      const payload = { title, content, summary };
      if (publish) payload.status = 'PUBLISHED';
      const res = await api.patch(`/market-intel/sector-reports/${report.id}/`, payload);
      onSaved(res.data);
      if (publish) onClose();
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  };

  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-card border border-border-theme rounded-[2rem] shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-8 pb-4 flex items-center justify-between border-b border-border-theme">
          <div>
            <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Edit Report Draft</h2>
            <p className="text-[10px] text-text-muted/60 uppercase tracking-[0.2em] font-bold mt-1">{report.quarter_label} · {report.sector_display}</p>
          </div>
          <button onClick={onClose} className="p-2 text-text-muted/30 hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted/60 uppercase tracking-[0.3em]">Report Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-foreground/[0.03] border border-border-theme rounded-xl text-sm font-bold text-foreground outline-none focus:border-ls-compliment transition-colors"
            />
          </div>

          {/* Executive Summary */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted/60 uppercase tracking-[0.3em]">Executive Summary</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-foreground/[0.03] border border-border-theme rounded-xl text-sm text-foreground outline-none focus:border-ls-compliment transition-colors resize-none font-light leading-relaxed"
            />
          </div>

          {/* Content (Markdown) */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted/60 uppercase tracking-[0.3em]">Report Content (Markdown)</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={20}
              className="w-full px-4 py-3 bg-foreground/[0.03] border border-border-theme rounded-xl text-sm text-foreground outline-none focus:border-ls-compliment transition-colors resize-none font-mono leading-relaxed"
              style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-8 pt-4 border-t border-border-theme flex items-center justify-between gap-4">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 border border-border-theme rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-foreground hover:bg-foreground/5 transition-all"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Edit3 size={14} />}
            Save Draft
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={publishing}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg
              ${isDark ? 'bg-emerald-500 text-white' : 'bg-emerald-600 text-white'} hover:opacity-90 active:scale-[0.98]`}
          >
            {publishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Publish Report
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function SectorReportsPage() {
  const [showNewModal, setShowNewModal] = useState(false);
  const [editReport, setEditReport] = useState(null);
  const [filterSector, setFilterSector] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const queryClient = useQueryClient();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Fetch sectors
  const { data: sectors = [] } = useQuery({
    queryKey: ['sector-choices'],
    queryFn: async () => {
      const res = await api.get('/market-intel/sectors/');
      return res.data;
    },
  });

  // Fetch reports
  const { data: reports = [], isLoading, refetch } = useQuery({
    queryKey: ['sector-reports', filterSector, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterSector) params.append('sector', filterSector);
      if (filterStatus) params.append('status', filterStatus);
      const res = await api.get(`/market-intel/sector-reports/?${params}`);
      return res.data;
    },
    refetchInterval: 15000,
  });

  const handleCreated = () => {
    refetch();
    setShowNewModal(false);
  };

  const handleSaved = (updated) => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-10 h-10 text-ls-compliment animate-spin" />
        <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Loading Intelligence Archive...</p>
      </div>
    );
  }

  const draftCount = reports.filter(r => r.status === 'DRAFT').length;
  const publishedCount = reports.filter(r => r.status === 'PUBLISHED').length;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight uppercase">Sector Research</h1>
          <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-2">AI-Generated Investment Research Reports</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className={`
            flex items-center gap-3 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95
            ${isDark ? 'bg-ls-compliment text-ls-primary hover:opacity-90' : 'bg-ls-primary text-white hover:opacity-90'}
          `}
        >
          <Plus size={16} />
          New Report
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-card border border-border-theme rounded-[2rem] p-8 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-ls-compliment/10 flex items-center justify-center">
              <BookOpen size={20} className="text-ls-compliment" />
            </div>
            <div>
              <p className="text-[9px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Total Reports</p>
              <p className="text-2xl font-black text-foreground tabular-nums">{reports.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border-theme rounded-[2rem] p-8 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <Clock size={20} className="text-amber-500" />
            </div>
            <div>
              <p className="text-[9px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Drafts</p>
              <p className="text-2xl font-black text-foreground tabular-nums">{draftCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border-theme rounded-[2rem] p-8 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <Globe size={20} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-[9px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Published</p>
              <p className="text-2xl font-black text-foreground tabular-nums">{publishedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-text-muted/30">
          <Filter size={14} />
          <span className="text-[9px] font-black uppercase tracking-[0.3em]">Filters</span>
        </div>
        <select
          value={filterSector}
          onChange={(e) => setFilterSector(e.target.value)}
          className="px-4 py-2 bg-foreground/[0.03] border border-border-theme rounded-xl text-xs font-bold text-foreground outline-none focus:border-ls-compliment transition-colors"
        >
          <option value="">All Sectors</option>
          {sectors.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-foreground/[0.03] border border-border-theme rounded-xl text-xs font-bold text-foreground outline-none focus:border-ls-compliment transition-colors"
        >
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </select>
      </div>

      {/* Reports Table */}
      {reports.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-border-theme rounded-[2rem]">
          <BookOpen size={48} className="mx-auto mb-6 text-text-muted/10" />
          <h3 className="text-xl font-black text-foreground/50 uppercase tracking-tight">No Reports Yet</h3>
          <p className="text-text-muted/40 text-sm mt-2 font-light">Generate your first AI-powered sector research report.</p>
          <button
            onClick={() => setShowNewModal(true)}
            className={`mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all
              ${isDark ? 'bg-ls-compliment text-ls-primary' : 'bg-ls-primary text-white'} hover:opacity-90`}
          >
            <Plus size={14} /> Create Report
          </button>
        </div>
      ) : (
        <div className="bg-card border border-border-theme rounded-[2rem] overflow-hidden shadow-2xl">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-5 bg-foreground/[0.02] border-b border-border-theme">
            <div className="col-span-4 text-[9px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Report</div>
            <div className="col-span-2 text-[9px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Sector</div>
            <div className="col-span-2 text-[9px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Quarter</div>
            <div className="col-span-2 text-[9px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Status</div>
            <div className="col-span-2 text-[9px] font-black text-text-muted/40 uppercase tracking-[0.3em] text-right">Actions</div>
          </div>

          {/* Table Rows */}
          {reports.map((report, idx) => (
            <div
              key={report.id}
              className={`grid grid-cols-1 md:grid-cols-12 gap-4 px-8 py-6 items-center hover:bg-foreground/[0.02] transition-colors group
                ${idx < reports.length - 1 ? 'border-b border-border-theme/50' : ''}`}
            >
              {/* Title */}
              <div className="col-span-4 min-w-0">
                <p className="text-sm font-black text-foreground truncate group-hover:text-ls-compliment transition-colors uppercase tracking-tight">
                  {report.title || 'Generating...'}
                </p>
                <p className="text-[9px] text-text-muted/40 font-bold uppercase tracking-[0.2em] mt-1">
                  {report.generated_by_email || 'System'}
                  {report.source_file && <span className="ml-2 text-ls-compliment">· Has Data File</span>}
                </p>
              </div>

              {/* Sector */}
              <div className="col-span-2">
                <span className="text-xs font-bold text-foreground/70">{report.sector_display}</span>
              </div>

              {/* Quarter */}
              <div className="col-span-2">
                <span className="text-xs font-bold text-foreground/70 font-mono">{report.quarter_label}</span>
              </div>

              {/* Status */}
              <div className="col-span-2">
                <SectorReportStatusBadge status={report.status} />
              </div>

              {/* Actions */}
              <div className="col-span-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => setEditReport(report)}
                  className="flex items-center gap-1.5 px-4 py-2 border border-border-theme rounded-lg text-[9px] font-black uppercase tracking-[0.2em] text-text-muted/60 hover:text-foreground hover:border-ls-compliment/30 transition-all"
                >
                  <Edit3 size={12} />
                  {report.status === 'DRAFT' ? 'Edit' : 'View'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showNewModal && (
          <NewReportModal
            isOpen={showNewModal}
            onClose={() => setShowNewModal(false)}
            sectors={sectors}
            onCreated={handleCreated}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editReport && (
          <EditDraftModal
            isOpen={!!editReport}
            onClose={() => setEditReport(null)}
            report={editReport}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
