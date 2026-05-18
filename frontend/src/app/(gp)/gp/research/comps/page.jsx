'use client';

/**
 * GP Portal – NEPSE Peer Benchmarking
 *
 * Allows uploading comparable company data via CSV/PDF, previewing/mapping it,
 * and upserting into the ComparableCompany database.
 */
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3, Upload, Search, Filter, Loader2, X, Check, FileText, AlertTriangle, CheckCircle, RefreshCcw
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api';
import { toast } from 'sonner';

const METRIC_FIELDS = [
  { key: 'market_cap', label: 'Market Cap' },
  { key: 'ev_ebitda', label: 'EV/EBITDA' },
  { key: 'pe_ratio', label: 'P/E Ratio' },
  { key: 'pb_ratio', label: 'P/B Ratio' },
  { key: 'ev_revenue', label: 'EV/Revenue' },
];

function UploadModal({ isOpen, onClose, onPreviewReady }) {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/market-intel/comps/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onPreviewReady(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to process file.');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-card border border-border-theme rounded-[2rem] shadow-2xl w-full max-w-md mx-4 p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Upload NEPSE Comps</h2>
          <button onClick={onClose} className="text-text-muted hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleUpload} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold flex items-center gap-2">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

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
            onClick={() => document.getElementById('comps-file').click()}
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
              </div>
            )}
            <input
              id="comps-file"
              type="file"
              accept=".csv,.pdf,.png,.jpg,.jpeg"
              onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
              className="hidden"
            />
          </div>

          <button
            type="submit"
            disabled={uploading || !file}
            className={`
              w-full flex items-center justify-center gap-2 py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all
              ${uploading || !file
                ? 'bg-foreground/10 text-text-muted/40 cursor-not-allowed'
                : `${isDark ? 'bg-ls-compliment text-ls-primary' : 'bg-ls-primary text-white'} hover:opacity-90 active:scale-[0.98] shadow-lg`
              }
            `}
          >
            {uploading ? (
              <><Loader2 size={16} className="animate-spin" /> Processing...</>
            ) : (
              <><BarChart3 size={16} /> Process File</>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function PreviewModal({ isOpen, onClose, previewData, onConfirm }) {
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    if (previewData?.rows) {
      setRows(previewData.rows);
    }
  }, [previewData]);

  const handleRowChange = (index, field, value) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };
    setRows(updated);
  };

  const handleRemoveRow = (index) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleConfirm = async () => {
    setSaving(true);
    setError('');
    try {
      // Send the corrected rows to upsert
      const res = await api.post('/market-intel/comps/confirm/', {
        source_filename: previewData?.source_filename || 'manual_upload',
        rows
      });
      onConfirm(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upsert comparable companies.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !previewData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-card border border-border-theme rounded-[2rem] shadow-2xl w-full max-w-6xl mx-4 max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="p-8 pb-4 flex items-center justify-between border-b border-border-theme">
          <div>
            <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Preview & Mapping</h2>
            <p className="text-[10px] text-text-muted/60 uppercase tracking-[0.2em] font-bold mt-1">Review {rows.length} extracted companies before saving</p>
          </div>
          <button onClick={onClose} className="p-2 text-text-muted/30 hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold flex items-center gap-2">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          {previewData.preview_type === 'text' ? (
            <div className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 text-xs font-bold flex items-center gap-2">
                <AlertTriangle size={16} /> Table structure could not be automatically determined. Manual entry required.
              </div>
              <textarea
                readOnly
                value={previewData.text}
                className="w-full h-96 p-4 bg-foreground/[0.02] border border-border-theme rounded-xl text-xs font-mono text-text-muted"
              />
            </div>
          ) : (
            <div className="min-w-max border border-border-theme rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-foreground/[0.02] border-b border-border-theme text-[9px] font-black uppercase tracking-[0.2em] text-text-muted/60">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Ticker</th>
                    <th className="px-4 py-3">Sector</th>
                    <th className="px-4 py-3">Exchange</th>
                    {METRIC_FIELDS.map(f => (
                      <th key={f.key} className="px-4 py-3">{f.label}</th>
                    ))}
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-b border-border-theme/50 hover:bg-foreground/[0.02]">
                      <td className="p-2">
                        <input
                          value={row.name || ''}
                          onChange={(e) => handleRowChange(i, 'name', e.target.value)}
                          className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-border-theme focus:border-ls-compliment rounded text-xs font-bold text-foreground outline-none transition-colors"
                          placeholder="Company Name"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          value={row.ticker || ''}
                          onChange={(e) => handleRowChange(i, 'ticker', e.target.value)}
                          className="w-20 px-2 py-1.5 bg-transparent border border-transparent hover:border-border-theme focus:border-ls-compliment rounded text-xs font-mono text-foreground outline-none transition-colors"
                          placeholder="Ticker"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          value={row.sector || ''}
                          onChange={(e) => handleRowChange(i, 'sector', e.target.value)}
                          className="w-28 px-2 py-1.5 bg-transparent border border-transparent hover:border-border-theme focus:border-ls-compliment rounded text-xs text-foreground outline-none transition-colors"
                          placeholder="Sector"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          value={row.exchange || 'NEPSE'}
                          onChange={(e) => handleRowChange(i, 'exchange', e.target.value)}
                          className="w-20 px-2 py-1.5 bg-transparent border border-transparent hover:border-border-theme focus:border-ls-compliment rounded text-xs text-foreground outline-none transition-colors"
                        />
                      </td>
                      {METRIC_FIELDS.map(f => (
                        <td key={f.key} className="p-2">
                          <input
                            type="number"
                            value={row[f.key] || ''}
                            onChange={(e) => handleRowChange(i, f.key, e.target.value ? parseFloat(e.target.value) : null)}
                            className="w-24 px-2 py-1.5 bg-transparent border border-transparent hover:border-border-theme focus:border-ls-compliment rounded text-xs text-foreground outline-none transition-colors"
                            placeholder="-"
                          />
                        </td>
                      ))}
                      <td className="p-2 text-center">
                        <button onClick={() => handleRemoveRow(i)} className="text-text-muted/30 hover:text-red-400 p-1">
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="p-8 pt-4 border-t border-border-theme flex items-center justify-between bg-card">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted/40">
            {rows.length} records ready
          </div>
          <button
            onClick={handleConfirm}
            disabled={saving || rows.length === 0}
            className={`
              flex items-center gap-2 px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-lg
              ${saving || rows.length === 0
                ? 'bg-foreground/10 text-text-muted/40 cursor-not-allowed'
                : `${isDark ? 'bg-ls-compliment text-ls-primary' : 'bg-ls-primary text-white'} hover:opacity-90 active:scale-[0.98]`
              }
            `}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Confirm & Upsert
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ManualAddModal({ isOpen, onClose, onConfirm, sectors }) {
  const [row, setRow] = useState({
    name: '', ticker: '', sector: '', exchange: 'NEPSE',
    market_cap: '', ev_ebitda: '', pe_ratio: '', pb_ratio: '', ev_revenue: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const handleSave = async (e) => {
    e.preventDefault();
    if (!row.name && !row.ticker) {
      setError('At least a name or ticker is required.');
      return;
    }
    setSaving(true);
    setError('');

    // clean up empty string numbers to null
    const cleanedRow = { ...row };
    METRIC_FIELDS.forEach(f => {
      if (cleanedRow[f.key] === '') cleanedRow[f.key] = null;
    });

    try {
      const res = await api.post('/market-intel/comps/confirm/', {
        source_filename: 'manual_entry',
        rows: [cleanedRow]
      });
      onConfirm(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add company.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-card border border-border-theme rounded-[2rem] shadow-2xl w-full max-w-lg mx-4 p-8 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Manual Entry</h2>
          <button onClick={onClose} className="text-text-muted hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold flex items-center gap-2">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Company Name</label>
              <input
                value={row.name}
                onChange={e => setRow({ ...row, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-background border border-border-theme rounded-xl text-xs font-bold text-foreground outline-none focus:border-ls-compliment"
                placeholder="Nabil Bank Limited"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Ticker</label>
              <input
                value={row.ticker}
                onChange={e => setRow({ ...row, ticker: e.target.value })}
                className="w-full px-4 py-2.5 bg-background border border-border-theme rounded-xl text-xs font-mono text-foreground outline-none focus:border-ls-compliment"
                placeholder="NABIL"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Sector</label>
              <select
                value={row.sector}
                onChange={e => setRow({ ...row, sector: e.target.value })}
                className="w-full px-4 py-2.5 bg-background border border-border-theme rounded-xl text-xs text-foreground outline-none focus:border-ls-compliment"
              >
                <option value="">Select Sector</option>
                {sectors.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-border-theme">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-4">Financial Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              {METRIC_FIELDS.map(f => (
                <div key={f.key}>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">{f.label}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={row[f.key]}
                    onChange={e => setRow({ ...row, [f.key]: e.target.value })}
                    className="w-full px-4 py-2.5 bg-background border border-border-theme rounded-xl text-xs text-foreground outline-none focus:border-ls-compliment"
                    placeholder="-"
                  />
                </div>
              ))}
            </div>
          </div>

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
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Save Company
          </button>
        </form>
      </motion.div>
    </div>
  );
}


export default function PeerBenchmarkingPage() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [filterSector, setFilterSector] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showManualModal, setShowManualModal] = useState(false);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const queryClient = useQueryClient();

  const { data: sectors = [] } = useQuery({
    queryKey: ['sector-choices'],
    queryFn: async () => {
      const res = await api.get('/market-intel/sectors/');
      return res.data;
    },
  });

  const { data: comps = [], isLoading, refetch } = useQuery({
    queryKey: ['comparable-companies', filterSector, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterSector) params.append('sector', filterSector);
      if (searchQuery) params.append('search', searchQuery);
      const res = await api.get(`/market-intel/comps/?${params}`);
      return res.data;
    },
  });

  const handlePreviewReady = (data) => {
    setPreviewData(data);
  };

  const handleConfirmDone = (result) => {
    setPreviewData(null);
    setShowManualModal(false);
    refetch();
    if (result) {
      toast.success(`Successfully saved comparable companies! Created: ${result.created || 0}, Updated: ${result.updated || 0}`);
    } else {
      toast.success('Comparable companies saved successfully!');
    }
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-10 h-10 text-ls-compliment animate-spin" />
        <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Loading Comps Database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight uppercase">Peer Benchmarking</h1>
          <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-2">NEPSE Comparable Company Analysis</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-3 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-sm active:scale-95 bg-foreground/5 hover:bg-foreground/10 text-foreground"
          >
            Manual Add
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className={`
              flex items-center gap-3 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95
              ${isDark ? 'bg-ls-compliment text-ls-primary hover:opacity-90' : 'bg-ls-primary text-white hover:opacity-90'}
            `}
          >
            <Upload size={16} />
            Upload Data
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[250px] max-w-sm">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/40" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ticker or name..."
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border-theme rounded-xl text-xs font-bold text-foreground outline-none focus:border-ls-compliment transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-text-muted/40" />
          <select
            value={filterSector}
            onChange={(e) => setFilterSector(e.target.value)}
            className="px-4 py-2.5 bg-card border border-border-theme rounded-xl text-xs font-bold text-foreground outline-none focus:border-ls-compliment transition-colors"
          >
            <option value="">All Sectors</option>
            {sectors.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Comps Table */}
      {comps.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-border-theme rounded-[2rem]">
          <BarChart3 size={48} className="mx-auto mb-6 text-text-muted/10" />
          <h3 className="text-xl font-black text-foreground/50 uppercase tracking-tight">No Comparables Found</h3>
          <p className="text-text-muted/40 text-sm mt-2 font-light">Upload NEPSE data to build your peer benchmarking database.</p>
        </div>
      ) : (
        <div className="bg-card border border-border-theme rounded-[2rem] overflow-hidden shadow-2xl overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-foreground/[0.02] border-b border-border-theme text-[9px] font-black uppercase tracking-[0.2em] text-text-muted/40 whitespace-nowrap">
              <tr>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Sector</th>
                <th className="px-6 py-4">Market Cap</th>
                <th className="px-6 py-4">EV/EBITDA</th>
                <th className="px-6 py-4">P/E</th>
                <th className="px-6 py-4">P/B</th>
                <th className="px-6 py-4">EV/Rev</th>
                <th className="px-6 py-4">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-theme/50 text-sm whitespace-nowrap">
              {comps.map(comp => (
                <tr key={comp.id} className="hover:bg-foreground/[0.01] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-foreground">{comp.name}</div>
                    <div className="text-[10px] font-mono text-ls-compliment mt-1 flex items-center gap-1.5">
                      {comp.exchange}:{comp.ticker}
                      {comp.is_verified && <CheckCircle size={10} className="text-emerald-500" />}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-text-muted">{comp.sector_display || '—'}</td>
                  <td className="px-6 py-4 font-mono">{comp.market_cap ? Number(comp.market_cap).toLocaleString() : '—'}</td>
                  <td className="px-6 py-4 font-mono">{comp.ev_ebitda ? `${Number(comp.ev_ebitda).toFixed(1)}x` : '—'}</td>
                  <td className="px-6 py-4 font-mono">{comp.pe_ratio ? `${Number(comp.pe_ratio).toFixed(1)}x` : '—'}</td>
                  <td className="px-6 py-4 font-mono">{comp.pb_ratio ? `${Number(comp.pb_ratio).toFixed(1)}x` : '—'}</td>
                  <td className="px-6 py-4 font-mono">{comp.ev_revenue ? `${Number(comp.ev_revenue).toFixed(1)}x` : '—'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-text-muted/60">
                      <RefreshCcw size={12} />
                      {comp.last_updated}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showUploadModal && (
          <UploadModal
            isOpen={showUploadModal}
            onClose={() => setShowUploadModal(false)}
            onPreviewReady={handlePreviewReady}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewData && (
          <PreviewModal
            isOpen={!!previewData}
            onClose={() => setPreviewData(null)}
            previewData={previewData}
            onConfirm={handleConfirmDone}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showManualModal && (
          <ManualAddModal
            isOpen={showManualModal}
            onClose={() => setShowManualModal(false)}
            onConfirm={handleConfirmDone}
            sectors={sectors}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
